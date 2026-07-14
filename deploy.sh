#!/bin/bash
set -e

# Load configuration
CONFIG_FILE="$(dirname "$0")/deploy.conf"
if [ -f "$CONFIG_FILE" ]; then
    . "$CONFIG_FILE"
else
    echo "Error: deploy.conf not found."
    exit 1
fi

# Ensure variables are set
if [ -z "$PROJECT_DIR" ] || [ -z "$WEB_ROOT" ]; then
    echo "Error: PROJECT_DIR or WEB_ROOT is not set in deploy.conf"
    exit 1
fi

echo ">>> Pulling latest source code from Git..."
cd "$PROJECT_DIR"
sudo -u $(whoami) git pull origin main

echo ">>> Building Docker image: $DOCKER_IMAGE_NAME..."
docker build -t "$DOCKER_IMAGE_NAME" .

echo ">>> Creating temporary container..."
CONTAINER_ID=$(docker create "$DOCKER_IMAGE_NAME")

echo ">>> Preparing dist folder..."
rm -rf "$PROJECT_DIR/dist"
mkdir -p "$PROJECT_DIR/dist"

echo ">>> Extracting build files from container..."
docker cp "$CONTAINER_ID:/app/dist/." "$PROJECT_DIR/dist/"

echo ">>> Cleaning up container..."
docker rm "$CONTAINER_ID"

echo ">>> Syncing files to web root: $WEB_ROOT"
rsync -av --delete --exclude '/git' --ignore-missing-args "$PROJECT_DIR/dist/" "$WEB_ROOT/"

echo "Copy custom error pages to live root"
cp -v "$PROJECT_DIR/error/"*.shtml "$WEB_ROOT/" || true

echo ">>> Fixing file permissions..."
chown -R www-data:www-data "$WEB_ROOT"

echo ">>> Deployment complete."

# ==========================================
# STAGIT BUILD PROCESS
# ==========================================
echo ">>> Building Stagit Docker image..."
docker build -t stagit-builder -f Dockerfile.stagit "$PROJECT_DIR"

echo ">>> Running Stagit container..."
# Notice the -v mount: it mounts your website project directory as read-only
CONTAINER_ID=$(docker run -d -v "$PROJECT_DIR:/repo:ro" stagit-builder)

echo ">>> Waiting for Stagit to finish generating pages..."
docker wait "$CONTAINER_ID"

echo ">>> Extracting git pages from container..."
rm -rf "$PROJECT_DIR/dist-git"
# Copy the generated files out of the container
docker cp "$CONTAINER_ID:/app/dist-git" "$PROJECT_DIR/"

echo ">>> Cleaning up Stagit container..."
docker rm "$CONTAINER_ID"

echo ">>> Injecting Navbar, Footer, and Vite Assets into Stagit pages..."

# 1. Extract the compiled CSS and JS tags from Vite's built index.html
# This ensures we get the correct hashed filenames (e.g., /assets/main-xyz.js)
VITE_ASSETS=$(grep -oE '<link rel="stylesheet"[^>]+>|<script type="module"[^>]+></script>' "$PROJECT_DIR/dist/index.html" | tr '\n' ' ' | sed 's/|/\\|/g')

# 2. Loop through all generated stagit HTML files and inject the HTML
find "$PROJECT_DIR/dist-git" -type f -name "*.html" | while read -r html_file; do
    # Inject Vite assets (global styles and main JS) right before </head>
    sed -i "s|</head>|  ${VITE_ASSETS}\n</head>|" "$html_file"

    # Inject Navbar placeholder right after <body>
    sed -i 's|<body>|<body>\n  <div id="navbar" class="navbar"></div>|' "$html_file"

    # Inject Footer placeholder right before </body>
    sed -i 's|</body>|  <div id="footer-placeholder"></div>\n</body>|' "$html_file"
done

echo ">>> Injecting Favicon and Logo into Stagit directories..."
# Stagit looks specifically for files named "favicon.png" and "logo.png".
# Since your favicons are in favicon_io/, we map the 32x32 one to both names.

FAVICON_SRC="$PROJECT_DIR/favicon_io/favicon-32x32.png"

# Copy to the root of the git pages
cp "$FAVICON_SRC" "$PROJECT_DIR/dist-git/favicon.png" || true
cp "$FAVICON_SRC" "$PROJECT_DIR/dist-git/logo.png" || true

# Loop through all repo subdirectories and copy them there too
for repo_dir in "$PROJECT_DIR/dist-git"/*/; do
    if [ -d "$repo_dir" ]; then
        cp "$FAVICON_SRC" "${repo_dir}favicon.png" || true
        cp "$FAVICON_SRC" "${repo_dir}logo.png" || true
    fi
done

echo ">>> Syncing Git pages to web root..."
# Sync the extracted git files into the /git subfolder of your web root
mkdir -p "$WEB_ROOT/git"
rsync -av --delete "$PROJECT_DIR/dist-git/" "$WEB_ROOT/git/"

echo ">>> Fixing file permissions..."
chown -R www-data:www-data "$WEB_ROOT"

echo ">>> Deployment complete."
