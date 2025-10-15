const API_KEY = 'fff6b64c1f333fa8f50e763da377e2c1'; 
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';


const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const unitToggle = document.getElementById('unitToggle');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const weatherCard = document.getElementById('weatherCard');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const bgAnimation = document.getElementById('bgAnimation');


const cityName = document.getElementById('cityName');
const dateTime = document.getElementById('dateTime');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const weatherIcon = document.getElementById('weatherIcon');
const tempMax = document.getElementById('tempMax');
const tempMin = document.getElementById('tempMin');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastGrid = document.getElementById('forecastGrid');
const recentList = document.getElementById('recentList');


let currentUnit = 'metric'; 
let currentCity = 'Mumbai';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];


document.addEventListener('DOMContentLoaded', () => {
    loadRecentSearches();
    getWeatherByCity(currentCity);
    updateDateTime();
    setInterval(updateDateTime, 60000); 
});


searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
currentLocationBtn.addEventListener('click', getCurrentLocation);
unitToggle.addEventListener('click', toggleUnit);


function handleSearch() {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherByCity(city);
        searchInput.value = '';
    }
}


async function getWeatherByCity(city) {
    showLoading();
    hideError();
    
    try {
        
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            
            useDemoData(city);
            return;
        }
        
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        displayWeather(data);
        getForecast(data.coord.lat, data.coord.lon);
        addToRecentSearches(city);
        showToast('Weather updated successfully!');
        
    } catch (error) {
        console.error('Error:', error);
        showError('City not found. Please try again.');
    } finally {
        hideLoading();
    }
}


function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await getWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                showError('Unable to get your location. Please search manually.');
                hideLoading();
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}


async function getWeatherByCoords(lat, lon) {
    try {
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            useDemoData('Your Location');
            return;
        }
        
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Unable to fetch weather');
        }
        
        const data = await response.json();
        displayWeather(data);
        getForecast(lat, lon);
        showToast('Location detected successfully!');
        
    } catch (error) {
        console.error('Error:', error);
        showError('Unable to fetch weather data.');
    } finally {
        hideLoading();
    }
}


async function getForecast(lat, lon) {
    try {
        if (API_KEY === 'YOUR_API_KEY_HERE') {
            displayDemoForecast();
            return;
        }
        
        const response = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
        );
        
        if (!response.ok) return;
        
        const data = await response.json();
        displayForecast(data);
        
    } catch (error) {
        console.error('Forecast error:', error);
    }
}


function displayWeather(data) {
    currentCity = data.name;
    
    
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    
    
    const temp = Math.round(data.main.temp);
    temperature.textContent = temp;
    feelsLike.textContent = `Feels like ${Math.round(data.main.feels_like)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    tempMax.textContent = `${Math.round(data.main.temp_max)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    tempMin.textContent = `${Math.round(data.main.temp_min)}°${currentUnit === 'metric' ? 'C' : 'F'}`;
    
    
    weatherDescription.textContent = data.weather[0].description;
    
    
    updateWeatherIcon(data.weather[0].main);
    updateBackground(data.weather[0].main);
    
    
    windSpeed.textContent = `${Math.round(data.wind.speed)} ${currentUnit === 'metric' ? 'km/h' : 'mph'}`;
    humidity.textContent = `${data.main.humidity}%`;
    visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    
    sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);
    sunset.textContent = formatTime(data.sys.sunset, data.timezone);
    
    weatherCard.classList.remove('hidden');
}


