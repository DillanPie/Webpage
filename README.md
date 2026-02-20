# Dillan Suon's Portfolio - Cybersecurity & Programming

Welcome to my personal portfolio website! This site showcases my skills, projects, and resume, all wrapped in a clean, dark-themed design inspired by the **Gruvbox** color palette.

---

## Key Features

- 💻 **Responsive Design:** Looks great on all devices.
- ⚡ **Optimized Build Process:** Uses Vite to bundle and minify assets (CSS, JS) for fast production performance.
- 📖 **Multiple Pages:** Includes dedicated sections for About Me, Projects, Resume, Photo Gallery, and Favorite Media.
- 🖼️ **Interactive Photo Galleries:** An auto-playing slideshow and a masonry-style gallery, both powered by PhotoSwipe for a full-screen lightbox experience.
- 📂 **Project Showcase:** A grid-based layout for projects with links to live demos and GitHub repositories.
- 📅 **GitHub Activity Tracker:** A calendar on the projects page to visualize contribution history.
- 📑 **Embedded Resume Viewer:** Preview the resume directly on the site without needing to download.
- 🚀 **Custom Start Page:** A functional "New Tab" replacement with a live weather widget and quick links.
- 🎨 **Consistent Theming:** Dark theme inspired by the **Gruvbox** color palette used throughout the site.

---

## Technologies, Libraries, and Tools

This project takes advantage of several modern web technologies to create a feature-rich and performant experience.

#### Core Technologies

- **HTML5 & CSS3:** For structure and styling.
- **JavaScript (ESM):** For interactivity, dynamic content, and API integration.

#### Build & Deployment

- **Vite:** A next-generation frontend build tool that bundles the site's assets for optimal performance.
- **Docker:** Used to create a consistent, isolated, and secure environment for building the production version of the site.

#### Design & Fonts

- **Gruvbox:** The color scheme inspiration for the entire site's aesthetic.
- **Nerd Fonts:** For iconic font glyphs used in buttons, links, and titles.

#### JavaScript Libraries & APIs

- **PhotoSwipe:** For creating beautiful, touch-friendly, and responsive image galleries.
- **GitHub Calendar:** To embed the GitHub contribution graph.
- **OpenWeather API:** To fetch and display real-time weather data.

---

## Development & Deployment

This project uses a modern toolchain for development and an automated, secure process for deployment.

### Getting Started (Local Development)

To run this project on your local machine, you will need Node.js installed.

1.  **Clone this repository:**

    ```bash
    git clone https://github.com/DillanPie/Webpage.git
    cd Webpage
    ```

2.  **Install project dependencies:**

    ```bash
    npm install
    ```

3.  **Run the Vite development server:**

    ```bash
    npm run dev
    ```

    This will start a local server (e.g., at `http://localhost:5173`) with hot-reloading, allowing you to see your changes live as you edit the source code.

4.  **Creating a Production Build:**
    To see what the final, optimized output will look like, you can run:
    ```bash
    npm run build
    ```
    This will create a `dist` folder containing the bundled and minified static files that get deployed to the server.

### Automated Deployment Pipeline

This repository is configured for automated, secure deployments. A custom `deploy.sh` script on the production server is triggered after a `git pull`. This script uses **Docker** to:

1.  Build a clean, ephemeral Docker image based on the `Dockerfile`.
2.  Install all dependencies and run the Vite production build (`npm run build`) inside the isolated container.
3.  Extract the optimized `dist` folder from the container.
4.  Deploy the contents to the webserver root, ensuring the production environment remains clean and secure, with no build tools installed directly on the host.

### Image Compression Workflow

This project includes a separate Bash script (`compress-photos.sh`) for pre-optimizing image assets.

**Usage Instructions:**

1.  **Prerequisites:** Ensure you have Node.js and npm installed.
2.  **Install Tools Globally:**
    ```bash
    npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant
    ```
3.  **Add New Images:** Place new, uncompressed images into the `Photos` folder.
4.  **Run the Script:**
    ```bash
    ./compress-photos.sh
    ```
    _If you get a "permission denied" error, first make the script executable by running `chmod +x compress-photos.sh`._
