let slideIndex = 0;
let slideInterval;

// Initialize the Slideshow
function initSlides() {
    const slides = document.getElementsByClassName("slide");
    const dotsContainer = document.querySelector(".dots-container");

    // Generate Dots Dynamically
    dotsContainer.innerHTML = ""; // Clear previous dots
    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.setAttribute("onclick", `currentSlide(${i})`);
        dotsContainer.appendChild(dot);
    }

    showSlides(slideIndex);
    startSlideshow();
}

// Display the Current Slide
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

// Controls for Manual Navigation
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

// Automatic Slideshow Functionality
function startSlideshow() {
    slideInterval = setInterval(() => { plusSlides(1); }, 5000);
}

function stopSlideshow() {
    clearInterval(slideInterval);
}

function resetSlideshow() {
    stopSlideshow();
    startSlideshow();
}

// Pause Slideshow on Hover
const slideshowContainer = document.querySelector(".slideshow-container");
slideshowContainer.addEventListener("mouseover", stopSlideshow);
slideshowContainer.addEventListener("mouseout", startSlideshow);

// Initialize the slideshow when the page is loaded
document.addEventListener("DOMContentLoaded", initSlides);
