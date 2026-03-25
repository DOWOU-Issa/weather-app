import API_CONFIG from '../../../config/api.config.js';
import StorageManager from '../storage/localStorageManager.js';

/**
 * Gestionnaire de thèmes
 * Gère le mode clair/sombre/auto
 */
export class ThemeManager {
    constructor() {
        this.storage = new StorageManager();
        this.currentTheme = API_CONFIG.themes.auto;
        this.systemTheme = this.getSystemTheme();
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.init();
    }
    
    /**
     * Initialise le gestionnaire de thèmes
     */
    init() {
        // Charge le thème sauvegardé
        const savedTheme = this.storage.getPreferences().theme;
        this.currentTheme = savedTheme || API_CONFIG.themes.auto;
        
        // Applique le thème
        this.applyTheme();
        
        // Écoute les changements de thème système
        this.mediaQuery.addEventListener('change', (e) => {
            this.systemTheme = e.matches ? 'dark' : 'light';
            if (this.currentTheme === API_CONFIG.themes.auto) {
                this.applyTheme();
            }
        });
        
        // Écoute l'événement de chargement pour éviter le FOUC
        document.addEventListener('DOMContentLoaded', () => {
            this.removePreloadClass();
        });
    }
    
    /**
     * Applique le thème actif
     */
    applyTheme() {
        let themeToApply = this.currentTheme;
        
        if (themeToApply === API_CONFIG.themes.auto) {
            themeToApply = this.systemTheme;
        }
        
        // Applique la classe au document
        document.documentElement.setAttribute('data-theme', themeToApply);
        
        // Met à jour les variables CSS
        this.updateCSSVariables(themeToApply);
        
        // Met à jour l'icône du toggle
        this.updateToggleIcon(themeToApply);
        
        // Dispatch un événement
        const event = new CustomEvent('themeChanged', {
            detail: { theme: themeToApply, requestedTheme: this.currentTheme }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Bascule entre les thèmes
     */
    toggle() {
        const themes = [API_CONFIG.themes.light, API_CONFIG.themes.dark, API_CONFIG.themes.auto];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }
    
    /**
     * Définit un thème spécifique
     * @param {string} theme - Nom du thème
     */
    setTheme(theme) {
        if (!Object.values(API_CONFIG.themes).includes(theme)) {
            console.warn(`Thème invalide: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        
        // Sauvegarde les préférences
        const preferences = this.storage.getPreferences();
        preferences.theme = theme;
        this.storage.savePreferences(preferences);
        
        // Applique le thème
        this.applyTheme();
        
        // Ajoute une classe pour l'animation
        this.addTransitionClass();
    }
    
    /**
     * Récupère le thème système
     * @returns {string} - 'dark' ou 'light'
     */
    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    /**
     * Met à jour les variables CSS dynamiques
     * @param {string} theme - Thème actif
     */
    updateCSSVariables(theme) {
        const root = document.documentElement;
        
        // Variables communes
        root.style.setProperty('--transition-speed', '0.3s');
        
        // Variables spécifiques au thème
        if (theme === 'dark') {
            root.style.setProperty('--bg-primary', '#1a1a2e');
            root.style.setProperty('--bg-secondary', '#16213e');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#a0a0a0');
            root.style.setProperty('--card-bg', '#0f3460');
            root.style.setProperty('--border-color', '#2a2a3e');
            root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.3)');
        } else {
            root.style.setProperty('--bg-primary', '#f5f5f5');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--text-primary', '#333333');
            root.style.setProperty('--text-secondary', '#666666');
            root.style.setProperty('--card-bg', '#ffffff');
            root.style.setProperty('--border-color', '#e0e0e0');
            root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.1)');
        }
    }
    
    /**
     * Met à jour l'icône du bouton de thème
     * @param {string} theme - Thème actif
     */
    updateToggleIcon(theme) {
        const toggleBtn = document.querySelector('.theme-toggle');
        if (!toggleBtn) return;
        
        const sunIcon = toggleBtn.querySelector('.fa-sun');
        const moonIcon = toggleBtn.querySelector('.fa-moon');
        const autoIcon = toggleBtn.querySelector('.fa-adjust');
        
        if (!sunIcon || !moonIcon) return;
        
        // Cache toutes les icônes
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'none';
        if (autoIcon) autoIcon.style.display = 'none';
        
        // Affiche l'icône appropriée
        if (this.currentTheme === API_CONFIG.themes.light) {
            if (sunIcon) sunIcon.style.display = 'inline-block';
            toggleBtn.setAttribute('aria-label', 'Passer au mode sombre');
        } else if (this.currentTheme === API_CONFIG.themes.dark) {
            if (moonIcon) moonIcon.style.display = 'inline-block';
            toggleBtn.setAttribute('aria-label', 'Passer au mode auto');
        } else {
            if (autoIcon) autoIcon.style.display = 'inline-block';
            toggleBtn.setAttribute('aria-label', 'Passer au mode clair');
        }
    }
    
    /**
     * Ajoute une classe pour l'animation de transition
     */
    addTransitionClass() {
        const root = document.documentElement;
        root.classList.add('theme-transition');
        
        setTimeout(() => {
            root.classList.remove('theme-transition');
        }, 300);
    }
    
    /**
     * Supprime la classe de préchargement
     */
    removePreloadClass() {
        document.documentElement.classList.remove('preload');
    }
    
    /**
     * Vérifie si le mode sombre est actif
     * @returns {boolean} - True si mode sombre
     */
    isDarkMode() {
        const activeTheme = this.currentTheme === API_CONFIG.themes.auto 
            ? this.systemTheme 
            : this.currentTheme;
        return activeTheme === 'dark';
    }
    
    /**
     * Récupère le thème actuellement affiché
     * @returns {string} - Thème affiché
     */
    getActiveTheme() {
        if (this.currentTheme === API_CONFIG.themes.auto) {
            return this.systemTheme;
        }
        return this.currentTheme;
    }
}

// Export par défaut
export default ThemeManager;