/**
 * Gestionnaire de loader
 * Affiche/masque un loader animé pendant les chargements
 */
export class LoaderManager {
    constructor() {
        this.loaderElement = null;
        this.loadingCount = 0;
        this.timeoutId = null;
    }
    
    /**
     * Initialise le loader
     */
    init() {
        this.loaderElement = document.getElementById('loader');
        if (!this.loaderElement) {
            this.createLoaderElement();
        }
    }
    
    /**
     * Crée l'élément loader s'il n'existe pas
     */
    createLoaderElement() {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.className = 'loader hidden';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-label', 'Chargement');
        
        loader.innerHTML = `
            <div class="spinner-container">
                <div class="spinner"></div>
                <div class="spinner-text">Chargement des données météo...</div>
            </div>
        `;
        
        document.body.appendChild(loader);
        this.loaderElement = loader;
    }
    
    /**
     * Affiche le loader
     * @param {string} message - Message optionnel
     */
    show(message = 'Chargement...') {
        if (!this.loaderElement) {
            this.init();
        }
        
        this.loadingCount++;
        
        // Met à jour le message
        const textElement = this.loaderElement.querySelector('.spinner-text');
        if (textElement) {
            textElement.textContent = message;
        }
        
        // Supprime le timeout précédent
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        // Affiche le loader
        this.loaderElement.classList.remove('hidden');
        
        // Force un reflow pour l'animation
        void this.loaderElement.offsetHeight;
        
        // Ajoute la classe pour l'animation d'entrée
        this.loaderElement.classList.add('visible');
    }
    
    /**
     * Masque le loader
     * @param {boolean} force - Force le masquage immédiat
     */
    hide(force = false) {
        if (!this.loaderElement) return;
        
        if (force) {
            this.loadingCount = 0;
        } else {
            this.loadingCount--;
        }
        
        if (this.loadingCount <= 0) {
            this.loadingCount = 0;
            
            // Retire la classe d'animation
            this.loaderElement.classList.remove('visible');
            
            // Timeout pour permettre l'animation de sortie
            this.timeoutId = setTimeout(() => {
                this.loaderElement.classList.add('hidden');
                this.timeoutId = null;
            }, 300);
        }
    }
    
    /**
     * Masque immédiatement le loader
     */
    hideImmediately() {
        if (!this.loaderElement) return;
        
        this.loadingCount = 0;
        this.loaderElement.classList.add('hidden');
        this.loaderElement.classList.remove('visible');
        
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
    
    /**
     * Exécute une fonction asynchrone avec loader
     * @param {Function} asyncFunction - Fonction à exécuter
     * @param {string} message - Message du loader
     * @returns {Promise} - Résultat de la fonction
     */
    async withLoader(asyncFunction, message = 'Chargement...') {
        this.show(message);
        
        try {
            const result = await asyncFunction();
            return result;
        } finally {
            this.hide();
        }
    }
    
    /**
     * Crée un loader pour un élément spécifique
     * @param {HTMLElement} element - Élément parent
     * @returns {Object} - Contrôleur du loader
     */
    createElementLoader(element) {
        if (!element) return null;
        
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'element-loader hidden';
        loaderContainer.innerHTML = `
            <div class="element-spinner"></div>
        `;
        
        element.style.position = 'relative';
        element.appendChild(loaderContainer);
        
        return {
            show: () => {
                loaderContainer.classList.remove('hidden');
                setTimeout(() => {
                    loaderContainer.classList.add('visible');
                }, 10);
            },
            hide: () => {
                loaderContainer.classList.remove('visible');
                setTimeout(() => {
                    loaderContainer.classList.add('hidden');
                }, 300);
            }
        };
    }
    
    /**
     * Vérifie si le loader est visible
     * @returns {boolean} - True si visible
     */
    isVisible() {
        return this.loaderElement && 
               !this.loaderElement.classList.contains('hidden') &&
               this.loadingCount > 0;
    }
}

// Export par défaut
export default LoaderManager;