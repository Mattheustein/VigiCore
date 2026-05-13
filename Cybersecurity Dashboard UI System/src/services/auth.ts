/**
 * VigiCore Authentication Service
 * ================================
 * Manages all user authentication, session handling, and user profile operations.
 *
 * Architecture:
 * - Uses Firebase Authentication for credential management (email/password + Google OAuth).
 * - Uses Firestore ("userProfiles" collection) for extended profile data (role, full name).
 * - Employs a dual Firebase app instance pattern: the primary app handles the active
 *   user session, while a secondary app is used for admin user creation to prevent
 *   the admin from being logged out when creating new accounts.
 *
 * Session Management:
 * - User session state is persisted to localStorage under the key "currentUser".
 * - The `onAuthStateChanged` listener syncs Firebase auth state with the local profile.
 * - A custom "authChange" event is dispatched on window to notify UI components of
 *   session changes (login, logout, profile updates).
 *
 * Role Assignment:
 * - Primary: Roles are stored in the Firestore "userProfiles" collection.
 * - Fallback: If no Firestore profile exists, the role is parsed from the Firebase Auth
 *   displayName field using a bracket convention (e.g., "John Doe [Super Admin]").
 * - Certain hardcoded emails are automatically assigned the "Super Admin" role as a
 *   fallback safety net.
 */
import { initializeApp, getApp, getApps } from "firebase/app";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    updateEmail,
    onAuthStateChanged,
    verifyBeforeUpdateEmail,
    updatePassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, getDoc } from "firebase/firestore";

/**
 * Firebase project configuration.
 * NOTE: In production, these values should be loaded from environment variables
 * (e.g., VITE_FIREBASE_API_KEY) to avoid exposing credentials in source control.
 * Firebase API keys are client-facing by design, but should be paired with
 * restrictive Firestore security rules and App Check for production deployments.
 */
const firebaseConfig = {
    apiKey: "AIzaSyCXFs_pE63H5uk_o2oM7gvfD5TdckP5G7g",
    authDomain: "vigicore-03.firebaseapp.com",
    projectId: "vigicore-03",
    storageBucket: "vigicore-03.firebasestorage.app",
    messagingSenderId: "18230410176",
    appId: "1:18230410176:web:33bd30d15ca6ae59072625",
    measurementId: "G-2R4TK28LGE"
};

// --- Firebase App Initialization ---

/** Primary Firebase app instance — used for the active user's auth session. */
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/**
 * Secondary Firebase app instance — used exclusively for admin operations
 * like creating new user accounts. Without this, calling
 * `createUserWithEmailAndPassword` on the primary auth would sign OUT the
 * currently logged-in admin and sign IN as the newly created user.
 */
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

/** Firestore database instance — stores user profiles and application data. */
const db = getFirestore(app);

/**
 * In-memory cache of the current user's profile, hydrated from localStorage
 * on page load and kept in sync by the `onAuthStateChanged` listener below.
 */
let currentUser: any = JSON.parse(localStorage.getItem('currentUser') || 'null');

/**
 * Firebase Auth State Listener
 * ----------------------------
 * Fires whenever the user's sign-in state changes (login, logout, token refresh).
 * Responsible for syncing the local `currentUser` object with the authoritative
 * profile data from Firestore, falling back to Firebase Auth metadata if no
 * Firestore profile is found.
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const email = user.email?.toLowerCase();
        let dbProfile = null;

        // Attempt to load the user's extended profile from Firestore
        try {
            const querySnapshot = await getDocs(collection(db, "userProfiles"));
            querySnapshot.forEach((d) => {
                const data = d.data();
                if (data.email?.toLowerCase() === email) {
                    dbProfile = data;
                }
            });
        } catch (e) {
            console.error("Auth change error reading DB:", e);
        }

        if (dbProfile) {
            // Use the Firestore profile as the source of truth for role and name
            currentUser = dbProfile;
        } else {
            // Fallback: derive profile from Firebase Auth displayName field.
            // The displayName stores the role in brackets, e.g., "John Doe [Admin]".
            const displayName = user.displayName || user.email || '';
            const roleMatch = displayName.match(/\[(.*?)\]$/);
            const isSuperAdminEmail = user.email === 'mattheustein@vigicore.local' || user.email === 'swe.mahmoud.sultan@gmail.com';
            const role = roleMatch ? roleMatch[1] : (isSuperAdminEmail ? 'Super Admin' : 'Analyst');
            const fullName = displayName.replace(/\s*\[.*?\]$/, '');

            currentUser = {
                username: user.email?.replace('@vigicore.local', ''),
                email: user.email,
                fullName: fullName || user.email?.split('@')[0],
                role: role
            };
        }
        // Persist session to survive page refreshes
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
        // User signed out — clear all session data
        currentUser = null;
        localStorage.removeItem('currentUser');
    }
    // Notify all listening components (DashboardLayout, SettingsPage, etc.)
    window.dispatchEvent(new Event('authChange'));
});

/**
 * AuthService — Public API
 * ========================
 * Provides all authentication and user management methods consumed by
 * the UI components. Exported as a singleton object with async methods.
 */
