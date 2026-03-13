// js/include/pages/index-page.js

// Step 1: Import the global assets (like navbar.css, footer.css, etc.)
import '../main.js';

// Step 2: Import the page-specific assets for the homepage.

// --- FIX: Add the CSS import for the slideshow ---
import '../../../css/slideshow.css'; 

// Import the slideshow's JavaScript logic
import '../../slideshow.js';

// Import the PhotoSwipe library's CSS
import 'photoswipe/dist/photoswipe.css';

console.log("Homepage (index-page.js) assets have been loaded.");
