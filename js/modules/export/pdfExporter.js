import Validators from '../utils/validators.js';
import Formatters from '../utils/formatters.js';

/**
 * Exportateur PDF
 * Exporte les données météo au format PDF avec jsPDF
 */
export class PDFExporter {
    constructor() {
        this.jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    }
    
    /**
     * Exporte les données météo en PDF
     * @param {Object} weatherData - Données météo actuelles
     * @param {Object} forecastData - Données de prévisions
     * @param {Object} options - Options d'export
     * @returns {Promise} - PDF généré
     */
    async export(weatherData, forecastData, options = {}) {
        if (!Validators.isValidWeatherData(weatherData)) {
            throw new Error('Données météo invalides pour l\'export');
        }
        
        if (!this.jsPDF) {
            throw new Error('jsPDF n\'est pas chargé');
        }
        
        const doc = new this.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Métadonnées
        doc.setProperties({
            title: 'Rapport Météo',
            subject: 'Données météorologiques',
            author: 'WeatherApp',
            creator: 'WeatherApp'
        });
        
        // Styles
        const styles = {
            title: { fontSize: 24, fontStyle: 'bold', color: '#333' },
            subtitle: { fontSize: 16, fontStyle: 'bold', color: '#666' },
            header: { fontSize: 12, fontStyle: 'bold', color: '#2196F3' },
            text: { fontSize: 10, fontStyle: 'normal', color: '#333' },
            small: { fontSize: 8, fontStyle: 'normal', color: '#666' }
        };
        
        let yPos = 20;
        
        // Titre
        doc.setFontSize(styles.title.fontSize);
        doc.setFont('helvetica', styles.title.fontStyle);
        doc.text('Rapport Météo', 105, yPos, { align: 'center' });
        yPos += 10;
        
        // Date
        doc.setFontSize(styles.small.fontSize);
        doc.setFont('helvetica', styles.small.fontStyle);
        doc.text(`Généré le: ${Formatters.formatDate(new Date(), 'full')}`, 105, yPos, { align: 'center' });
        yPos += 15;
        
        // Section météo actuelle
        yPos = this.addCurrentWeatherSection(doc, weatherData, yPos, styles);
        
        // Section localisation
        yPos = this.addLocationSection(doc, weatherData, yPos, styles);
        
        // Section prévisions
        if (forecastData && forecastData.list) {
            yPos = await this.addForecastSection(doc, forecastData, yPos, styles);
        }
        
        // Pied de page
        this.addFooter(doc);
        
        return doc;
    }
    
    /**
     * Ajoute la section météo actuelle
     * @param {Object} doc - Document PDF
     * @param {Object} weatherData - Données météo
     * @param {number} yPos - Position Y
     * @param {Object} styles - Styles
     * @returns {number} - Nouvelle position Y
     */
    addCurrentWeatherSection(doc, weatherData, yPos, styles) {
        // Titre section
        doc.setFontSize(styles.header.fontSize);
        doc.setFont('helvetica', styles.header.fontStyle);
        doc.text('Météo Actuelle', 20, yPos);
        yPos += 10;
        
        // Température
        doc.setFontSize(styles.text.fontSize);
        doc.setFont('helvetica', styles.text.fontStyle);
        doc.text(`Température: ${Formatters.formatTemperature(weatherData.main.temp)}`, 25, yPos);
        doc.text(`Ressenti: ${Formatters.formatTemperature(weatherData.main.feels_like)}`, 25, yPos + 7);
        doc.text(`Température min: ${Formatters.formatTemperature(weatherData.main.temp_min)}`, 25, yPos + 14);
        doc.text(`Température max: ${Formatters.formatTemperature(weatherData.main.temp_max)}`, 25, yPos + 21);
        yPos += 28;
        
        // Humidité et pression
        doc.text(`Humidité: ${Formatters.formatHumidity(weatherData.main.humidity)}`, 25, yPos);
        doc.text(`Pression: ${Formatters.formatPressure(weatherData.main.pressure)}`, 25, yPos + 7);
        yPos += 14;
        
        // Vent
        doc.text(`Vent: ${Formatters.formatWindSpeed(weatherData.wind.speed)}`, 25, yPos);
        doc.text(`Direction: ${Formatters.formatWindDirection(weatherData.wind.deg)}`, 25, yPos + 7);
        yPos += 14;
        
        // Conditions
        doc.text(`Conditions: ${Formatters.capitalize(weatherData.weather[0].description)}`, 25, yPos);
        yPos += 15;
        
        return yPos;
    }
    
