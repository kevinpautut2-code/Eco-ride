/**
 * EcoRide - Gestion du thème (Dark/Light Mode)
 * Système de thème moderne avec persistance
 */

class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || 'light';
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');

        this.init();
    }

    init() {
        // Appliquer le thème initial
        this.applyTheme(this.theme);

        // Écouter les changements
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Écouter les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!this.getStoredTheme()) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.theme);
        this.storeTheme(this.theme);

        // Animation de transition
        this.animateThemeChange();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateIcon(theme);
    }

    updateIcon(theme) {
        if (this.themeIcon) {
            this.themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
        }
    }

    animateThemeChange() {
        // Ajouter une animation fluide lors du changement de thème
        const body = document.body;
        body.style.transition = 'background-color 0.3s ease, color 0.3s ease';

        setTimeout(() => {
            body.style.transition = '';
        }, 300);
    }

    storeTheme(theme) {
        try {
            localStorage.setItem('ecoride-theme', theme);
        } catch (error) {
            console.warn('Unable to store theme preference:', error);
        }
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('ecoride-theme');
        } catch (error) {
            console.warn('Unable to retrieve theme preference:', error);
            return null;
        }
    }
}

// Initialiser le gestionnaire de thème
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});
