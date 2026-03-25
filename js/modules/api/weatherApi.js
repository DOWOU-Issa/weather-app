import API_CONFIG from '../../../config/api.config.js';
import Validators from '../utils/validators.js';
import ErrorHandler from '../utils/errorHandler.js';

/**
 * API Météo - OpenWeatherMap
 */
export class WeatherAPI {
    constructor() {
        this.baseUrl = API_CONFIG.openWeatherMap.baseUrl;
        this.apiKey = API_CONFIG.openWeatherMap.apiKey;
        this.units = API_CONFIG.openWeatherMap.units;
        this.lang = API_CONFIG.openWeatherMap.lang;
        this.errorHandler = new ErrorHandler();
    }
    
    /**
     * Requête générique à l'API
     * @param {string} endpoint - Endpoint API
     * @param {Object} params - Paramètres de la requête
     * @returns {Promise<Object>} - Données de l'API
     */
    async fetchFromAPI(endpoint, params = {}) {
        // Vérifie la connexion
        if (!navigator.onLine) {
            throw new Error('Pas de connexion internet');
        }
        
        // Construit l'URL
        const queryParams = new URLSearchParams({
            appid: this.apiKey,
            units: this.units,
            lang: this.lang,
            ...params
        });
        
        const url = `${this.baseUrl}${endpoint}?${queryParams}`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.general.timeout);
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    response: {
                        status: response.status,
                        data: errorData
                    }
                };
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La requête a expiré');
            }
            throw error;
        }
    }
    
    /**
     * Récupère la météo actuelle par nom de ville
     * @param {string} city - Nom de la ville
     * @returns {Promise<Object>} - Données météo
     */
    async getCurrentWeatherByCity(city) {
        if (!Validators.isValidCityName(city)) {
            throw ErrorHandler.createValidationError('Nom de ville invalide');
        }
        
        try {
            const data = await this.fetchFromAPI('/weather', {
                q: city
            });
            
            if (!Validators.isValidWeatherData(data)) {
                throw new Error('Données météo invalides');
            }
            
            return data;
        } catch (error) {
            this.errorHandler.handle(error, 'weather');
            throw error;
        }
    }
    
    /**
     * Récupère la météo actuelle par coordonnées
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Données météo
     */
    async getCurrentWeatherByCoords(lat, lon) {
        if (!Validators.isValidCoordinates(lat, lon)) {
            throw ErrorHandler.createValidationError('Coordonnées invalides');
        }
        
        try {
            const data = await this.fetchFromAPI('/weather', {
                lat: lat,
                lon: lon
            });
            
            if (!Validators.isValidWeatherData(data)) {
                throw new Error('Données météo invalides');
            }
            
            return data;
        } catch (error) {
            this.errorHandler.handle(error, 'weather');
            throw error;
        }
    }
    
    /**
     * Récupère les prévisions sur 5 jours
     * @param {string|Object} location - Nom de ville ou {lat, lon}
     * @returns {Promise<Object>} - Données de prévisions
     */
    async getForecast(location) {
        let params = {};
        
        if (typeof location === 'string') {
            if (!Validators.isValidCityName(location)) {
                throw ErrorHandler.createValidationError('Nom de ville invalide');
            }
            params.q = location;
        } else if (typeof location === 'object') {
            if (!Validators.isValidCoordinates(location.lat, location.lon)) {
                throw ErrorHandler.createValidationError('Coordonnées invalides');
            }
            params.lat = location.lat;
            params.lon = location.lon;
        } else {
            throw ErrorHandler.createValidationError('Paramètre de localisation invalide');
        }
        
        try {
            const data = await this.fetchFromAPI('/forecast', {
                ...params,
                cnt: 40 // 5 jours * 8 prévisions par jour
            });
            
            if (!Validators.isValidForecastData(data)) {
                throw new Error('Données de prévisions invalides');
            }
            
            return data;
        } catch (error) {
            this.errorHandler.handle(error, 'weather');
            throw error;
        }
    }
    
    /**
     * Récupère les prévisions horaires
     * @param {string|Object} location - Nom de ville ou {lat, lon}
     * @param {number} hours - Nombre d'heures (max 48)
     * @returns {Promise<Array>} - Prévisions horaires
     */
    async getHourlyForecast(location, hours = 24) {
        const forecast = await this.getForecast(location);
        
        if (!forecast || !forecast.list) {
            return [];
        }
        
        // Limite au nombre d'heures demandé
        const maxItems = Math.min(hours, 48);
        return forecast.list.slice(0, maxItems);
    }
    
    /**
     * Récupère les prévisions quotidiennes
     * @param {string|Object} location - Nom de ville ou {lat, lon}
     * @returns {Promise<Array>} - Prévisions quotidiennes
     */
    async getDailyForecast(location) {
        const forecast = await this.getForecast(location);
        
        if (!forecast || !forecast.list) {
            return [];
        }
        
        // Groupe par jour
        const dailyMap = new Map();
        
        forecast.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            
            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    date: date,
                    temps: [],
                    tempsMin: item.main.temp_min,
                    tempsMax: item.main.temp_max,
                    humidity: [],
                    windSpeed: [],
                    weather: item.weather[0],
                    icon: item.weather[0].icon
                });
            }
            
            const daily = dailyMap.get(date);
            daily.temps.push(item.main.temp);
            daily.humidity.push(item.main.humidity);
            daily.windSpeed.push(item.wind.speed);
            daily.tempsMin = Math.min(daily.tempsMin, item.main.temp_min);
            daily.tempsMax = Math.max(daily.tempsMax, item.main.temp_max);
        });
        
        // Calcule les moyennes
        const dailyForecast = Array.from(dailyMap.values()).map(day => ({
            ...day,
            tempMoy: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
            humidityMoy: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
            windSpeedMoy: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length
        }));
        
        return dailyForecast;
    }
    
    /**
     * Récupère la qualité de l'air
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Promise<Object>} - Données de qualité de l'air
     */
    async getAirPollution(lat, lon) {
        if (!Validators.isValidCoordinates(lat, lon)) {
            throw ErrorHandler.createValidationError('Coordonnées invalides');
        }
        
        try {
            const data = await this.fetchFromAPI('/air_pollution', {
                lat: lat,
                lon: lon
            });
            
            return data;
        } catch (error) {
            this.errorHandler.handle(error, 'weather');
            throw error;
        }
    }
    
    /**
     * Vérifie et récupère la météo avec retry
     * @param {Function} apiCall - Fonction API à appeler
     * @param {number} attempts - Tentatives restantes
     * @returns {Promise<Object>} - Données météo
     */
    async withRetry(apiCall, attempts = API_CONFIG.general.retryAttempts) {
        try {
            return await apiCall();
        } catch (error) {
            if (attempts > 1 && this.isRetryableError(error)) {
                await this.delay(API_CONFIG.general.retryDelay);
                return this.withRetry(apiCall, attempts - 1);
            }
            throw error;
        }
    }
    
    /**
     * Vérifie si l'erreur peut être réessayée
     * @param {Error} error - L'erreur
     * @returns {boolean} - True si réessayable
     */
    isRetryableError(error) {
        // Erreurs réseau ou timeout
        if (error.message === 'Failed to fetch' || error.message === 'La requête a expiré') {
            return true;
        }
        
        // Erreurs serveur (5xx)
        if (error.response && error.response.status >= 500) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Delay helper
     * @param {number} ms - Millisecondes
     * @returns {Promise} - Promise de délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export par défaut
export default WeatherAPI;