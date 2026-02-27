import { initializeApp, getApp, getApps } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
} from "firebase/auth";

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

let currentUser: any = JSON.parse(localStorage.getItem('currentUser') || 'null');

onAuthStateChanged(auth, (user) => {
    if (user) {
        const displayName = user.displayName || user.email || '';
        const roleMatch = displayName.match(/\[(.*?)\]$/);
        const role = roleMatch ? roleMatch[1] : (user.email === 'mattheustein@vigicore.local' ? 'Super Admin' : 'Analyst');
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
    getUsers: () => {
        // We can't list all users natively from pure client SDK securely.
        // For dashboard mock UI purposes, we'll return a cached list from local storage or display the logged in user as the only known "database".
        // A true user list requires a Firebase Admin/Cloud Functions or Firestore collection. Let's return local mock just so UI doesn't crash:
        try {
            return JSON.parse(localStorage.getItem('localUsersMockList') || '[]');
        } catch (e) {
            return [];
        }
    },
    saveUsers: (users: any[]) => {
        localStorage.setItem('localUsersMockList', JSON.stringify(users));
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
            const email = newUser.username.includes('@') ? newUser.username.toLowerCase() : `${newUser.username.toLowerCase()}@vigicore.local`;
            const role = newUser.role || 'Analyst';

            // Create user on secondary instance to avoid booting the active admin
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);

            // Assign name and role to profile displayName using a bracket hack for storage
            await updateProfile(userCredential.user, {
                displayName: `${newUser.fullName || newUser.username} [${role}]`
            });
            await signOut(secondaryAuth);

            // Keep the local ui list updated for view purpose
            const users = AuthService.getUsers();
            if (!users.find((u: any) => u.username === newUser.username)) {
                users.push(newUser);
                AuthService.saveUsers(users);
            }

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

                // Update local storage representation
                currentUser = { ...currentUser, ...updatedUser };
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
