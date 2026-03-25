import Formatters from '../utils/formatters.js';

/**
 * Gestionnaire de graphiques
 * Crée et gère les graphiques météo avec Chart.js ou fallback Canvas natif
 */
export class ChartManager {
    constructor() {
        this.charts = {};
        this.chartInstances = {};
        this.defaultColors = {
            temperature: {
                border: 'rgba(255, 99, 132, 1)',
                background: 'rgba(255, 99, 132, 0.2)',
                pointBackground: 'rgba(255, 99, 132, 1)'
            },
            humidity: {
                border: 'rgba(54, 162, 235, 1)',
                background: 'rgba(54, 162, 235, 0.2)',
                pointBackground: 'rgba(54, 162, 235, 1)'
            },
            wind: {
                border: 'rgba(75, 192, 192, 1)',
                background: 'rgba(75, 192, 192, 0.2)',
                pointBackground: 'rgba(75, 192, 192, 1)'
            },
            pressure: {
                border: 'rgba(153, 102, 255, 1)',
                background: 'rgba(153, 102, 255, 0.2)',
                pointBackground: 'rgba(153, 102, 255, 1)'
            }
        };
    }
    
    /**
     * Crée un graphique de température sur 7 jours
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {Object} options - Options supplémentaires
     */
    createTemperatureChart(canvasId, forecastData, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        // Destruction du graphique existant
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }
        
        // Prépare les données
        const { labels, temperatures, feelsLike } = this.prepareTemperatureData(forecastData);
        
