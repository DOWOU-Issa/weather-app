import API_CONFIG from '../../../config/api.config.js';
import Validators from '../utils/validators.js';
import ErrorHandler from '../utils/errorHandler.js';
import { GeoAPI } from './geoApi.js';

/**
 * API d'autocomplétion - Combine GeoDB et OpenWeatherMap
 */
export class AutocompleteAPI {
    constructor() {
        this.geoAPI = new GeoAPI();
        this.errorHandler = new ErrorHandler();
        this.cache = new Map();
        this.lastQuery = '';
        this.abortController = null;
        
        // Configuration GeoDB (RapidAPI)
        this.geoDBConfig = {
            baseUrl: API_CONFIG.geoDB.baseUrl,
            apiKey: API_CONFIG.geoDB.apiKey,
            apiHost: API_CONFIG.geoDB.apiHost
        };
    }
    
    /**
     * Recherche avec autocomplétion
     * @param {string} query - Texte de recherche
     * @param {Object} options - Options de recherche
     * @returns {Promise<Array>} - Suggestions
     */
    async autocomplete(query, options = {}) {
        if (!Validators.isValidSearchQuery(query)) {
            return [];
        }
        
        // Vérifie le cache
        const cacheKey = `${query}_${JSON.stringify(options)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Annule la requête précédente
        if (this.abortController) {
            this.abortController.abort();
        }
        
        this.abortController = new AbortController();
        
        try {
            let suggestions = [];
            
            // Essaie d'abord avec GeoDB si la clé est configurée
            if (this.geoDBConfig.apiKey !== 'YOUR_RAPIDAPI_KEY_HERE') {
                suggestions = await this.searchWithGeoDB(query, options);
            }
            
            // Fallback sur OpenWeatherMap si GeoDB échoue ou pas de résultats
            if (suggestions.length === 0) {
                suggestions = await this.searchWithOpenWeather(query, options);
            }
            
            // Nettoie et formate les suggestions
            const formattedSuggestions = this.formatSuggestions(suggestions, query);
            
            // Met en cache
            this.cache.set(cacheKey, formattedSuggestions);
            
            // Limite la taille du cache
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            return formattedSuggestions;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                return []; // Requête annulée
            }
            this.errorHandler.handle(error, 'autocomplete');
            return [];
        }
    }
    
    /**
     * Recherche avec GeoDB Cities API
     * @param {string} query - Texte de recherche
     * @param {Object} options - Options
     * @returns {Promise<Array>} - Suggestions
     */
    async searchWithGeoDB(query, options) {
        const limit = options.limit || 10;
        const offset = options.offset || 0;
        
        const url = `${this.geoDBConfig.baseUrl}/cities?namePrefix=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&sort=-population`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'X-RapidAPI-Key': this.geoDBConfig.apiKey,
                    'X-RapidAPI-Host': this.geoDBConfig.apiHost
                },
                signal: this.abortController.signal
            });
            
            if (!response.ok) {
                throw new Error(`GeoDB API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.data || !Array.isArray(data.data)) {
                return [];
            }
            
            return data.data.map(city => ({
                name: city.name,
                country: city.countryCode,
                state: city.region,
                lat: city.latitude,
                lon: city.longitude,
                population: city.population,
                source: 'geodb'
            }));
            
        } catch (error) {
            console.warn('GeoDB API failed:', error);
            return [];
        }
    }
    
    /**
     * Recherche avec OpenWeatherMap Geo API
     * @param {string} query - Texte de recherche
     * @param {Object} options - Options
     * @returns {Promise<Array>} - Suggestions
     */
    async searchWithOpenWeather(query, options) {
        const limit = options.limit || 10;
        
        try {
            const cities = await this.geoAPI.searchCities(query, { limit });
            return cities.map(city => ({
                ...city,
                source: 'openweather'
            }));
            
        } catch (error) {
            console.warn('OpenWeather Geo API failed:', error);
            return [];
        }
    }
    
    /**
     * Formate les suggestions pour l'affichage
     * @param {Array} suggestions - Suggestions brutes
     * @param {string} query - Requête originale
     * @returns {Array} - Suggestions formatées
     */
    formatSuggestions(suggestions, query) {
        const normalizedQuery = query.toLowerCase().trim();
        
        return suggestions
            .map(suggestion => ({
                id: `${suggestion.name}_${suggestion.country}_${suggestion.lat}_${suggestion.lon}`,
                name: suggestion.name,
                country: suggestion.country,
                state: suggestion.state,
                lat: suggestion.lat,
                lon: suggestion.lon,
                displayName: this.getDisplayName(suggestion),
                searchText: `${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ''}, ${suggestion.country}`,
                highlight: this.highlightMatch(suggestion.name, normalizedQuery),
                population: suggestion.population,
                source: suggestion.source
            }))
            .sort((a, b) => {
                // Priorité aux noms qui commencent par la requête
                const aStarts = a.name.toLowerCase().startsWith(normalizedQuery);
                const bStarts = b.name.toLowerCase().startsWith(normalizedQuery);
                
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                
                // Ensuite par population (plus grande d'abord)
                if (a.population && b.population) {
                    return b.population - a.population;
                }
                
                return 0;
            });
    }
    
    /**
     * Récupère le nom d'affichage
     * @param {Object} suggestion - Suggestion
     * @returns {string} - Nom formaté
     */
    getDisplayName(suggestion) {
        let display = suggestion.name;
        
        if (suggestion.state) {
            display += `, ${suggestion.state}`;
        }
        
        if (suggestion.country) {
            display += `, ${suggestion.country}`;
        }
        
        return display;
    }
    
    /**
     * Met en évidence la correspondance
     * @param {string} text - Texte original
     * @param {string} query - Requête
     * @returns {string} - Texte avec highlight
     */
    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    /**
     * Récupère les villes populaires (fallback)
     * @returns {Array} - Liste des villes populaires
     */
    getPopularCities() {
        return [
            { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
            { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
            { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
            { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
            { name: 'Berlin', country: 'DE', lat: 52.5200, lon: 13.4050 },
            { name: 'Madrid', country: 'ES', lat: 40.4168, lon: -3.7038 },
            { name: 'Rome', country: 'IT', lat: 41.9028, lon: 12.4964 },
            { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
            { name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
            { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 }
        ];
    }
    
    /**
     * Efface le cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Annule la requête en cours
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}

// Export par défaut
export default AutocompleteAPI;