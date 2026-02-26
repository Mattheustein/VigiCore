import axios from 'axios';

const ES_API_URL = '/api/elasticsearch';

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

// Stateful Mock Data Generator
const generateInitialLogs = (): AuthLog[] => {
    const logs: AuthLog[] = [];
    const now = new Date();
    const maliciousIPs = ['192.168.1.50', '203.0.113.42', '198.51.100.23', '45.22.12.99', '10.0.0.15'];
    const safeIPs = ['192.168.1.100', '192.168.1.101', '192.168.1.102'];
    const users = ['root', 'admin', 'mattheus', 'ubuntu', 'guest'];

    // Generate 1500 logs over the last 24 hours
    for (let i = 0; i < 1500; i++) {
        const timeOffset = Math.floor(Math.random() * 24 * 60 * 60 * 1000); // Random time in last 24h
        const eventDate = new Date(now.getTime() - timeOffset);

        const isMalicious = Math.random() > 0.7; // 30% are malicious
        const ip = isMalicious ? maliciousIPs[Math.floor(Math.random() * maliciousIPs.length)] : safeIPs[Math.floor(Math.random() * safeIPs.length)];
        const result = isMalicious ? (Math.random() > 0.05 ? 'Failed' : 'Success') : (Math.random() > 0.9 ? 'Failed' : 'Success');
        const user = users[Math.floor(Math.random() * users.length)];

        logs.push({
            id: `log-${Math.random().toString(36).substr(2, 9)}`,
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

let mockLogs = generateInitialLogs();

// Simulator loop to add live data
setInterval(() => {
    const isMalicious = Math.random() > 0.8;
    const ip = isMalicious ? '203.0.113.42' : '192.168.1.100';
    mockLogs.unshift({
        id: `log-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        user: isMalicious ? 'root' : 'mattheus',
        sourceIp: ip,
        host: 'ubuntu-server-01',
        result: isMalicious ? 'Failed' : 'Success',
        method: 'password',
        port: 22,
        risk: isMalicious ? 'Medium' : 'Low'
    });
    if (mockLogs.length > 3000) mockLogs.pop();
}, 2500);

export const ElasticsearchService = {
    getAuthLogs: async (size: number = 50): Promise<AuthLog[]> => {
        return Promise.resolve(mockLogs.slice(0, size));
    },

    getFailedLogins: async (): Promise<FailedLogin[]> => {
        const now = new Date();
        const intervals = 6;
        const bucketSize = 4 * 60 * 60 * 1000; // 4 hours

        const buckets = Array.from({ length: intervals }).map((_, i) => {
            const bucketStart = new Date(now.getTime() - (intervals - i) * bucketSize);
            const bucketEnd = new Date(now.getTime() - (intervals - i - 1) * bucketSize);

            const attempts = mockLogs.filter(log => {
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
        const failedLogs = mockLogs.filter(log => log.result === 'Failed');
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

            const events = mockLogs.filter(log => {
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
        const successCount = mockLogs.filter(l => l.result === 'Success').length;
        const failureCount = mockLogs.filter(l => l.result === 'Failed').length;

        return Promise.resolve([
            { name: 'Success', value: successCount, color: '#10B981' },
            { name: 'Failed', value: failureCount, color: '#EF4444' },
        ]);
    },

    getSuspiciousIPs: async (): Promise<any[]> => {
        const topIPs = await ElasticsearchService.getTopSourceIPs();

        return Promise.resolve(topIPs.map(ipData => {
            const lastLog = mockLogs.find(l => l.sourceIp === ipData.ip && l.result === 'Failed');
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
                reputation: item.risk === 'High' ? 'High Risk' : item.risk === 'Medium' ? 'Medium Risk' : 'Low Risk'
            };
        });
    },

    getSystemHealth: async (): Promise<any> => {
        return Promise.resolve({
            cpu: 34 + Math.floor(Math.random() * 10),
            memory: 65 + Math.floor(Math.random() * 5),
            disk: 42,
            status: 'Healthy'
        });
    },

    getAlerts: async (): Promise<any[]> => {
        const recentHighRiskLogs = mockLogs
            .filter(l => l.risk === 'High' || l.result === 'Failed')
            .slice(0, 20);

        return Promise.resolve(recentHighRiskLogs.map(log => ({
            id: log.id,
            title: log.risk === 'High' ? 'Critical Security Event' : 'Failed Login Attempt',
            severity: log.risk || 'Medium',
            timestamp: log.timestamp,
            status: 'Active',
            description: `Unauthorized access attempt detected from ${log.sourceIp} targeting user ${log.user}.`
        })));
    },

    checkHealth: async () => {
        return Promise.resolve({ status: 'green' });
    }
};
