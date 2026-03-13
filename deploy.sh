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
rsync -av --delete --ignore-missing-args "$PROJECT_DIR/dist/" "$WEB_ROOT/"

echo ">>> Fixing file permissions..."
chown -R www-data:www-data "$WEB_ROOT"

echo ">>> Deployment complete."
