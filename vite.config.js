// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { globSync } from 'glob';

// Import Optimization Plugins
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
    // Project root directory (where index.html is)
    root: './',
    // Base public path when served in development or production
    base: '/',

    // --- OPTIMIZATION 1: Path Aliases ---
    // Allows using '@/' to refer to the project root, cleaning up import paths.
    resolve: {
      alias: {
        '@': resolve(__dirname, './'),
      },
    },

    // --- OPTIMIZATION 2: Unused CSS Removal ---
    // PurgeCSS scans your files and removes unused CSS rules from the final build.
    css: {
      postcss: {
        plugins: [
          purgeCss({
            content: [
              './*.html',
              './js/**/*.js',
            ],
          }),
        ],
      },
    },
    
    // --- OPTIMIZATION 3 & 4: Compression and Bundle Analysis ---
    plugins: [
      // Creates pre-compressed .gz files for Nginx to serve.
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Creates pre-compressed .br (Brotli) files, which are even smaller.
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        // Brotli can be slow, so you might disable it for development builds if needed.
        // apply: 'build', 
      }),
      // --- SECURITY FOCUS: Only run the visualizer in 'analyze' mode ---
      // This prevents the stats.html file from being generated in a normal 'npm run build'.
      mode === 'analyze' && visualizer({
        open: true, // Automatically opens the report in your browser
        filename: 'dist/stats.html', // Output file for the report
      }),
    ],

    build: {
      // Output directory for the build
      outDir: 'dist',
      rollupOptions: {
        // Tell Vite about all your HTML entry points
        input: htmlFiles,
      },
    },
  };
});