export const AuthService = {
    /** No-op placeholder — database initialization is handled by Firebase SDK. */
    initDB: () => { },
    /**
     * Retrieves all user profiles from the Firestore "userProfiles" collection.
     * If the collection is empty (first-time setup), seeds it with two default
     * accounts: the primary Super Admin and a system Administrator.
     * Used by the Settings > User Management panel (Super Admin only).
     */
    getUsers: async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "userProfiles"));
            const users: any[] = [];
            querySnapshot.forEach((d) => {
                users.push(d.data());
            });

            // First-time bootstrap: seed default user profiles
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
    /** Persists or updates a user profile document in Firestore, keyed by username. */
    saveUserToDB: async (user: any) => {
        await setDoc(doc(db, "userProfiles", user.username), user);
    },

    /** Removes a user profile document from Firestore. Does NOT delete the Firebase Auth account. */
    deleteUserFromDB: async (username: string) => {
        await deleteDoc(doc(db, "userProfiles", username));
    },

    /**
     * Authenticates a user via email/password against Firebase Auth.
     * Supports both plain username (e.g., "mattheustein") and full email
     * (e.g., "user@domain.com") as the username input.
     *
     * Username Resolution Logic:
     * 1. If input contains "@", treat it as a full email address.
     * 2. If input is a plain username, look up the Firestore profile to find
     *    the associated real email address.
     * 3. If no Firestore profile exists, fall back to "username@vigicore.local".
     */
    login: async (username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
        try {
            let email = username.toLowerCase();
            if (!email.includes('@')) {
                // Resolve plain username to email via Firestore lookup
                try {
                    const userDoc = await getDoc(doc(db, "userProfiles", email));
                    if (userDoc.exists() && userDoc.data().email) {
                        email = userDoc.data().email.toLowerCase();
                    } else {
                        // Default domain for internal accounts without a profile
                        email = `${email}@vigicore.local`;
                    }
                } catch (dbError) {
                    email = `${email}@vigicore.local`;
                }
            } else {
                email = email.toLowerCase();
            }

            await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: currentUser };
        } catch (error: any) {
            console.error(error);
            return { success: false, error: 'Invalid username or password' };
        }
    },

    /**
     * Authenticates a user via Google OAuth popup.
     * Security: Only users with a pre-existing Firestore profile are allowed in.
     * If the Google account's email doesn't match any profile, the Firebase
     * session is immediately revoked and the user is denied access.
     * This acts as a whitelist mechanism for Google SSO.
     */
    loginWithGoogle: async (): Promise<{ success: boolean; user?: any; error?: string }> => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const user = result.user;
            const email = user.email || '';
            const fullName = user.displayName || email.split('@')[0];
            const defaultUsername = email.split('@')[0].toLowerCase();

            // Verify the Google account has an existing authorized profile
            const allUsers = await AuthService.getUsers();
            const existingProfile = allUsers.find(u => u.email === email);

            if (!existingProfile) {
                await signOut(auth); // Immediately revoke the session — unauthorized user
                return { success: false, error: 'Your email is not authorized. Please ask an Administrator to create a profile for you first.' };
            }

            currentUser = existingProfile;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            return { success: true, user: currentUser };
        } catch (error: any) {
            console.error(error);
            return { success: false, error: 'Google Login failed: ' + error.message };
        }
    },

    /** Signs out the current user from Firebase Auth. The `onAuthStateChanged` listener handles cleanup. */
    logout: () => {
        signOut(auth);
    },

    /** Returns the cached user profile, falling back to localStorage if the in-memory cache is empty. */
    getCurrentUser: () => {
        return currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
    },

    /**
     * Creates a new user account (Super Admin operation).
     *
     * Uses the secondary Firebase app instance to create the Firebase Auth account,
     * preventing the currently logged-in admin from being signed out. After creation,
     * the secondary auth session is immediately signed out.
     *
     * The user's role is encoded into the Firebase Auth displayName field using the
     * bracket convention (e.g., "Jane Doe [Analyst]") and also persisted to Firestore.
     *
     * Email Resolution: If no email is provided, generates one as "username@vigicore.local".
     */
    addUser: async (newUser: any): Promise<{ success: boolean; error?: string }> => {
        try {
            // Resolve the email: use provided email, or derive from username
            const email = (newUser.email && newUser.email.includes('@'))
                ? newUser.email.toLowerCase()
                : (newUser.username.includes('@') ? newUser.username.toLowerCase() : `${newUser.username.toLowerCase()}@vigicore.local`);
            const role = newUser.role || 'Analyst';

            // Create the Firebase Auth account on the SECONDARY instance
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newUser.password);

            // Encode the role into displayName using the bracket convention
            await updateProfile(userCredential.user, {
                displayName: `${newUser.fullName || newUser.username} [${role}]`
            });
            await signOut(secondaryAuth); // Clean up the secondary session

            // Persist the user profile to Firestore for the User Management panel
            await AuthService.saveUserToDB({ ...newUser, email });

            return { success: true };
        } catch (error: any) {
            console.error(error);
            return { success: false, error: 'Error creating user: ' + error.message };
        }
    },

    /**
     * Updates the currently signed-in user's profile.
     * Handles three independent update operations:
     *   1. Display name and role (always updated via Firebase Auth displayName)
     *   2. Email change (requires Firebase email verification flow)
     *   3. Password change (requires recent authentication)
     *
     * Firebase will throw `auth/requires-recent-login` for sensitive operations
     * (email/password changes) if the user hasn't authenticated recently.
     * These errors are caught and surfaced as user-friendly messages.
     */
    updateProfile: async (updatedUser: any): Promise<{ success: boolean; error?: string }> => {
        try {
            if (auth.currentUser) {
                // 1. Update displayName with role bracket convention
                const role = updatedUser.role || currentUser?.role || 'Analyst';
                await updateProfile(auth.currentUser, {
                    displayName: `${updatedUser.fullName || updatedUser.username} [${role}]`
                });

                // 2. Email update — requires verification for security
                if (updatedUser.email && updatedUser.email !== auth.currentUser.email) {
                    try {
                        await updateEmail(auth.currentUser, updatedUser.email);
                    } catch (e: any) {
                        if (e.code === 'auth/operation-not-allowed' || e.message?.includes('verify')) {
                            // Firebase requires email verification before applying the change
                            await verifyBeforeUpdateEmail(auth.currentUser, updatedUser.email);
                            alert(`Firebase Security Alert: A verification email has been sent to ${updatedUser.email}. Please click the link to finalize your new email address in the authentication system.`);
                        } else if (e.code === 'auth/requires-recent-login') {
                            return { success: false, error: 'Firebase Security requires you to log out and log back in before changing your email.' };
                        } else {
                            throw e;
                        }
                    }
                }

                // 3. Password update — only if a new password was provided
                if (updatedUser.password) {
                    try {
                        await updatePassword(auth.currentUser, updatedUser.password);
                    } catch (e: any) {
                        if (e.code === 'auth/requires-recent-login') {
                            return { success: false, error: 'Firebase Security requires you to log out and log back in before changing your password.' };
                        } else {
                            throw e;
                        }
                    }
                }

                // Sync updates to Firestore and local session
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
