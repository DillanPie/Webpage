#!/bin/bash
set -euo pipefail

# ==========================================
# Cleanup on Exit
# ==========================================
cleanup() {
    if [[ -n "${CONTAINER_ID:-}" ]]; then
        docker rm -f "$CONTAINER_ID" >/dev/null 2>&1 || true
    fi
}
trap cleanup EXIT

# ==========================================
# Load Configuration
# ==========================================
CONFIG_FILE="$(dirname "$0")/deploy.conf"

if [[ -f "$CONFIG_FILE" ]]; then
    . "$CONFIG_FILE"
else
    echo "Error: deploy.conf not found."
    exit 1
fi

# ==========================================
# Validate Configuration
# ==========================================
if [[ -z "${PROJECT_DIR:-}" || -z "${WEB_ROOT:-}" ]]; then
    echo "Error: PROJECT_DIR or WEB_ROOT is not set in deploy.conf"
    exit 1
fi

if [[ -z "${DOCKER_IMAGE_NAME:-}" ]]; then
    echo "Error: DOCKER_IMAGE_NAME is not set in deploy.conf"
    exit 1
fi

# ==========================================
# Check Required Commands
# ==========================================
for cmd in docker rsync grep sed find; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Error: Required command '$cmd' is not installed."
        exit 1
    fi
done

# ==========================================
# Build Main Website
# ==========================================
echo ">>> Entering project directory..."
cd "$PROJECT_DIR"

echo ">>> Pulling latest source code from Git..."
git pull origin "$GIT_BRANCH"

echo ">>> Building Docker image: $DOCKER_IMAGE_NAME..."
docker build -t "$DOCKER_IMAGE_NAME" .

echo ">>> Creating temporary container..."
CONTAINER_ID=$(docker create "$DOCKER_IMAGE_NAME")

echo ">>> Preparing dist folder..."
rm -rf "$PROJECT_DIR/dist"
mkdir -p "$PROJECT_DIR/dist"

echo ">>> Extracting build files..."
docker cp "$CONTAINER_ID:/app/dist/." "$PROJECT_DIR/dist/"

echo ">>> Removing temporary container..."
docker rm "$CONTAINER_ID"
unset CONTAINER_ID

echo ">>> Syncing website to $WEB_ROOT..."
mkdir -p "$WEB_ROOT"

rsync -av --delete \
    --exclude '/git' \
    "$PROJECT_DIR/dist/" \
    "$WEB_ROOT/"

echo ">>> Copying custom error pages..."
cp -v "$PROJECT_DIR/error/"*.shtml "$WEB_ROOT/" 2>/dev/null || true

echo ">>> Fixing permissions..."
if id www-data >/dev/null 2>&1; then
    chown -R www-data:www-data "$WEB_ROOT"
else
    echo ">>> www-data user not found; skipping chown."
fi

echo ">>> Main website deployment complete."

# ==========================================
# Build Stagit Pages
# ==========================================
echo
echo "=========================================="
echo "Building Stagit Pages"
echo "=========================================="

echo ">>> Building Stagit Docker image..."
docker build -t stagit-builder -f Dockerfile.stagit "$PROJECT_DIR"

echo ">>> Running Stagit container..."
CONTAINER_ID=$(docker run -d -v "$PROJECT_DIR:/repo:ro" stagit-builder)

echo ">>> Waiting for Stagit..."
docker wait "$CONTAINER_ID" >/dev/null

echo ">>> Extracting generated pages..."
rm -rf "$PROJECT_DIR/dist-git"

docker cp "$CONTAINER_ID:/app/dist-git" "$PROJECT_DIR/"

docker rm "$CONTAINER_ID"
unset CONTAINER_ID

# ==========================================
# Inject Vite Assets
# ==========================================
echo ">>> Injecting navbar, footer, and Vite assets..."

if [[ ! -f "$PROJECT_DIR/dist/index.html" ]]; then
    echo "Error: dist/index.html not found."
    exit 1
fi

VITE_ASSETS=$(
grep -oE '<link rel="stylesheet"[^>]+>|<script type="module"[^>]+></script>' \
"$PROJECT_DIR/dist/index.html" |
tr '\n' ' '
)

find "$PROJECT_DIR/dist-git" -type f -name "*.html" | while read -r html_file
do
    sed -i "s|</head>|  ${VITE_ASSETS}\n</head>|" "$html_file"

    sed -i \
        's|<body>|<body>\n  <div id="navbar" class="navbar"></div>|' \
        "$html_file"

    sed -i \
        's|</body>|  <div id="footer-placeholder"></div>\n</body>|' \
        "$html_file"
done

# ==========================================
# Copy Favicons
# ==========================================
echo ">>> Installing favicon and logo..."

FAVICON_SRC="$PROJECT_DIR/favicon_io/favicon-32x32.png"

if [[ -f "$FAVICON_SRC" ]]; then

    cp "$FAVICON_SRC" "$PROJECT_DIR/dist-git/favicon.png"
    cp "$FAVICON_SRC" "$PROJECT_DIR/dist-git/logo.png"

    for repo_dir in "$PROJECT_DIR"/dist-git/*/
    do
        [[ -d "$repo_dir" ]] || continue

        cp "$FAVICON_SRC" "${repo_dir}favicon.png"
        cp "$FAVICON_SRC" "${repo_dir}logo.png"
    done
else
    echo "Warning: favicon source not found."
fi

# ==========================================
# Deploy Git Pages
# ==========================================
echo ">>> Syncing Git pages..."

mkdir -p "$WEB_ROOT/git"

rsync -av --delete \
    "$PROJECT_DIR/dist-git/" \
    "$WEB_ROOT/git/"

echo ">>> Fixing permissions..."

if id www-data >/dev/null 2>&1; then
    chown -R www-data:www-data "$WEB_ROOT"
fi

echo
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="