#!/bin/bash
set -e

# Load configuration variables from a private file
# The '.' command is a synonym for 'source'
if [ -f "$(dirname "$0")/deploy.conf" ]; then
    . "$(dirname "$0")/deploy.conf"
else
    echo "Error: deploy.conf not found."
    exit 1
fi

# --- Deployment Steps (Now using variables) ---

echo ">>> Pulling latest source code..."
cd "$PROJECT_DIR"
git pull origin main

echo ">>> Building Docker image: $DOCKER_IMAGE_NAME..."
docker build -t "$DOCKER_IMAGE_NAME" .

echo ">>> Creating temporary container..."
CONTAINER_ID=$(docker create "$DOCKER_IMAGE_NAME")

echo ">>> Extracting build files from container..."
rm -rf "$PROJECT_DIR/dist" 
docker cp "$CONTAINER_ID:/app/dist" "$PROJECT_DIR/dist"

echo ">>> Cleaning up container..."
docker rm "$CONTAINER_ID"

echo ">>> Deploying files to web root..."
rsync -av --delete "$PROJECT_DIR/dist/" "$WEB_ROOT/"

rm -rf "$PROJECT_DIR/dist"

echo ">>> Fixing file permissions..."
chown -R www-data:www-data "$WEB_ROOT"

echo ">>> Deployment successfully completed."
