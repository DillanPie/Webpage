// js/include/navbar.js

document.addEventListener("DOMContentLoaded", () => {
    fetch('/partials/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(data => {
            const navbar = document.getElementById('navbar');
            if (!navbar) return;

            // --- Dropdown Menu Logic (No changes here) ---
            const toggleButton = document.createElement('button');
            toggleButton.className = 'navbar-toggle';
            toggleButton.setAttribute('aria-label', 'Toggle navigation');
            toggleButton.setAttribute('aria-expanded', 'false');
            toggleButton.innerHTML = `
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            `;
            const menu = document.createElement('div');
            menu.className = 'navbar-menu';
            menu.innerHTML = data;
            navbar.appendChild(toggleButton);
            navbar.appendChild(menu);
            toggleButton.addEventListener('click', () => {
                const isExpanded = menu.classList.toggle('show');
                toggleButton.setAttribute('aria-expanded', isExpanded);
            });

            // --- REVISED Highlighting Logic ---
            const links = menu.querySelectorAll('a');
            const currentPath = window.location.pathname;
            const isHomePage = currentPath === '/' || currentPath.endsWith('/index.html');
            let observer = null; // <-- FIX 1: Define observer in a broader scope

            // --- FIX 2: Create a cleanup function ---
            const cleanupAndNavigate = (event) => {
                // Check if the link is an internal page link, not a hash link on the same page
                const link = event.currentTarget;
                const isSamePageHashLink = link.pathname === window.location.pathname && link.hash;

                if (!isSamePageHashLink) {
                    if (observer) {
                        console.log('Disconnecting IntersectionObserver before navigating away.');
                        observer.disconnect(); // This is the crucial cleanup step
                    }
                }
                // For hash links, we let the default behavior happen (scrolling)
                // For other links, the default navigation will now proceed without interruption.
            };

            // --- FIX 3: Attach the cleanup listener to ALL links ---
            links.forEach(link => {
                link.addEventListener('click', cleanupAndNavigate);
            });

            links.forEach(link => link.classList.remove('active'));

            if (isHomePage) {
                // --- Homepage: Scroll-aware and Initial Highlighting ---
                const contactSection = document.getElementById('contact');
                const homeLink = menu.querySelector('a[href="index.html"]');
                const contactLink = menu.querySelector('a[href="index.html#contact"]');
                
                if (!contactSection || !homeLink || !contactLink) {
                    // Fallback logic remains the same
                    return;
                }

                if (window.location.hash === '#contact') {
                    contactLink.classList.add('active');
                } else {
                    homeLink.classList.add('active');
                }

                const observerOptions = { root: null, threshold: 0.6 };
                const observerCallback = (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            homeLink.classList.remove('active');
                            contactLink.classList.add('active');
                        } else {
                            contactLink.classList.remove('active');
                            homeLink.classList.add('active');
                        }
                    });
                };

                // Assign the created observer to our variable
                observer = new IntersectionObserver(observerCallback, observerOptions);
                observer.observe(contactSection);
            } else {
                // --- Other Pages: Simple Highlighting Logic (No changes here) ---
                // ... your existing logic for other pages
            }
        })
        .catch(error => console.error('Error loading or processing navbar:', error));
});
