// navbar.js

document.addEventListener("DOMContentLoaded", () => {
    fetch('partials/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar').innerHTML = data;

            // Highlight Active Link Based on URL
            const links = document.querySelectorAll('.navbar a');
            links.forEach(link => {
                if (link.href === window.location.href) {
                    link.classList.add('active');

                    // Apply fade-in animation to the active link
                    link.style.opacity = '0';
                    link.style.transition = 'opacity 0.6s'; // Ensures smooth fade-in effect
                    setTimeout(() => {
                        link.style.opacity = '1';
                    }, 100);
                }
            });
        })
        .catch(error => console.error('Error loading navbar:', error));
});
