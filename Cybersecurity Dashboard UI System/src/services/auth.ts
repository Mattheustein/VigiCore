import { initializeApp, getApp, getApps } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    updateEmail,
    onAuthStateChanged,
    verifyBeforeUpdateEmail
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCXFs_pE63H5uk_o2oM7gvfD5TdckP5G7g",
    authDomain: "vigicore-03.firebaseapp.com",
    projectId: "vigicore-03",
    storageBucket: "vigicore-03.firebasestorage.app",
    messagingSenderId: "18230410176",
    appId: "1:18230410176:web:33bd30d15ca6ae59072625",
    measurementId: "G-2R4TK28LGE"
};

// Main App & Auth
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Secondary App for User Creation (prevents Admin logout)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

const db = getFirestore(app);

let currentUser: any = JSON.parse(localStorage.getItem('currentUser') || 'null');

onAuthStateChanged(auth, (user) => {
    if (user) {
        const displayName = user.displayName || user.email || '';
        const roleMatch = displayName.match(/\[(.*?)\]$/);
        const isSuperAdminEmail = user.email === 'mattheustein@vigicore.local' || user.email === 'swe.mahmoud.sultan@gmail.com';
        const role = roleMatch ? roleMatch[1] : (isSuperAdminEmail ? 'Super Admin' : 'Analyst');
        const fullName = displayName.replace(/\s*\[.*?\]$/, '');

        currentUser = {
            username: user.email?.replace('@vigicore.local', ''),
            fullName: fullName || user.email?.split('@')[0],
            role: role
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        currentUser = null;
        localStorage.removeItem('currentUser');
    }
    window.dispatchEvent(new Event('authChange'));
});

export const AuthService = {
    initDB: () => { },
    getUsers: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "userProfiles"));
            const users: any[] = [];
            querySnapshot.forEach((d) => {
                users.push(d.data());
            });

            if (users.length === 0) {
                const default1 = { fullName: "Mahmoud Sultan", username: "mattheustein", email: "swe.mahmoud.sultan@gmail.com", role: "Super Admin" };
                const default2 = { fullName: "System Admin", username: "admin", email: "admin@vigicore.local", role: "Administrator" };
                users.push(default1, default2);
                await setDoc(doc(db, "userProfiles", "mattheustein"), default1);
                await setDoc(doc(db, "userProfiles", "admin"), default2);
            }
            return users;
        } catch (e) {
            console.error("Error fetching users", e);
            return [];
        }
    },
    saveUserToDB: async (user: any) => {
        await setDoc(doc(db, "userProfiles", user.username), user);
    },
    deleteUserFromDB: async (username: string) => {
        await deleteDoc(doc(db, "userProfiles", username));
    },

    login: async (username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
        try {
            const email = username.includes('@') ? username.toLowerCase() : `${username.toLowerCase()}@vigicore.local`;
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: currentUser };
        } catch (error: any) {
            console.error(error);
            return { success: false, error: 'Invalid username or password' };
        }
    },

    logout: () => {
        signOut(auth);
    },

    getCurrentUser: () => {
        return currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
    },

    addUser: async (newUser: any): Promise<{ success: boolean; error?: string }> => {
        try {
            const email = (newUser.email && newUser.email.includes('@'))
                ? newUser.email.toLowerCase()
                : (newUser.username.includes('@') ? newUser.username.toLowerCase() : `${newUser.username.toLowerCase()}@vigicore.local`);
            const role = newUser.role || 'Analyst';

            // Create user on secondary instance to avoid booting the active admin
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);

            // Assign name and role to profile displayName using a bracket hack for storage
            await updateProfile(userCredential.user, {
                displayName: `${newUser.fullName || newUser.username} [${role}]`
            });
            await signOut(secondaryAuth);

            // Keep the database list updated for view purpose
            await AuthService.saveUserToDB({ ...newUser, email });

            return { success: true };
        } catch (error: any) {
            console.error(error);
            return { success: false, error: 'Error creating user: ' + error.message };
        }
    },

    updateProfile: async (updatedUser: any): Promise<{ success: boolean; error?: string }> => {
        try {
            if (auth.currentUser) {
                const role = updatedUser.role || currentUser?.role || 'Analyst';
                await updateProfile(auth.currentUser, {
                    displayName: `${updatedUser.fullName || updatedUser.username} [${role}]`
                });

                if (updatedUser.email && updatedUser.email !== auth.currentUser.email) {
                    try {
                        await updateEmail(auth.currentUser, updatedUser.email);
                    } catch (e: any) {
                        if (e.code === 'auth/operation-not-allowed' || e.message?.includes('verify')) {
                            await verifyBeforeUpdateEmail(auth.currentUser, updatedUser.email);
                            alert(`Firebase Security Alert: A verification email has been sent to ${updatedUser.email}. Please click the link to finalize your new email address in the authentication system.`);
                        } else if (e.code === 'auth/requires-recent-login') {
                            return { success: false, error: 'Firebase Security requires you to log out and log back in before changing your email.' };
                        } else {
                            throw e;
                        }
                    }
                }

                // Update global users list if they are in there
                currentUser = { ...currentUser, ...updatedUser };
                await AuthService.saveUserToDB(currentUser);

                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                window.dispatchEvent(new Event('authChange'));

                return { success: true };
            }
            return { success: false, error: 'No user signed in' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
};
