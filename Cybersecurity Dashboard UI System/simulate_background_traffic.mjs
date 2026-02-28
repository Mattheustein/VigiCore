import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCXFs_pE63H5uk_o2oM7gvfD5TdckP5G7g",
    authDomain: "vigicore-03.firebaseapp.com",
    projectId: "vigicore-03",
    storageBucket: "vigicore-03.firebasestorage.app",
    messagingSenderId: "18230410176",
    appId: "1:18230410176:web:33bd30d15ca6ae59072625",
    measurementId: "G-2R4TK28LGE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const LOGS_COL = collection(db, "authLogs");

// Shared Mock Entities for Variety
const maliciousIPs = [
    '203.0.113.42', '198.51.100.23', '45.22.12.99', '101.42.15.11',
    '220.191.50.80', '5.188.87.52', '185.20.10.15', '31.14.88.2',
    '45.144.200.11', '193.106.191.13', '181.214.206.51', '118.193.31.22',
    '34.122.50.77', '18.220.11.192', '51.15.20.25', '178.128.99.200',
    '159.65.11.45', '82.165.20.11'
];
const safeIPs = [
    '192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103',
    '10.0.0.50', '10.0.0.51', '10.0.1.20', '172.16.0.15', '192.168.2.10',
    '203.0.113.1', '127.0.0.1', '192.168.1.250'
];
const users = ['root', 'admin', 'mattheus', 'ubuntu', 'guest', 'oracle', 'mysql', 'postgres', 'test', 'sysadmin', 'jenkins', 'git', 'deploy', 'backup', 'nobody', 'ftp', 'nagios'];
const methods = ['password', 'publickey', 'keyboard-interactive', 'gssapi-with-mic', 'none', 'hostbased'];
const hosts = ['ubuntu-server-01', 'db-production-01', 'web-frontend-02', 'api-gateway', 'payment-processor', 'jenkins-ci-runner', 'backup-server', 'dev-environment', 'redis-cache-01', 'loadbalancer-01'];
const ports = [22, 2222, 21, 23, 80, 443, 3389, 8080, 5432, 3306, 6379, 27017, 1433, 1521, 5900];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateEvents = async () => {
    // Generate 5 to 15 events to simulate 5 minutes of background traffic
    const eventCount = Math.floor(Math.random() * 11) + 5;

    console.log(`Simulating ${eventCount} events in background...`);
    const now = new Date();

    for (let i = 0; i < eventCount; i++) {
        const timeOffset = Math.floor(Math.random() * 5 * 60 * 1000); // within the last 5 mins
        const eventDate = new Date(now.getTime() - timeOffset);

        const isMalicious = Math.random() > 0.6;
        const ip = isMalicious ? getRandomItem(maliciousIPs) : getRandomItem(safeIPs);
        const result = isMalicious ? (Math.random() > 0.05 ? 'Failed' : 'Success') : (Math.random() > 0.95 ? 'Failed' : 'Success');
        const user = getRandomItem(users);
        const method = getRandomItem(methods);
        const host = getRandomItem(hosts);
        const port = getRandomItem(ports);

        let risk = 'Low';
        if (isMalicious && result === 'Success') risk = 'High';
        else if (isMalicious && result === 'Failed') risk = 'Medium';
        else if (!isMalicious && result === 'Failed') risk = 'Low';

        try {
            await addDoc(LOGS_COL, {
                timestamp: eventDate.toISOString(),
                user,
                sourceIp: ip,
                host,
                result,
                method,
                port,
                risk
            });
            console.log(`Pushed log: ${user} from ${ip} (${result})`);
        } catch (e) {
            console.error("Error pushing event", e);
        }
    }
    console.log("Finished running simulator job.");
    process.exit(0);
};

generateEvents();
