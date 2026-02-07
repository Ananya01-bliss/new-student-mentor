import { Injectable, signal } from '@angular/core';

export type ThemeType = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'user-theme';
    theme = signal<ThemeType>(this.getInitialTheme());

    constructor() {
        this.applyTheme(this.theme());
    }

    setTheme(newTheme: ThemeType) {
        this.theme.set(newTheme);
        localStorage.setItem(this.THEME_KEY, newTheme);
        this.applyTheme(newTheme);
    }

    private getInitialTheme(): ThemeType {
        const savedTheme = localStorage.getItem(this.THEME_KEY) as ThemeType;
        return savedTheme || 'light';
    }

    private applyTheme(theme: ThemeType) {
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        root.classList.add(`theme-${theme}`);
    }
}
