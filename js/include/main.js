// js/include/main.js

// This file is the single source of truth for all GLOBAL assets.

// Import all global styles using the '@/' alias
import '@/css/navbar.css';
import '@/css/footer.css';

// Import all global scripts
import '@/js/include/navbar.js';
import '@/js/include/footer.js';

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

console.log("Global assets (main.js) have been loaded.");