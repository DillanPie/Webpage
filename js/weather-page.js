document.addEventListener("DOMContentLoaded", () => {
  // --- DEVELOPMENT SWITCH ---
  const useMockData = false;

  let hourlyChart;
  let map;

  const weather = {
    apiKey: "44a54a5ef877513e49804e198c18cb32S", 

    getWeatherForCity: function(city) {
      document.body.classList.add("weather-loading");
      if (useMockData) {
        if (typeof mockWeatherData !== 'undefined') {
          setTimeout(() => this.displayAllWeather(mockWeatherData, "New York (Mock Data)"), 500);
        } else {
          console.error("Error: mock-weather.js is not loaded or mockWeatherData is not defined.");
          alert("Development Error: Mock weather data is missing.");
        }
      } else {
        this.getCoords(city);
      }
    },

    getCoords: function(city) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}`)
        .then(res => { if (!res.ok) throw new Error("City not found."); return res.json(); })
        .then(data => this.getForecast(data.coord.lat, data.coord.lon, data.name))
        .catch(err => { alert(err.message); document.body.classList.remove("weather-loading"); });
    },

    getForecast: function(lat, lon, cityName) {
      fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,alerts&appid=${this.apiKey}`)
        .then(res => { if (!res.ok) throw new Error("Could not retrieve forecast."); return res.json(); })
        .then(data => this.displayAllWeather(data, cityName))
        .catch(err => { alert(err.message); document.body.classList.remove("weather-loading"); });
    },

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
        
        // --- START OF MAP FIX ---
        // After the map container is made visible by removing the loading class,
        // we need to tell Leaflet to recalculate its size.
        // A small timeout ensures the browser has finished its layout rendering.
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);
        // --- END OF MAP FIX ---
    },

    displayCurrent: function(data, cityName) {
        const { temp, feels_like, humidity, wind_speed, uvi, visibility } = data.current;
        const { icon, description } = data.current.weather[0];
        const { max, min } = data.daily[0].temp;

        document.querySelector(".city-name").innerText = cityName;
        document.querySelector(".current-temp").innerText = `${Math.round(temp)}°F`;
        document.querySelector(".current-icon").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        document.querySelector(".current-description").innerText = description;
        
        document.getElementById("feels-like").innerText = `${Math.round(feels_like)}°F`;
        document.getElementById("high-temp").innerText = `${Math.round(max)}°F`;
        document.getElementById("low-temp").innerText = `${Math.round(min)}°F`;
        document.getElementById("wind-speed").innerText = `${wind_speed.toFixed(1)} mph`;
        document.getElementById("humidity").innerText = `${humidity}%`;
        document.getElementById("uv-index").innerText = uvi;
        document.getElementById("visibility").innerText = `${(visibility / 1609).toFixed(1)} mi`;
    },
    
    displayHourlyChart: function(hourlyData) {
        const ctx = document.getElementById('hourly-chart').getContext('2d');
        if (hourlyChart) { hourlyChart.destroy(); }

        const labels = hourlyData.slice(0, 24).map(hour => new Date(hour.dt * 1000).toLocaleTimeString([], { hour: 'numeric' }));
        const tempData = hourlyData.slice(0, 24).map(hour => Math.round(hour.temp));
        const precipData = hourlyData.slice(0, 24).map(hour => Math.round(hour.pop * 100));

        hourlyChart = new Chart(ctx, {
            type: 'bar', data: { labels: labels, datasets: [ { type: 'line', label: 'Temperature (°F)', data: tempData, borderColor: 'rgba(250, 189, 47, 1)', tension: 0.4, yAxisID: 'yTemp' }, { type: 'bar', label: 'Precipitation (%)', data: precipData, backgroundColor: 'rgba(131, 165, 152, 0.6)', yAxisID: 'yPrecip' } ] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#ebdbb2' } }, yTemp: { position: 'left', ticks: { color: '#fabd2f' }, grid: { drawOnChartArea: false } }, yPrecip: { position: 'right', max: 100, ticks: { color: '#83a598' } } } }
        });
    },

    displayHourly: function(hourlyData) {
        const container = document.getElementById("hourly-forecast");
        container.innerHTML = "";
        hourlyData.slice(0, 24).forEach(hour => {
            const el = document.createElement("div");
            el.classList.add("hourly-item");
            el.innerHTML = `<div class="time">${new Date(hour.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })}</div><img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="icon" class="icon" /><div class="temp">${Math.round(hour.temp)}°F</div>`;
            container.appendChild(el);
        });
    },

    displayDaily: function(dailyData) {
        const container = document.getElementById("daily-forecast");
        container.innerHTML = "";
        dailyData.slice(1, 8).forEach(day => {
            const el = document.createElement("div");
            el.classList.add("daily-item");
            el.innerHTML = `<div class="day">${new Date(day.dt * 1000).toLocaleDateString([], { weekday: 'long' })}</div><div class="icon-temp"><img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="icon" class="icon" /><span>${day.weather[0].main}</span></div><div class="temps"><span class="high">${Math.round(day.temp.max)}°</span> / <span class="low">${Math.round(day.temp.min)}°</span></div>`;
            container.appendChild(el);
        });
    },
    
    displayWeatherMap: function(lat, lon) {
        if (map) { map.remove(); }
        map = L.map('weather-map').setView([lat, lon], 9);
        const url = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
        const attr = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>';
        L.tileLayer(url, { attribution: attr }).addTo(map);

        if (!useMockData && this.apiKey && this.apiKey !== "YOUR_API_KEY_GOES_HERE") {
            L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${this.apiKey}`, { opacity: 0.7 }).addTo(map);
        }
    },

    search: function() {
        const city = document.querySelector(".weather-search").value;
        if (city) this.getWeatherForCity(city);
    },
  };

  document.querySelector(".weather-search-btn").addEventListener("click", () => weather.search());
  document.getElementById("weather-search-input").addEventListener("keyup", e => e.key === "Enter" && weather.search());
  
  const startWeather = () => {
    weather.getWeatherForCity("New York");
  };
  
  startWeather();
});
