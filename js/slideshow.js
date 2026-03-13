// js/slideshow.js

import PhotoSwipeLightbox from 'photoswipe/lightbox';

let slideIndex = 0;
let slideInterval;

// --- Part 1: Your auto-slideshow logic (no changes needed here) ---

function showSlides(n) {
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    if (n >= slides.length) slideIndex = 0;
    if (n < 0) slideIndex = slides.length - 1;
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (let i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex].style.display = "block";
    dots[slideIndex].className += " active";
}

function plusSlides(n) {
    stopSlideshow();
    showSlides(slideIndex += n);
    startSlideshow();
}

function currentSlide(n) {
    stopSlideshow();
    showSlides(slideIndex = n);
    startSlideshow();
}

function startSlideshow() {
    stopSlideshow();
    slideInterval = setInterval(() => showSlides(slideIndex += 1), 5000);
}

function stopSlideshow() {
    clearInterval(slideInterval);
}


// --- Part 2: The DYNAMIC PhotoSwipe Initializer ---

function initializeDynamicLightbox() {
    console.log('Starting dynamic lightbox initialization...');
    const galleryContainer = document.querySelector('#my-gallery');
    if (!galleryContainer) return;

    const links = galleryContainer.querySelectorAll('a');

    links.forEach(link => {
        const img = new Image();
        img.onload = () => {
            // Once the image loads in the background, set the data attributes.
            console.log(`Loaded: ${link.href}, size: ${img.width}x${img.height}`);
            link.dataset.pswpWidth = img.width;
            link.dataset.pswpHeight = img.height;
        };
        img.onerror = () => {
            console.error('Failed to preload image for PhotoSwipe:', link.href);
        };
        // This starts the background loading process.
        img.src = link.href;
    });
    
    // Now, initialize PhotoSwipe. It will find the attributes once the user clicks.
    const lightbox = new PhotoSwipeLightbox({
        gallery: '#my-gallery',
        children: 'a',
        pswpModule: () => import('photoswipe'),
        padding: { top: 20, bottom: 20, left: 40, right: 40 }
    });

    lightbox.on('beforeOpen', stopSlideshow);
    lightbox.on('close', startSlideshow);

    lightbox.init(); // This just prepares PhotoSwipe, it doesn't open it.
    console.log('PhotoSwipe is now initialized and waiting for clicks.');
}


// --- Part 3: The Main DOM Initialization ---

document.addEventListener("DOMContentLoaded", () => {
    // Attach listeners for your custom controls
    document.querySelector('.next').addEventListener('click', () => plusSlides(1));
    document.querySelector('.prev').addEventListener('click', () => plusSlides(-1));
    
    const dotsContainer = document.querySelector(".dots-container");
    const slides = document.querySelectorAll(".slide");
    dotsContainer.innerHTML = "";
    slides.forEach((_, index) => {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.addEventListener('click', () => currentSlide(index));
        dotsContainer.appendChild(dot);
    });

    // Add hover-to-pause functionality
    const slideshowContainer = document.querySelector(".slideshow-container");
    slideshowContainer.addEventListener("mouseover", stopSlideshow);
    slideshowContainer.addEventListener("mouseout", startSlideshow);

    // Start the auto-playing slideshow
    showSlides(slideIndex);
    startSlideshow();
    
    // Start the dynamic PhotoSwipe setup
    initializeDynamicLightbox();
});
