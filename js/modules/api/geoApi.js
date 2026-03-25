import API_CONFIG from '../../../config/api.config.js';
import Validators from '../utils/validators.js';
import ErrorHandler from '../utils/errorHandler.js';

/**
 * API de géolocalisation - OpenWeatherMap Geo API
 */
export class GeoAPI {
    constructor() {
        this.baseUrl = 'https://api.openweathermap.org/geo/1.0';
        this.apiKey = API_CONFIG.openWeatherMap.apiKey;
        this.errorHandler = new ErrorHandler();
    }
    
    /**
     * Recherche des coordonnées par nom de ville
     * @param {string} cityName - Nom de la ville
     * @param {number} limit - Nombre de résultats
     * @returns {Promise<Array>} - Liste des villes trouvées
     */
    async getCoordinates(cityName, limit = 5) {
        if (!Validators.isValidCityName(cityName)) {
            throw ErrorHandler.createValidationError('Nom de ville invalide');
        }
        
        try {
            const url = `${this.baseUrl}/direct?q=${encodeURIComponent(cityName)}&limit=${limit}&appid=${this.apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                return [];
            }
            
            return data.map(city => ({
                name: city.name,
                country: city.country,
                state: city.state,
                lat: city.lat,
                lon: city.lon,
                displayName: this.formatCityDisplay(city)
            }));
            
        } catch (error) {
            this.errorHandler.handle(error, 'geolocation');
            throw error;
        }
    }
    
    /**
     * Recherche le nom de la ville par coordonnées
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Informations de la ville
     */
    async reverseGeocode(lat, lon) {
        if (!Validators.isValidCoordinates(lat, lon)) {
            throw ErrorHandler.createValidationError('Coordonnées invalides');
        }
        
        try {
            const url = `${this.baseUrl}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Aucune ville trouvée pour ces coordonnées');
            }
            
            const city = data[0];
            return {
                name: city.name,
                country: city.country,
                state: city.state,
                lat: city.lat,
                lon: city.lon,
                displayName: this.formatCityDisplay(city)
            };
            
        } catch (error) {
            this.errorHandler.handle(error, 'geolocation');
            throw error;
        }
    }
    
    /**
     * Recherche les villes par nom avec filtres
     * @param {string} query - Recherche
     * @param {Object} filters - Filtres (country, limit)
     * @returns {Promise<Array>} - Liste des villes
     */
    async searchCities(query, filters = {}) {
        if (!Validators.isValidSearchQuery(query)) {
            throw ErrorHandler.createValidationError('Requête de recherche invalide');
        }
        
        const limit = filters.limit || 10;
        const country = filters.country ? `,${filters.country}` : '';
        
        try {
            const searchQuery = `${query}${country}`;
            const url = `${this.baseUrl}/direct?q=${encodeURIComponent(searchQuery)}&limit=${limit}&appid=${this.apiKey}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                return [];
            }
            
            return data.map(city => ({
                name: city.name,
                country: city.country,
                state: city.state,
                lat: city.lat,
                lon: city.lon,
                displayName: this.formatCityDisplay(city),
                fullName: this.getFullCityName(city)
            }));
            
        } catch (error) {
            this.errorHandler.handle(error, 'geolocation');
            throw error;
        }
    }
    
    /**
     * Formate l'affichage d'une ville
     * @param {Object} city - Données de la ville
     * @returns {string} - Nom formaté
     */
    formatCityDisplay(city) {
        let display = city.name;
        
        if (city.state) {
            display += `, ${city.state}`;
        }
        
        if (city.country) {
            display += `, ${city.country}`;
        }
        
        return display;
    }
    
    /**
     * Récupère le nom complet de la ville
     * @param {Object} city - Données de la ville
     * @returns {string} - Nom complet
     */
    getFullCityName(city) {
        let fullName = city.name;
        
        if (city.state) {
            fullName += `, ${city.state}`;
        }
        
        if (city.country) {
            fullName += `, ${city.country}`;
        }
        
        return fullName;
    }
    
    /**
     * Récupère la position actuelle de l'utilisateur
     * @returns {Promise<Object>} - Position {lat, lon}
     */
    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Géolocalisation non supportée par le navigateur'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    let message = 'Erreur de géolocalisation';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'Accès à la géolocalisation refusé';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'Position indisponible';
                            break;
                        case error.TIMEOUT:
                            message = 'Délai de géolocalisation dépassé';
                            break;
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }
    
    /**
     * Récupère la météo à la position actuelle
     * @returns {Promise<Object>} - Ville et coordonnées
     */
    async getCurrentCity() {
        try {
            const position = await this.getCurrentPosition();
            const cityInfo = await this.reverseGeocode(position.lat, position.lon);
            return {
                ...cityInfo,
                lat: position.lat,
                lon: position.lon
            };
        } catch (error) {
            this.errorHandler.handle(error, 'geolocation');
            throw error;
        }
    }
}

// Export par défaut
export default GeoAPI;