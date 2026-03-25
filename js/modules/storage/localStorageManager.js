import API_CONFIG from '../../../config/api.config.js';
import Validators from '../utils/validators.js';

/**
 * Gestionnaire de stockage local
 * Gère les sauvegardes dans localStorage
 */
export class StorageManager {
    constructor() {
        this.storageKeys = {
            history: 'weather_app_history',
            preferences: 'weather_app_preferences',
            lastSearch: 'weather_app_last_search',
            cache: 'weather_app_cache'
        };
        
        this.maxHistoryItems = API_CONFIG.app.maxHistoryItems;
    }
    
    /**
     * Sauvegarde l'historique des recherches
     * @param {string} city - Ville recherchée
     */
    saveToHistory(city) {
        if (!Validators.isValidCityName(city)) return;
        
        const normalizedCity = Validators.normalizeCityName(city);
        let history = this.getSearchHistory();
        
        // Supprime l'entrée si elle existe déjà
        history = history.filter(item => 
            Validators.normalizeCityName(item) !== normalizedCity
        );
        
        // Ajoute au début
        history.unshift(normalizedCity);
        
        // Limite la taille
        if (history.length > this.maxHistoryItems) {
            history = history.slice(0, this.maxHistoryItems);
        }
        
        // Sauvegarde
        this.setItem(this.storageKeys.history, history);
        this.setItem(this.storageKeys.lastSearch, normalizedCity);
    }
    
    /**
     * Récupère l'historique des recherches
     * @returns {Array} - Liste des villes recherchées
     */
    getSearchHistory() {
        const history = this.getItem(this.storageKeys.history);
        return Array.isArray(history) ? history : [];
    }
    
    /**
     * Récupère la dernière recherche
     * @returns {string|null} - Dernière ville recherchée
     */
    getLastSearch() {
        return this.getItem(this.storageKeys.lastSearch);
    }
    
    /**
     * Efface l'historique
     */
    clearHistory() {
        this.removeItem(this.storageKeys.history);
        this.removeItem(this.storageKeys.lastSearch);
    }
    
    /**
     * Supprime une entrée spécifique de l'historique
     * @param {string} city - Ville à supprimer
     */
    removeFromHistory(city) {
        let history = this.getSearchHistory();
        const normalizedCity = Validators.normalizeCityName(city);
        
        history = history.filter(item => 
            Validators.normalizeCityName(item) !== normalizedCity
        );
        
        this.setItem(this.storageKeys.history, history);
        
        // Met à jour la dernière recherche si nécessaire
        const lastSearch = this.getLastSearch();
        if (Validators.normalizeCityName(lastSearch) === normalizedCity) {
            this.removeItem(this.storageKeys.lastSearch);
        }
    }
    
    /**
     * Sauvegarde les préférences utilisateur
     * @param {Object} preferences - Préférences
     */
    savePreferences(preferences) {
        const currentPrefs = this.getPreferences();
        const newPrefs = { ...currentPrefs, ...preferences };
        this.setItem(this.storageKeys.preferences, newPrefs);
    }
    
    /**
     * Récupère les préférences utilisateur
     * @returns {Object} - Préférences
     */
    getPreferences() {
        const defaults = {
            theme: API_CONFIG.themes.auto,
            unit: 'metric',
            notificationsEnabled: true
        };
        
        const prefs = this.getItem(this.storageKeys.preferences);
        return { ...defaults, ...prefs };
    }
    
    /**
     * Sauvegarde des données en cache
     * @param {string} key - Clé du cache
     * @param {any} data - Données à cacher
     * @param {number} duration - Durée de validité en ms
     */
    setCache(key, data, duration = API_CONFIG.general.cacheDuration) {
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            expiry: duration
        };
        
        const cache = this.getItem(this.storageKeys.cache) || {};
        cache[key] = cacheItem;
        this.setItem(this.storageKeys.cache, cache);
    }
    
    /**
     * Récupère des données du cache
     * @param {string} key - Clé du cache
     * @returns {any|null} - Données du cache ou null
     */
    getCache(key) {
        const cache = this.getItem(this.storageKeys.cache);
        if (!cache || !cache[key]) return null;
        
        const cacheItem = cache[key];
        const isExpired = Date.now() - cacheItem.timestamp > cacheItem.expiry;
        
        if (isExpired) {
            this.clearCacheKey(key);
            return null;
        }
        
        return cacheItem.data;
    }
    
    /**
     * Efface une clé spécifique du cache
     * @param {string} key - Clé à effacer
     */
    clearCacheKey(key) {
        const cache = this.getItem(this.storageKeys.cache);
        if (cache && cache[key]) {
            delete cache[key];
            this.setItem(this.storageKeys.cache, cache);
        }
    }
    
    /**
     * Efface tout le cache
     */
    clearAllCache() {
        this.removeItem(this.storageKeys.cache);
    }
    
    /**
     * Sauvegarde un item dans localStorage
     * @param {string} key - Clé
     * @param {any} value - Valeur
     */
    setItem(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            return false;
        }
    }
    
    /**
     * Récupère un item du localStorage
     * @param {string} key - Clé
     * @returns {any|null} - Valeur ou null
     */
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Erreur lors de la récupération:', error);
            return null;
        }
    }
    
    /**
     * Supprime un item du localStorage
     * @param {string} key - Clé
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return false;
        }
    }
    
    /**
     * Efface toutes les données de l'application
     */
    clearAll() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Erreur lors du nettoyage:', error);
            return false;
        }
    }
    
    /**
     * Vérifie l'espace disponible
     * @returns {number|null} - Espace utilisé en pourcentage
     */
    getStorageUsage() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length;
                }
            }
            
            // Estimation approximative (5MB max)
            const maxSize = 5 * 1024 * 1024;
            return (total / maxSize) * 100;
        } catch (error) {
            console.error('Erreur lors du calcul d\'espace:', error);
            return null;
        }
    }
}

// Export par défaut
export default StorageManager;