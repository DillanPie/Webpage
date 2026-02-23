// File: js/include/pages/weather-page.js

// Step 1: Import the main bundle of global assets.
import '../main.js';

// Step 2: Import the CSS for this page and its libraries.
import '../../../css/weather.css';
import 'leaflet/dist/leaflet.css'; // Import Leaflet's CSS from node_modules

// Step 3: Import the page-specific JavaScript logic.
// This will now handle importing Chart.js and Leaflet directly.
import '../../weather.js';

console.log("Weather page assets have been loaded.");
