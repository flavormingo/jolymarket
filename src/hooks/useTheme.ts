// theme hook for light/dark mode

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // check for saved preference
        const saved = localStorage.getItem('jolymarket-theme');
        if (saved === 'light' || saved === 'dark') {
            return saved;
        }
        // check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        // apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('jolymarket-theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    }, []);

    return { theme, toggleTheme, isDark: theme === 'dark' };
}
