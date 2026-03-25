/**
 * Module de validation
 * Valide les entrées utilisateur et les données reçues
 */
export class Validators {
    
    /**
     * Vérifie si un nom de ville est valide
     * @param {string} cityName - Nom de la ville à valider
     * @returns {boolean} - True si valide
     */
    static isValidCityName(cityName) {
        if (!cityName || typeof cityName !== 'string') return false;
        
        // Nettoie la chaîne
        const cleanName = cityName.trim();
        
        // Vérifie la longueur (entre 2 et 100 caractères)
        if (cleanName.length < 2 || cleanName.length > 100) return false;
        
        // Autorise lettres, accents, espaces, tirets, apostrophes
        const cityNameRegex = /^[a-zA-ZÀ-ÿ\s\-'’]+$/;
        return cityNameRegex.test(cleanName);
    }
    
    /**
     * Valide les données météo reçues de l'API
     * @param {Object} data - Données météo
     * @returns {boolean} - True si les données sont valides
     */
    static isValidWeatherData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Vérifie la présence des champs obligatoires
        const requiredFields = ['name', 'main', 'weather', 'wind'];
        const hasRequiredFields = requiredFields.every(field => field in data);
        
        if (!hasRequiredFields) return false;
        
        // Vérifie les sous-champs
        const hasMainFields = data.main && 
                             typeof data.main.temp === 'number' &&
                             typeof data.main.humidity === 'number';
        
        const hasWeatherFields = data.weather && 
                                Array.isArray(data.weather) &&
                                data.weather.length > 0 &&
                                data.weather[0].main;
        
        const hasWindFields = data.wind && 
                             typeof data.wind.speed === 'number';
        
        return hasMainFields && hasWeatherFields && hasWindFields;
    }
    
    /**
     * Valide les données de prévisions
     * @param {Object} data - Données de prévisions
     * @returns {boolean} - True si valide
     */
    static isValidForecastData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Vérifie la présence du tableau de prévisions
        if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
            return false;
        }
        
        // Vérifie au moins une prévision valide
        const firstForecast = data.list[0];
        return firstForecast && 
               firstForecast.main && 
               typeof firstForecast.main.temp === 'number';
    }
    
    /**
     * Valide les coordonnées géographiques
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {boolean} - True si les coordonnées sont valides
     */
    static isValidCoordinates(lat, lon) {
        if (typeof lat !== 'number' || typeof lon !== 'number') return false;
        
        // Latitude entre -90 et 90
        // Longitude entre -180 et 180
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    }
    
    /**
     * Valide l'entrée de recherche pour l'autocomplétion
     * @param {string} query - Chaîne de recherche
     * @returns {boolean} - True si valide
     */
    static isValidSearchQuery(query) {
        if (!query || typeof query !== 'string') return false;
        
        const cleanQuery = query.trim();
        
        // Minimum 2 caractères pour la recherche
        if (cleanQuery.length < 2) return false;
        
        // Maximum 50 caractères
        if (cleanQuery.length > 50) return false;
        
        // Vérifie les caractères autorisés
        const validQueryRegex = /^[a-zA-ZÀ-ÿ0-9\s\-'’]+$/;
        return validQueryRegex.test(cleanQuery);
    }
    
    /**
     * Sanitize une chaîne pour éviter les injections XSS
     * @param {string} str - Chaîne à nettoyer
     * @returns {string} - Chaîne nettoyée
     */
    static sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        
        return str
            .trim()
            .replace(/[<>]/g, '') // Supprime les balises HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    /**
     * Valide le format de l'email (si nécessaire plus tard)
     * @param {string} email - Email à valider
     * @returns {boolean} - True si valide
     */
    static isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        
        const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Vérifie si une valeur est un nombre valide
     * @param {any} value - Valeur à vérifier
     * @returns {boolean} - True si c'est un nombre valide
     */
    static isValidNumber(value) {
        if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
            return true;
        }
        
        // Vérifie les strings numériques
        if (typeof value === 'string') {
            const num = parseFloat(value);
            return !isNaN(num) && isFinite(num);
        }
        
        return false;
    }
    
    /**
     * Valide les données avant export
     * @param {Object} data - Données à valider
     * @returns {boolean} - True si les données sont exportables
     */
    static isValidExportData(data) {
        if (!data || typeof data !== 'object') return false;
        
        // Vérifie les champs nécessaires pour l'export
        const requiredExportFields = ['city', 'temperature', 'humidity', 'windSpeed', 'timestamp'];
        return requiredExportFields.every(field => field in data);
    }
    
    /**
     * Nettoie et normalise le nom d'une ville
     * @param {string} cityName - Nom de la ville
     * @returns {string} - Nom normalisé
     */
    static normalizeCityName(cityName) {
        if (!cityName) return '';
        
        return cityName
            .trim()
            .toLowerCase()
            .replace(/[^a-zÀ-ÿ0-9\s-]/g, '')
            .replace(/\s+/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Export par défaut
export default Validators;