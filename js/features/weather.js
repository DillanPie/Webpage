import Chart from 'chart.js/auto';
import L from 'leaflet';

document.addEventListener("DOMContentLoaded", () => {
  const useMockData = false;
  let hourlyChart;
  let map;
  let expandedMap; 

  const weather = {
    apiKey: "44a54a5ef877513e49804e198c18cb32",

    // --- HELPER FUNCTIONS ---
    displayError: function(message) {
        const errorEl = document.getElementById("weather-error-message");
        errorEl.innerText = message;
        errorEl.style.display = "block";
        document.body.classList.remove("weather-loading"); // Stop the loading spinner
        document.getElementById("current-weather").style.visibility = 'hidden';
        this.enableSearchControls();
    },

    clearError: function() {
        const errorEl = document.getElementById("weather-error-message");
        errorEl.style.display = "none";
    },

    disableSearchControls: function() {
        document.querySelector(".weather-search-btn").disabled = true;
        document.getElementById("weather-search-input").disabled = true;
    },

    enableSearchControls: function() {
        document.querySelector(".weather-search-btn").disabled = false;
        document.getElementById("weather-search-input").disabled = false;
    },

    // --- Main Workflow ---
    getLocationAndWeather: function() {
        if (navigator.geolocation) {
            document.body.classList.add("weather-loading");
            document.getElementById("weather-search-input").placeholder = "Getting your location...";
            this.clearError();
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.getCityNameFromCoords(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn(`Geolocation Error (${error.code}): ${error.message}`);
                    this.getWeatherByIP();
                }
            );
        } else {
            console.log("Geolocation not supported. Using IP-based location.");
            this.getWeatherByIP();
        }
    },

    getCityNameFromCoords: function(lat, lon) {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
        fetch(url)
            .then(res => { if (!res.ok) throw new Error("Could not find city name from coordinates."); return res.json(); })
            .then(data => {
                const city = data[0]?.name || "Your Location";
                const state = data[0]?.state;
                const cityName = state ? `${city}, ${state}` : city;
                this.getForecast(lat, lon, cityName);
            })
            .catch(err => {
                console.error("Reverse Geocoding Error:", err);
                this.getForecast(lat, lon, "Current Location");
            });
    },

    getWeatherByIP: function() {
        document.getElementById("weather-search-input").placeholder = "Guessing location...";
        fetch('https://ipinfo.io/json')
            .then(res => { if (!res.ok) throw new Error("Could not fetch IP location."); return res.json(); })
            .then(data => {
                const [lat, lon] = data.loc.split(',');
                const cityName = `${data.city} (IP Approx.)`;
                this.getForecast(parseFloat(lat), parseFloat(lon), cityName);
            })
            .catch(err => {
                console.error("IP Geolocation Error:", err);
                this.displayError("Could not determine your location. Showing weather for New York instead.");
                this.getWeatherForCity("New York");
            });
    },
    
    getWeatherForCity: function(city) {
      this.clearError();
      if (useMockData) {
        this.getForecast(40.71, -74.0, "New York (Mock Data)");
      } else {
        this.getCoords(city);
      }
    },

    getCoords: function(city) {
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}`)
        .then(res => { if (!res.ok) throw new Error(`City "${city}" not found.`); return res.json(); })
        .then(data => this.getForecast(data.coord.lat, data.coord.lon, data.name))
        .catch(err => this.displayError(err.message));
    },

    getForecast: function(lat, lon, cityName) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,windspeed_10m&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=auto`;
      fetch(url)
        .then(res => { if (!res.ok) throw new Error("Could not retrieve forecast data."); return res.json(); })
        .then(data => {
            data.lat = lat;
            data.lon = lon;
            this.displayAllWeather(data, cityName);
        })
        .catch(err => this.displayError(err.message));
    },

    displayAllWeather: function(data, cityName) {
    //display all the fast, text-based data first.
    
    document.getElementById("current-weather").style.visibility = 'visible';
    
    this.displayCurrent(data, cityName);
    this.displayHourlyChart(data.hourly);
    this.displayHourly(data.hourly);
    this.displayDaily(data.daily);

    // Update the search bar and timestamp
    document.querySelector(".weather-search").value = cityName;
    document.getElementById("timestamp").innerText = new Date().toLocaleTimeString();

    // NOW, remove the loading spinner and show the main content.
    // The user sees the page as "loaded" at this point.
    document.body.classList.remove("weather-loading");
    this.enableSearchControls();

    // --- THEN, start loading the map in the background ---
    // This will no longer hold up the initial page display.
    this.displayWeatherMap(data.lat, data.lon, 'map', false);

    // This final resize call is still good practice.
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
    },
    
    displayHourlyChart: function(hourlyData) {
        const ctx = document.getElementById('hourly-chart').getContext('2d');
        if (hourlyChart) { hourlyChart.destroy(); }

        const labels = hourlyData.time.slice(0, 24).map(time => new Date(time).toLocaleTimeString([], { hour: 'numeric' }));
        const tempData = hourlyData.temperature_2m.slice(0, 24).map(t => Math.round(t));
        const precipData = hourlyData.precipitation_probability.slice(0, 24);

        hourlyChart = new Chart(ctx, {
            type: 'bar', 
            data: { 
                labels, 
                datasets: [
                    { type: 'line', label: 'Temperature', data: tempData, borderColor: '#fabd2f', tension: 0.4, yAxisID: 'yTemp' }, 
                    { type: 'bar', label: 'Precipitation', data: precipData, backgroundColor: '#83a598', yAxisID: 'yPrecip' } 
                ] 
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                // *** NEW: Plugin options for legend styling ***
                plugins: {
                    legend: {
                        labels: {
                            color: '#ebdbb2',
                            font: {
                                size: 14 // Adjust size of top legend labels (e.g., "Temp", "Precip")
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#ebdbb2' }
                    },
                    yTemp: { // Temperature Axis (Left)
                        position: 'left',
                        ticks: {
                            color: '#fabd2f',
                            // *** NEW: Font size for the temperature numbers ***
                            font: {
                                size: 14 // Adjust size of numbers on the axis
                            }
                        },
                        // *** NEW: Title for the temperature axis ***
                        title: {
                            display: true,
                            text: 'Temp (°F)',
                            color: '#fabd2f',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        },
                        grid: { drawOnChartArea: false }
                    },
                    yPrecip: { // Precipitation Axis (Right)
                        position: 'right',
                        max: 100,
                        ticks: {
                            color: '#83a598',
                             // *** NEW: Font size for the precipitation numbers ***
                            font: {
                                size: 14 // Adjust size of numbers on the axis
                            }
                        },
                         // *** NEW: Title for the precipitation axis ***
                        title: {
                            display: true,
                            text: 'Precipitation (%)',
                            color: '#83a598',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    },

    
// This function is updated to center the current hour.
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

        // Use a short timeout to ensure the browser has rendered the items
        // and calculated their widths before we try to scroll.
        setTimeout(() => {
            const currentIndex = new Date().getHours(); // Get the current hour (0-23)
            const items = container.children;

            if (items[currentIndex]) {
                const currentItem = items[currentIndex];
                const containerWidth = container.clientWidth;
                const itemLeft = currentItem.offsetLeft;
                const itemWidth = currentItem.offsetWidth;

                // Calculate the scroll position needed to center the item
                const scrollPosition = itemLeft - (containerWidth / 2) + (itemWidth / 2);

                // Set the container's scroll position smoothly
                container.scrollTo({
                    left: scrollPosition,
                    behavior: 'smooth'
                });
            }
            // The scroll event listener will automatically update the arrow buttons.
        }, 150);
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
    
displayWeatherMap: function (lat, lon, mapId, isExpanded) {
    let mapInstance;

    const setupMap = (zoom) => {
        const mapOptions = { maxZoom: 20 };
        let instance;

        if (isExpanded) {
            if (expandedMap) expandedMap.remove();
            expandedMap = L.map(mapId, mapOptions).setView([lat, lon], zoom);
            instance = expandedMap;
        } else {
            if (map) map.remove();
            map = L.map(mapId, mapOptions).setView([lat, lon], zoom);
            instance = map;
        }

        setTimeout(() => {
            if (instance) instance.invalidateSize();
        }, 0);

        return instance;
    };

    mapInstance = setupMap(10);

    const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20
    });
    baseLayer.addTo(mapInstance);

    const overlayMaps = {};

    // --- THIS IS THE CORRECTED PART ---
    const cloudLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${weather.apiKey}`, {
        attribution: ' | Clouds &copy; <a href="https://openweathermap.org/" target="_blank">OpenWeatherMap</a>',
        // 1. Opacity decreased to make clouds more transparent.
        //    (0.0 is fully transparent, 1.0 is fully solid)
        opacity: 1.0,
        
        // 2. A class name to target this layer with CSS.
        className: 'cloud-tile-layer',

        // 3. Over-zooming options remain to keep it visible.
        maxNativeZoom: 9,
        maxZoom: 20,
        noWrap: true
    });
    overlayMaps["Clouds"] = cloudLayer;

    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(res => res.ok ? res.json() : Promise.reject('RainViewer API request failed'))
        .then(data => {
            const host = data.host;
            const latestTimestampPath = data.radar.past.pop().path;
            const radarUrl = `${host}${latestTimestampPath}/512/{z}/{x}/{y}/2/1_1.png`;

            const rainviewerLayer = L.tileLayer(radarUrl, {
                attribution: ' | <a href="https://www.rainviewer.com/" target="_blank">RainViewer</a>',
                opacity: 0.8,
                noWrap: true,
                maxNativeZoom: 7,
                maxZoom: 20
            });
            
            overlayMaps["Smooth Radar"] = rainviewerLayer;
            rainviewerLayer.addTo(mapInstance);

            L.control.layers({ "Base Map": baseLayer }, overlayMaps).addTo(mapInstance);
        })
        .catch(error => {
            console.error("Could not load smooth radar layer. Only showing cloud layer option.", error);
            L.control.layers({ "Base Map": baseLayer }, overlayMaps).addTo(mapInstance);
        });
},



    getWeatherInfoFromCode: function(code) {
        const weatherMap = { 0: { description: "Clear sky", icon: "01d" }, 1: { description: "Mainly clear", icon: "01d" }, 2: { description: "Partly cloudy", icon: "02d" }, 3: { description: "Overcast", icon: "04d" }, 45: { description: "Fog", icon: "50d" }, 48: { description: "Rime Fog", icon: "50d" }, 51: { description: "Light Drizzle", icon: "09d" }, 53: { description: "Drizzle", icon: "09d" }, 55: { description: "Dense Drizzle", icon: "09d" }, 61: { description: "Slight Rain", icon: "10d" }, 63: { description: "Rain", icon: "10d" }, 65: { description: "Heavy Rain", icon: "10d" }, 71: { description: "Slight Snow", icon: "13d" }, 73: { description: "Snow", icon: "13d" }, 75: { description: "Heavy Snow", icon: "13d" }, 80: { description: "Rain Showers", icon: "09d" }, 81: { description: "Rain Showers", icon: "09d" }, 82: { description: "Violent Showers", icon: "09d" }, 95: { description: "Thunderstorm", icon: "11d" } };
        return weatherMap[code] || { description: "Unknown", icon: "50d" };
    },

    search: function() {
        const city = document.getElementById("weather-search-input").value;
        if (city) {
            this.disableSearchControls();
            document.body.classList.add("weather-loading");
            this.getWeatherForCity(city);
        }
    },
  };

  const hourlyContainer = document.getElementById("hourly-forecast");
  const scrollLeftBtn = document.getElementById("hourly-scroll-left");
  const scrollRightBtn = document.getElementById("hourly-scroll-right");

  const updateScrollButtons = () => {
      const atStart = hourlyContainer.scrollLeft < 10;
      const atEnd = hourlyContainer.scrollWidth - hourlyContainer.scrollLeft - hourlyContainer.clientWidth < 10;
      scrollLeftBtn.disabled = atStart;
      scrollRightBtn.disabled = atEnd;
  };

  scrollLeftBtn.addEventListener("click", () => hourlyContainer.scrollBy({ left: -300, behavior: "smooth" }));
  scrollRightBtn.addEventListener("click", () => hourlyContainer.scrollBy({ left: 300, behavior: "smooth" }));
  hourlyContainer.addEventListener("scroll", updateScrollButtons);

  document.querySelector(".weather-search-btn").addEventListener("click", () => weather.search());
  document.getElementById("weather-search-input").addEventListener("keyup", e => e.key === "Enter" && weather.search());
  
  weather.getLocationAndWeather();

// --- Modal Logic ---
const mapModal = document.getElementById('map-modal');
const closeModalBtn = document.querySelector('.close-modal');
const expandMapBtn = document.getElementById('expand-map-btn'); // Get the new button

// --- THIS IS THE CORRECTED PART ---
// The click listener is now on the expand button, not the whole map.
expandMapBtn.addEventListener('click', () => {
    mapModal.classList.add('visible');
    document.body.classList.add('modal-open');
    
    // Get the current view from the small map
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    // Display the big map with the same view
    weather.displayWeatherMap(currentCenter.lat, currentCenter.lng, 'expanded-map', true);
    
    // Ensure the expanded map resizes correctly
    setTimeout(() => {
        if (expandedMap) {
            expandedMap.invalidateSize();
        }
    }, 100); 
});

const closeModal = () => {
    mapModal.classList.remove('visible');
    document.body.classList.remove('modal-open');
    if (expandedMap) {
        expandedMap.remove();
        expandedMap = null;
    }
};

closeModalBtn.addEventListener('click', closeModal);
mapModal.addEventListener('click', (e) => {
    if (e.target === mapModal) closeModal();
});
});
