// js/include/pages/weather-page.js

// Step 1: Import the main bundle of global assets.
import '@/js/include/main.js';

// Step 2: Import the CSS for this page and its libraries.
import '@/css/weather.css';
import 'leaflet/dist/leaflet.css'; // This path is correct (from node_modules)

// Step 3: Import the page-specific JavaScript logic file.
import '@/js/weather-page.js'; // This loads and runs your weather logic

console.log("Weather page assets have been loaded.");
