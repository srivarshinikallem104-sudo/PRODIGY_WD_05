// Interpret code blocks to descriptive metadata objects
function interpretWeatherCode(code) {
    const mapping = {
        0: { desc: 'Clear Sky', summary: 'Beautiful, crisp clear weather parameters.', icon: 'fa-sun', color: '#f1c40f' },
        1: { desc: 'Mainly Clear', summary: 'High atmospheric view with tiny cloud patches.', icon: 'fa-cloud-sun', color: '#f39c12' },
        2: { desc: 'Partly Cloudy', summary: 'An outstanding mixture of partial sun rays and cloud breaks.', icon: 'fa-cloud-sun', color: '#cbd5e1' },
        3: { desc: 'Cloudy', summary: 'Dense overcast cloud covers hovering inside area.', icon: 'fa-cloud', color: '#cbd5e1' },
        45: { desc: 'Foggy', summary: 'Horizontal space visual tracking minimized by ground mist.', icon: 'fa-smog', color: '#a0aec0' },
        51: { desc: 'Light Drizzle', summary: 'Passing tiny condensed droplets dropping down.', icon: 'fa-cloud-rain', color: '#3498db' },
        61: { desc: 'Slight Rain', summary: 'Light, steady rainfall elements across sectors.', icon: 'fa-cloud-rain', color: '#3498db' },
        63: { desc: 'Moderate Rain', summary: 'Mainstream running showers expected over timelines.', icon: 'fa-cloud-showers-heavy', color: '#2980b9' },
        65: { desc: 'Heavy Rain', summary: 'Strong continuous rain sweeping geographic zones.', icon: 'fa-cloud-showers-heavy', color: '#2980b9' },
        95: { desc: 'Thunderstorm', summary: 'Unstable sky layers triggering flash lightning grids.', icon: 'fa-cloud-bolt', color: '#e74c3c' }
    };
    return mapping[code] || { desc: 'Cloudy', summary: 'Overcast atmospheric profile.', icon: 'fa-cloud', color: '#cbd5e1' };
}

// Fetch live weather from open global API endpoints
async function fetchWeatherData(lat, lon, cityName) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=6`;
        const response = await fetch(url);
        const data = await response.json();
        renderUI(data, cityName);
    } catch (error) {
        console.error("API link exception error:", error);
    }
}

// Geocode query handler string parsing
async function getCoordinates(city) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            alert("Specified target location profile unverified.");
            return;
        }
        const match = geoData.results[0];
        fetchWeatherData(match.latitude, match.longitude, `${match.name}, ${match.country}`);
    } catch (e) {
        console.error("Geocoding conversion malfunction.");
    }
}

// Map parsed live parameters vectors straight into target layout tags
function renderUI(data, cityName) {
    const current = data.current;
    const statusInfo = interpretWeatherCode(current.weather_code);

    // Header values updates mappings
    document.getElementById('locationName').innerHTML = `<i class="fa-solid fa-location-dot"></i>${cityName}`;
    document.getElementById('currentTime').innerText = new Date().toLocaleString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('mainTemp').innerText = `${Math.round(current.temperature_2m)}°C`;
    document.getElementById('feelsLike').innerText = `Feels like ${Math.round(current.apparent_temperature)}°C`;
    document.getElementById('weatherStatus').innerText = statusInfo.desc;
    document.getElementById('weatherSummary').innerText = statusInfo.summary;
    
    const iconElement = document.getElementById('mainIcon');
    iconElement.className = `fa-solid ${statusInfo.icon}`;
    iconElement.style.color = statusInfo.color;

    document.getElementById('humidityVal').innerText = `${current.relative_humidity_2m}%`;
    document.getElementById('humidityVal2').innerText = `${current.relative_humidity_2m}%`;
    document.getElementById('windVal').innerText = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('visibilityVal').innerText = `${(current.visibility / 1000).toFixed(0)} km`;
    document.getElementById('pressureVal').innerText = `${Math.round(current.surface_pressure)} hPa`;
    
    // UV index thresholds categorizations updates
    const uvRaw = Math.round(data.daily.uv_index_max[0]);
    let uvLabel = "Low";
    if(uvRaw >= 3 && uvRaw <= 5) uvLabel = "Mod";
    if(uvRaw >= 6) uvLabel = "High";
    document.getElementById('uvVal').innerText = `${uvRaw} (${uvLabel})`;

    document.getElementById('sunriseVal').innerText = data.daily.sunrise[0].split('T')[1];
    document.getElementById('sunsetVal').innerText = data.daily.sunset[0].split('T')[1];

    // Populate 12 Hourly carousel items components
    const hourlyWrapper = document.getElementById('hourlyWrapper');
    hourlyWrapper.innerHTML = '';
    const currentHourIndex = new Date().getHours();

    for(let i = currentHourIndex; i < currentHourIndex + 12; i++) {
        const rawTimeStr = data.hourly.time[i].split('T')[1];
        const rawHourNum = parseInt(rawTimeStr.split(':')[0]);
        const ampmLabel = rawHourNum >= 12 ? 'PM' : 'AM';
        const displayHour = rawHourNum % 12 || 12;
        
        const rawTemp = Math.round(data.hourly.temperature_2m[i]);
        const codeMeta = interpretWeatherCode(data.hourly.weather_code[i]);
        const titleLabel = (i === currentHourIndex) ? 'Now' : `${displayHour} ${ampmLabel}`;

        hourlyWrapper.innerHTML += `
            <div class="hourly-item">
                <span class="time">${titleLabel}</span>
                <i class="fa-solid ${codeMeta.icon}" style="color:${codeMeta.color}"></i>
                <span class="hourly-temp">${rawTemp}°C</span>
            </div>
        `;
    }

    // Populate 5 Days future layout indicators columns
    const dailyWrapper = document.getElementById('dailyWrapper');
    dailyWrapper.innerHTML = '';
    for(let d = 1; d <= 5; d++) {
        const dateObj = new Date(data.daily.time[d]);
        const weekdayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        const maxT = Math.round(data.daily.temperature_2m_max[d]);
        const minT = Math.round(data.daily.temperature_2m_min[d]);
        const codeMeta = interpretWeatherCode(data.daily.weather_code[d]);

        dailyWrapper.innerHTML += `
            <div class="daily-item">
                <span class="day">${weekdayStr}</span>
                <i class="fa-solid ${codeMeta.icon}" style="color:${codeMeta.color}"></i>
                <span class="daily-temp">${maxT}°/${minT}°</span>
            </div>
        `;
    }
}

// Interactive listeners registrations
document.getElementById('cityInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim() !== "") {
        getCoordinates(this.value.trim());
    }
});

document.getElementById('locationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude, "Your Location"),
            () => alert("Location tracker lookup blocked.")
        );
    }
});

// App Initiation natively triggers Hyderabad coordinate strings directly on startup mapping
window.onload = () => {
    fetchWeatherData(17.3850, 78.4867, "Hyderabad, India");
};