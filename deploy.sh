#!/bin/bash
set -euo pipefail

# --- Load configuration ---
CONF_FILE="$(dirname "$0")/deploy.conf"
if [ -f "$CONF_FILE" ]; then
    . "$CONF_FILE"
else
    echo "Error: deploy.conf not found at $CONF_FILE"
    exit 1
fi

# --- Ensure PROJECT_DIR exists ---
if [ ! -d "$PROJECT_DIR" ]; then
    echo "Error: PROJECT_DIR '$PROJECT_DIR' does not exist."
    exit 1
fi

# --- Update source code ---
echo ">>> Pulling latest source code from Git..."
cd "$PROJECT_DIR"

# Make sure the repository is owned by current user to avoid permission errors
sudo chown -R $USER:$USER "$PROJECT_DIR"

# Fetch and reset to the desired branch (main)
git fetch origin "$GIT_BRANCH"
git reset --hard "origin/$GIT_BRANCH"

# --- Build Docker image ---
echo ">>> Building Docker image: $DOCKER_IMAGE_NAME"
docker build -t "$DOCKER_IMAGE_NAME" .

# --- Prepare dist folder ---
echo ">>> Preparing dist folder..."
rm -rf "$PROJECT_DIR/dist"
mkdir -p "$PROJECT_DIR/dist"

# --- Create temporary container and copy build output ---
echo ">>> Extracting build files from container..."
CONTAINER_ID=$(docker create "$DOCKER_IMAGE_NAME")
docker cp "$CONTAINER_ID:/app/dist/." "$PROJECT_DIR/dist/"
docker rm "$CONTAINER_ID"

# --- Deploy to web root ---
echo ">>> Syncing files to web root: $WEB_ROOT"
mkdir -p "$WEB_ROOT"
rsync -av --delete "$PROJECT_DIR/dist/" "$WEB_ROOT/"

# --- Fix permissions ---
echo ">>> Setting permissions..."
chown -R www-data:www-data "$WEB_ROOT"

# --- Cleanup local dist ---
rm -rf "$PROJECT_DIR/dist"

echo ">>> Deployment successfully completed!"
