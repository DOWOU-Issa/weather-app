/**
 * Application Météo Moderne
 * Point d'entrée principal qui orchestre tous les modules
 */

// Import des modules
import API_CONFIG from '../config/api.config.js';
import WeatherAPI from './modules/api/weatherApi.js';
import GeoAPI from './modules/api/geoApi.js';
import AutocompleteAPI from './modules/api/autocompleteApi.js';
import UIRenderer from './modules/ui/renderer.js';
import ThemeManager from './modules/ui/themeManager.js';
import LoaderManager from './modules/ui/loader.js';
import NotificationManager from './modules/ui/notifications.js';
import StorageManager from './modules/storage/localStorageManager.js';
import ChartManager from './modules/charts/chartManager.js';
import ExportManager from './modules/export/exportManager.js';
import Validators from './modules/utils/validators.js';
import Formatters from './modules/utils/formatters.js';
import ErrorHandler from './modules/utils/errorHandler.js';

/**
 * Classe principale de l'application
 */
class WeatherApp {
    constructor() {
        // Initialisation des modules
        this.api = new WeatherAPI();
        this.geoApi = new GeoAPI();
        this.autocompleteApi = new AutocompleteAPI();
        this.ui = new UIRenderer();
        this.theme = new ThemeManager();
        this.loader = new LoaderManager();
        this.notifications = new NotificationManager();
        this.storage = new StorageManager();
        this.charts = new ChartManager();
        this.exports = new ExportManager();
        this.errorHandler = new ErrorHandler();
        
        // État de l'application
        this.currentCity = null;
        this.currentWeather = null;
        this.currentForecast = null;
        this.isLoading = false;
        
        // Éléments DOM
        this.searchInput = null;
        this.locationBtn = null;
        this.themeToggle = null;
        this.weatherCanvas = null;
        
        // Bind des méthodes
        this.searchCity = this.searchCity.bind(this);
        this.handleLocationClick = this.handleLocationClick.bind(this);
        this.handleThemeToggle = this.handleThemeToggle.bind(this);
        this.handleExport = this.handleExport.bind(this);
        this.handleAutocomplete = this.handleAutocomplete.bind(this);
        this.handleOnlineStatus = this.handleOnlineStatus.bind(this);
        this.updateChart = this.updateChart.bind(this);
        
        // Initialisation
        this.init();
    }
    
    /**
     * Initialisation de l'application
     */
    async init() {
        try {
            console.log('🚀 Initialisation de WeatherApp...');
            
            // Initialise les gestionnaires d'UI
            this.loader.init();
            this.notifications.init();
            
            // Charge les éléments DOM
            this.cacheDOMElements();
            
            // Configure les écouteurs d'événements
            this.setupEventListeners();
            
            // Initialise le thème
            this.theme.init();
            
            // Configure le gestionnaire d'erreurs
            this.setupErrorHandling();
            
            // Charge l'historique
            this.loadHistory();
            
            // Charge la dernière recherche ou géolocalisation
            await this.loadInitialData();
            
            // Vérifie la connexion
            this.checkConnectivity();
            
            console.log('✅ WeatherApp initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.notifications.error('Erreur lors du chargement de l\'application');
        }
    }
    
    /**
     * Cache les éléments DOM
     */
    cacheDOMElements() {
        this.searchInput = document.getElementById('city-search');
        this.locationBtn = document.querySelector('.location-btn');
        this.themeToggle = document.querySelector('.theme-toggle');
        this.weatherCanvas = document.getElementById('weather-chart');
        this.clearSearchBtn = document.querySelector('.clear-search');
        this.historyList = document.getElementById('history-list');
        
        // Vérifie les éléments critiques
        if (!this.searchInput) {
            console.warn('Élément search-input non trouvé');
        }
    }
    
