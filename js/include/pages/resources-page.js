// js/include/pages/resources-page.js

// Step 1: Import the main bundle of global assets.
// This executes everything in main.js first.
import '../main.js';

// Step 2: Import ONLY the CSS specific to this page.
// Because this is imported last, its rules will correctly override any
// conflicting rules from the global stylesheets.
import '../../../css/resources.css';

console.log("Resources page specific assets loaded.");
