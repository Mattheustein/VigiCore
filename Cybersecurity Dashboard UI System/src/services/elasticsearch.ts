/**
 * VigiCore Elasticsearch / Data Service
 * ======================================
 * Central data layer for the entire dashboard. Despite the name, this service
 * does NOT connect to a live Elasticsearch cluster — it uses Firebase Firestore
 * as the primary data store and supplements it with locally generated mock data
 * to simulate a high-volume IDS environment.
 *
 * Architecture (Hybrid Data Model):
 * 1. **Firestore (Real-time):** Listens to the "authLogs_v3" and "detectionRules"
 *    collections via `onSnapshot` for real-time updates. New logs are periodically
 *    batch-written to Firestore every 10 minutes.
 * 2. **Local Mock Generation:** Generates tens of thousands of historical auth logs
 *    in-memory (backfilled to January of the current year) to provide rich chart
 *    data without exceeding Firestore's free-tier quotas.
 * 3. **Scale Ratio:** A heuristic that queries Firestore's true document count
 *    (`getCountFromServer`) and computes a ratio to scale local statistics up,
 *    ensuring dashboard numbers reflect the full database size.
 *
 * Multi-Tenancy:
 * - The primary tenant ("Global Analytics Corp") uses real Firestore data.
 * - Secondary tenants get independently generated in-memory datasets, cached
 *   in `tenantLogsCache` to maintain consistency during a session.
 *
 * Time Filtering:
 * - A global time filter ("Last hour" through "All time") controls which logs
 *   are included in all dashboard computations via `getFilteredLogs()`.
 * - The `getBuckets()` function generates time-axis segments for chart rendering.
 *
 * Exports:
 * - `ElasticsearchService` — Main API consumed by all dashboard pages.
 * - `setGlobalTimeFilter` / `getGlobalTimeFilter` — Global time filter state.
 * - `setGlobalTenant` / `getGlobalTenant` — Multi-tenant state.
 * - TypeScript interfaces: `AuthLog`, `FailedLogin`, `TopIP`, `AuthEvent`.
 */
import axios from 'axios';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit as limitDocs, writeBatch, doc, updateDoc, deleteDoc, getCountFromServer, getDocs, enableIndexedDbPersistence, where } from 'firebase/firestore';
import { app } from './auth';

// =============================================================================
// Type Definitions — Shared data shapes used across all dashboard components
// =============================================================================

/** Data point for the "Failed Login Attempts" line chart on the main dashboard. */
export interface FailedLogin {
    time: string;
    attempts: number;
}

/** Data point for the "Top Source IPs" horizontal bar chart. */
export interface TopIP {
    ip: string;
    attempts: number;
}

/** Represents a single authentication log entry (the core data entity of the IDS). */
export interface AuthLog {
    id: string;
    timestamp: string;
    user: string;
    sourceIp: string;
    host: string;
    result: 'Success' | 'Failed';
    method: string;   // SSH auth method: password, publickey, keyboard-interactive, etc.
    port: number;
    risk?: 'High' | 'Medium' | 'Low';
}

/** Data point for the "Authentication Timeline" area chart. */
export interface AuthEvent {
    time: string;
    events: number;
}

// =============================================================================
// Firestore Connection & State
// =============================================================================

const db = getFirestore(app);

/** Firestore collection references for the two primary data entities. */
const LOGS_COL = collection(db, 'authLogs_v3');
const RULES_COL = collection(db, 'detectionRules');

/**
 * In-memory log array — the single source of truth for all dashboard queries.
 * Populated by merging Firestore real-time data with locally generated history.
 */
let mockLogs: AuthLog[] = [];

/** In-memory cache of detection rules, kept in sync via Firestore onSnapshot. */
let detectionRulesData: any[] = [];

// =============================================================================
// Mock Data Pools — Realistic entity pools for log generation
// =============================================================================

/** Known malicious IPs — used with 60% probability to simulate attack traffic. */
const maliciousIPs = [
    '203.0.113.42', '198.51.100.23', '45.22.12.99', '101.42.15.11',
    '220.191.50.80', '5.188.87.52', '185.20.10.15', '31.14.88.2',
    '45.144.200.11', '193.106.191.13', '181.214.206.51', '118.193.31.22',
    '34.122.50.77', '18.220.11.192', '51.15.20.25', '178.128.99.200',
    '159.65.11.45', '82.165.20.11'
];
/** Internal/safe IPs — RFC 1918 private ranges to simulate legitimate traffic. */
const safeIPs = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
    '10.0.0.50', '10.0.0.51', '10.0.1.20', '172.16.0.15', '192.168.2.10',
    '203.0.113.1', '127.0.0.1', '192.168.1.250'
];
/** Common SSH usernames targeted in real-world brute-force attacks. */
const users = ['root', 'admin', 'mattheus', 'ubuntu', 'guest', 'oracle', 'mysql', 'postgres', 'test', 'sysadmin', 'jenkins', 'git', 'deploy', 'backup', 'nobody', 'ftp', 'nagios'];
/** SSH authentication methods per the SSH protocol specification. */
const methods = ['password', 'publickey', 'keyboard-interactive', 'gssapi-with-mic', 'none', 'hostbased'];
/** Simulated server hostnames representing a typical enterprise infrastructure. */
const hosts = ['ubuntu-server-01', 'db-production-01', 'web-frontend-02', 'api-gateway', 'payment-processor', 'jenkins-ci-runner', 'backup-server', 'dev-environment', 'redis-cache-01', 'loadbalancer-01'];
/** Common service ports — SSH (22), RDP (3389), databases, web servers, etc. */
const ports = [22, 2222, 21, 23, 80, 443, 3389, 8080, 5432, 3306, 6379, 27017, 1433, 1521, 5900];

