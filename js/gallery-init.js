// js/gallery-init.js

import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.min.js';

// This function runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeGallery();
});

async function initializeGallery() {
  console.log('Starting gallery initialization...');
  
  // Combine the selectors here to get all links from both gallery types
  const galleryLinks = document.querySelectorAll('.media-grid a, .item a');
  const promises = [];

  for (const link of galleryLinks) {
    const promise = new Promise((resolve) => {
      const imageUrl = link.href;
      const img = new Image();
      img.onload = () => {
        console.log(`Loaded ${imageUrl}: ${img.width}x${img.height}`);
        link.setAttribute('data-pswp-width', img.width);
        link.setAttribute('data-pswp-height', img.height);
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${imageUrl}`);
        // Resolve even on error so one broken image doesn't stop the gallery
        resolve();
      };
      img.src = imageUrl;
    });
    promises.push(promise);
  }

  try {
    await Promise.all(promises);
    console.log('All image dimensions have been set.');

    // --- The Magic is Here ---
    const lightbox = new PhotoSwipeLightbox({
      // 1. Gallery Container: Look for an element with class '.grid' OR '.media-grid'
      gallery: '.grid, .media-grid', 
      
      // 2. Child Items: Look for an 'a' tag inside an element with class '.item' OR '.media-item'
      children: '.item > a, .media-item > a',

      pswpModule: () => import('https://unpkg.com/photoswipe@5/dist/photoswipe.esm.min.js'),
      padding: { top: 20, bottom: 20, left: 40, right: 40 }
    });
    
    lightbox.init();
    console.log('Universal PhotoSwipe initialized successfully.');

  } catch (error) {
    console.error('An error occurred during gallery initialization:', error);
  }
}
