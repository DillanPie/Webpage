// This file contains mock data to simulate an API response for development purposes.

const mockWeatherData = {
  lat: 40.7128,
  lon: -74.006,
  timezone: "America/New_York",
  current: {
    dt: 1684951200,
    temp: 68.5,
    feels_like: 67.8,
    humidity: 55,
    uvi: 8.5,
    visibility: 10000,
    wind_speed: 10.2,
    weather: [{
      main: "Clouds",
      description: "partly cloudy",
      icon: "04d"
    }],
  },
  hourly: Array.from({ length: 25 }, (_, i) => ({
    dt: 1684951200 + i * 3600,
    temp: 68.5 - i * 0.5 + Math.sin(i / 4) * 2,
    pop: Math.max(0, Math.sin(i / 6) * 0.5 - 0.25), // Probability of precipitation
    weather: [{
      main: i > 18 || i < 4 ? "Clouds" : "Clear",
      icon: i > 18 || i < 4 ? "04n" : "01d"
    }],
  })),
  daily: Array.from({ length: 8 }, (_, i) => ({
    dt: 1684951200 + i * 86400,
    temp: {
      min: 58 + Math.sin(i) * 3,
      max: 75 - Math.sin(i) * 3,
    },
    weather: [{
      main: i % 3 === 0 ? "Rain" : "Clouds",
      description: i % 3 === 0 ? "light rain" : "broken clouds",
      icon: i % 3 === 0 ? "10d" : "04d",
    }],
  })),
};
