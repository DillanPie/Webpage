// js/slideshow.js

import PhotoSwipeLightbox from 'https://unpkg.com/photoswipe@5/dist/photoswipe-lightbox.esm.min.js';

let slideIndex = 0;
let slideInterval;

// --- STEP 1: Set up the Slideshow and its Controls ---
function initSlideshowDOM() {
    // Attach button listeners programmatically
    document.querySelector('.next').addEventListener('click', () => plusSlides(1));
    document.querySelector('.prev').addEventListener('click', () => plusSlides(-1));
    
    const dotsContainer = document.querySelector(".dots-container");
    const slides = document.querySelectorAll(".slide");
    dotsContainer.innerHTML = "";

    slides.forEach((slide, index) => {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.addEventListener('click', () => currentSlide(index));
        dotsContainer.appendChild(dot);
    });

    showSlides(slideIndex);
    startSlideshow();
}

// --- STEP 2: The Definitive PhotoSwipe Integration ---
// This function attaches a click handler that does everything "just-in-time".
function initializePhotoSwipe() {
    const slideshowContainer = document.querySelector('.slideshow-container');
    
    // Make the event listener ASYNC to allow `await` inside
    slideshowContainer.addEventListener('click', async (e) => {
        const clickedLink = e.target.closest('.slide a');
        
        // Only proceed if a slide link was actually clicked
        if (clickedLink) {
            e.preventDefault();
            stopSlideshow();

            // We build the entire data source from scratch right now.
            console.log('Click detected. Building dataSource from DOM...');
            const allLinks = Array.from(document.querySelectorAll('.slide a'));

            // Use Promise.all to wait for all image dimensions to load in memory
            const dataSource = await Promise.all(allLinks.map(link => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        // Resolve the promise with the complete data object
                        resolve({
                            src: link.href,
                            width: img.width,
                            height: img.height,
                            alt: link.querySelector('img')?.alt || ''
                        });
                    };
                    img.onerror = () => {
                        console.error('Image failed to load:', link.href);
                        resolve(null); // Resolve with null if an image fails
                    };
                    img.src = link.href;
                });
            }));
            
            // Filter out any images that failed to load
            const validDataSource = dataSource.filter(item => item !== null);
            console.log(`DataSource created with ${validDataSource.length} valid items.`);

            if (validDataSource.length === 0) {
                console.error('Could not load any images for PhotoSwipe.');
                startSlideshow(); // Restart slideshow if something went wrong
                return;
            }

            const lightbox = new PhotoSwipeLightbox({
                dataSource: validDataSource,
                pswpModule: () => import('https://unpkg.com/photoswipe@5/dist/photoswipe.esm.min.js'),
                padding: { top: 20, bottom: 20, left: 40, right: 40 }

            });
            
            lightbox.on('close', () => startSlideshow());
            
            // Find the index of the link that was clicked
            const clickedIndex = allLinks.indexOf(clickedLink);
            
            // Open the lightbox at the correct slide
            lightbox.loadAndOpen(clickedIndex);
        }
    });
    console.log('Just-in-time PhotoSwipe listener is active.');
}

// --- All your helper functions are here ---

function showSlides(n) {
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    if (n >= slides.length) { slideIndex = 0; }
    if (n < 0) { slideIndex = slides.length - 1; }
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
    slideIndex += n;
    showSlides(slideIndex);
    resetSlideshow();
}

function currentSlide(n) {
    slideIndex = n;
    showSlides(slideIndex);
    resetSlideshow();
}

function startSlideshow() {
    clearInterval(slideInterval);
    slideInterval = setInterval(() => { plusSlides(1); }, 5000);
}

function stopSlideshow() {
    clearInterval(slideInterval);
}

function resetSlideshow() {
    stopSlideshow();
    startSlideshow();
}

// These listeners handle pausing the slideshow on hover
const slideshowContainer = document.querySelector(".slideshow-container");
slideshowContainer.addEventListener("mouseover", stopSlideshow);
slideshowContainer.addEventListener("mouseout", startSlideshow);

// --- Start the entire process when the DOM is ready ---
document.addEventListener("DOMContentLoaded", () => {
    initSlideshowDOM();
    initializePhotoSwipe();
});
