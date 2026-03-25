import Formatters from '../utils/formatters.js';
import Validators from '../utils/validators.js';

/**
 * Rendu de l'interface utilisateur
 * Gère l'affichage des données météo
 */
export class UIRenderer {
    constructor() {
        this.weatherDisplay = document.getElementById('weather-display');
        this.currentWeatherCard = document.querySelector('.weather-card.current-weather');
        this.historyList = document.getElementById('history-list');
        this.autocompleteList = document.getElementById('autocomplete-list');
    }
    
    /**
     * Affiche les données météo
     * @param {Object} weatherData - Données météo actuelles
     * @param {Object} forecastData - Données de prévisions
     */
    displayWeather(weatherData, forecastData = null) {
        if (!Validators.isValidWeatherData(weatherData)) {
            console.error('Données météo invalides');
            return;
        }
        
        // Affiche le conteneur principal
        this.weatherDisplay.classList.remove('hidden');
        
        // Met à jour la carte météo
        this.updateCurrentWeatherCard(weatherData);
        
        // Met à jour les prévisions si disponibles
        if (forecastData && Validators.isValidForecastData(forecastData)) {
            this.updateForecastInfo(forecastData);
        }
        
        // Met à jour les conseils
        this.updateAdvice(weatherData);
        
        // Animation d'entrée
        this.weatherDisplay.classList.add('fade-in');
        setTimeout(() => {
            this.weatherDisplay.classList.remove('fade-in');
        }, 500);
    }
    
    /**
     * Met à jour la carte météo actuelle
     * @param {Object} data - Données météo
     */
    updateCurrentWeatherCard(data) {
        if (!this.currentWeatherCard) return;
        
        const cityName = Formatters.formatCityName(data.name);
        const country = data.sys.country;
        const temp = Formatters.formatTemperature(data.main.temp);
        const feelsLike = Formatters.formatTemperature(data.main.feels_like);
        const humidity = Formatters.formatHumidity(data.main.humidity);
        const windSpeed = Formatters.formatWindSpeed(data.wind.speed);
        const windDirection = Formatters.formatWindDirection(data.wind.deg);
        const pressure = Formatters.formatPressure(data.main.pressure);
        const weatherCondition = data.weather[0].main;
        const weatherDescription = Formatters.capitalize(data.weather[0].description);
        const iconClass = Formatters.getWeatherIcon(weatherCondition);
        const date = Formatters.formatDate(new Date(), 'full');
        
        const weatherHtml = `
            <div class="weather-header">
                <div class="city-info">
                    <h2 class="city-name">
                        <i class="fas fa-map-marker-alt"></i>
                        ${cityName}, ${country}
                    </h2>
                    <p class="weather-date">${date}</p>
                </div>
                <div class="weather-icon">
                    <i class="fas ${iconClass} fa-5x"></i>
                    <p class="weather-description">${weatherDescription}</p>
                </div>
            </div>
            
            <div class="weather-main">
                <div class="temperature">
                    <span class="temp-value">${temp}</span>
                    <div class="feels-like">Ressenti: ${feelsLike}</div>
                </div>
            </div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <i class="fas fa-tint"></i>
                    <div class="detail-info">
                        <span class="detail-label">Humidité</span>
                        <span class="detail-value">${humidity}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="fas fa-wind"></i>
                    <div class="detail-info">
                        <span class="detail-label">Vent</span>
                        <span class="detail-value">${windSpeed} ${windDirection}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <i class="fas fa-compress-alt"></i>
                    <div class="detail-info">
                        <span class="detail-label">Pression</span>
                        <span class="detail-value">${pressure}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.currentWeatherCard.innerHTML = weatherHtml;
    }
    
    /**
     * Met à jour les informations de prévisions
     * @param {Object} forecastData - Données de prévisions
     */
    updateForecastInfo(forecastData) {
        // Cette méthode sera complétée avec ChartManager
        console.log('Prévisions reçues:', forecastData);
    }
    
    /**
     * Met à jour le message de conseil
     * @param {Object} weatherData - Données météo
     */
    updateAdvice(weatherData) {
        const adviceMessage = Formatters.getAdviceMessage(weatherData);
        let adviceElement = document.querySelector('.weather-advice');
        
        if (!adviceElement) {
            adviceElement = document.createElement('div');
            adviceElement.className = 'weather-advice';
            this.currentWeatherCard.appendChild(adviceElement);
        }
        
        adviceElement.innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <span>${adviceMessage}</span>
        `;
    }
    
