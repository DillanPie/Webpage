# Dillan Suon's Portfolio - Cybersecurity & Programming

Welcome to my personal portfolio website! This site showcases my skills, projects, and resume, all wrapped in a clean, dark-themed design inspired by the **Gruvbox** color palette.

---

## Key Features

-   💻 **Responsive Design:** Looks great on all devices.
-   📖 **Multiple Pages:** Includes dedicated sections for About Me, Projects, Resume, Photo Gallery, and Favorite Media.
-   🖼️ **Interactive Photo Galleries:** An auto-playing slideshow on the "About" page and a masonry-style gallery, both powered by PhotoSwipe for a full-screen lightbox experience.
-   📂 **Project Showcase:** A grid-based layout for projects with links to live demos and GitHub repositories.
-   📅 **GitHub Activity Tracker:** A calendar on the projects page to visualize contribution history.
-   📑 **Embedded Resume Viewer:** Preview the resume directly on the site without needing to download.
-   🚀 **Custom Start Page:** A functional "New Tab" replacement with a live weather widget and quick links.
-   🎨 **Consistent Theming:** Dark theme inspired by the **Gruvbox** color palette used throughout the site.
-   📬 **Contact Form:** Simple `mailto:` form for reaching out directly.

---

## Technologies, Libraries, and Tools

This project takes advantage of several modern web technologies and third-party resources to create a feature-rich experience.

#### Core Technologies
-   **HTML5 & CSS3:** For structure and styling.
-   **JavaScript:** For interactivity, dynamic content, and API integration.

#### Design & Fonts
-   **Gruvbox:** The color scheme inspiration for the entire site's aesthetic.
-   **Nerd Fonts:** For iconic font glyphs used in buttons, links, and titles.

#### JavaScript Libraries & APIs
-   **PhotoSwipe:** For creating beautiful, touch-friendly, and responsive image galleries and slideshows.
-   **GitHub Calendar:** To embed and display the GitHub contribution graph on the projects page.
-   **OpenWeather API:** To fetch and display real-time weather data on the custom start page.

#### Development & Asset Tools
-   **ChatGPT:** Assisted in code generation and website structure.
-   **favicon.io:** Used to generate the site's favicon from text.
-   **imagemin-cli & Plugins:** For automated, command-line image compression to improve site performance.

---

## Getting Started

1.  Clone this repository:
    ```bash
    git clone https://github.com/DillanPie/Webpage.git
    ```
2.  Open the `index.html` file in your browser to view the website.

### Image Compression Workflow

This project includes an intelligent Bash script (`compress-photos.sh`) to automate the compression of all images, which is essential for website performance.

**How It Works:**
The script is "state-aware." It uses the `Photos-Backup` directory (which is tracked in Git) as a source of truth.

*   **First Run:** If the backup directory is missing (e.g., on a fresh clone), the script will create a backup of your `Photos` directory and then perform a full compression of every image.
*   **Update Run:** If the backup directory exists, the script will scan the `Photos` directory and only compress images that are new or not present in the backup. This saves time and prevents re-compressing files unnecessarily.

**Usage Instructions:**
1.  **Prerequisites:** Ensure you have Node.js and npm installed on your system.
2.  **Install Tools:** Install `imagemin-cli` and its plugins globally by running:
    ```bash
    npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant
    ```
3.  **Add New Images:** Place any new, uncompressed images into the appropriate subdirectories within the `Photos` folder.
4.  **Run the Script:** From the project's root directory, run the script:
    ```bash
    ./compress-photos.sh
    ```
    *If you get a "permission denied" error, first make the script executable by running `chmod +x compress-photos.sh`.*

The script will automatically back up and compress only the new files, and you will see the changes reflected in Git.
