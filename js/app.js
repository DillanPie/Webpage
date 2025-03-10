function searchWithGoogle(event) {
  if (event.key === "Enter" && event.target.value !== "") {
    window.location =
      "https://www.google.com/search?q=" + event.target.value;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const weather = {
    apiKey: "44a54a5ef877513e49804e198c18cb32",
    fetchWeather: function (city) {
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${this.apiKey}`
      )
        .then((response) => {
          if (!response.ok) {
            alert("No weather found.");
            throw new Error("No weather found.");
          }
          return response.json();
        })
        .then((data) => this.displayWeather(data))
        .catch((error) =>
          console.error("Error fetching weather:", error)
        );
    },

    displayWeather: function (data) {
      const { name } = data;
      const { icon, description } = data.weather[0];
      const { temp, humidity } = data.main;
      const { speed } = data.wind;
      document.querySelector(".city").innerText = "Weather in " + name;
      document.querySelector(".icon").src =
        "https://openweathermap.org/img/wn/" + icon + ".png";
      document.querySelector(".description").innerText = description;
      document.querySelector(".temp").innerText = temp + "°F";
      document.querySelector(".humidity").innerText =
        "Humidity: " + humidity + "%";
      document.querySelector(".wind").innerText =
        "Wind speed: " + speed + " mph";
      document.querySelector(".weather").classList.remove("loading");
      document.body.style.backgroundImage =
        "url('https://source.unsplash.com/1600x900/?" + name + "')";
    },
  };

  // Automatically fetch weather for the initial city
  weather.fetchWeather("King George");
});