    /**
     * Affiche l'historique des recherches
     * @param {Array} history - Liste des villes
     * @param {Function} onCityClick - Callback au clic
     */
    displayHistory(history, onCityClick) {
        if (!this.historyList) return;
        
        if (!history || history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-history">Aucune recherche récente</p>';
            return;
        }
        
        const historyHtml = history.map(city => `
            <div class="history-item" data-city="${city}">
                <i class="fas fa-history"></i>
                <span class="history-city">${city}</span>
                <button class="history-delete" data-city="${city}" aria-label="Supprimer">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
        
        this.historyList.innerHTML = historyHtml;
        
        // Ajoute les événements
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-delete')) {
                    const city = item.dataset.city;
                    if (onCityClick) onCityClick(city);
                }
            });
        });
        
        this.historyList.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const city = btn.dataset.city;
                if (onCityClick && typeof onCityClick === 'object') {
                    onCityClick.deleteCity(city);
                }
            });
        });
    }
    
    /**
     * Affiche les suggestions d'autocomplétion
     * @param {Array} suggestions - Liste des suggestions
     * @param {Function} onSelect - Callback de sélection
     */
    showAutocomplete(suggestions, onSelect) {
        if (!this.autocompleteList) return;
        
        if (!suggestions || suggestions.length === 0) {
            this.hideAutocomplete();
            return;
        }
        
        const suggestionsHtml = suggestions.map(suggestion => `
            <div class="autocomplete-item" data-city="${suggestion.searchText}" data-lat="${suggestion.lat}" data-lon="${suggestion.lon}">
                <i class="fas fa-city"></i>
                <div class="autocomplete-info">
                    <div class="autocomplete-name">${suggestion.highlight || suggestion.name}</div>
                    <div class="autocomplete-country">${suggestion.country}</div>
                </div>
            </div>
        `).join('');
        
        this.autocompleteList.innerHTML = suggestionsHtml;
        this.autocompleteList.classList.add('visible');
        
        // Ajoute les événements
        this.autocompleteList.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const city = item.dataset.city;
                if (onSelect) onSelect(city);
                this.hideAutocomplete();
            });
        });
    }
    
    /**
     * Masque l'autocomplétion
     */
    hideAutocomplete() {
        if (this.autocompleteList) {
            this.autocompleteList.classList.remove('visible');
            setTimeout(() => {
                this.autocompleteList.innerHTML = '';
            }, 300);
        }
    }
    
    /**
     * Affiche une notification
     * @param {string} message - Message
     * @param {string} type - Type de notification
     */
    showNotification(message, type = 'info') {
        // Cette méthode sera gérée par NotificationManager
        const event = new CustomEvent('showNotification', {
            detail: { message, type }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Efface l'affichage météo
     */
    clearWeatherDisplay() {
        if (this.weatherDisplay) {
            this.weatherDisplay.classList.add('hidden');
        }
        
        if (this.currentWeatherCard) {
            this.currentWeatherCard.innerHTML = '';
        }
    }
    
    /**
     * Met à jour le loader
     * @param {boolean} show - Afficher ou masquer
     * @param {string} message - Message optionnel
     */
    updateLoader(show, message = 'Chargement...') {
        const event = new CustomEvent('updateLoader', {
            detail: { show, message }
        });
        document.dispatchEvent(event);
    }
}

// Export par défaut
export default UIRenderer;