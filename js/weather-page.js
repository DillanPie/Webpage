document.addEventListener("DOMContentLoaded", () => {
  // --- DEVELOPMENT SWITCH ---
  const useMockData = false;
  let hourlyChart;
  let map;

  const weather = {
    apiKey: "44a54a5ef877513e49804e198c18cb32",

    // --- Main Workflow ---
    // STEP 1 (MODIFIED): Try browser geolocation first.
    getLocationAndWeather: function() {
        if (navigator.geolocation) {
            document.body.classList.add("weather-loading");
            document.getElementById("weather-search-input").placeholder = "Getting your location...";
            
            navigator.geolocation.getCurrentPosition(
                // SUCCESS: User approved location access.
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // NEW: Convert coordinates to a city name first.
                    this.getCityNameFromCoords(latitude, longitude);
                },
                // ERROR: User denied or an error occurred.
                (error) => {
                    console.warn(`Geolocation Error (${error.code}): ${error.message}`);
                    console.log("Falling back to IP-based location.");
                    this.getWeatherByIP(); // Fallback to IP lookup.
                }
            );
        } else {
            // Browser doesn't support geolocation at all.
            console.log("Geolocation not supported. Using IP-based location.");
            this.getWeatherByIP();
        }
    },

    // STEP 2 (NEW): Convert coordinates to a city name using Reverse Geocoding.
    getCityNameFromCoords: function(lat, lon) {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
        
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error("Could not reverse geocode coordinates.");
                return res.json();
            })
            .then(data => {
                // Construct a city name like "Brooklyn, NY" if state is available.
                const city = data[0]?.name || "Your Location";
                const state = data[0]?.state;
                const cityName = state ? `${city}, ${state}` : city;
                
                // Now that we have the name, get the full forecast.
                this.getForecast(lat, lon, cityName);
            })
            .catch(err => {
                console.error("Reverse Geocoding Error:", err);
                // If reverse geocoding fails, still show the weather, but with a generic name.
                alert("Could not find city name. Showing weather for your current coordinates.");
                this.getForecast(lat, lon, "Your Location");
            });
    },

    // STEP 3 (FALLBACK): Get location from IP address.
    getWeatherByIP: function() {
        document.getElementById("weather-search-input").placeholder = "Guessing location...";
        
        fetch('https://ipinfo.io/json')
            .then(res => {
                if (!res.ok) throw new Error("Could not fetch IP location.");
                return res.json();
            })
            .then(data => {
                const [lat, lon] = data.loc.split(',');
                const cityName = `${data.city} (IP Approx.)`;
                this.getForecast(parseFloat(lat), parseFloat(lon), cityName);
            })
            .catch(err => {
                console.error("IP Geolocation Error:", err);
                alert("Could not determine location. Defaulting to New York.");
                this.getWeatherForCity("New York");
            });
    },
    
    // This function is for manual city searches
    getWeatherForCity: function(city) {
      document.body.classList.add("weather-loading");
      if (useMockData) {
        this.getForecast(40.71, -74.0, "New York (Mock Data)");
      } else {
        this.getCoords(city);
      }
    },

    // This converts a city name string into coordinates for the forecast call
    getCoords: function(city) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}`)
        .then(res => { if (!res.ok) throw new Error("City not found."); return res.json(); })
        .then(data => this.getForecast(data.coord.lat, data.coord.lon, data.name))
        .catch(err => { alert(err.message); document.body.classList.remove("weather-loading"); });
    },

    // This is the final step that gets forecast data from Open-Meteo.
    getForecast: function(lat, lon, cityName) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,windspeed_10m&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;
      fetch(url)
        .then(res => { if (!res.ok) throw new Error("Could not retrieve forecast."); return res.json(); })
        .then(data => {
            data.lat = lat;
            data.lon = lon;
            this.displayAllWeather(data, cityName);
        })
        .catch(err => { alert(err.message); document.body.classList.remove("weather-loading"); });
    },

    // --- All UI Display Functions (unchanged from before) ---
    displayAllWeather: function(data, cityName) {
        this.displayCurrent(data, cityName);
        this.displayHourlyChart(data.hourly);
        this.displayHourly(data.hourly);
        this.displayDaily(data.daily);
        this.displayWeatherMap(data.lat, data.lon);

        const cityForImage = cityName.split(',')[0].trim();
        document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${cityForImage},city')`;
        
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
        }
    },

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
  };

  // --- Event Listeners and Initial Page Load ---
  document.querySelector(".weather-search-btn").addEventListener("click", () => weather.search());
  document.getElementById("weather-search-input").addEventListener("keyup", e => e.key === "Enter" && weather.search());
  
  weather.getLocationAndWeather();
});
