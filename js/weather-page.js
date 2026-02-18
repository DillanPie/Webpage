document.addEventListener("DOMContentLoaded", () => {
  // --- DEVELOPMENT SWITCH ---
  // Set to 'true' to use mock data without an API key.
  // Set to 'false' and add your key below to use live data.
  const useMockData = false;

  let hourlyChart;
  let map;

  const weather = {
    // This key is ONLY for the geocoding (city search) and map overlay.
    apiKey: "44a54a5ef877513e49804e198c18cb32",

    // --- Main Workflow ---
    getWeatherForCity: function(city) {
      document.body.classList.add("weather-loading");
      // Decide whether to use live data or simulate with mock data
      if (useMockData) {
        console.log("Mock Mode: Simulating geocoding for New York.");
        this.getForecast(40.71, -74.0, "New York (Mock Data)");
      } else {
        this.getCoords(city);
      }
    },

    // Step 1: Use OpenWeather to get coordinates from a city name.
    getCoords: function(city) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}`)
        .then(res => { if (!res.ok) throw new Error("City not found."); return res.json(); })
        .then(data => this.getForecast(data.coord.lat, data.coord.lon, data.name))
        .catch(err => { alert(err.message); document.body.classList.remove("weather-loading"); });
    },

    // Step 2: Use coordinates to get FREE forecast data from Open-Meteo.
    getForecast: function(lat, lon, cityName) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,windspeed_10m&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;

      fetch(url)
        .then(res => { if (!res.ok) throw new Error("Could not retrieve forecast from Open-Meteo."); return res.json(); })
        .then(data => {
            data.lat = lat;
            data.lon = lon;
            this.displayAllWeather(data, cityName);
        })
        .catch(err => { alert(err.message); document.body.classList.remove("weather-loading"); });
    },

    // --- UI Display Functions ---
    displayAllWeather: function(data, cityName) {
        this.displayCurrent(data, cityName);
        this.displayHourlyChart(data.hourly);
        this.displayHourly(data.hourly);
        this.displayDaily(data.daily);
        this.displayWeatherMap(data.lat, data.lon);

        const cityForImage = cityName.split('(')[0].trim();
        document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${cityForImage},city)`;
        
        document.body.classList.remove("weather-loading");
        document.querySelector(".weather-search").value = cityName;
        
        setTimeout(() => map && map.invalidateSize(), 100);
    },

    displayCurrent: function(data, cityName) {
        const { temperature_2m: temp, apparent_temperature: feels_like, relativehumidity_2m: humidity, windspeed_10m: wind_speed } = data.current;
        const { description, icon } = this.getWeatherInfoFromCode(data.current.weathercode);
        const { temperature_2m_max: max, temperature_2m_min: min } = data.daily;

        document.querySelector(".city-name").innerText = cityName;
        document.querySelector(".current-temp").innerText = `${Math.round(temp)}°F`;
        document.querySelector(".current-icon").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        document.querySelector(".current-description").innerText = description;
        
        document.getElementById("feels-like").innerText = `${Math.round(feels_like)}°F`;
        document.getElementById("high-temp").innerText = `${Math.round(max[0])}°F`;
        document.getElementById("low-temp").innerText = `${Math.round(min[0])}°F`;
        document.getElementById("wind-speed").innerText = `${wind_speed.toFixed(1)} mph`;
        document.getElementById("humidity").innerText = `${humidity}%`;
        
        const uvIndexEl = document.getElementById("uv-index").parentElement;
        const visibilityEl = document.getElementById("visibility").parentElement;
        if (uvIndexEl) uvIndexEl.style.display = 'none';
        if (visibilityEl) visibilityEl.style.display = 'none';
    },
    
    displayHourlyChart: function(hourlyData) {
        const ctx = document.getElementById('hourly-chart').getContext('2d');
        if (hourlyChart) { hourlyChart.destroy(); }

        const labels = hourlyData.time.slice(0, 24).map(time => new Date(time).toLocaleTimeString([], { hour: 'numeric' }));
        const tempData = hourlyData.temperature_2m.slice(0, 24).map(t => Math.round(t));
        const precipData = hourlyData.precipitation_probability.slice(0, 24);

        hourlyChart = new Chart(ctx, {
            type: 'bar', data: { labels, datasets: [ { type: 'line', label: 'Temp (°F)', data: tempData, borderColor: '#fabd2f', tension: 0.4, yAxisID: 'yTemp' }, { type: 'bar', label: 'Precipitation (%)', data: precipData, backgroundColor: '#83a598', yAxisID: 'yPrecip' } ] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#ebdbb2' } }, yTemp: { position: 'left', ticks: { color: '#fabd2f' }, grid: { drawOnChartArea: false } }, yPrecip: { position: 'right', max: 100, ticks: { color: '#83a598' } } } }
        });
    },

    displayHourly: function(hourlyData) {
        const container = document.getElementById("hourly-forecast");
        container.innerHTML = "";
        for (let i = 0; i < 24; i++) {
            const el = document.createElement("div");
            el.classList.add("hourly-item");
            const { icon } = this.getWeatherInfoFromCode(hourlyData.weathercode[i]);
            el.innerHTML = `<div class="time">${new Date(hourlyData.time[i]).toLocaleTimeString([], { hour: 'numeric' })}</div><img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon" /><div class="temp">${Math.round(hourlyData.temperature_2m[i])}°F</div>`;
            container.appendChild(el);
        }
    },

    displayDaily: function(dailyData) {
        const container = document.getElementById("daily-forecast");
        container.innerHTML = "";
        for (let i = 1; i < dailyData.time.length && i < 8; i++) {
            const el = document.createElement("div");
            el.classList.add("daily-item");
            const { description, icon } = this.getWeatherInfoFromCode(dailyData.weathercode[i]);
            const date = new Date(dailyData.time[i]);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
            el.innerHTML = `<div class="day">${dayName}</div><div class="icon-temp"><img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}" class="icon" /><span>${description}</span></div><div class="temps"><span class="high">${Math.round(dailyData.temperature_2m_max[i])}°</span> / <span class="low">${Math.round(dailyData.temperature_2m_min[i])}°</span></div>`;
            container.appendChild(el);
        }
    },
    
    displayWeatherMap: function(lat, lon) {
        if (map) { map.remove(); }
        map = L.map('weather-map').setView([lat, lon], 9);
        L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', { attribution: '&copy; Stadia Maps' }).addTo(map);

        if (!useMockData && this.apiKey && this.apiKey !== "YOUR_API_KEY_GOES_HERE") {
            L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${this.apiKey}`, { opacity: 0.7 }).addTo(map);
        } else {
            console.log("In mock mode. Using embedded Data URL for weather map overlay.");
            const imageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AYbFwslkpBrqwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAVVSURBVHja7d1BjvwmEAVQJolI/v/L3kOQC4kgxJIi2Uu/tc45z8zM3p6XHoB5u+kCgP8TSAUE4gIBRcDiAyIUEIgLRBQCiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+IFEIgLhBQiA+... The rest of this is unchanged ...";
            const imageBounds = [[38.0, -82.0], [45.0, -70.0]];
            L.imageOverlay(imageUrl, imageBounds, { opacity: 0.6, interactive: true }).addTo(map);
        }
    },

    // This helper function must be INSIDE the weather object to be called with 'this'
    getWeatherInfoFromCode: function(code) {
        const weatherMap = {
            0: { description: "Clear sky", icon: "01d" }, 1: { description: "Mainly clear", icon: "01d" }, 2: { description: "Partly cloudy", icon: "02d" }, 3: { description: "Overcast", icon: "04d" },
            45: { description: "Fog", icon: "50d" }, 48: { description: "Rime Fog", icon: "50d" },
            51: { description: "Light Drizzle", icon: "09d" }, 53: { description: "Drizzle", icon: "09d" }, 55: { description: "Dense Drizzle", icon: "09d" },
            61: { description: "Slight Rain", icon: "10d" }, 63: { description: "Rain", icon: "10d" }, 65: { description: "Heavy Rain", icon: "10d" },
            71: { description: "Slight Snow", icon: "13d" }, 73: { description: "Snow", icon: "13d" }, 75: { description: "Heavy Snow", icon: "13d" },
            80: { description: "Rain Showers", icon: "09d" }, 81: { description: "Rain Showers", icon: "09d" }, 82: { description: "Violent Showers", icon: "09d" },
            95: { description: "Thunderstorm", icon: "11d" }
        };
        return weatherMap[code] || { description: "Unknown", icon: "50d" };
    },

    search: function() {
        const city = document.querySelector(".weather-search").value;
        if (city) this.getWeatherForCity(city);
    },
  }; // <-- The weather object correctly closes here

  // --- Event Listeners and Initial Page Load ---
  document.querySelector(".weather-search-btn").addEventListener("click", () => weather.search());
  document.getElementById("weather-search-input").addEventListener("keyup", e => e.key === "Enter" && weather.search());
  
  weather.getWeatherForCity("New York");

});
