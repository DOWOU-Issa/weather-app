// Configuration des APIs
const API_CONFIG = {
    // OpenWeatherMap API
    openWeatherMap: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: 'eceaccb935363b69f9001c59679b7ab4', // Remplace par ta clé API
        endpoints: {
            current: '/weather',
            forecast: '/forecast',
            airPollution: '/air_pollution'
        },
        units: 'metric', // metric, imperial, standard
        lang: 'fr'
    },
    
    // GeoDB Cities API (pour l'autocomplétion)
    geoDB: {
        baseUrl: 'https://wft-geo-db.p.rapidapi.com/v1/geo',
        apiKey: '2afbcfe519msh29ef5f9dc27a88ap18373cjsnde75dddb196b', // Remplace par ta clé API
        apiHost: 'wft-geo-db.p.rapidapi.com',
        endpoints: {
            cities: '/cities',
            countries: '/countries'
        },
        limit: 10,
        offset: 0
    },
    
    // Configuration générale
    general: {
        cacheDuration: 300000, // 5 minutes en millisecondes
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 10000
    },
    
    // Messages d'erreur
    errorMessages: {
        network: 'Erreur de connexion. Vérifiez votre connexion internet.',
        apiKey: 'Erreur d\'authentification API. Contactez l\'administrateur.',
        cityNotFound: 'Ville non trouvée. Vérifiez le nom et réessayez.',
        rateLimit: 'Trop de requêtes. Veuillez patienter quelques secondes.',
        generic: 'Une erreur est survenue. Veuillez réessayer.',
        offline: 'Vous êtes hors ligne. Les données affichées sont en cache.',
        invalidCity: 'Nom de ville invalide. Utilisez uniquement des lettres et tirets.'
    },
    
    // Thèmes disponibles
    themes: {
        light: 'light',
        dark: 'dark',
        auto: 'auto'
    },
    
    // Paramètres de l'application
    app: {
        version: '1.0.0',
        defaultCity: 'Paris',
        maxHistoryItems: 10,
        debounceDelay: 300
    }
};

// Vérification de la présence des clés API
if (API_CONFIG.openWeatherMap.apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ Attention: Veuillez configurer votre clé API OpenWeatherMap dans config/api.config.js');
}

if (API_CONFIG.geoDB.apiKey === 'YOUR_RAPIDAPI_KEY_HERE') {
    console.warn('⚠️ Attention: Veuillez configurer votre clé API GeoDB dans config/api.config.js');
}

// Export pour les modules ES6
export default API_CONFIG;