function displayForecast(data) {
    forecastGrid.innerHTML = '';
    
    
    const dailyForecasts = data.list.filter(item => 
        item.dt_txt.includes('12:00:00')
    ).slice(0, 5);
    
    dailyForecasts.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${dayName}</div>
            <i class="${getWeatherIconClass(day.weather[0].main)} forecast-icon"></i>
            <div class="forecast-temp">${Math.round(day.main.temp)}°${currentUnit === 'metric' ? 'C' : 'F'}</div>
            <div class="forecast-desc">${day.weather[0].description}</div>
        `;
        
        forecastGrid.appendChild(card);
    });
}


function updateWeatherIcon(condition) {
    const iconClass = getWeatherIconClass(condition);
    weatherIcon.className = `${iconClass} weather-icon`;
}


function getWeatherIconClass(condition) {
    const iconMap = {
        'Clear': 'fas fa-sun',
        'Clouds': 'fas fa-cloud',
        'Rain': 'fas fa-cloud-rain',
        'Drizzle': 'fas fa-cloud-rain',
        'Thunderstorm': 'fas fa-bolt',
        'Snow': 'fas fa-snowflake',
        'Mist': 'fas fa-smog',
        'Smoke': 'fas fa-smog',
        'Haze': 'fas fa-smog',
        'Fog': 'fas fa-smog'
    };
    
    return iconMap[condition] || 'fas fa-cloud-sun';
}


function updateBackground(condition) {
    const colors = {
        'Clear': 'radial-gradient(circle at 20% 50%, rgba(255, 193, 7, 0.2) 0%, transparent 50%)',
        'Clouds': 'radial-gradient(circle at 20% 50%, rgba(158, 158, 158, 0.2) 0%, transparent 50%)',
        'Rain': 'radial-gradient(circle at 20% 50%, rgba(33, 150, 243, 0.2) 0%, transparent 50%)',
        'Thunderstorm': 'radial-gradient(circle at 20% 50%, rgba(63, 81, 181, 0.2) 0%, transparent 50%)',
        'Snow': 'radial-gradient(circle at 20% 50%, rgba(224, 247, 250, 0.2) 0%, transparent 50%)',
        'Mist': 'radial-gradient(circle at 20% 50%, rgba(189, 189, 189, 0.2) 0%, transparent 50%)'
    };
    
    const gradient = colors[condition] || colors['Clear'];
    bgAnimation.style.background = gradient;
}


function toggleUnit() {
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    unitToggle.textContent = currentUnit === 'metric' ? '°C' : '°F';
    getWeatherByCity(currentCity);
}


function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}


function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    dateTime.textContent = now.toLocaleDateString('en-US', options);
}


function addToRecentSearches(city) {
    
    recentSearches = recentSearches.filter(item => 
        item.toLowerCase() !== city.toLowerCase()
    );
    
    
    recentSearches.unshift(city);
    
    
    recentSearches = recentSearches.slice(0, 5);
    
    
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    
    loadRecentSearches();
}

function loadRecentSearches() {
    recentList.innerHTML = '';
    
    recentSearches.forEach(city => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span>${city}</span>
        `;
        item.addEventListener('click', () => getWeatherByCity(city));
        recentList.appendChild(item);
    });
}

// UI Helper Functions
function showLoading() {
    loading.classList.add('active');
    weatherCard.classList.add('hidden');
}

function hideLoading() {
    loading.classList.remove('active');
}

function showError(message) {
    errorMessage.classList.add('active');
    document.getElementById('errorText').textContent = message;
}

function hideError() {
    errorMessage.classList.remove('active');
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


function useDemoData(city) {
    const demoData = {
        name: city,
        sys: { country: 'IN', sunrise: 1697258400, sunset: 1697299800 },
        main: {
            temp: 28,
            feels_like: 26,
            temp_max: 30,
            temp_min: 24,
            humidity: 65,
            pressure: 1013
        },
        weather: [{ main: 'Clouds', description: 'partly cloudy' }],
        wind: { speed: 12 },
        visibility: 10000,
        timezone: 19800
    };
    
    displayWeather(demoData);
    displayDemoForecast();
    addToRecentSearches(city);
    showToast('Using demo data. Add API key for live weather!');
    hideLoading();
}

function displayDemoForecast() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const conditions = ['Clear', 'Clouds', 'Rain', 'Clear', 'Clouds'];
    const temps = [29, 27, 25, 30, 28];
    
    forecastGrid.innerHTML = '';
    
    days.forEach((day, index) => {
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-day">${day}</div>
            <i class="${getWeatherIconClass(conditions[index])} forecast-icon"></i>
            <div class="forecast-temp">${temps[index]}°C</div>
            <div class="forecast-desc">${conditions[index]}</div>
        `;
        forecastGrid.appendChild(card);
    });
}


const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
    'London', 'New York', 'Tokyo', 'Paris', 'Dubai'
];

searchInput.addEventListener('input', (e) => {
    const value = e.target.value.toLowerCase();
    const suggestions = document.getElementById('suggestions');
    
    if (value.length < 2) {
        suggestions.classList.remove('active');
        return;
    }
    
    const filtered = popularCities.filter(city => 
        city.toLowerCase().includes(value)
    );
    
    if (filtered.length > 0) {
        suggestions.innerHTML = filtered.map(city => `
            <div class="suggestion-item" onclick="selectCity('${city}')">
                ${city}
            </div>
        `).join('');
        suggestions.classList.add('active');
    } else {
        suggestions.classList.remove('active');
    }
});

function selectCity(city) {
    searchInput.value = city;
    document.getElementById('suggestions').classList.remove('active');
    getWeatherByCity(city);
}