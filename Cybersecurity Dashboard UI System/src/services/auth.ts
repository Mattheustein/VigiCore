export const AuthService = {
    login: async (username: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> => {
        // Simulated database query delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock Login Database
        const usersDatabase = [
            {
                username: 'Mattheustein',
                password: 'Matt123',
                role: 'Analyst',
            },
            {
                username: 'Admin',
                password: 'Admin123',
                role: 'Administrator',
            }
        ];

        const user = usersDatabase.find(
            (u) => (u.username.toLowerCase() === username.toLowerCase()) && u.password === password
        );

        if (user) {
            // Return success without the password
            const { password: _, ...userInfo } = user;
            return { success: true, user: userInfo };
        }

        return { success: false, error: 'Invalid username or password' };
    }
};