/** Utility: picks a random element from an array. */
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

// =============================================================================
// Log Generation Engine
// =============================================================================

/**
 * Generates a batch of realistic mock authentication logs within a time window.
 * Each log has a randomized IP, user, method, host, port, and risk level.
 *
 * Risk Assignment Logic (IDS Heuristic):
 * - Malicious IP + successful login = High (indicates a compromised account)
 * - Malicious IP + failed login = Medium (indicates a brute-force attempt)
 * - Safe IP + failed login = Low (likely a typo or legitimate lockout)
 * - Root login on non-standard port = High (anomalous privileged access)
 *
 * @param count - Number of logs to generate
 * @param monthStart - Start of the time window (epoch ms)
 * @param monthEnd - End of the time window (epoch ms)
 */
const generateInitialLogs = (count: number, monthStart: number, monthEnd: number): AuthLog[] => {
    const logs: AuthLog[] = [];

    for (let i = 0; i < count; i++) {
        // Generate a random timestamp anywhere within the provided month window
        const randomTimeInWindow = monthStart + Math.random() * (monthEnd - monthStart);
        const eventDate = new Date(randomTimeInWindow);

        const isMalicious = Math.random() > 0.6; // 40% chance of malicious origin
        const ip = isMalicious ? getRandomItem(maliciousIPs) : getRandomItem(safeIPs);
        // Malicious IPs almost always fail (95%); safe IPs almost always succeed (95%)
        const result = isMalicious ? (Math.random() > 0.05 ? 'Failed' : 'Success') : (Math.random() > 0.95 ? 'Failed' : 'Success');
        const user = getRandomItem(users);
        const method = getRandomItem(methods);
        const host = getRandomItem(hosts);
        const port = getRandomItem(ports);

        // Assign risk dynamically based on outcome and nature
        let risk: 'Low' | 'Medium' | 'High' = 'Low';
        if (isMalicious) {
            if (result === 'Success') risk = 'High'; // Compromised
            else risk = 'Medium'; // Brute force attempt
        } else {
            if (result === 'Failed') risk = 'Low'; // Simple typo inside secure network
        }

        // Add additional edge cases for High Risk
        if (user === 'root' && result === 'Success' && port !== 22) risk = 'High';

        logs.push({
            id: '',
            timestamp: eventDate.toISOString(),
            user,
            sourceIp: ip,
            host,
            result: result as 'Success' | 'Failed',
            method,
            port,
            risk
        });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// =============================================================================
// Firestore Real-Time Listeners
// =============================================================================

/**
 * Initializes the primary log data pipeline.
 * 1. Generates historical mock data for each month of the current year
 *    (volumes defined per-month in `monthVolumes`).
 * 2. Attaches a Firestore `onSnapshot` listener to overlay real database logs
 *    on top of the historical data, replacing mock data for days that have
 *    actual Firestore records.
 *
 * The merge strategy uses day-level deduplication: if Firestore has logs for
 * a given calendar day, ALL mock logs for that day are discarded.
 */
const initFirestoreLogs = async () => {
    // Generate month-by-month historical data to fill charts without
    // needing tens of thousands of Firestore documents
    const nowLocal = new Date();
    const currentYear = nowLocal.getFullYear();
    const currentMonthIndex = nowLocal.getMonth();
    
    let historicalFallback: AuthLog[] = [];
    // Target volumes per month — higher in Q1 to simulate seasonal attack patterns
    const monthVolumes = [14500, 16500, 9500, 11500, 14000, 3900, 4500, 4100, 3800, 4300, 4700, 4000];
    
    for (let i = 0; i <= currentMonthIndex; i++) {
        const start = new Date(currentYear, i, 1).getTime();
        const isCurrentMonth = (i === currentMonthIndex);
        const end = isCurrentMonth ? nowLocal.getTime() : new Date(currentYear, i + 1, 0, 23, 59, 59).getTime();
        
        // For the current month, pro-rate volume based on how many days have passed
        let volume = monthVolumes[i];
        if (isCurrentMonth) {
            const daysInMonth = new Date(currentYear, i + 1, 0).getDate();
            const daysPassed = Math.max(1, nowLocal.getDate());
            volume = Math.floor(volume * (daysPassed / daysInMonth));
        }
        
        const logs = generateInitialLogs(volume, start, end);
        historicalFallback = [...historicalFallback, ...logs];
    }
    // Sort descending (newest first) to match expected query order
    historicalFallback.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Subscribe to the 2000 most recent Firestore documents for real-time overlay
    const q = query(LOGS_COL, orderBy('timestamp', 'desc'), limitDocs(2000));

    onSnapshot(q, (snapshot: any) => {
        const logsFromDB: AuthLog[] = [];
        snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            logsFromDB.push({
                id: docSnap.id,
                timestamp: data.timestamp,
                user: data.user,
                sourceIp: data.sourceIp,
                host: data.host,
                result: data.result,
                method: data.method,
                port: data.port,
                risk: data.risk
            });
        });

        // Day-level deduplication: identify which calendar days have real DB data
        const activeDBDays = new Set(logsFromDB.map(l => new Date(l.timestamp).toDateString()));
        
        // Keep mock data only for days WITHOUT real Firestore coverage
        const filteredHistorical = historicalFallback.filter(h => {
            const day = new Date(h.timestamp).toDateString();
            return !activeDBDays.has(day);
        });
        
        // Merge: real DB logs take priority, supplemented by mock history
        mockLogs = [...logsFromDB, ...filteredHistorical].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        window.dispatchEvent(new Event('logsDatabaseUpdated'));
    }, (error: any) => {
        console.error('Firestore listener error:', error);
        mockLogs = historicalFallback; // Graceful degradation: use mock data if Firestore fails
        window.dispatchEvent(new Event('logsDatabaseUpdated'));
    });
};

