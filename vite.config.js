// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { globSync } from 'glob';

// --- PLUGIN IMPORTS ---
import { createHtmlPlugin } from 'vite-plugin-html';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// Dynamically find all HTML files
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

    // Path Aliases
    resolve: {
      alias: {
        '@': resolve(__dirname, './'),
      },
    },

    // --- REMOVED PurgeCSS for simplicity and stability ---
    
    // --- PLUGINS ---
    plugins: [
      // Build-Time HTML Includes (with correct configuration)
      createHtmlPlugin({
        minify: true,
        // --- THIS IS THE CRITICAL FIX ---
        // This 'pages' option tells the plugin to process these files
        // and correctly resolves includes from the project root in both dev and build.
        pages: globSync('*.html').map(file => {
          return {
            filename: file,
            template: file,
          };
        }),
      }),

      // Asset Compression
      viteCompression({ algorithm: 'gzip', ext: '.gz' }),
      viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),

      // Bundle Analysis (Securely)
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
