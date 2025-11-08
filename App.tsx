
import React, { useState, createContext, useMemo, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SchedulePage from './pages/SchedulePage';
import TeamPage from './pages/PlayersPage';
import TacticsPage from './pages/TacticsPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminPage from './pages/AdminPage';
import { useTheme } from './hooks/useTheme';
import { useAuth, AuthContext, User } from './hooks/useAuth';
import { NAV_LINKS, ADMIN_NAV_LINK, LOGOUT_NAV_LINK, PLAYER_PROFILE_NAV_LINK, TACTICS_NAV_LINK } from './constants';
import type { Page } from './types';

export const ThemeContext = createContext<{ theme: string; toggleTheme: () => void; } | null>(null);
export const PageContext = createContext<{ currentPage: Page; setCurrentPage: (page: Page) => void; } | null>(null);

const App: React.FC = () => {
    const [theme, toggleTheme] = useTheme();
    const [currentPage, setCurrentPage] = useState<Page>('Home');
    const { user, isAdmin, isCoach } = useAuth();
    
    const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
    const pageValue = useMemo(() => ({ currentPage, setCurrentPage }), [currentPage]);
    const authValue = useMemo(() => ({ user, isAdmin, isCoach }), [user, isAdmin, isCoach]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
    }, [theme]);

    const renderPage = () => {
        switch (currentPage) {
            case 'Home':
                return <HomePage />;
            case 'Schedule':
                return <SchedulePage />;
            case 'Team':
                return <TeamPage />;
            case 'Tactics':
                return <TacticsPage />;
            case 'My Profile':
            case 'Login':
                return <LoginPage />;
            case 'Admin Login':
                return <AdminLoginPage />;
            case 'Admin':
                return isAdmin ? <AdminPage /> : <HomePage />; // Redirect if not admin
            default:
                return <HomePage />;
        }
    };

    const navLinks = useMemo(() => {
        if (user) {
            // User is logged in
            const baseLinks = NAV_LINKS.filter(
                (link) => link.name !== 'Login' && link.name !== 'Admin Login'
            );
            if (isAdmin) {
                // If admin, add admin and logout (NO TACTICS)
                return [...baseLinks, ADMIN_NAV_LINK, LOGOUT_NAV_LINK];
            }
             // If coach or regular player, add profile, tactics and logout
            if (isCoach || !isAdmin) {
                 return [...baseLinks, PLAYER_PROFILE_NAV_LINK, TACTICS_NAV_LINK, LOGOUT_NAV_LINK];
            }
        }
        // User is not logged in
        return NAV_LINKS;
    }, [user, isAdmin, isCoach]);


    return (
        <ThemeContext.Provider value={themeValue}>
            <AuthContext.Provider value={authValue}>
                <PageContext.Provider value={pageValue}>
                    <div className="font-sans bg-base-200 dark:bg-dark-base-200 text-base-content dark:text-dark-base-content min-h-screen">
                        <Header navLinks={navLinks} />
                        <main className="pb-20 lg:pb-0 lg:pt-20">
                           <div className="container mx-auto px-6 py-8">
                                {renderPage()}
                            </div>
                        </main>
                        <BottomNav navLinks={navLinks} />
                    </div>
                </PageContext.Provider>
            </AuthContext.Provider>
        </ThemeContext.Provider>
    );
};

export default App;