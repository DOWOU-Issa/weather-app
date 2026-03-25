/**
 * Gestionnaire d'export
 * Centralise tous les formats d'export
 */

import JSONExporter from './jsonExporter.js';
import CSVExporter from './csvExporter.js';
import PDFExporter from './pdfExporter.js';

export class ExportManager {
    constructor() {
        this.jsonExporter = new JSONExporter();
        this.csvExporter = new CSVExporter();
        this.pdfExporter = new PDFExporter();
    }
    
    /**
     * Exporte les données selon le format
     * @param {string} format - Format d'export (json, csv, pdf)
     * @param {Object} weatherData - Données météo actuelles
     * @param {Object} forecastData - Données de prévisions
     * @param {Object} options - Options supplémentaires
     */
    async exportData(format, weatherData, forecastData, options = {}) {
        if (!weatherData) {
            console.error('Aucune donnée à exporter');
            return;
        }
        
        const cityName = weatherData.name.toLowerCase().replace(/\s+/g, '-');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `${cityName}-weather-${timestamp}`;
        
        try {
            switch (format.toLowerCase()) {
                case 'json':
                    this.exportJSON(weatherData, forecastData, `${filename}.json`);
                    break;
                case 'csv':
                    this.exportCSV(weatherData, forecastData, `${filename}.csv`);
                    break;
                case 'pdf':
                    await this.exportPDF(weatherData, forecastData, `${filename}.pdf`);
                    break;
                default:
                    console.warn(`Format non supporté: ${format}`);
            }
        } catch (error) {
            console.error(`Erreur export ${format}:`, error);
        }
    }
    
    exportJSON(weatherData, forecastData, filename) {
        const exportData = {
            ville: weatherData.name,
            pays: weatherData.sys.country,
            temperature: weatherData.main.temp,
            ressenti: weatherData.main.feels_like,
            humidite: weatherData.main.humidity,
            pression: weatherData.main.pressure,
            vent_kmh: Math.round(weatherData.wind.speed * 3.6),
            description: weatherData.weather[0].description,
            date_export: new Date().toLocaleString('fr-FR')
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Export JSON réussi:', filename);
    }
    
    exportCSV(weatherData, forecastData, filename) {
        const exportData = {
            ville: weatherData.name,
            pays: weatherData.sys.country,
            temperature: weatherData.main.temp,
            ressenti: weatherData.main.feels_like,
            humidite: weatherData.main.humidity,
            pression: weatherData.main.pressure,
            vent_kmh: Math.round(weatherData.wind.speed * 3.6),
            description: weatherData.weather[0].description,
            date_export: new Date().toLocaleString('fr-FR')
        };
        
        const headers = Object.keys(exportData);
        const values = Object.values(exportData);
        const csv = [headers.join(';'), values.join(';')].join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Export CSV réussi:', filename);
    }
    
    async exportPDF(weatherData, forecastData, filename) {
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF non chargé');
            return;
        }
        
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        
        // Titre
        doc.setFontSize(20);
        doc.text(`Rapport météo - ${weatherData.name}`, 20, 20);
        
        // Date
        doc.setFontSize(10);
        doc.text(`Généré le: ${new Date().toLocaleString('fr-FR')}`, 20, 30);
        
        // Données
        doc.setFontSize(12);
        let y = 50;
        
        doc.text(`Ville: ${weatherData.name}, ${weatherData.sys.country}`, 20, y); y += 10;
        doc.text(`Température: ${Math.round(weatherData.main.temp)}°C`, 20, y); y += 10;
        doc.text(`Ressenti: ${Math.round(weatherData.main.feels_like)}°C`, 20, y); y += 10;
        doc.text(`Humidité: ${weatherData.main.humidity}%`, 20, y); y += 10;
        doc.text(`Vent: ${Math.round(weatherData.wind.speed * 3.6)} km/h`, 20, y); y += 10;
        doc.text(`Pression: ${weatherData.main.pressure} hPa`, 20, y); y += 10;
        doc.text(`Conditions: ${weatherData.weather[0].description}`, 20, y);
        
        doc.save(filename);
        console.log('Export PDF réussi:', filename);
    }
}

// Export par défaut
export default ExportManager;