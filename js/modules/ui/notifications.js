/**
 * Gestionnaire de notifications
 * Affiche des notifications temporaires
 */
export class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.defaultDuration = 5000;
        this.maxNotifications = 3;
    }
    
    /**
     * Initialise le conteneur de notifications
     */
    init() {
        this.container = document.getElementById('notifications');
        if (!this.container) {
            this.createContainer();
        }
    }
    
    /**
     * Crée le conteneur de notifications
     */
    createContainer() {
        const container = document.createElement('div');
        container.id = 'notifications';
        container.className = 'notifications';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
        this.container = container;
    }
    
    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, warning, info)
     * @param {number} duration - Durée d'affichage en ms
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        if (!this.container) {
            this.init();
        }
        
        // Crée l'élément de notification
        const notification = this.createNotificationElement(message, type);
        
        // Ajoute au conteneur
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        // Gère le nombre maximum de notifications
        this.cleanupOldNotifications();
        
        // Animation d'entrée
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        // Auto-suppression
        const timeoutId = setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        // Stocke le timeout pour pouvoir l'annuler
        notification.dataset.timeoutId = timeoutId;
        
        // Ajoute le bouton de fermeture
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.removeNotification(notification);
            });
        }
        
        return notification;
    }
    
    /**
     * Crée l'élément de notification
     * @param {string} message - Message
     * @param {string} type - Type
     * @returns {HTMLElement} - Élément notification
     */
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const icon = icons[type] || icons.info;
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
            <button class="notification-close" aria-label="Fermer">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return notification;
    }
    
    /**
     * Supprime une notification
     * @param {HTMLElement} notification - Élément à supprimer
     */
    removeNotification(notification) {
        if (!notification || !notification.parentNode) return;
        
        // Annule le timeout
        const timeoutId = notification.dataset.timeoutId;
        if (timeoutId) {
            clearTimeout(parseInt(timeoutId));
        }
        
        // Animation de sortie
        notification.classList.remove('visible');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }
    
    /**
     * Nettoie les anciennes notifications
     */
    cleanupOldNotifications() {
        while (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            if (oldest && oldest.parentNode) {
                this.removeNotification(oldest);
            }
        }
    }
    
    /**
     * Efface toutes les notifications
     */
    clearAll() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }
    
    /**
     * Affiche une notification de succès
     * @param {string} message - Message
     * @param {number} duration - Durée
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    /**
     * Affiche une notification d'erreur
     * @param {string} message - Message
     * @param {number} duration - Durée
     */
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    /**
     * Affiche une notification d'avertissement
     * @param {string} message - Message
     * @param {number} duration - Durée
     */
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    /**
     * Affiche une notification d'information
     * @param {string} message - Message
     * @param {number} duration - Durée
     */
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
    
    /**
     * Échappe les caractères HTML
     * @param {string} text - Texte à échapper
     * @returns {string} - Texte échappé
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export par défaut
export default NotificationManager;