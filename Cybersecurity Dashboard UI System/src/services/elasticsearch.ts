import axios from 'axios';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit as limitDocs, writeBatch, doc } from 'firebase/firestore';
import { app } from './auth';

export interface FailedLogin {
    time: string;
    attempts: number;
}

export interface TopIP {
    ip: string;
    attempts: number;
}

export interface AuthLog {
    id: string;
    timestamp: string;
    user: string;
    sourceIp: string;
    host: string;
    result: 'Success' | 'Failed';
    method: string;
    port: number;
    risk?: 'High' | 'Medium' | 'Low';
}

export interface AuthEvent {
    time: string;
    events: number;
}

// Database Connection
const db = getFirestore(app);
const LOGS_COL = collection(db, 'authLogs');

let mockLogs: AuthLog[] = [];

// Stateful Mock Data Generator
const generateInitialLogs = (count: number = 300): AuthLog[] => {
    const logs: AuthLog[] = [];
    const now = new Date();
    const maliciousIPs = ['192.168.1.50', '203.0.113.42', '198.51.100.23', '45.22.12.99', '10.0.0.15'];
    const safeIPs = ['192.168.1.100', '192.168.1.101', '192.168.1.102'];
    const users = ['root', 'admin', 'mattheus', 'ubuntu', 'guest'];

    for (let i = 0; i < count; i++) {
        const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
        const eventDate = new Date(now.getTime() - timeOffset);

        const isMalicious = Math.random() > 0.7;
        const ip = isMalicious ? maliciousIPs[Math.floor(Math.random() * maliciousIPs.length)] : safeIPs[Math.floor(Math.random() * safeIPs.length)];
        const result = isMalicious ? (Math.random() > 0.05 ? 'Failed' : 'Success') : (Math.random() > 0.9 ? 'Failed' : 'Success');
        const user = users[Math.floor(Math.random() * users.length)];

        logs.push({
            id: '',
            timestamp: eventDate.toISOString(),
            user,
            sourceIp: ip,
            host: 'ubuntu-server-01',
            result,
            method: 'password',
            port: 22,
            risk: isMalicious ? (result === 'Failed' ? 'Medium' : 'High') : 'Low'
        });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Initialize Firestore Listening
const initFirestoreLogs = async () => {
    // Increased the fetch limit to 5,000 records dynamically, preventing out of memory on UI while storing infinity on DB
    const q = query(LOGS_COL, orderBy('timestamp', 'desc'), limitDocs(5000));

    onSnapshot(q, (snapshot) => {
        const logsFromDB: AuthLog[] = [];
        snapshot.forEach(docSnap => {
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

        // Seed initial if absolutely empty. We seed 500 records.
        if (logsFromDB.length === 0 && !localStorage.getItem('vigicore_seeded_firebase')) {
            console.log('Seeding initial Firestore logs to Firebase...');
            localStorage.setItem('vigicore_seeded_firebase', 'true'); // lock this client

            const initLogs = generateInitialLogs(500);
            const batch = writeBatch(db);
            initLogs.forEach(log => {
                const docRef = doc(LOGS_COL);
                log.id = docRef.id;
                batch.set(docRef, log);
            });
            batch.commit().catch(console.error);
        } else {
            mockLogs = logsFromDB.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            // Dispatch event to make UI update its cache if observing the array change manually.
            window.dispatchEvent(new Event('logsDatabaseUpdated'));
        }
    }, (error) => console.log('Firestore listener error:', error));
};

initFirestoreLogs();

// Simulator loop to add live data to Firestore (acts as the unified backend driver)
// It only produces traffic on devices that enable it, to prevent write spam.
// We auto-enable if we are the primary tab open (basic local locking mechanism for demonstration).
setInterval(() => {
    // Basic leader election via localStorage lock 10s
    const lastLeader = localStorage.getItem('vigicore_simulator_leader_time');
    const now = Date.now();
    if (!lastLeader || now - parseInt(lastLeader) >= 10000) {
        localStorage.setItem('vigicore_simulator_leader_time', now.toString());
    }

    // Only the leader device writes random logs
    if (now - parseInt(localStorage.getItem('vigicore_simulator_leader_time') || '0') < 2000) {
        const isMalicious = Math.random() > 0.8;
        const ip = isMalicious ? '203.0.113.42' : '192.168.1.100';

        addDoc(LOGS_COL, {
            timestamp: new Date().toISOString(),
            user: isMalicious ? 'root' : 'mattheus',
            sourceIp: ip,
            host: 'ubuntu-server-01',
            result: isMalicious ? 'Failed' : 'Success',
            method: 'password',
            port: 22,
            risk: isMalicious ? 'Medium' : 'Low'
        }).catch(console.error);
    }
}, 4000);


let currentTimeFilter = 'All time';

export const setGlobalTimeFilter = (filter: string) => {
    currentTimeFilter = filter;
    window.dispatchEvent(new Event('timeFilterChange'));
};

export const getGlobalTimeFilter = () => currentTimeFilter;

const getFilteredLogs = (): AuthLog[] => {
    if (currentTimeFilter === 'All time') return mockLogs;
    const now = Date.now();
    const thresholds: Record<string, number> = {
        'Last hour': 60 * 60 * 1000,
        'Today': 24 * 60 * 60 * 1000,
        'This week': 7 * 24 * 60 * 60 * 1000,
        'This month': 30 * 24 * 60 * 60 * 1000,
        'This quarter': 90 * 24 * 60 * 60 * 1000,
        'This year': 365 * 24 * 60 * 60 * 1000,
    };

    if (currentTimeFilter === 'Today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return mockLogs.filter(l => new Date(l.timestamp).getTime() >= startOfToday.getTime());
    }

    const threshold = thresholds[currentTimeFilter];
    if (threshold) {
        return mockLogs.filter(l => new Date(l.timestamp).getTime() >= now - threshold);
    }
    return mockLogs;
};

export const ElasticsearchService = {
    getAuthLogs: async (size: number = 50): Promise<AuthLog[]> => {
        return Promise.resolve(getFilteredLogs().slice(0, size));
    },

    getAuthStats: async () => {
        return Promise.resolve({
            total: getFilteredLogs().length,
            success: getFilteredLogs().filter(l => l.result === 'Success').length,
            failed: getFilteredLogs().filter(l => l.result === 'Failed').length,
            publickey: getFilteredLogs().filter(l => l.method === 'publickey').length,
        });
    },

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

    getFailedLogins: async (): Promise<FailedLogin[]> => {
        const now = new Date();
        const intervals = 6;
        const bucketSize = 4 * 60 * 60 * 1000; // 4 hours

        const buckets = Array.from({ length: intervals }).map((_, i) => {
            const bucketStart = new Date(now.getTime() - (intervals - i) * bucketSize);
            const bucketEnd = new Date(now.getTime() - (intervals - i - 1) * bucketSize);

            const attempts = getFilteredLogs().filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return log.result === 'Failed' && logTime >= bucketStart.getTime() && logTime < bucketEnd.getTime();
            }).length;

            return {
                time: bucketEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attempts
            };
        });

        return Promise.resolve(buckets);
    },

    getTopSourceIPs: async (): Promise<TopIP[]> => {
        const failedLogs = getFilteredLogs().filter(log => log.result === 'Failed');
        const counts: Record<string, number> = {};

        failedLogs.forEach(log => {
            counts[log.sourceIp] = (counts[log.sourceIp] || 0) + 1;
        });

        const sorted = Object.entries(counts)
            .map(([ip, attempts]) => ({ ip, attempts }))
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 5);

        return Promise.resolve(sorted);
    },

    getAuthTimeline: async (): Promise<AuthEvent[]> => {
        const now = new Date();
        const intervals = 6;
        const bucketSize = 4 * 60 * 60 * 1000;

        const buckets = Array.from({ length: intervals }).map((_, i) => {
            const bucketStart = new Date(now.getTime() - (intervals - i) * bucketSize);
            const bucketEnd = new Date(now.getTime() - (intervals - i - 1) * bucketSize);

            const events = getFilteredLogs().filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return logTime >= bucketStart.getTime() && logTime < bucketEnd.getTime();
            }).length;

            return {
                time: bucketEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                events
            };
        });

        return Promise.resolve(buckets);
    },

    getLoginDistribution: async (): Promise<{ name: string; value: number; color: string }[]> => {
        const successCount = getFilteredLogs().filter(l => l.result === 'Success').length;
        const failureCount = getFilteredLogs().filter(l => l.result === 'Failed').length;

        return Promise.resolve([
            { name: 'Success', value: successCount, color: '#10B981' },
            { name: 'Failed', value: failureCount, color: '#EF4444' },
        ]);
    },

    getSuspiciousIPs: async (): Promise<any[]> => {
        const topIPs = await ElasticsearchService.getTopSourceIPs();

        return Promise.resolve(topIPs.map(ipData => {
            const lastLog = getFilteredLogs().find(l => l.sourceIp === ipData.ip && l.result === 'Failed');
            const targetUser = lastLog?.user || 'unknown';

            return {
                ip: ipData.ip,
                attempts: ipData.attempts,
                user: targetUser,
                status: ipData.attempts > 150 ? 'Blocked' : 'Monitoring',
                risk: ipData.attempts > 150 ? 'High' : ipData.attempts > 50 ? 'Medium' : 'Low',
                timestamp: lastLog?.timestamp || new Date().toISOString()
            };
        }));
    },

    getIPIntelligence: async (): Promise<any[]> => {
        const suspiciousIPs = await ElasticsearchService.getSuspiciousIPs();

        // Generate mock locations and threats for top IPs
        const ipIntelligenceDatabase: Record<string, any> = {
            '192.168.1.50': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
            '203.0.113.42': { country: 'Russia', city: 'Moscow', coordinates: [37.6173, 55.7558] },
            '198.51.100.23': { country: 'China', city: 'Beijing', coordinates: [116.4074, 39.9042] },
            '45.22.12.99': { country: 'USA', city: 'New York', coordinates: [-74.0060, 40.7128] },
            '10.0.0.15': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
            '192.168.1.100': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
            '192.168.1.101': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
            '192.168.1.102': { country: 'Unknown', city: 'Internal Net', coordinates: [0, 0] },
        };

        return suspiciousIPs.map((item, index) => {
            const data = ipIntelligenceDatabase[item.ip] || { country: 'Unknown', city: 'Unknown', coordinates: [0, 0] };

            // Randomly assign some to real locations if they aren't in the DB to make the map look busy
            const backupCoords = [
                [-0.1276, 51.5072], // London
                [2.3522, 48.8566], // Paris
                [139.6917, 35.6895], // Tokyo
                [13.4050, 52.5200], // Berlin
                [-43.1729, -22.9068], // Rio
            ];
            const coords = data.coordinates[0] === 0 ? backupCoords[index % backupCoords.length] : data.coordinates;
            const country = data.country === 'Unknown' ? ['UK', 'France', 'Japan', 'Germany', 'Brazil'][index % 5] : data.country;
            const city = data.city === 'Internal Net' ? ['London', 'Paris', 'Tokyo', 'Berlin', 'Rio de Janeiro'][index % 5] : data.city;

            return {
                ...item,
                country: country,
                city: city,
                coordinates: coords,
                threats: Math.floor(item.attempts / 10) + 1,
                reputation: item.risk === 'High' ? 'High Risk' : item.risk === 'Medium' ? 'Low Risk' : 'Low Risk'
            };
        });
    },

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

    getAlertStats: async (): Promise<any> => {
        const fullAlerts = getFilteredLogs().filter(l => l.risk === 'High' || l.result === 'Failed');
        let active = 0, monitoring = 0, resolved = 0;

        fullAlerts.forEach((_, index) => {
            if (index % 4 === 0) resolved++;
            else if (index % 3 === 0) monitoring++;
            else active++;
        });

        return Promise.resolve({
            total: fullAlerts.length,
            active,
            monitoring,
            resolved
        });
    },

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

    checkHealth: async () => {
        return Promise.resolve({ status: 'green' });
    }
};