/**
 * Initializes real-time listener for the Detection Rules collection.
 * On first run (no rules in Firestore + no localStorage flag), seeds the
 * collection with 5 default IDS rules covering common threat categories.
 */
const initFirestoreRules = async () => {
    onSnapshot(RULES_COL, (snapshot: any) => {
        const rulesFromDB: any[] = [];
        snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            rulesFromDB.push({
                id: docSnap.id,
                name: data.name,
                description: data.description,
                status: data.status,
                severity: data.severity,
                type: data.type
            });
        });

        if (rulesFromDB.length === 0 && !localStorage.getItem('vigicore_seeded_rules')) {
            console.log('Seeding initial Detection Rules to Firebase...');
            localStorage.setItem('vigicore_seeded_rules', 'true');
            const initialRules = [
                { name: 'Brute Force Prevention', description: 'Blocks IP after 5 failed login attempts within 5 minutes.', status: 'Active', severity: 'High', type: 'Authentication' },
                { name: 'Malicious IP Blocking', description: 'Automatically drops packets from known malicious subnets (Threat Intel).', status: 'Active', severity: 'Critical', type: 'Network' },
                { name: 'Geo-Fencing (Strict)', description: 'Alerts on any login attempt originating from outside North America.', status: 'Inactive', severity: 'Medium', type: 'Authentication' },
                { name: 'SQL Injection Signature Detection', description: 'Inspects HTTP payloads for common SQLi syntax near login endpoints.', status: 'Active', severity: 'High', type: 'Application' },
                { name: 'Rate Limiting (API)', description: 'Limits requests to 100/sec per client IP to prevent simple DDoS.', status: 'Active', severity: 'Medium', type: 'Network' },
            ];
            const batch = writeBatch(db);
            initialRules.forEach(rule => {
                const docRef = doc(RULES_COL);
                batch.set(docRef, rule);
            });
            batch.commit().catch(console.error);
        } else {
            detectionRulesData = rulesFromDB;
            window.dispatchEvent(new Event('rulesDatabaseUpdated'));
        }
    });
};

// Start both real-time listeners on module load
initFirestoreLogs();
initFirestoreRules();

// =============================================================================
// Global Filter State
// =============================================================================

/** Currently active time window for all dashboard queries. */
let currentTimeFilter = 'All time';
/** Currently selected tenant/client organization. */
let currentTenant = 'Global Analytics Corp';
/** Per-tenant log cache — lazily populated on first access for non-primary tenants. */
const tenantLogsCache: Record<string, AuthLog[]> = {};

/**
 * Background Log Generator (runs every 10 minutes)
 * --------------------------------------------------
 * Generates 60–70 new logs per cycle for each cached tenant and batch-writes
 * them to Firestore for the primary tenant. This creates organic data growth
 * that keeps the dashboard feeling alive over extended sessions.
 */
