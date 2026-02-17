document.addEventListener("DOMContentLoaded", () => {
    fetch('/partials/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(data => {
            const navbar = document.getElementById('navbar');
            if (!navbar) return;

            // --- Dropdown Menu Logic (No Changes Here) ---
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
            // --- End of Dropdown Logic ---

            // --- REVISED Highlighting Logic ---
            const links = menu.querySelectorAll('a');
            const currentPath = window.location.pathname;
            const isHomePage = currentPath === '/' || currentPath.endsWith('/index.html');

            // Clear any previous active states
            links.forEach(link => link.classList.remove('active'));

            if (isHomePage) {
                // --- Homepage: Scroll-aware and Initial Highlighting ---
                const contactSection = document.getElementById('contact');
                const homeLink = menu.querySelector('a[href="index.html"]');
                const contactLink = menu.querySelector('a[href="index.html#contact"]');

                if (!contactSection || !homeLink || !contactLink) {
                    console.error("Required elements for scroll-spying not found.");
                    // Fallback to simple highlight if elements are missing
                    (window.location.hash === '#contact' ? contactLink : homeLink)?.classList.add('active');
                    return;
                }

                // 1. Set initial active link on page load
                if (window.location.hash === '#contact') {
                    contactLink.classList.add('active');
                } else {
                    homeLink.classList.add('active');
                }

                // 2. Set up the observer to watch the contact section
                const observerOptions = {
                    root: null, // observing intersections relative to the viewport
                    threshold: 0.6 // trigger when 60% of the contact section is visible
                };

                const observerCallback = (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            // Contact section is visible: highlight "Contact"
                            homeLink.classList.remove('active');
                            contactLink.classList.add('active');
                        } else {
                            // Contact section is not visible: highlight "Home"
                            contactLink.classList.remove('active');
                            homeLink.classList.add('active');
                        }
                    });
                };

                const observer = new IntersectionObserver(observerCallback, observerOptions);
                observer.observe(contactSection);

            } else {
                // --- Other Pages: Simple Highlighting Logic ---
                let foundMatch = false;
                links.forEach(link => {
                    const linkPath = new URL(link.href).pathname;
                    if (currentPath.includes(linkPath) && linkPath !== '/') {
                        link.classList.add('active');
                        foundMatch = true;
                    }
                });
                // Fallback for root path if no other match is found
                if (!foundMatch) {
                    menu.querySelector('a[href="index.html"]')?.classList.add('active');
                }
            }
        })
        .catch(error => console.error('Error loading or processing navbar:', error));
});
