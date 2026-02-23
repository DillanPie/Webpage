// File: js/include/pages/fav-media-page.js

// Step 1: Import the main bundle of global assets (CSS and JS).
// This executes everything in your main.js file first.
import '../main.js';

// Step 2: Import the CSS that is specific to THIS page.
// Because it's imported last, it can override global styles if needed.
import '../../../css/media.css';
import '../../../css/gallery.css'

// Step 3: Import the gallery initialization script to make it run.
import '../../gallery-init.js';

console.log("Media page assets have been loaded.");