setInterval(async () => {
    let tenantUpdated = false;
    // Inject new logs into each cached secondary tenant
    Object.keys(tenantLogsCache).forEach(tenant => {
        const numNewLogs = Math.floor(Math.random() * 11) + 60;
        const now = new Date();
        const past10Mins = now.getTime() - (10 * 60 * 1000);
        const newLogs = generateInitialLogs(numNewLogs, past10Mins, now.getTime());

        newLogs.forEach(log => {
            tenantLogsCache[tenant].unshift(log);
        });

        if (tenantLogsCache[tenant].length > 40005) {
            tenantLogsCache[tenant].splice(40005);
        }
        tenantUpdated = true;
    });

    // Handle organic traffic for the primary tenant
    const numNewLogs = Math.floor(Math.random() * 11) + 60;
    const now = new Date();
    const past10Mins = now.getTime() - (10 * 60 * 1000);
    const newLogs = generateInitialLogs(numNewLogs, past10Mins, now.getTime());

    // We are online; broadcast the burst securely to Firebase.
    // We intentionally DO NOT prune, delete, or fallback. The user requested we never mess with actual totals.
    try {
        const batch = writeBatch(db);
        newLogs.forEach(log => {
            const docRef = doc(LOGS_COL);
            log.id = docRef.id;
            batch.set(docRef, log);
        });
        await batch.commit();
    } catch (error) {
        console.error('Firebase burst upload failed. Logs not saved.', error);
    }

    if (tenantUpdated && currentTenant !== 'Global Analytics Corp') {
        // Sort the array by timestamp before dispatching to ensure the UI stays ordered
        tenantLogsCache[currentTenant]?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        window.dispatchEvent(new Event('logsDatabaseUpdated'));
    }
}, 10 * 60 * 1000); // Fired every 10 minutes

/** Updates the global time filter and notifies all listening components. */
export const setGlobalTimeFilter = (filter: string) => {
    currentTimeFilter = filter;
    window.dispatchEvent(new Event('timeFilterChange'));
};

export const getGlobalTimeFilter = () => currentTimeFilter;

/** Updates the active tenant context and notifies listeners. */
export const setGlobalTenant = (tenant: string) => {
    currentTenant = tenant;
    window.dispatchEvent(new Event('tenantChange'));
};

export const getGlobalTenant = () => currentTenant;

// =============================================================================
// Log Filtering Pipeline
// =============================================================================

/**
 * Returns the log dataset filtered by the current tenant and time window.
 * - Primary tenant: uses `mockLogs` (Firestore + mock hybrid).
 * - Secondary tenants: uses lazily-generated per-tenant cache.
 * - Time filtering applies calendar-aligned boundaries (start of day/week/month/etc.).
 */
const getFilteredLogs = (): AuthLog[] => {
    let baseLogs = mockLogs;

    // Lazy-initialize secondary tenant data on first access
    if (currentTenant !== 'Global Analytics Corp') {
        if (!tenantLogsCache[currentTenant]) {
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
            // Secondary tenants get 2,000–5,000 logs to appear smaller than the primary
            const logVolume = Math.floor(Math.random() * 3000) + 2000;
            tenantLogsCache[currentTenant] = generateInitialLogs(logVolume, startOfYear, now.getTime());
        }
        baseLogs = tenantLogsCache[currentTenant];
    }

    if (currentTimeFilter === 'All time') return baseLogs;
    const now = new Date();

    if (currentTimeFilter === 'This year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
        return baseLogs.filter(l => new Date(l.timestamp).getTime() >= startOfYear);
    }
    if (currentTimeFilter === 'This quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1).getTime();
        return baseLogs.filter(l => new Date(l.timestamp).getTime() >= startOfQuarter);
    }
    if (currentTimeFilter === 'This month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return baseLogs.filter(l => new Date(l.timestamp).getTime() >= startOfMonth);
    }
    if (currentTimeFilter === 'This week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.getTime());
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return baseLogs.filter(l => new Date(l.timestamp).getTime() >= startOfWeek.getTime());
    }
    if (currentTimeFilter === 'Today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        return baseLogs.filter(l => new Date(l.timestamp).getTime() >= startOfToday);
    }
    if (currentTimeFilter === 'Last hour') {
        const startOfHour = now.getTime() - (60 * 60 * 1000);
        return baseLogs.filter(l => new Date(l.timestamp).getTime() >= startOfHour);
    }
    
    return baseLogs;
};

// =============================================================================
// Chart Bucketing Engine
// =============================================================================

/**
 * Generates time-axis buckets for chart rendering based on the active time filter.
 * Each bucket defines a start/end timestamp range and a display label.
 *
 * Bucket granularity by filter:
 * - All time / This year: monthly buckets (Jan–current month)
 * - This quarter: 3 monthly buckets
 * - This month: daily buckets (1–last day of month)
 * - This week: 7 daily buckets (Mon–Sun)
 * - Today: 6 four-hour blocks (00:00–23:59)
 * - Last hour: 6 ten-minute blocks
 */
