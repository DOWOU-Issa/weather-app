import Validators from '../utils/validators.js';
import Formatters from '../utils/formatters.js';

/**
 * Exportateur JSON
 * Exporte les données météo au format JSON
 */
export class JSONExporter {
    
    /**
     * Exporte les données météo
     * @param {Object} weatherData - Données météo actuelles
     * @param {Object} forecastData - Données de prévisions
     * @param {Object} options - Options d'export
     * @returns {Object} - Données formatées pour l'export
     */
    export(weatherData, forecastData, options = {}) {
        if (!Validators.isValidWeatherData(weatherData)) {
            throw new Error('Données météo invalides pour l\'export');
        }
        
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                source: 'WeatherApp',
                units: 'metric'
            },
            current: this.formatCurrentWeather(weatherData),
            location: this.formatLocation(weatherData),
            ...(forecastData && { forecast: this.formatForecast(forecastData) })
        };
        
        return exportData;
    }
    
    /**
     * Formate les données météo actuelles
     * @param {Object} weatherData - Données météo
     * @returns {Object} - Données formatées
     */
    formatCurrentWeather(weatherData) {
        return {
            temperature: {
                current: weatherData.main.temp,
                feelsLike: weatherData.main.feels_like,
                min: weatherData.main.temp_min,
                max: weatherData.main.temp_max,
                formatted: {
                    current: Formatters.formatTemperature(weatherData.main.temp),
                    feelsLike: Formatters.formatTemperature(weatherData.main.feels_like)
                }
            },
            humidity: {
                value: weatherData.main.humidity,
                formatted: Formatters.formatHumidity(weatherData.main.humidity)
            },
            pressure: {
                value: weatherData.main.pressure,
                formatted: Formatters.formatPressure(weatherData.main.pressure)
            },
            wind: {
                speed: weatherData.wind.speed,
                direction: weatherData.wind.deg,
                formatted: {
                    speed: Formatters.formatWindSpeed(weatherData.wind.speed),
                    direction: Formatters.formatWindDirection(weatherData.wind.deg)
                }
            },
            weather: {
                main: weatherData.weather[0].main,
                description: weatherData.weather[0].description,
                icon: weatherData.weather[0].icon,
                formatted: Formatters.capitalize(weatherData.weather[0].description)
            },
            visibility: weatherData.visibility,
            clouds: weatherData.clouds?.all,
            timestamp: new Date(weatherData.dt * 1000).toISOString()
        };
    }
    
    /**
     * Formate la localisation
     * @param {Object} weatherData - Données météo
     * @returns {Object} - Localisation formatée
     */
    formatLocation(weatherData) {
        return {
            name: weatherData.name,
            country: weatherData.sys.country,
            coordinates: {
                lat: weatherData.coord.lat,
                lon: weatherData.coord.lon
            },
            formatted: `${weatherData.name}, ${weatherData.sys.country}`
        };
    }
    
    /**
     * Formate les prévisions
     * @param {Object} forecastData - Données de prévisions
     * @returns {Object} - Prévisions formatées
     */
    formatForecast(forecastData) {
        if (!forecastData || !forecastData.list) {
            return null;
        }
        
        const dailyForecast = this.groupForecastByDay(forecastData.list);
        
        return {
            daily: dailyForecast.map(day => ({
                date: day.date,
                temperature: {
                    min: Math.round(day.tempMin),
                    max: Math.round(day.tempMax),
                    avg: Math.round(day.tempAvg)
                },
                humidity: Math.round(day.humidityAvg),
                wind: {
                    speed: Math.round(day.windAvg * 3.6), // m/s to km/h
                    formatted: Formatters.formatWindSpeed(day.windAvg)
                },
                weather: {
                    main: day.weatherMain,
                    description: day.weatherDescription
                }
            })),
            hourly: forecastData.list.slice(0, 24).map(item => ({
                time: new Date(item.dt * 1000).toISOString(),
                temperature: item.main.temp,
                humidity: item.main.humidity,
                windSpeed: item.wind.speed,
                weather: item.weather[0].description
            }))
        };
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
     * Télécharge le fichier JSON
     * @param {Object} data - Données à télécharger
     * @param {string} filename - Nom du fichier
     */
    download(data, filename = 'weather-data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
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
export default JSONExporter;