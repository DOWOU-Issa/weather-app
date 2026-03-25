import Validators from '../utils/validators.js';
import Formatters from '../utils/formatters.js';

/**
 * Exportateur CSV
 * Exporte les données météo au format CSV
 */
export class CSVExporter {
    
    /**
     * Exporte les données météo en CSV
     * @param {Object} weatherData - Données météo actuelles
     * @param {Object} forecastData - Données de prévisions
     * @param {Object} options - Options d'export
     * @returns {string} - Chaîne CSV
     */
    export(weatherData, forecastData, options = {}) {
        if (!Validators.isValidWeatherData(weatherData)) {
            throw new Error('Données météo invalides pour l\'export');
        }
        
        const includeForecast = options.includeForecast !== false;
        
        let csvRows = [];
        
        // Section météo actuelle
        csvRows.push(['=== MÉTÉO ACTUELLE ===']);
        csvRows.push(this.getCurrentWeatherRow(weatherData));
        csvRows.push([]); // Ligne vide
        
        // Section localisation
        csvRows.push(['=== LOCALISATION ===']);
        csvRows.push(this.getLocationRow(weatherData));
        csvRows.push([]);
        
        // Section prévisions
        if (includeForecast && forecastData && forecastData.list) {
            csvRows.push(['=== PRÉVISIONS ===']);
            csvRows.push(this.getForecastHeaders());
            const forecastRows = this.getForecastRows(forecastData);
            csvRows.push(...forecastRows);
        }
        
        // Convertit en CSV
        return csvRows.map(row => 
            row.map(cell => this.escapeCSV(cell)).join(',')
        ).join('\n');
    }
    
    /**
     * Récupère la ligne de météo actuelle
     * @param {Object} weatherData - Données météo
     * @returns {Array} - Ligne CSV
     */
    getCurrentWeatherRow(weatherData) {
        return [
            'Ville',
            'Température',
            'Ressenti',
            'Humidité',
            'Pression',
            'Vent',
            'Direction',
            'Météo',
            'Date'
        ];
    }
    
    /**
     * Récupère les données de météo actuelle
     * @param {Object} weatherData - Données météo
     * @returns {Array} - Ligne de données
     */
    getCurrentWeatherDataRow(weatherData) {
        return [
            `${weatherData.name}, ${weatherData.sys.country}`,
            Formatters.formatTemperature(weatherData.main.temp),
            Formatters.formatTemperature(weatherData.main.feels_like),
            Formatters.formatHumidity(weatherData.main.humidity),
            Formatters.formatPressure(weatherData.main.pressure),
            Formatters.formatWindSpeed(weatherData.wind.speed),
            Formatters.formatWindDirection(weatherData.wind.deg),
            Formatters.capitalize(weatherData.weather[0].description),
            Formatters.formatDate(new Date(weatherData.dt * 1000), 'full')
        ];
    }
    
    /**
     * Récupère la ligne de localisation
     * @param {Object} weatherData - Données météo
     * @returns {Array} - Ligne CSV
     */
    getLocationRow(weatherData) {
        return [
            'Nom',
            'Pays',
            'Latitude',
            'Longitude'
        ];
    }
    
    /**
     * Récupère les données de localisation
     * @param {Object} weatherData - Données météo
     * @returns {Array} - Ligne de données
     */
    getLocationDataRow(weatherData) {
        return [
            weatherData.name,
            weatherData.sys.country,
            weatherData.coord.lat,
            weatherData.coord.lon
        ];
    }
    
    /**
     * Récupère les en-têtes des prévisions
     * @returns {Array} - En-têtes CSV
     */
    getForecastHeaders() {
        return [
            'Date',
            'Heure',
            'Température (°C)',
            'Ressenti (°C)',
            'Humidité (%)',
            'Pression (hPa)',
            'Vent (km/h)',
            'Direction',
            'Météo',
            'Description'
        ];
    }
    
    /**
     * Récupère les lignes de prévisions
     * @param {Object} forecastData - Données de prévisions
     * @returns {Array} - Lignes CSV
     */
    getForecastRows(forecastData) {
        const rows = [];
        
        if (!forecastData.list) return rows;
        
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            
            rows.push([
                Formatters.formatDate(date, 'short'),
                Formatters.formatDate(date, 'time'),
                Math.round(item.main.temp),
                Math.round(item.main.feels_like),
                item.main.humidity,
                item.main.pressure,
                Math.round(item.wind.speed * 3.6), // m/s to km/h
                Formatters.formatWindDirection(item.wind.deg),
                item.weather[0].main,
                Formatters.capitalize(item.weather[0].description)
            ]);
        });
        
        return rows;
    }
    
    /**
     * Échappe les caractères CSV
     * @param {any} cell - Valeur de la cellule
     * @returns {string} - Valeur échappée
     */
    escapeCSV(cell) {
        if (cell === null || cell === undefined) {
            return '';
        }
        
        const stringCell = String(cell);
        
        // Si contient des virgules, guillemets ou sauts de ligne
        if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
            // Échappe les guillemets
            const escaped = stringCell.replace(/"/g, '""');
            return `"${escaped}"`;
        }
        
        return stringCell;
    }
    
    /**
     * Exporte avec toutes les données détaillées
     * @param {Object} weatherData - Données météo
     * @param {Object} forecastData - Prévisions
     * @returns {string} - CSV complet
     */
    exportDetailed(weatherData, forecastData) {
        const sections = [];
        
        // Section météo actuelle
        sections.push('=== MÉTÉO ACTUELLE ===');
        sections.push(this.getCurrentWeatherDataRow(weatherData).join(','));
        sections.push('');
        
        // Section localisation
        sections.push('=== LOCALISATION ===');
        sections.push(this.getLocationDataRow(weatherData).join(','));
        sections.push('');
        
        // Section prévisions
        if (forecastData && forecastData.list) {
            sections.push('=== PRÉVISIONS HORAIRES ===');
            sections.push(this.getForecastHeaders().join(','));
            const rows = this.getForecastRows(forecastData);
            sections.push(...rows.map(row => row.join(',')));
        }
        
        return sections.join('\n');
    }
    
    /**
     * Télécharge le fichier CSV
     * @param {Object} weatherData - Données météo
     * @param {Object} forecastData - Prévisions
     * @param {string} filename - Nom du fichier
     * @param {boolean} detailed - Export détaillé
     */
    download(weatherData, forecastData, filename = 'weather-data.csv', detailed = false) {
        const csvData = detailed 
            ? this.exportDetailed(weatherData, forecastData)
            : this.export(weatherData, forecastData);
        
        // Ajout BOM pour UTF-8
        const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Export par défaut
export default CSVExporter;