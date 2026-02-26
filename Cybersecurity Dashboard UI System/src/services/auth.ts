export const AuthService = {
    initDB: () => {
        if (!localStorage.getItem('usersDatabase')) {
            const initialUsers = [
                {
                    username: 'Mattheustein',
                    password: 'Matt123',
                    role: 'Super Admin',
                    fullName: 'Mattheus Stein'
                },
                {
                    username: 'Admin',
                    password: 'Admin123',
                    role: 'Administrator',
                    fullName: 'System Admin'
                }
            ];
            localStorage.setItem('usersDatabase', JSON.stringify(initialUsers));
        }
    },

    getUsers: () => {
        AuthService.initDB();
        return JSON.parse(localStorage.getItem('usersDatabase') || '[]');
    },

    saveUsers: (users: any[]) => {
        localStorage.setItem('usersDatabase', JSON.stringify(users));
    },

    login: async (username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
        await new Promise(resolve => setTimeout(resolve, 500));
        AuthService.initDB();

        const usersDatabase = AuthService.getUsers();
        const user = usersDatabase.find(
            (u: any) => (u.username.toLowerCase() === username.toLowerCase()) && u.password === password
        );

        if (user) {
            const { password: _, ...userInfo } = user;
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            window.dispatchEvent(new Event('authChange'));
            return { success: true, user: userInfo };
        }

        return { success: false, error: 'Invalid username or password' };
    },

    logout: () => {
        localStorage.removeItem('currentUser');
        window.dispatchEvent(new Event('authChange'));
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    addUser: async (newUser: any): Promise<{ success: boolean; error?: string }> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const users = AuthService.getUsers();
        if (users.find((u: any) => u.username.toLowerCase() === newUser.username.toLowerCase())) {
            return { success: false, error: 'Username already exists' };
        }
        users.push({ ...newUser, role: newUser.role || 'Analyst' });
        AuthService.saveUsers(users);
        return { success: true };
    },

    updateProfile: async (updatedUser: any): Promise<{ success: boolean; error?: string }> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const users = AuthService.getUsers();
        const index = users.findIndex((u: any) => u.username === updatedUser.username);
        if (index > -1) {
            const currentUser = users[index];
            users[index] = { ...currentUser, ...updatedUser };
            AuthService.saveUsers(users);

            // Update session if it's the current user
            const sessionObj = AuthService.getCurrentUser();
            if (sessionObj && sessionObj.username === updatedUser.username) {
                const { password: _, ...sessionInfo } = users[index];
                localStorage.setItem('currentUser', JSON.stringify(sessionInfo));
                window.dispatchEvent(new Event('authChange'));
            }
            return { success: true };
        }
        return { success: false, error: 'User not found' };
    }
};
