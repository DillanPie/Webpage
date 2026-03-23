// js/app.js (This code is correct for the new HTML)

document.addEventListener("DOMContentLoaded", () => {
  const weather = {
    apiKey: "44a54a5ef877513e49804e198c18cb32",

    fetchWeatherByCity: function (city) {
      document.querySelector(".weather-search").placeholder = "Loading...";
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${this.apiKey}`)
        .then(response => {
          if (!response.ok) {
            alert("No weather found. Please check the city name.");
            throw new Error("No weather found.");
          }
          return response.json();
        })
        .then(data => this.displayWeather(data))
        .catch(error => {
          console.error("Error fetching weather by city:", error);
          document.querySelector(".weather-search").value = "";
          document.querySelector(".weather-search").placeholder = "City not found";
        });
    },

    displayWeather: function (data) {
      const { name } = data;
      const { icon, description } = data.weather[0];
      const { temp, humidity } = data.main;
      const { speed } = data.wind;

      document.querySelector(".weather-search").value = name;
      document.querySelector(".icon").src = `https://openweathermap.org/img/wn/${icon}.png`;
      document.querySelector(".description").innerText = description;
      document.querySelector(".temp").innerText = `${temp}°F`;
      document.querySelector(".humidity").innerText = `Humidity: ${humidity}%`;
      document.querySelector(".wind").innerText = `Wind speed: ${speed} mph`;
      document.querySelector(".weather").classList.remove("loading");
      document.body.style.backgroundImage = `url('https://source.unsplash.com/1600x900/?${name}')`;
    },

    search: function () {
      const city = document.querySelector(".weather-search").value;
      if (city) this.fetchWeatherByCity(city);
    }
  };

  document.querySelector(".weather-search-btn").addEventListener("click", () => weather.search());
  document.getElementById("weather-search-input").addEventListener("keyup", (event) => {
    if (event.key === "Enter") weather.search();
  });

  const getLocationByIP = () => {
    fetch("http://ip-api.com/json/")
      .then(response => response.json())
      .then(data => {
        if (data && data.status === 'success' && data.city) {
          weather.fetchWeatherByCity(data.city);
        } else {
          throw new Error("IP API could not determine city.");
        }
      })
      .catch(error => {
        console.warn(error.message, "Falling back to default city.");
        weather.fetchWeatherByCity("New York");
      });
  };

  getLocationByIP();
});