const getBuckets = () => {
    const now = new Date();
    const buckets: { start: number, end: number, label: string }[] = [];

    if (currentTimeFilter === 'This year' || currentTimeFilter === 'All time') {
        const currentMonth = now.getMonth();
        // Only render up to the current month to avoid empty future buckets
        for (let i = 0; i <= currentMonth; i++) {
            const start = new Date(now.getFullYear(), i, 1).getTime();
            const end = new Date(now.getFullYear(), i + 1, 1).getTime();
            const label = new Date(now.getFullYear(), i, 1).toLocaleDateString([], { month: 'short', year: '2-digit' });
            buckets.push({ start, end, label });
        }
    } else if (currentTimeFilter === 'This quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startMonthOfQuarter = currentQuarter * 3;
        for (let i = 0; i < 3; i++) {
            const monthOffset = startMonthOfQuarter + i;
            const start = new Date(now.getFullYear(), monthOffset, 1).getTime();
            const end = new Date(now.getFullYear(), monthOffset + 1, 1).getTime();
            const label = new Date(now.getFullYear(), monthOffset, 1).toLocaleDateString([], { month: 'short', year: '2-digit' });
            buckets.push({ start, end, label });
        }
    } else if (currentTimeFilter === 'This month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 0; i < daysInMonth; i++) {
            const start = new Date(now.getFullYear(), now.getMonth(), i + 1).getTime();
            const end = start + 24 * 60 * 60 * 1000;
            const label = new Date(start).toLocaleDateString([], { month: 'short', day: 'numeric' });
            buckets.push({ start, end, label });
        }
    } else if (currentTimeFilter === 'This week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(now.getFullYear(), now.getMonth(), diff);
        weekStart.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const start = weekStart.getTime() + i * 24 * 60 * 60 * 1000;
            const end = start + 24 * 60 * 60 * 1000;
            const label = new Date(start).toLocaleDateString([], { weekday: 'short' });
            buckets.push({ start, end, label });
        }
    } else if (currentTimeFilter === 'Today') {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        for (let i = 0; i < 6; i++) {
            const start = dayStart + i * 4 * 60 * 60 * 1000;
            const end = start + 4 * 60 * 60 * 1000;
            const label = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            buckets.push({ start, end, label });
        }
    } else if (currentTimeFilter === 'Last hour') {
        const hourStart = Math.floor(now.getTime() / (60 * 60 * 1000)) * (60 * 60 * 1000);
        for (let i = 0; i < 6; i++) {
            const start = hourStart + i * 10 * 60 * 1000;
            const end = start + 10 * 60 * 1000;
            const label = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            buckets.push({ start, end, label });
        }
    }

    return buckets;
};

// =============================================================================
// Scale Ratio Heuristic
// =============================================================================

/** Throttle state for Firestore count queries (max once per 5 seconds). */
let lastScaleTime = 0;
let lastTrueTotal = 0;

/**
 * Computes a scaling ratio between the true Firestore document count and
 * the local in-memory log count. This allows dashboard statistics to reflect
 * the actual database volume while only holding a subset of data locally.
 *
 * For the primary tenant, it queries `getCountFromServer` (costs only 1 Firestore read)
 * with a time-filter-aware query. For secondary tenants, the local count IS the truth.
 *
 * Throttled to max 1 Firestore query per 5 seconds to respect quota limits.
 *
 * @returns Object with `ratio` (multiplier) and `total` (true document count)
 */
const getScaleRatio = async (): Promise<{ ratio: number, total: number }> => {
    const currentLocalTotal = getFilteredLogs().length || 1;

    // Avoid fetching from Firebase more than once every 5 seconds per client
    if (Date.now() - lastScaleTime < 5000) {
        let trueTotal = lastTrueTotal;
        if (trueTotal < currentLocalTotal) trueTotal = currentLocalTotal;
        return { ratio: trueTotal / currentLocalTotal, total: trueTotal };
    }

    lastScaleTime = Date.now();
    let trueTotal = getFilteredLogs().length;

    if (currentTenant === 'Global Analytics Corp') {
        try {
            let baseQuery: any = LOGS_COL;
            if (currentTimeFilter !== 'All time') {
                const now = new Date();
                let thresholdDate = new Date();

                if (currentTimeFilter === 'This year') {
                    thresholdDate = new Date(now.getFullYear(), 0, 1);
                } else if (currentTimeFilter === 'This quarter') {
                    const currentQuarter = Math.floor(now.getMonth() / 3);
                    thresholdDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                } else if (currentTimeFilter === 'This month') {
                    thresholdDate = new Date(now.getFullYear(), now.getMonth(), 1);
                } else if (currentTimeFilter === 'This week') {
                    const day = now.getDay();
                    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                    thresholdDate = new Date(now.getTime());
                    thresholdDate.setDate(diff);
                    thresholdDate.setHours(0, 0, 0, 0);
                } else if (currentTimeFilter === 'Today') {
                    thresholdDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                } else if (currentTimeFilter === 'Last hour') {
                    thresholdDate = new Date(now.getTime() - (60 * 60 * 1000));
                }

                baseQuery = query(LOGS_COL, where('timestamp', '>=', thresholdDate.toISOString()));
            }
            // Fetch live exact count from Firebase explicitly. Only costs 1 read against quota!
            const snap = await getCountFromServer(baseQuery);
            trueTotal = snap.data().count;
        } catch (error) {
            console.warn("Firebase true total fetch failed. Returning strictly matched local lengths.", error);
            trueTotal = getFilteredLogs().length || 1;
        }
    }

    const localTotal = getFilteredLogs().length || 1;

    if (trueTotal < localTotal) trueTotal = localTotal; // Scale lock
    lastTrueTotal = trueTotal;

    return { ratio: trueTotal / localTotal, total: trueTotal };
};

