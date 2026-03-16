import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, getCountFromServer } from "firebase/firestore";

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

async function checkDates() {
    console.log("Checking database authLogs_v2...");
    
    const janStart = new Date(2026, 0, 1).toISOString();
    const febStart = new Date(2026, 1, 1).toISOString();
    const marStart = new Date(2026, 2, 1).toISOString();
    const aprStart = new Date(2026, 3, 1).toISOString();

    const qJan = query(LOGS_COL, where("timestamp", ">=", janStart), where("timestamp", "<", febStart));
    const qFeb = query(LOGS_COL, where("timestamp", ">=", febStart), where("timestamp", "<", marStart));
    const qMar = query(LOGS_COL, where("timestamp", ">=", marStart), where("timestamp", "<", aprStart));

    const snapJan = await getCountFromServer(qJan);
    const snapFeb = await getCountFromServer(qFeb);
    const snapMar = await getCountFromServer(qMar);
    const snapTotal = await getCountFromServer(LOGS_COL);

    console.log(`January Logs: ${snapJan.data().count}`);
    console.log(`February Logs: ${snapFeb.data().count}`);
    console.log(`March Logs: ${snapMar.data().count}`);
    console.log(`Total Logs: ${snapTotal.data().count}`);
    process.exit(0);
}

checkDates().catch(console.error);
