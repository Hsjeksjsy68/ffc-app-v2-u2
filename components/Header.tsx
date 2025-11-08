import React, { useContext } from 'react';
import { PageContext } from '../App';
import ThemeToggle from './ThemeToggle';
import type { NavLink, Page } from '../types';
import { auth } from '../services/firebase';

interface HeaderProps {
    navLinks: NavLink[];
}

const Header: React.FC<HeaderProps> = ({ navLinks }) => {
    const pageContext = useContext(PageContext);
    if (!pageContext) return null;
    const { currentPage, setCurrentPage } = pageContext;

    const handleLinkClick = (page: Page) => {
        if (page === 'Logout') {
            auth.signOut().then(() => {
                setCurrentPage('Home');
            }).catch((error) => {
                console.error("Logout failed:", error);
            });
        } else {
            setCurrentPage(page);
        }
    };

    return (
        <header className="hidden lg:flex fixed top-0 left-0 right-0 bg-base-100/80 dark:bg-dark-base-100/80 backdrop-blur-sm border-b border-base-300 dark:border-gray-700 shadow-sm z-50 h-20 items-center justify-between px-6">
            <div className="flex items-center">
                <img src="https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" alt="Logo" className="h-12" />
                <span className="ml-3 text-xl font-bold text-base-content dark:text-white">Flamehunter FC</span>
            </div>
            <nav className="flex items-center space-x-2">
                {navLinks.map(({ name, icon: Icon }) => (
                    <a
                        key={name}
                        href={`#${name.toLowerCase().replace(' ', '-')}`}
                        onClick={(e) => {
                            e.preventDefault();
                            handleLinkClick(name);
                        }}
                        className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${currentPage === name ? 'bg-primary text-white' : 'text-gray-600 dark:text-dark-base-content hover:bg-base-200 dark:hover:bg-dark-base-200'}`}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="ml-2">{name}</span>
                    </a>
                ))}
            </nav>
            <div>
                <ThemeToggle showText={false} />
            </div>
        </header>
    );
};

export default Header;