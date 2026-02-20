// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { globSync } from 'glob';

// Get all HTML files as entry points
const htmlFiles = Object.fromEntries(
  globSync('*.html').map(file => [
    // This gives the name of the file without the extension
    // e.g., 'about' for 'about.html'
    file.slice(0, file.length - '.html'.length),
    // This is the absolute path to the file
    resolve(__dirname, file)
  ])
);

export default defineConfig({
  // Project root directory (where index.html is)
  root: './', 
  // Base public path when served in development or production
  base: '/', 
  build: {
    // Output directory for the build
    outDir: 'dist', 
    rollupOptions: {
      // Tell Vite about all your HTML entry points
      input: htmlFiles,
    },
  },
});
