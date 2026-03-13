// js/gallery-init.js

import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.min.js';

// This function runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeGallery();
});

async function initializeGallery() {
  console.log('Starting gallery initialization...');
  
  // Combine the selectors here to get all links from both gallery types
// Add .music-grid a to the list of selectors
  const galleryLinks = document.querySelectorAll('.media-grid a, .item a, .music-grid a');
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


const lightbox = new PhotoSwipeLightbox({
  // 1. Gallery Container: Add .music-grid to the list
  gallery: '.grid, .media-grid, .music-grid', 
  
  // 2. Child Items: This selector is still correct and doesn't need to be changed.
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
