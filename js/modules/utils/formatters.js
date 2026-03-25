/**
 * Module de formatage
 * Formate les données météo pour l'affichage
 */
export class Formatters {
    
    /**
     * Formate la température
     * @param {number} temp - Température en degrés Celsius
     * @param {string} unit - Unité ('C', 'F')
     * @returns {string} - Température formatée
     */
    static formatTemperature(temp, unit = 'C') {
        if (typeof temp !== 'number' || isNaN(temp)) return '--°';
        
        const roundedTemp = Math.round(temp);
        
        if (unit === 'C') {
            return `${roundedTemp}°C`;
        } else if (unit === 'F') {
            const fahrenheit = (roundedTemp * 9/5) + 32;
            return `${Math.round(fahrenheit)}°F`;
        }
        
        return `${roundedTemp}°C`;
    }
    
    /**
     * Formate la vitesse du vent
     * @param {number} speed - Vitesse en m/s
     * @returns {string} - Vitesse formatée
     */
    static formatWindSpeed(speed) {
        if (typeof speed !== 'number' || isNaN(speed)) return '-- km/h';
        
        // Convertit m/s en km/h
        const kmh = Math.round(speed * 3.6);
        return `${kmh} km/h`;
    }
    
    /**
     * Formate l'humidité
     * @param {number} humidity - Humidité en pourcentage
     * @returns {string} - Humidité formatée
     */
    static formatHumidity(humidity) {
        if (typeof humidity !== 'number' || isNaN(humidity)) return '--%';
        
        return `${Math.round(humidity)}%`;
    }
    
    /**
     * Formate la date
     * @param {number|string|Date} date - Date à formater
     * @param {string} format - Format de date ('full', 'short', 'time')
     * @param {string} locale - Locale (par défaut 'fr-FR')
     * @returns {string} - Date formatée
     */
    static formatDate(date, format = 'full', locale = 'fr-FR') {
        if (!date) return '--';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '--';
        
        const options = {
            full: { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            },
            short: { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            },
            time: { 
                hour: '2-digit', 
                minute: '2-digit' 
            },
            day: {
                weekday: 'long',
                day: 'numeric',
                month: 'short'
            }
        };
        
        const selectedOptions = options[format] || options.full;
        return dateObj.toLocaleDateString(locale, selectedOptions);
    }
    
    /**
     * Formate la pression atmosphérique
     * @param {number} pressure - Pression en hPa
     * @returns {string} - Pression formatée
     */
    static formatPressure(pressure) {
        if (typeof pressure !== 'number' || isNaN(pressure)) return '-- hPa';
        
        return `${Math.round(pressure)} hPa`;
    }
    
    /**
     * Retourne l'icône météo correspondante
     * @param {string} weatherCondition - Condition météo (ex: 'Clear', 'Rain')
     * @returns {string} - Classe d'icône FontAwesome
     */
    static getWeatherIcon(weatherCondition) {
        const icons = {
            'Clear': 'fa-sun',
            'Clouds': 'fa-cloud',
            'Rain': 'fa-cloud-rain',
            'Drizzle': 'fa-cloud-rain',
            'Thunderstorm': 'fa-bolt',
            'Snow': 'fa-snowflake',
            'Mist': 'fa-smog',
            'Smoke': 'fa-smog',
            'Haze': 'fa-smog',
            'Dust': 'fa-smog',
            'Fog': 'fa-smog',
            'Sand': 'fa-smog',
            'Ash': 'fa-smog',
            'Squall': 'fa-wind',
            'Tornado': 'fa-tornado'
        };
        
        return icons[weatherCondition] || 'fa-cloud-sun';
    }
    
    /**
     * Formate la direction du vent en texte
     * @param {number} degrees - Direction en degrés
     * @returns {string} - Direction formatée
     */
    static formatWindDirection(degrees) {
        if (typeof degrees !== 'number' || isNaN(degrees)) return '--';
        
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                           'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }
    
    /**
     * Formate la visibilité
     * @param {number} visibility - Visibilité en mètres
     * @returns {string} - Visibilité formatée
     */
    static formatVisibility(visibility) {
        if (typeof visibility !== 'number' || isNaN(visibility)) return '-- km';
        
        const km = visibility / 1000;
        return `${km.toFixed(1)} km`;
    }
    
    /**
     * Retourne le message de conseil selon la météo
     * @param {Object} weatherData - Données météo
     * @returns {string} - Message conseil
     */
    static getAdviceMessage(weatherData) {
        const temp = weatherData.main.temp;
        const condition = weatherData.weather[0].main;
        const humidity = weatherData.main.humidity;
        
        if (condition === 'Rain') {
            return '☔ N\'oubliez pas votre parapluie !';
        } else if (condition === 'Snow') {
            return '❄️ Habillez-vous chaudement !';
        } else if (temp > 30) {
            return '🔥 Canicule ! Restez hydraté et évitez les sorties aux heures chaudes.';
        } else if (temp < 0) {
            return '🥶 Température négative ! Couvrez-vous bien.';
        } else if (humidity > 80) {
            return '💧 Humidité élevée, l\'air est lourd.';
        } else if (condition === 'Clear' && temp > 20) {
            return '☀️ Belle journée ! Profitez-en pour sortir.';
        } else if (condition === 'Clouds') {
            return '☁️ Temps couvert, parfait pour une activité en intérieur.';
        }
        
        return '🌡️ Consultez la météo avant de sortir !';
    }
    
    /**
     * Capitalise la première lettre d'une chaîne
     * @param {string} str - Chaîne à capitaliser
     * @returns {string} - Chaîne capitalisée
     */
    static capitalize(str) {
        if (!str || typeof str !== 'string') return '';
        
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    /**
     * Formate le nom de la ville
     * @param {string} cityName - Nom de la ville
     * @returns {string} - Nom formaté
     */
    static formatCityName(cityName) {
        if (!cityName) return '';
        
        return cityName
            .split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    }
}

// Export par défaut
export default Formatters;