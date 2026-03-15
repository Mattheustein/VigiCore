import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";

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
const LOGS_COL = collection(db, 'authLogs_v2');

const maliciousIPs = [
    '203.0.113.42', '198.51.100.23', '45.22.12.99', '101.42.15.11',
    '220.191.50.80', '5.188.87.52', '185.20.10.15', '31.14.88.2',
    '45.144.200.11', '193.106.191.13', '181.214.206.51', '118.193.31.22',
    '34.122.50.77', '18.220.11.192', '51.15.20.25', '178.128.99.200',
    '159.65.11.45', '82.165.20.11'
];
const internalHosts = ['auth.vigicore.local', 'vpn.vigicore.local', 'sso.vigicore.local', 'api.vigicore.local'];

function generateInitialLogs(count: number, startTimestamp: number, endTimestamp: number): any[] {
    const logs: any[] = [];
    const timeSpan = endTimestamp - startTimestamp;

    for (let i = 0; i < count; i++) {
        const isMalicious = Math.random() > 0.85;
        const result = isMalicious && Math.random() > 0.1 ? 'Failed' : 'Success';

        let sourceIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
        if (isMalicious) {
            sourceIp = maliciousIPs[Math.floor(Math.random() * maliciousIPs.length)];
        } else if (Math.random() > 0.7) {
            sourceIp = `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        }

        const randomTime = startTimestamp + Math.floor(Math.random() * timeSpan);

        logs.push({
            timestamp: new Date(randomTime).toISOString(),
            user: isMalicious ? `attacker_${Math.floor(Math.random() * 9999)}` : `employee_${Math.floor(Math.random() * 500)}`,
            sourceIp,
            host: internalHosts[Math.floor(Math.random() * internalHosts.length)],
            result,
            method: Math.random() > 0.5 ? 'password' : 'publickey',
            port: [22, 443, 8080, 8443][Math.floor(Math.random() * 4)],
            risk: isMalicious ? 'High' : (result === 'Failed' ? 'Medium' : 'Low')
        });
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

async function runSeeder() {
    console.log('Seeding pristine 15k log history explicitly to Version 2 database...');
    const now = new Date();
    const year = now.getFullYear();

    const janStart = new Date(year, 0, 1).getTime();
    const janEnd = new Date(year, 1, 0, 23, 59, 59).getTime();
    const janLogs = generateInitialLogs(4839, janStart, janEnd);

    const febStart = new Date(year, 1, 1).getTime();
    const febEnd = new Date(year, 2, 0, 23, 59, 59).getTime();
    const febLogs = generateInitialLogs(7214, febStart, febEnd);

    const marStart = new Date(year, 2, 1).getTime();
    const marEnd = now.getTime();
    const marLogs = generateInitialLogs(3630, marStart, marEnd);

    const initLogs = [...janLogs, ...febLogs, ...marLogs];

    const MAX_BATCH_SIZE = 400;
    let writeCount = 0;
    let setBatch = writeBatch(db);

    for (const log of initLogs) {
        const docRef = doc(LOGS_COL);
        log.id = docRef.id;
        setBatch.set(docRef, log);
        writeCount++;
        if (writeCount % MAX_BATCH_SIZE === 0) {
            await setBatch.commit();
            console.log(`Committed ${writeCount} pristine logs...`);
            setBatch = writeBatch(db);
        }
    }
    await setBatch.commit();
    console.log('Successfully completed uncorrupted Version 2 database seed!');
    process.exit(0);
}

runSeeder();
