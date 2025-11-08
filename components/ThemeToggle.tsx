import React, { useContext } from 'react';
import { ThemeContext } from '../App';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

interface ThemeToggleProps {
    showText?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ showText = true }) => {
    const themeContext = useContext(ThemeContext);
    if (!themeContext) return null;

    const { theme, toggleTheme } = themeContext;
    
    const buttonClasses = showText
        ? "flex items-center justify-center w-full px-4 py-2 rounded-lg bg-base-200 dark:bg-dark-base-200 text-gray-700 dark:text-dark-base-content hover:bg-base-300 dark:hover:bg-dark-base-300 transition-colors"
        : "p-2 rounded-full bg-base-200 dark:bg-dark-base-200 text-gray-700 dark:text-dark-base-content hover:bg-base-300 dark:hover:bg-dark-base-300 transition-colors";

    return (
        <button
            onClick={toggleTheme}
            className={buttonClasses}
            aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            {showText && <span className="ml-2 font-medium">Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>}
        </button>
    );
};

export default ThemeToggle;