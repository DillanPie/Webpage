// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { globSync } from 'glob';

// --- PLUGIN IMPORTS ---
import { createHtmlPlugin } from 'vite-plugin-html';
import purgeCss from '@fullhuman/postcss-purgecss';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// Dynamically find all HTML files to create a multi-page app setup
const htmlFiles = Object.fromEntries(
  globSync('*.html').map(file => [
    file.slice(0, file.length - '.html'.length),
    resolve(__dirname, file)
  ])
);

export default defineConfig(({ mode }) => {
  return {
    // Project root directory
    root: './',
    // Base public path
    base: '/',

    // --- OPTIMIZATION 1: Path Aliases ---
    resolve: {
      alias: {
        '@': resolve(__dirname, './'),
      },
    },

    // --- OPTIMIZATION 2: Unused CSS Removal ---
    css: {
      postcss: {
        plugins: [
          purgeCss({
            // Scan all HTML and JS files for class names.
            // Because the HTML plugin runs first, PurgeCSS will see the complete HTML.
            content: [
              './*.html',
              './js/**/*.js',
            ],
          }),
        ],
      },
    },
    
    // --- PLUGINS ---
    plugins: [
      // --- NEW: Build-Time HTML Includes ---
      // This plugin assembles your HTML files before the build,
      // replacing <%- include(...) %> tags with the content of your partials.
      createHtmlPlugin({
        minify: true, // Minifies the final HTML file
      }),

      // --- OPTIMIZATION 3: Asset Compression ---
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),

      // --- OPTIMIZATION 4: Bundle Analysis (Securely) ---
      // Only runs when you execute 'npm run build:analyze'
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/stats.html',
      }),
    ],

    build: {
      outDir: 'dist',
      rollupOptions: {
        input: htmlFiles,
      },
    },
  };
});