        // Configuration du graphique
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Température (°C)',
                        data: temperatures,
                        borderColor: this.defaultColors.temperature.border,
                        backgroundColor: this.defaultColors.temperature.background,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: this.defaultColors.temperature.pointBackground,
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: 'Ressenti (°C)',
                        data: feelsLike,
                        borderColor: 'rgba(255, 159, 64, 1)',
                        backgroundColor: 'rgba(255, 159, 64, 0.2)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += Math.round(context.parsed.y) + '°C';
                                return label;
                            }
                        }
                    },
                    title: {
                        display: options.title !== false,
                        text: options.title || 'Prévisions de température',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Température (°C)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: (value) => value + '°C'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                ...options.chartOptions
            }
        };
        
        this.chartInstances[canvasId] = new Chart(canvas, config);
        return this.chartInstances[canvasId];
    }
    
    /**
     * Crée un graphique d'humidité
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {Object} options - Options supplémentaires
     */
    createHumidityChart(canvasId, forecastData, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }
        
        const { labels, humidity } = this.prepareHumidityData(forecastData);
        
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Humidité (%)',
                        data: humidity,
                        backgroundColor: this.defaultColors.humidity.background,
                        borderColor: this.defaultColors.humidity.border,
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.7,
                        categoryPercentage: 0.8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Humidité: ${context.parsed.y}%`;
                            }
                        }
                    },
                    title: {
                        display: options.title !== false,
                        text: options.title || 'Prévisions d\'humidité',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Humidité (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                ...options.chartOptions
            }
        };
        
        this.chartInstances[canvasId] = new Chart(canvas, config);
        return this.chartInstances[canvasId];
    }
    
    /**
     * Crée un graphique de vitesse du vent
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {Object} options - Options supplémentaires
     */
    createWindChart(canvasId, forecastData, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }
        
        const { labels, windSpeed } = this.prepareWindData(forecastData);
        
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Vitesse du vent (km/h)',
                        data: windSpeed,
                        borderColor: this.defaultColors.wind.border,
                        backgroundColor: this.defaultColors.wind.background,
                        borderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: this.defaultColors.wind.pointBackground,
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Vent: ${Math.round(context.parsed.y)} km/h`;
                            }
                        }
                    },
                    title: {
                        display: options.title !== false,
                        text: options.title || 'Prévisions de vent',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Vitesse (km/h)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: (value) => value + ' km/h'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                ...options.chartOptions
            }
        };
        
        this.chartInstances[canvasId] = new Chart(canvas, config);
        return this.chartInstances[canvasId];
    }
    
    /**
     * Crée un graphique combiné (température + humidité)
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {Object} options - Options supplémentaires
     */
    createCombinedChart(canvasId, forecastData, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
        }
        
        const { labels, temperatures, humidity } = this.prepareCombinedData(forecastData);
        
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Température (°C)',
                        data: temperatures,
                        borderColor: this.defaultColors.temperature.border,
                        backgroundColor: this.defaultColors.temperature.background,
                        borderWidth: 2,
                        pointRadius: 3,
                        yAxisID: 'y-temperature',
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: 'Humidité (%)',
                        data: humidity,
                        borderColor: this.defaultColors.humidity.border,
                        backgroundColor: this.defaultColors.humidity.background,
                        borderWidth: 2,
                        pointRadius: 3,
                        yAxisID: 'y-humidity',
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 12
                            },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    title: {
                        display: options.title !== false,
                        text: options.title || 'Température et Humidité',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                scales: {
                    'y-temperature': {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Température (°C)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: (value) => value + '°C'
                        }
                    },
                    'y-humidity': {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Humidité (%)',
                            font: {
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: (value) => value + '%'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                },
                ...options.chartOptions
            }
        };
        
        this.chartInstances[canvasId] = new Chart(canvas, config);
        return this.chartInstances[canvasId];
    }
    
    /**
     * Prépare les données de température
     * @param {Array} forecastData - Données de prévisions
     * @returns {Object} - Données formatées
     */
    prepareTemperatureData(forecastData) {
        const dailyData = this.groupByDay(forecastData);
        const labels = [];
        const temperatures = [];
        const feelsLike = [];
        
        dailyData.forEach(day => {
            labels.push(Formatters.formatDate(day.date, 'day'));
            temperatures.push(Math.round(day.tempMoy));
            feelsLike.push(Math.round(day.feelsLikeMoy || day.tempMoy));
        });
        
        return { labels, temperatures, feelsLike };
    }
    
    /**
     * Prépare les données d'humidité
     * @param {Array} forecastData - Données de prévisions
     * @returns {Object} - Données formatées
     */
    prepareHumidityData(forecastData) {
        const dailyData = this.groupByDay(forecastData);
        const labels = [];
        const humidity = [];
        
        dailyData.forEach(day => {
            labels.push(Formatters.formatDate(day.date, 'day'));
            humidity.push(Math.round(day.humidityMoy));
        });
        
        return { labels, humidity };
    }
    
    /**
     * Prépare les données de vent
     * @param {Array} forecastData - Données de prévisions
     * @returns {Object} - Données formatées
     */
    prepareWindData(forecastData) {
        const dailyData = this.groupByDay(forecastData);
        const labels = [];
        const windSpeed = [];
        
        dailyData.forEach(day => {
            labels.push(Formatters.formatDate(day.date, 'day'));
            windSpeed.push(Math.round(day.windSpeedMoy * 3.6)); // Convert m/s to km/h
        });
        
        return { labels, windSpeed };
    }
    
    /**
     * Prépare les données combinées
     * @param {Array} forecastData - Données de prévisions
     * @returns {Object} - Données formatées
     */
    prepareCombinedData(forecastData) {
        const dailyData = this.groupByDay(forecastData);
        const labels = [];
        const temperatures = [];
        const humidity = [];
        
        dailyData.forEach(day => {
            labels.push(Formatters.formatDate(day.date, 'day'));
            temperatures.push(Math.round(day.tempMoy));
            humidity.push(Math.round(day.humidityMoy));
        });
        
        return { labels, temperatures, humidity };
    }
    
    /**
     * Groupe les prévisions par jour
     * @param {Array} forecastList - Liste des prévisions
     * @returns {Array} - Données groupées par jour
     */
    groupByDay(forecastList) {
        const dailyMap = new Map();
        
        if (!forecastList || !Array.isArray(forecastList)) {
            return [];
        }
        
        forecastList.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            
            if (!dailyMap.has(date)) {
                dailyMap.set(date, {
                    date: date,
                    temps: [],
                    feelsLike: [],
                    humidity: [],
                    windSpeed: []
                });
            }
            
            const daily = dailyMap.get(date);
            daily.temps.push(item.main.temp);
            daily.feelsLike.push(item.main.feels_like);
            daily.humidity.push(item.main.humidity);
            daily.windSpeed.push(item.wind.speed);
        });
        
        // Calcule les moyennes
        const dailyData = Array.from(dailyMap.values()).map(day => ({
            date: day.date,
            tempMoy: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
            feelsLikeMoy: day.feelsLike.reduce((a, b) => a + b, 0) / day.feelsLike.length,
            humidityMoy: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
            windSpeedMoy: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length
        }));
        
        return dailyData;
    }
    
    /**
     * Met à jour un graphique existant
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Nouvelles données
     * @param {string} chartType - Type de graphique
     */
    updateChart(canvasId, forecastData, chartType = 'temperature') {
        if (!this.chartInstances[canvasId]) {
            return this.createChartByType(canvasId, forecastData, chartType);
        }
        
        let newData;
        switch (chartType) {
            case 'temperature':
                newData = this.prepareTemperatureData(forecastData);
                this.chartInstances[canvasId].data.datasets[0].data = newData.temperatures;
                if (this.chartInstances[canvasId].data.datasets[1]) {
                    this.chartInstances[canvasId].data.datasets[1].data = newData.feelsLike;
                }
                this.chartInstances[canvasId].data.labels = newData.labels;
                break;
            case 'humidity':
                newData = this.prepareHumidityData(forecastData);
                this.chartInstances[canvasId].data.datasets[0].data = newData.humidity;
                this.chartInstances[canvasId].data.labels = newData.labels;
                break;
            case 'wind':
                newData = this.prepareWindData(forecastData);
                this.chartInstances[canvasId].data.datasets[0].data = newData.windSpeed;
                this.chartInstances[canvasId].data.labels = newData.labels;
                break;
            case 'combined':
                newData = this.prepareCombinedData(forecastData);
                this.chartInstances[canvasId].data.datasets[0].data = newData.temperatures;
                this.chartInstances[canvasId].data.datasets[1].data = newData.humidity;
                this.chartInstances[canvasId].data.labels = newData.labels;
                break;
        }
        
        this.chartInstances[canvasId].update();
    }
    
    /**
     * Crée un graphique selon le type
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données
     * @param {string} chartType - Type de graphique
     * @returns {Object} - Instance du graphique
     */
    createChartByType(canvasId, forecastData, chartType) {
        switch (chartType) {
            case 'temperature':
                return this.createTemperatureChart(canvasId, forecastData);
            case 'humidity':
                return this.createHumidityChart(canvasId, forecastData);
            case 'wind':
                return this.createWindChart(canvasId, forecastData);
            case 'combined':
                return this.createCombinedChart(canvasId, forecastData);
            default:
                return this.createTemperatureChart(canvasId, forecastData);
        }
    }
    
    /**
     * Détruit un graphique
     * @param {string} canvasId - ID du canvas
     */
    destroyChart(canvasId) {
        if (this.chartInstances[canvasId]) {
            this.chartInstances[canvasId].destroy();
            delete this.chartInstances[canvasId];
        }
    }
    
    /**
     * Détruit tous les graphiques
     */
    destroyAllCharts() {
        Object.keys(this.chartInstances).forEach(canvasId => {
            this.destroyChart(canvasId);
        });
    }
    
    /**
     * Exporte le graphique en image
     * @param {string} canvasId - ID du canvas
     * @param {string} format - Format (png, jpeg)
     * @returns {string} - Data URL de l'image
     */
    exportChartAsImage(canvasId, format = 'png') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        return canvas.toDataURL(mimeType);
    }
    
    // ==================== MÉTHODES DE FALLBACK CANVAS NATIF ====================
    
    /**
     * Crée un graphique simple avec Canvas natif (fallback)
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {string} type - Type de graphique (temperature, humidity, wind)
     */
    createNativeChart(canvasId, forecastData, type = 'temperature') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Efface le canvas
        ctx.clearRect(0, 0, width, height);
        
        const dailyData = this.groupByDay(forecastData);
        const labels = dailyData.map(day => Formatters.formatDate(day.date, 'day'));
        
        let data;
        let yLabel;
        let color;
        
        switch (type) {
            case 'temperature':
                data = dailyData.map(day => Math.round(day.tempMoy));
                yLabel = 'Température (°C)';
                color = this.defaultColors.temperature.border;
                break;
            case 'humidity':
                data = dailyData.map(day => Math.round(day.humidityMoy));
                yLabel = 'Humidité (%)';
                color = this.defaultColors.humidity.border;
                break;
            case 'wind':
                data = dailyData.map(day => Math.round(day.windSpeedMoy * 3.6));
                yLabel = 'Vent (km/h)';
                color = this.defaultColors.wind.border;
                break;
            default:
                data = dailyData.map(day => Math.round(day.tempMoy));
                yLabel = 'Température (°C)';
                color = this.defaultColors.temperature.border;
        }
        
        this.drawNativeChart(ctx, width, height, labels, data, yLabel, color);
        return { type, data, labels };
    }
    
    /**
     * Dessine un graphique avec Canvas natif
     * @param {CanvasRenderingContext2D} ctx - Contexte canvas
     * @param {number} width - Largeur
     * @param {number} height - Hauteur
     * @param {Array} labels - Labels
     * @param {Array} data - Données
     * @param {string} yLabel - Label Y
     * @param {string} color - Couleur de la ligne
     */
    drawNativeChart(ctx, width, height, labels, data, yLabel, color = '#2196F3') {
        const padding = { top: 40, right: 30, bottom: 60, left: 50 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;
        
        if (graphWidth <= 0 || graphHeight <= 0) return;
        
        const maxValue = Math.max(...data, 1);
        const minValue = Math.min(...data, 0);
        const valueRange = maxValue - minValue;
        
        // Dessine l'arrière-plan
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(padding.left, padding.top, graphWidth, graphHeight);
        
        // Dessine la grille
        ctx.beginPath();
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 0.5;
        
        // Lignes horizontales
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (graphHeight / 5) * i;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + graphWidth, y);
            ctx.stroke();
            
            // Labels Y
            const value = maxValue - (valueRange / 5) * i;
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(Math.round(value), padding.left - 30, y + 3);
        }
        
        // Lignes verticales
        const step = graphWidth / (labels.length - 1);
        for (let i = 0; i < labels.length; i++) {
            const x = padding.left + step * i;
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + graphHeight);
            ctx.stroke();
            
            // Labels X
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.save();
            ctx.translate(x, padding.top + graphHeight + 15);
            ctx.rotate(-0.4);
            ctx.fillText(labels[i], 0, 0);
            ctx.restore();
        }
        
        // Dessine la ligne de données
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < data.length; i++) {
            const x = padding.left + step * i;
            const y = padding.top + graphHeight - ((data[i] - minValue) / valueRange) * graphHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Dessine les points
        for (let i = 0; i < data.length; i++) {
            const x = padding.left + step * i;
            const y = padding.top + graphHeight - ((data[i] - minValue) / valueRange) * graphHeight;
            
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Contour blanc
            ctx.beginPath();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Titre Y
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
        
        // Titre X
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Date', width / 2, height - 10);
    }
    
    /**
     * Vérifie si Chart.js est disponible
     * @returns {boolean} - Chart.js disponible
     */
    isChartJSAvailable() {
        return typeof Chart !== 'undefined';
    }
    
    /**
     * Crée un graphique adaptatif (Chart.js ou fallback Canvas natif)
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {string} chartType - Type de graphique (temperature, humidity, wind, combined)
     * @returns {Object|null} - Instance du graphique ou null
     */
    createAdaptiveChart(canvasId, forecastData, chartType = 'temperature') {
        if (this.isChartJSAvailable()) {
            return this.createChartByType(canvasId, forecastData, chartType);
        } else {
            console.warn('Chart.js non disponible, utilisation du fallback Canvas natif');
            return this.createNativeChart(canvasId, forecastData, chartType);
        }
    }
    
    /**
     * Crée plusieurs graphiques adaptatifs
     * @param {Array} chartConfigs - Configuration des graphiques
     * @returns {Object} - Résultats des créations
     */
    createAdaptiveCharts(chartConfigs) {
        const results = {};
        
        chartConfigs.forEach(config => {
            const { canvasId, forecastData, chartType, options = {} } = config;
            results[canvasId] = this.createAdaptiveChart(canvasId, forecastData, chartType);
        });
        
        return results;
    }
    
    /**
     * Redimensionne un graphique Canvas natif
     * @param {string} canvasId - ID du canvas
     * @param {Array} forecastData - Données de prévisions
     * @param {string} chartType - Type de graphique
     */
    resizeNativeChart(canvasId, forecastData, chartType = 'temperature') {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Met à jour les dimensions
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Redessine le graphique
        this.createNativeChart(canvasId, forecastData, chartType);
    }
}

// Export par défaut
export default ChartManager;