    /**
     * Ajoute la section localisation
     * @param {Object} doc - Document PDF
     * @param {Object} weatherData - Données météo
     * @param {number} yPos - Position Y
     * @param {Object} styles - Styles
     * @returns {number} - Nouvelle position Y
     */
    addLocationSection(doc, weatherData, yPos, styles) {
        // Titre section
        doc.setFontSize(styles.header.fontSize);
        doc.setFont('helvetica', styles.header.fontStyle);
        doc.text('Localisation', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(styles.text.fontSize);
        doc.setFont('helvetica', styles.text.fontStyle);
        doc.text(`Ville: ${weatherData.name}, ${weatherData.sys.country}`, 25, yPos);
        doc.text(`Coordonnées: ${weatherData.coord.lat}, ${weatherData.coord.lon}`, 25, yPos + 7);
        yPos += 20;
        
        return yPos;
    }
    
    /**
     * Ajoute la section prévisions
     * @param {Object} doc - Document PDF
     * @param {Object} forecastData - Prévisions
     * @param {number} yPos - Position Y
     * @param {Object} styles - Styles
     * @returns {number} - Nouvelle position Y
     */
    async addForecastSection(doc, forecastData, yPos, styles) {
        // Vérifie l'espace disponible
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }
        
        // Titre section
        doc.setFontSize(styles.header.fontSize);
        doc.setFont('helvetica', styles.header.fontStyle);
        doc.text('Prévisions 5 jours', 20, yPos);
        yPos += 10;
        
        // Tableau des prévisions
        const dailyForecast = this.groupForecastByDay(forecastData.list);
        
        // En-têtes
        doc.setFontSize(styles.text.fontSize);
        doc.setFont('helvetica', 'bold');
        doc.text('Date', 20, yPos);
        doc.text('Min', 60, yPos);
        doc.text('Max', 80, yPos);
        doc.text('Humidité', 100, yPos);
        doc.text('Vent', 130, yPos);
        doc.text('Météo', 160, yPos);
        yPos += 7;
        
        // Lignes
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(styles.small.fontSize);
        
        dailyForecast.forEach((day, index) => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
                
                // Ré-affiche les en-têtes
                doc.setFont('helvetica', 'bold');
                doc.text('Date', 20, yPos);
                doc.text('Min', 60, yPos);
                doc.text('Max', 80, yPos);
                doc.text('Humidité', 100, yPos);
                doc.text('Vent', 130, yPos);
                doc.text('Météo', 160, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
            }
            
            doc.text(Formatters.formatDate(day.date, 'short'), 20, yPos);
            doc.text(`${Math.round(day.tempMin)}°C`, 60, yPos);
            doc.text(`${Math.round(day.tempMax)}°C`, 80, yPos);
            doc.text(`${Math.round(day.humidityAvg)}%`, 100, yPos);
            doc.text(`${Math.round(day.windAvg * 3.6)} km/h`, 130, yPos);
            doc.text(day.weatherMain, 160, yPos);
            yPos += 6;
        });
        
        yPos += 10;
        return yPos;
    }
    
    /**
     * Groupe les prévisions par jour
     * @param {Array} forecastList - Liste des prévisions
     * @returns {Array} - Données groupées
     */
    groupForecastByDay(forecastList) {
        const dailyMap = new Map();
        
        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            
            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    date: date,
                    temps: [],
                    tempMin: item.main.temp_min,
                    tempMax: item.main.temp_max,
                    humidity: [],
                    wind: [],
                    weatherMain: item.weather[0].main,
                    weatherDescription: item.weather[0].description
                });
            }
            
            const daily = dailyMap.get(date);
            daily.temps.push(item.main.temp);
            daily.humidity.push(item.main.humidity);
            daily.wind.push(item.wind.speed);
            daily.tempMin = Math.min(daily.tempMin, item.main.temp_min);
            daily.tempMax = Math.max(daily.tempMax, item.main.temp_max);
        });
        
        return Array.from(dailyMap.values()).map(day => ({
            date: day.date,
            tempMin: day.tempMin,
            tempMax: day.tempMax,
            tempAvg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
            humidityAvg: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
            windAvg: day.wind.reduce((a, b) => a + b, 0) / day.wind.length,
            weatherMain: day.weatherMain,
            weatherDescription: day.weatherDescription
        }));
    }
    
    /**
     * Ajoute le pied de page
     * @param {Object} doc - Document PDF
     */
    addFooter(doc) {
        const pageCount = doc.internal.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text(
                'WeatherApp - Rapport généré automatiquement',
                105,
                287,
                { align: 'center' }
            );
            doc.text(
                `Page ${i} / ${pageCount}`,
                195,
                287,
                { align: 'right' }
            );
        }
    }
    
    /**
     * Télécharge le PDF
     * @param {Object} weatherData - Données météo
     * @param {Object} forecastData - Prévisions
     * @param {string} filename - Nom du fichier
     */
    async download(weatherData, forecastData, filename = 'weather-report.pdf') {
        const doc = await this.export(weatherData, forecastData);
        doc.save(filename);
    }
    
    /**
     * Crée un rapport PDF avec graphiques
     * @param {Object} weatherData - Données météo
     * @param {Object} forecastData - Prévisions
     * @param {string} chartImageUrl - URL de l'image du graphique
     * @returns {Object} - Document PDF
     */
    async exportWithChart(weatherData, forecastData, chartImageUrl) {
        const doc = await this.export(weatherData, forecastData);
        
        if (chartImageUrl) {
            doc.addPage();
            
            // Titre de la page graphique
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Graphique des prévisions', 105, 20, { align: 'center' });
            
            // Ajoute l'image du graphique
            try {
                doc.addImage(chartImageUrl, 'PNG', 15, 30, 180, 100);
            } catch (error) {
                console.error('Erreur lors de l\'ajout du graphique:', error);
                doc.text('Graphique non disponible', 105, 80, { align: 'center' });
            }
        }
        
        return doc;
    }
}

// Export par défaut
export default PDFExporter;