    /**
     * Configure les écouteurs d'export
     */
    setupExportListeners() {
        const exportOptions = document.querySelectorAll('.export-option');
        exportOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const format = btn.dataset.format;
                console.log('📤 Export demandé:', format);
                this.handleExport(format);
                // Ferme le menu après le clic
                const exportMenu = document.getElementById('exportMenu');
                if (exportMenu) {
                    exportMenu.classList.remove('visible');
                }
            });
        });
        console.log('✅ Export listeners configurés');
    }
    
    /**
     * Configure les écouteurs des boutons de graphique
     */
    setupChartListeners() {
        const chartBtns = document.querySelectorAll('.chart-btn');
        chartBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Désactive tous les boutons
                chartBtns.forEach(b => b.classList.remove('active'));
                // Active le bouton cliqué
                btn.classList.add('active');
                // Met à jour le graphique
                const chartType = btn.dataset.chart;
                console.log('📊 Changement de graphique:', chartType);
                this.updateChart(chartType);
            });
        });
        console.log('✅ Chart listeners configurés');
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Recherche avec debounce
        let debounceTimeout;
        this.searchInput?.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.handleAutocomplete(e.target.value);
            }, API_CONFIG.general.debounceDelay);
        });
        
        // Recherche au clic sur Entrée
        this.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchCity(e.target.value);
            }
        });
        
        // Bouton d'effacement
        this.clearSearchBtn?.addEventListener('click', () => {
            this.searchInput.value = '';
            this.ui.hideAutocomplete();
            this.searchInput.focus();
        });
        
        // Bouton de localisation
        this.locationBtn?.addEventListener('click', this.handleLocationClick);
        
        // Bouton de thème
        this.themeToggle?.addEventListener('click', this.handleThemeToggle);
        
        // Événements personnalisés
        document.addEventListener('showNotification', (e) => {
            this.notifications.show(e.detail.message, e.detail.type);
        });
        
        document.addEventListener('updateLoader', (e) => {
            if (e.detail.show) {
                this.loader.show(e.detail.message);
            } else {
                this.loader.hide();
            }
        });
        
        // Écouteurs de connectivité
        window.addEventListener('online', this.handleOnlineStatus);
        window.addEventListener('offline', this.handleOnlineStatus);
        
        // Écouteur de redimensionnement pour les graphiques
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Écouteur de clic extérieur pour fermer l'autocomplétion
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.ui.hideAutocomplete();
            }
        });
        
        // Configure les écouteurs d'export
        this.setupExportListeners();
        
        // Configure les écouteurs des graphiques
        this.setupChartListeners();
    }
    
    /**
     * Configure la gestion des erreurs
     */
    setupErrorHandling() {
        this.errorHandler.addListener((error) => {
            const message = this.errorHandler.getUserFriendlyMessage(error);
            this.notifications.show(message, error.type);
        });
        
        // Gestion des promesses non gérées
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesse non gérée:', event.reason);
            this.errorHandler.handle(event.reason, 'unhandled');
        });
        
        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.errorHandler.handle(event.error, 'global');
        });
    }
    
    /**
     * Charge les données initiales
     */
    async loadInitialData() {
        // Vérifie la dernière recherche
        const lastSearch = this.storage.getLastSearch();
        
        if (lastSearch) {
            await this.searchCity(lastSearch);
        } else {
            // Essaie la géolocalisation
            await this.getGeolocationWeather();
        }
    }
    
    /**
     * Charge l'historique des recherches
     */
    loadHistory() {
        const history = this.storage.getSearchHistory();
        this.ui.displayHistory(history, {
            selectCity: this.searchCity,
            deleteCity: (city) => {
                this.storage.removeFromHistory(city);
                this.loadHistory();
                this.notifications.info(`"${city}" supprimé de l'historique`);
            }
        });
    }
    
    /**
     * Gère l'autocomplétion
     * @param {string} query - Requête de recherche
     */
    async handleAutocomplete(query) {
        if (!query || query.length < 2) {
            this.ui.hideAutocomplete();
            return;
        }
        
        try {
            const suggestions = await this.autocompleteApi.autocomplete(query);
            this.ui.showAutocomplete(suggestions, this.searchCity);
        } catch (error) {
            this.errorHandler.handle(error, 'autocomplete');
        }
    }
    
    /**
     * Met à jour les statistiques moyennes
     * @param {Object} forecastData - Données de prévisions
     */
    updateStats(forecastData) {
        if (!forecastData || !forecastData.list) return;
        
        // Groupe les données par jour
        const dailyData = {};
        forecastData.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyData[date]) {
                dailyData[date] = { temps: [], humidity: [], wind: [] };
            }
            dailyData[date].temps.push(item.main.temp);
            dailyData[date].humidity.push(item.main.humidity);
            dailyData[date].wind.push(item.wind.speed);
        });
        
        // Calcule les moyennes sur 5 jours
        const days = Object.keys(dailyData).slice(0, 7);
        
        if (days.length === 0) return;
        
        const avgTemp = days.reduce((sum, d) => {
            const dayAvg = dailyData[d].temps.reduce((a, b) => a + b, 0) / dailyData[d].temps.length;
            return sum + dayAvg;
        }, 0) / days.length;
        
        const avgHumidity = days.reduce((sum, d) => {
            const dayAvg = dailyData[d].humidity.reduce((a, b) => a + b, 0) / dailyData[d].humidity.length;
            return sum + dayAvg;
        }, 0) / days.length;
        
        const avgWind = days.reduce((sum, d) => {
            const dayAvg = dailyData[d].wind.reduce((a, b) => a + b, 0) / dailyData[d].wind.length;
            return sum + dayAvg * 3.6; // Conversion m/s → km/h
        }, 0) / days.length;
        
        // Met à jour l'affichage
        const avgTempEl = document.getElementById('avg-temp');
        const avgHumidityEl = document.getElementById('avg-humidity');
        const avgWindEl = document.getElementById('avg-wind');
        
        if (avgTempEl) avgTempEl.textContent = `${Math.round(avgTemp)}°C`;
        if (avgHumidityEl) avgHumidityEl.textContent = `${Math.round(avgHumidity)}%`;
        if (avgWindEl) avgWindEl.textContent = `${Math.round(avgWind)} km/h`;
        
        console.log('📊 Stats mises à jour:', { 
            avgTemp: Math.round(avgTemp), 
            avgHumidity: Math.round(avgHumidity), 
            avgWind: Math.round(avgWind) 
        });
    }
    
    /**
     * Recherche la météo d'une ville
     * @param {string} city - Nom de la ville
     */
    async searchCity(city) {
        if (!city || !Validators.isValidCityName(city)) {
            this.notifications.warning('Veuillez entrer un nom de ville valide');
            return;
        }
        
        if (this.isLoading) {
            this.notifications.info('Une recherche est déjà en cours...');
            return;
        }
        
        this.isLoading = true;
        this.loader.show(`Recherche de ${city}...`);
        
        try {
            // Récupère les données météo
            const weatherData = await this.api.withRetry(() => 
                this.api.getCurrentWeatherByCity(city)
            );
            
            // Récupère les prévisions
            const forecastData = await this.api.withRetry(() =>
                this.api.getForecast(city)
            );
            
            // Sauvegarde dans l'état
            this.currentWeather = weatherData;
            this.currentForecast = forecastData;
            this.currentCity = weatherData.name;
            
            // Sauvegarde dans l'historique
            this.storage.saveToHistory(city);
            this.loadHistory();
            
            // Affiche les données
            this.ui.displayWeather(weatherData, forecastData);
            
            // Met à jour les statistiques moyennes
            this.updateStats(forecastData);
            
            // Crée les graphiques
            this.createCharts(forecastData);
            
            // Met à jour le titre de la page
            document.title = `${Formatters.formatCityName(weatherData.name)} - WeatherApp`;
            
            // Notification de succès
            this.notifications.success(`Météo de ${weatherData.name} chargée avec succès`);
            
        } catch (error) {
            console.error('Erreur recherche:', error);
            this.errorHandler.handle(error, 'weather');
            this.ui.clearWeatherDisplay();
        } finally {
            this.isLoading = false;
            this.loader.hide();
            this.ui.hideAutocomplete();
        }
    }
    
    /**
     * Récupère la météo par géolocalisation
     */
    async getGeolocationWeather() {
        this.loader.show('Récupération de votre position...');
        
        try {
            const cityInfo = await this.geoApi.getCurrentCity();
            
            if (cityInfo && cityInfo.name) {
                await this.searchCity(cityInfo.name);
                this.notifications.success(`Bienvenue à ${cityInfo.name} !`);
            } else {
                // Fallback sur Paris
                await this.searchCity(API_CONFIG.app.defaultCity);
            }
        } catch (error) {
            this.errorHandler.handle(error, 'geolocation');
            // Fallback sur Paris
            await this.searchCity(API_CONFIG.app.defaultCity);
        } finally {
            this.loader.hide();
        }
    }
    
    /**
     * Crée les graphiques météo
     * @param {Object} forecastData - Données de prévisions
     */
    createCharts(forecastData) {
        if (!forecastData || !forecastData.list) return;
        
        // Vérifie si le canvas existe
        if (!this.weatherCanvas) return;
        
        // Utilise le graphique adaptatif (Chart.js ou fallback)
        this.charts.createAdaptiveChart(
            'weather-chart',
            forecastData.list,
            'temperature'
        );
    }
    
    /**
     * Met à jour le graphique selon le type sélectionné
     * @param {string} type - Type de graphique (temperature, humidity, wind, combined)
     */
    updateChart(type) {
        if (!this.currentForecast || !this.currentForecast.list) {
            console.warn('Aucune donnée de prévisions disponible');
            return;
        }
        
        console.log('🔄 Mise à jour du graphique:', type);
        
        // Utilise la méthode updateChart du ChartManager
        this.charts.updateChart('weather-chart', this.currentForecast.list, type);
    }
    
    /**
     * Gère le clic sur le bouton de localisation
     */
    async handleLocationClick() {
        if (this.isLoading) {
            this.notifications.info('Veuillez patienter...');
            return;
        }
        
        await this.getGeolocationWeather();
    }
    
    /**
     * Gère le changement de thème
     */
    handleThemeToggle() {
        this.theme.toggle();
    }
    
    /**
     * Gère l'export des données
     * @param {string} format - Format d'export
     */
    async handleExport(format) {
        console.log('📤 Export demandé:', format);
        
        if (!this.currentWeather) {
            this.notifications.warning('Aucune donnée météo à exporter');
            return;
        }
        
        try {
            // Si PDF avec graphique, récupère l'image du graphique
            let chartImage = null;
            if (format === 'pdf' && this.weatherCanvas) {
                chartImage = this.charts.exportChartAsImage('weather-chart');
            }
            
            await this.exports.exportData(
                format,
                this.currentWeather,
                this.currentForecast,
                { chartImage }
            );
            
            this.notifications.success(`Export ${format.toUpperCase()} réussi`);
        } catch (error) {
            console.error('Erreur export:', error);
            this.errorHandler.handle(error, 'export');
            this.notifications.error(`Erreur lors de l'export ${format.toUpperCase()}`);
        }
    }
    
    /**
     * Gère le changement de statut de connexion
     */
    handleOnlineStatus() {
        if (navigator.onLine) {
            this.notifications.success('Connexion rétablie');
            // Rafraîchit les données si nécessaire
            if (this.currentCity) {
                this.searchCity(this.currentCity);
            }
        } else {
            this.notifications.warning('Vous êtes hors ligne. Données en cache.');
        }
    }
    
    /**
     * Gère le redimensionnement de la fenêtre
     */
    handleResize() {
        // Redessine les graphiques Canvas natifs si Chart.js n'est pas disponible
        if (!this.charts.isChartJSAvailable() && this.currentForecast) {
            this.charts.resizeNativeChart('weather-chart', this.currentForecast.list, 'temperature');
        }
    }
    
    /**
     * Vérifie la connectivité
     */
    checkConnectivity() {
        if (!navigator.onLine) {
            this.notifications.warning('Vous êtes hors ligne. Les données affichées peuvent être obsolètes.');
        }
    }
    
    /**
     * Rafraîchit les données météo
     */
    async refreshWeather() {
        if (this.currentCity) {
            await this.searchCity(this.currentCity);
        }
    }
    
    /**
     * Efface toutes les données de l'application
     */
    clearAllData() {
        if (confirm('Êtes-vous sûr de vouloir effacer toutes les données ?')) {
            this.storage.clearAll();
            this.loadHistory();
            this.ui.clearWeatherDisplay();
            this.currentWeather = null;
            this.currentForecast = null;
            this.currentCity = null;
            this.notifications.success('Toutes les données ont été effacées');
        }
    }
    
    /**
     * Obtient la version de l'application
     * @returns {string} - Version
     */
    getVersion() {
        return API_CONFIG.app.version;
    }
}

// Attendre le chargement du DOM avant d'initialiser
document.addEventListener('DOMContentLoaded', () => {
    // Vérifie que Chart.js est chargé (optionnel)
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js non chargé, utilisation du fallback Canvas natif');
    }
    
    // Initialise l'application
    window.weatherApp = new WeatherApp();
});

// Export pour les tests/modules
export default WeatherApp;