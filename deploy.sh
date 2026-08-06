#!/bin/bash
set -e

# ==========================================
# LOAD CONFIGURATION
# ==========================================

CONFIG_FILE="$(dirname "$0")/deploy.conf"

if [ -f "$CONFIG_FILE" ]; then
    . "$CONFIG_FILE"
else
    echo "Error: deploy.conf not found."
    exit 1
fi

if [ -z "$PROJECT_DIR" ] || [ -z "$WEB_ROOT" ]; then
    echo "Error: PROJECT_DIR or WEB_ROOT is not set in deploy.conf"
    exit 1
fi


# ==========================================
# BUILD MAIN VITE SITE
# ==========================================

echo ">>> Pulling latest source code from Git..."

cd "$PROJECT_DIR"

sudo -u "$(whoami)" git pull origin "$GIT_BRANCH"


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


# ==========================================
# DEPLOY MAIN WEBSITE
# ==========================================

echo ">>> Syncing files to web root: $WEB_ROOT"

mkdir -p "$WEB_ROOT"

rsync -av \
    --delete \
    --exclude '/git' \
    --exclude '*.shtml' \
    "$PROJECT_DIR/dist/" \
    "$WEB_ROOT/"


echo ">>> Copying custom error pages..."

cp -v "$PROJECT_DIR/error/"*.shtml "$WEB_ROOT/" || true


echo ">>> Fixing file permissions..."

if id www-data >/dev/null 2>&1; then
    chown -R www-data:www-data "$WEB_ROOT"
else
    echo "www-data user not found, skipping ownership change"
fi


# ==========================================
# STAGIT BUILD PROCESS
# ==========================================

echo ">>> Building Stagit Docker image..."
docker build -t stagit-builder -f Dockerfile.stagit "$PROJECT_DIR"

echo ">>> Running Stagit container..."
CONTAINER_ID=$(docker run -d -v "$PROJECT_DIR:/repo:ro" stagit-builder)

echo ">>> Waiting for Stagit to finish generating pages..."
docker wait "$CONTAINER_ID"

echo ">>> Extracting git pages from container..."

# Remove old Stagit output safely
if [ -d "$PROJECT_DIR/dist-git" ]; then
    sudo rm -rf "$PROJECT_DIR/dist-git"
fi

# Copy generated files
docker cp "$CONTAINER_ID:/app/dist-git" "$PROJECT_DIR/"

echo ">>> Fixing Stagit ownership..."

# Return ownership to current user
sudo chown -R "$DEPLOY_USER:$DEPLOY_GROUP" "$PROJECT_DIR/dist-git"

echo ">>> Cleaning up Stagit container..."
docker rm "$CONTAINER_ID"


echo ">>> Injecting Navbar, Footer, and Vite Assets into Stagit pages..."

# Extract Vite assets from built index.html
VITE_ASSETS=$(grep -oE '<link rel="stylesheet"[^>]+>|<script type="module"[^>]+></script>' \
"$PROJECT_DIR/dist/index.html" | tr '\n' ' ' | sed 's/|/\\|/g')


find "$PROJECT_DIR/dist-git" -type f -name "*.html" -print


find "$PROJECT_DIR/dist-git" -type f -name "*.html" | while read -r html_file; do

    # Add Vite CSS/JS before </head>
    sed -i "s|</head>|  ${VITE_ASSETS}\n</head>|" "$html_file"

    # Add navbar
    sed -i 's|<body>|<body>\n  <div id="navbar" class="navbar"></div>|' "$html_file"

    # Add footer
    sed -i 's|</body>|<div id="footer-placeholder"></div>\n</body>|' "$html_file"

done


echo ">>> Injecting Favicon and Logo into Stagit directories..."

FAVICON_SRC="$PROJECT_DIR/favicon_io/favicon-32x32.png"

if [ -f "$FAVICON_SRC" ]; then

    cp "$FAVICON_SRC" "$PROJECT_DIR/dist-git/favicon.png"
    cp "$FAVICON_SRC" "$PROJECT_DIR/dist-git/logo.png"

    for repo_dir in "$PROJECT_DIR/dist-git"/*/; do
        if [ -d "$repo_dir" ]; then
            cp "$FAVICON_SRC" "${repo_dir}favicon.png"
            cp "$FAVICON_SRC" "${repo_dir}logo.png"
        fi
    done

fi


echo ">>> Syncing Git pages to web root..."

mkdir -p "$WEB_ROOT/git"

rsync -av --delete \
"$PROJECT_DIR/dist-git/" \
"$WEB_ROOT/git/"


echo ">>> Fixing final permissions..."

if id www-data >/dev/null 2>&1; then
    sudo chown -R www-data:www-data "$WEB_ROOT"
else
    echo "www-data user not found, skipping ownership change"
fi


echo ">>> Deployment complete."