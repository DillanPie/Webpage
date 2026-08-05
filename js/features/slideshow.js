// js/slideshow.js

import PhotoSwipeLightbox from 'photoswipe/lightbox';

// =========================================================================
// --- PART 1: SLIDESHOW LOGIC (No Changes) ---
// =========================================================================

let slideIndex = 0;
let slideInterval;

function showSlides(n) {
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    if (slides.length === 0) return;

    if (n > slides.length) { slideIndex = 1; }
    if (n < 1) { slideIndex = slides.length; }

    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    if (dots.length > 0) {
        for (let i = 0; i < dots.length; i++) {
            dots[i].className = dots[i].className.replace(" active", "");
        }
    }

    slides[slideIndex - 1].style.display = "block";
    if (dots.length > 0) {
        dots[slideIndex - 1].className += " active";
    }
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
    slideInterval = setInterval(() => {
        slideIndex++;
        showSlides(slideIndex);
    }, 5000);
}

function stopSlideshow() {
    clearInterval(slideInterval);
}


// =========================================================================
// --- PART 2 & 3: FINAL INITIALIZATION LOGIC ---
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
    const slideshowContainer = document.querySelector(".slideshow-container");
    if (!slideshowContainer) return;

    // --- Standard slideshow setup ---
    const slides = document.querySelectorAll(".slide");
    const dotsContainer = document.querySelector(".dots-container");
    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        slides.forEach((_, index) => {
            const dot = document.createElement("span");
            dot.className = "dot";
            dot.addEventListener('click', () => currentSlide(index + 1));
            dotsContainer.appendChild(dot);
        });
    }
    
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    if (prevButton) prevButton.addEventListener('click', () => plusSlides(-1));
    if (nextButton) nextButton.addEventListener('click', () => plusSlides(1));
    
    // --- Pre-load image dimensions for smooth animations and aspect ratio ---
    const links = Array.from(slideshowContainer.querySelectorAll('a'));
    links.forEach(link => {
        const img = new Image();
        img.onload = () => {
            link.dataset.pswpWidth = img.width;
            link.dataset.pswpHeight = img.height;
        };
        img.src = link.href;
    });
    
    // Start the main slideshow
    slideIndex = 0;
    plusSlides(1);

    // --- FINAL PHOTOSWIPE INITIALIZATION ---
    const lightbox = new PhotoSwipeLightbox({
        pswpModule: () => import('photoswipe'),
        padding: { top: 20, bottom: 20, left: 40, right: 40 },
    });

    lightbox.on('beforeOpen', stopSlideshow);
    lightbox.on('close', startSlideshow);
    lightbox.init();

    slideshowContainer.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        e.preventDefault();

        const index = links.indexOf(link);
        const thumbEl = link.querySelector('img');

        // *** THE FIX: Build a data source with ALL images ***
        const dataSource = links.map(item => {
            return {
                src: item.href,
                width: parseInt(item.dataset.pswpWidth, 10),
                height: parseInt(item.dataset.pswpHeight, 10)
            };
        });

        // Open the lightbox with the full gallery data
        lightbox.loadAndOpen(index, dataSource, { 'thumbEl': thumbEl });
    });
});
