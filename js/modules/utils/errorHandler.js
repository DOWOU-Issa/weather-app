import API_CONFIG from '../../../config/api.config.js';

/**
 * Module de gestion des erreurs
 * Centralise la gestion des erreurs de l'application
 */
export class ErrorHandler {
    constructor() {
        this.errorListeners = [];
        this.isOnline = navigator.onLine;
        
        // Écoute les changements de connectivité
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }
    
    /**
     * Gère une erreur
     * @param {Error|string} error - L'erreur à gérer
     * @param {string} context - Contexte de l'erreur
     * @returns {Object} - Objet d'erreur formaté
     */
    handle(error, context = 'general') {
        // Formate l'erreur
        const formattedError = this.formatError(error, context);
        
        // Log l'erreur en console
        this.logError(formattedError);
        
        // Notifie les listeners
        this.notifyListeners(formattedError);
        
        // Retourne l'erreur formatée
        return formattedError;
    }
    
    /**
     * Formate l'erreur pour un affichage utilisateur
     * @param {Error|string} error - L'erreur brute
     * @param {string} context - Contexte
     * @returns {Object} - Erreur formatée
     */
    formatError(error, context) {
        let message = API_CONFIG.errorMessages.generic;
        let type = 'error';
        let technicalDetails = null;
        
        // Erreur de réseau
        if (!this.isOnline) {
            message = API_CONFIG.errorMessages.offline;
            type = 'warning';
        }
        // Erreur API
        else if (error.response) {
            switch (error.response.status) {
                case 401:
                case 403:
                    message = API_CONFIG.errorMessages.apiKey;
                    break;
                case 404:
                    message = API_CONFIG.errorMessages.cityNotFound;
                    break;
                case 429:
                    message = API_CONFIG.errorMessages.rateLimit;
                    break;
                default:
                    message = `${API_CONFIG.errorMessages.generic} (${error.response.status})`;
            }
        }
        // Erreur de validation
        else if (error.name === 'ValidationError') {
            message = error.message;
            type = 'warning';
        }
        // Erreur JavaScript standard
        else if (error instanceof Error) {
            message = error.message || API_CONFIG.errorMessages.generic;
            technicalDetails = {
                name: error.name,
                stack: error.stack,
                context: context
            };
        }
        // String d'erreur
        else if (typeof error === 'string') {
            message = error;
        }
        
        return {
            message: message,
            type: type,
            context: context,
            timestamp: new Date().toISOString(),
            technicalDetails: technicalDetails,
            isOnline: this.isOnline
        };
    }
    
    /**
     * Log l'erreur dans la console
     * @param {Object} formattedError - Erreur formatée
     */
    logError(formattedError) {
        const logPrefix = `[${formattedError.timestamp}] [${formattedError.context}]`;
        
        switch (formattedError.type) {
            case 'error':
                console.error(logPrefix, formattedError.message);
                if (formattedError.technicalDetails) {
                    console.error('Détails techniques:', formattedError.technicalDetails);
                }
                break;
            case 'warning':
                console.warn(logPrefix, formattedError.message);
                break;
            default:
                console.log(logPrefix, formattedError.message);
        }
    }
    
    /**
     * Ajoute un listener d'erreur
     * @param {Function} listener - Fonction callback
     */
    addListener(listener) {
        if (typeof listener === 'function') {
            this.errorListeners.push(listener);
        }
    }
    
    /**
     * Supprime un listener
     * @param {Function} listener - Fonction à supprimer
     */
    removeListener(listener) {
        this.errorListeners = this.errorListeners.filter(l => l !== listener);
    }
    
    /**
     * Notifie tous les listeners
     * @param {Object} error - Erreur à notifier
     */
    notifyListeners(error) {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (listenerError) {
                console.error('Erreur dans le listener:', listenerError);
            }
        });
    }
    
    /**
     * Gère le changement de statut en ligne
     * @param {boolean} isOnline - Statut de connexion
     */
    handleOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        
        if (isOnline) {
            const reconnectMessage = {
                message: 'Connexion rétablie !',
                type: 'success',
                context: 'network',
                timestamp: new Date().toISOString()
            };
            this.notifyListeners(reconnectMessage);
        } else {
            const offlineMessage = {
                message: API_CONFIG.errorMessages.offline,
                type: 'warning',
                context: 'network',
                timestamp: new Date().toISOString()
            };
            this.notifyListeners(offlineMessage);
        }
    }
    
    /**
     * Vérifie si une erreur est critique
     * @param {Object} error - Erreur à vérifier
     * @returns {boolean} - True si critique
     */
    isCriticalError(error) {
        return error.type === 'error' && 
               (error.message.includes('API') || 
                error.message.includes('authentification') ||
                error.message.includes('connexion'));
    }
    
    /**
     * Retourne un message utilisateur friendly
     * @param {Object} error - Erreur formatée
     * @returns {string} - Message utilisateur
     */
    getUserFriendlyMessage(error) {
        // Messages personnalisés selon le contexte
        const contextMessages = {
            'weather': 'Impossible de charger les données météo. ',
            'geolocation': 'Impossible d\'obtenir votre position. ',
            'autocomplete': 'Erreur lors de la recherche. ',
            'export': 'Erreur lors de l\'export des données. ',
            'storage': 'Erreur de sauvegarde locale. '
        };
        
        const prefix = contextMessages[error.context] || '';
        return prefix + error.message;
    }
    
    /**
     * Crée une erreur de validation
     * @param {string} message - Message d'erreur
     * @returns {Error} - Erreur de validation
     */
    static createValidationError(message) {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }
    
    /**
     * Crée une erreur API
     * @param {string} message - Message d'erreur
     * @param {number} statusCode - Code HTTP
     * @returns {Error} - Erreur API
     */
    static createAPIError(message, statusCode) {
        const error = new Error(message);
        error.name = 'APIError';
        error.statusCode = statusCode;
        return error;
    }
}

// Export par défaut
export default ErrorHandler;