// =============================================================================
// ElasticsearchService — Public API
// =============================================================================

/**
 * Public API consumed by all dashboard page components.
 * Each method returns a Promise to maintain a consistent async interface,
 * even though most operations are computed from the local `mockLogs` array.
 *
 * All numeric values are scaled using `getScaleRatio()` to reflect Firestore totals.
 */
export const ElasticsearchService = {
    /** Returns the most recent auth logs, capped at `size`. Used by AuthLogsPage. */
    getAuthLogs: async (size: number = 50): Promise<AuthLog[]> => {
        return Promise.resolve(getFilteredLogs().slice(0, size));
    },

    /**
     * Computes aggregate authentication statistics (total, success, failed, publickey).
     * Uses proportional scaling: calculates local proportions then applies the
     * Firestore-derived total to produce accurate large-scale numbers.
     */
    getAuthStats: async () => {
        const { total } = await getScaleRatio();
        const localLogs = getFilteredLogs();
        const localTotal = localLogs.length || 1;

        const localSuccess = localLogs.filter(l => l.result === 'Success').length;
        const localFailed = localLogs.filter(l => l.result === 'Failed').length;
        const localPublicKey = localLogs.filter(l => l.method === 'publickey').length;

        // Derive proportions from local sample, then scale to true total
        const failedProportion = localFailed / localTotal;
        const successProportion = localSuccess / localTotal;
        const publickeyProportion = localPublicKey / localTotal;

        const scaledFailed = Math.round(total * failedProportion);
        const scaledSuccess = Math.round(total * successProportion);
        const scaledPublickey = Math.round(total * publickeyProportion);

        return {
            total: total,
            success: scaledSuccess,
            failed: scaledFailed,
            publickey: scaledPublickey,
        };
    },

    /** Full-text search across logs by IP, user, result, or risk. Debounced 300ms. */
    searchLogs: async (query: string): Promise<AuthLog[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!query.trim()) return [];
        const q = query.toLowerCase();

        const results = getFilteredLogs().filter(log =>
            log.sourceIp.includes(q) ||
            log.user.toLowerCase().includes(q) ||
            log.result.toLowerCase().includes(q) ||
            log.risk?.toLowerCase().includes(q)
        );
        return results.reverse().slice(0, 10);
    },

    /** Aggregates failed login counts into time buckets for the line chart. */
    getFailedLogins: async (): Promise<FailedLogin[]> => {
        const bucketsDef = getBuckets();
        const { ratio } = await getScaleRatio();
        
        const localLogs = getFilteredLogs();
        const localFailed = localLogs.filter(l => l.result === 'Failed');

        const distributedBuckets = bucketsDef.map(bucket => {
            const countInBucket = localFailed.filter(l => {
                const t = new Date(l.timestamp).getTime();
                return t >= bucket.start && t < bucket.end;
            }).length;
            
            return {
                time: bucket.label,
                attempts: Math.round(countInBucket * ratio)
            };
        });

        return Promise.resolve(distributedBuckets);
    },

    /** Ranks the top 5 source IPs by failed login count. Used by the bar chart. */
    getTopSourceIPs: async (): Promise<TopIP[]> => {
        const failedLogs = getFilteredLogs().filter(log => log.result === 'Failed');
        const counts: Record<string, number> = {};
        const { ratio } = await getScaleRatio();

        failedLogs.forEach(log => {
            counts[log.sourceIp] = (counts[log.sourceIp] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .map(([ip, attempts]) => ({ ip, attempts: Math.round(attempts * ratio) }))
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 5);

        return Promise.resolve(sorted);
    },

    /** Aggregates all auth events into time buckets for the area chart. */
    getAuthTimeline: async (): Promise<AuthEvent[]> => {
        const bucketsDef = getBuckets();
        const { ratio } = await getScaleRatio();

        const localLogs = getFilteredLogs();

        const distributedBuckets = bucketsDef.map(bucket => {
            const countInBucket = localLogs.filter(l => {
                const t = new Date(l.timestamp).getTime();
                return t >= bucket.start && t < bucket.end;
            }).length;

            return {
                time: bucket.label,
                events: Math.round(countInBucket * ratio)
            };
        });

        return Promise.resolve(distributedBuckets);
    },

    /** Derives login success/failure distribution for the pie chart. */
    getLoginDistribution: async (): Promise<{ name: string; value: number; color: string }[]> => {
        const { ratio } = await getScaleRatio();
        const successCount = getFilteredLogs().filter(l => l.result === 'Success').length;
        const failureCount = getFilteredLogs().filter(l => l.result === 'Failed').length;

        return Promise.resolve([
            { name: 'Success', value: Math.round(successCount * ratio), color: '#10B981' },
            { name: 'Failed', value: Math.round(failureCount * ratio), color: '#EF4444' },
        ]);
    },

    /**
     * Builds a suspicious IP threat report by enriching top IPs with:
     * - Deterministic attack type (based on IP character sum for consistency)
     * - Auto-blocking threshold (>150 attempts = Blocked)
     * - Risk level assignment
     */
    getSuspiciousIPs: async (): Promise<any[]> => {
        const topIPs = await ElasticsearchService.getTopSourceIPs();

        const attackTypes = [
            'Brute Force Attack',
            'SQL Injection Attempt',
            'DDoS Attempt',
            'Port Scan',
            'Credential Stuffing',
            'Malware Beaconing',
            'Command Injection',
            'Cross-Site Scripting (XSS)'
        ];

        return Promise.resolve(topIPs.map(ipData => {
            const lastLog = getFilteredLogs().find(l => l.sourceIp === ipData.ip && l.result === 'Failed');
            const targetUser = lastLog?.user || 'unknown';

            // Generate a deterministic attack type based on IP string
            const charSum = ipData.ip.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
            const type = attackTypes[charSum % attackTypes.length];

            return {
                ip: ipData.ip,
                attempts: ipData.attempts,
                user: targetUser,
                status: ipData.attempts > 150 ? 'Blocked' : 'Monitoring',
                risk: ipData.attempts > 150 ? 'High' : ipData.attempts > 50 ? 'Medium' : 'Low',
                timestamp: lastLog?.timestamp || new Date().toISOString(),
                type: type
            };
        }));
    },

    /**
     * Enriches suspicious IPs with geolocation data for the world map visualization.
     * Uses a static lookup table mapping known IPs to coordinates, countries, and
     * threat classification types (Botnet, Tor Exit Node, etc.).
     * Unknown IPs fall back to a rotating set of major world cities.
     */
    getIPIntelligence: async (): Promise<any[]> => {
        const suspiciousIPs = await ElasticsearchService.getSuspiciousIPs();

        // Varied IPs logic covering all possible generated strings
        const ipIntelligenceDatabase: Record<string, any> = {
            '203.0.113.42': { country: 'Russia', city: 'Moscow', coordinates: [37.6173, 55.7558], type: 'Botnet' },
            '198.51.100.23': { country: 'China', city: 'Beijing', coordinates: [116.4074, 39.9042], type: 'Scanning IP' },
            '45.22.12.99': { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128], type: 'VPN/Proxy' },
            '101.42.15.11': { country: 'China', city: 'Shanghai', coordinates: [121.4737, 31.2304], type: 'DDoS Node' },
            '220.191.50.80': { country: 'China', city: 'Hangzhou', coordinates: [120.1551, 30.2741], type: 'Brute-forcer' },
            '5.188.87.52': { country: 'Russia', city: 'St. Petersburg', coordinates: [30.3141, 59.9386], type: 'Spam Node' },
            '185.20.10.15': { country: 'Netherlands', city: 'Amsterdam', coordinates: [4.8952, 52.3702], type: 'Tor Exit Node' },
            '31.14.88.2': { country: 'Iran', city: 'Tehran', coordinates: [51.3890, 35.6892], type: 'Suspicious' },
            '45.144.200.11': { country: 'Brazil', city: 'Sao Paulo', coordinates: [-46.6333, -23.5505], type: 'Botnet' },
            '193.106.191.13': { country: 'Ukraine', city: 'Kyiv', coordinates: [30.5234, 50.4501], type: 'Malware C2' },
            '181.214.206.51': { country: 'Colombia', city: 'Bogota', coordinates: [-74.0721, 4.7110], type: 'Proxy' },
            '118.193.31.22': { country: 'Hong Kong', city: 'Hong Kong', coordinates: [114.1694, 22.3193], type: 'Suspicious' },
            '34.122.50.77': { country: 'USA', city: 'Chicago', coordinates: [-87.6298, 41.8781], type: 'Cloud Hosting' },
            '18.220.11.192': { country: 'USA', city: 'San Francisco', coordinates: [-122.4194, 37.7749], type: 'Cloud Node' },
            '51.15.20.25': { country: 'France', city: 'Paris', coordinates: [2.3522, 48.8566], type: 'Hosting IP' },
            '178.128.99.200': { country: 'Singapore', city: 'Singapore', coordinates: [103.8198, 1.3521], type: 'VPS Node' },
            '159.65.11.45': { country: 'India', city: 'Bangalore', coordinates: [77.5946, 12.9716], type: 'Suspicious' },
            '82.165.20.11': { country: 'Germany', city: 'Frankfurt', coordinates: [8.6821, 50.1109], type: 'Proxy' },
            '192.168.1.100': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
            '192.168.1.101': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
            '192.168.1.102': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
        };

        return suspiciousIPs.map((item, index) => {
            const data = ipIntelligenceDatabase[item.ip] || { country: 'Unknown', city: 'Unknown', coordinates: [0, 0], type: 'Unknown' };

            // Randomly assign some to real locations if they aren't in the DB to make the map look busy
            const backupCoords = [
                [-0.1276, 51.5072], // London
                [2.3522, 48.8566], // Paris
                [139.6917, 35.6895], // Tokyo
                [13.4050, 52.5200], // Berlin
                [-43.1729, -22.9068], // Rio
            ];
            const coords = data.coordinates[0] === 0 ? (ipIntelligenceDatabase[item.ip] ? data.coordinates : backupCoords[index % backupCoords.length]) : data.coordinates;
            const country = data.country === 'Unknown' ? ['UK', 'France', 'Japan', 'Germany', 'Brazil'][index % 5] : data.country;
            const city = data.city === 'Unknown' ? ['London', 'Paris', 'Tokyo', 'Berlin', 'Rio de Janeiro'][index % 5] : data.city;

            return {
                ...item,
                country: country,
                city: city,
                coordinates: coords,
                threats: Math.floor(item.attempts / 10) + 1,
                reputation: item.risk === 'High' ? 'High Risk' : item.risk === 'Medium' ? 'Suspicious' : 'Low Risk',
                type: data.type || 'Unknown'
            };
        });
    },

    /**
     * Generates simulated system health metrics using sine-wave patterns
     * to create realistic CPU/memory fluctuations with slight random jitter.
     * Status thresholds: >85% CPU = Critical, >70% = Warning, else Healthy.
     */
    getSystemHealth: async (): Promise<any> => {
        const time = Date.now();
        const baseCpu = 40 + Math.sin(time / 8000) * 20; // Smooth sine wave pattern
        const cpu = Math.max(0, Math.min(100, baseCpu + (Math.random() * 8 - 4))); // With slight jitter

        const memory = 68 + Math.sin(time / 30000) * 4 + (Math.random() * 2 - 1);
        const disk = 42.4 + (Math.random() * 0.2);

        return Promise.resolve({
            cpu: Math.floor(cpu),
            memory: Math.floor(memory),
            disk: disk.toFixed(1),
            status: cpu > 85 ? 'Critical' : cpu > 70 ? 'Warning' : 'Healthy'
        });
    },

    /** Computes alert statistics by categorizing high-risk/failed logs into Active/Monitoring/Resolved. */
    getAlertStats: async (): Promise<any> => {
        const { ratio } = await getScaleRatio();
        const fullAlerts = getFilteredLogs().filter(l => l.risk === 'High' || l.result === 'Failed');
        let active = 0, monitoring = 0, resolved = 0;

        fullAlerts.forEach((_, index) => {
            if (index % 4 === 0) resolved++;
            else if (index % 3 === 0) monitoring++;
            else active++;
        });

        return Promise.resolve({
            total: Math.round(fullAlerts.length * ratio),
            active: Math.round(active * ratio),
            monitoring: Math.round(monitoring * ratio),
            resolved: Math.round(resolved * ratio)
        });
    },

    /** Returns the 24 most recent high-risk or failed auth logs as alert objects. */
    getAlerts: async (): Promise<any[]> => {
        const recentHighRiskLogs = getFilteredLogs()
            .filter(l => l.risk === 'High' || l.result === 'Failed')
            .slice(0, 24);

        return Promise.resolve(recentHighRiskLogs.map((log, index) => {
            let status = 'Active';
            if (index % 4 === 0) status = 'Resolved';
            else if (index % 3 === 0) status = 'Monitoring';

            return {
                id: log.id,
                title: log.risk === 'High' ? 'Critical Security Event' : 'Failed Login Attempt',
                severity: log.risk || 'Medium',
                timestamp: log.timestamp,
                status: status,
                description: `Unauthorized access attempt detected from ${log.sourceIp} targeting user ${log.user}.`
            };
        }));
    },

    // --- Detection Rules CRUD (Firestore-backed) ---

    /** Returns all detection rules from the in-memory cache (synced via onSnapshot). */
    getDetectionRules: async (): Promise<any[]> => {
        return Promise.resolve(detectionRulesData);
    },

    /** Creates a new detection rule document in Firestore. */
    createDetectionRule: async (rule: any): Promise<void> => {
        await addDoc(RULES_COL, rule);
    },

    /** Toggles a rule's status (Active/Inactive) in Firestore. */
    updateDetectionRuleStatus: async (id: string, newStatus: string): Promise<void> => {
        const ruleDoc = doc(db, 'detectionRules', id);
        await updateDoc(ruleDoc, { status: newStatus });
    },

    /** Permanently removes a detection rule from Firestore. */
    deleteDetectionRule: async (id: string): Promise<void> => {
        const ruleDoc = doc(db, 'detectionRules', id);
        await deleteDoc(ruleDoc);
    },

    /** Simple health check — always returns green (no live Elasticsearch connection). */
    checkHealth: async () => {
        return Promise.resolve({ status: 'green' });
    }
};