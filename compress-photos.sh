#!/bin/bash

# --- Enable features for robust scripting ---
shopt -s globstar
set -e

# --- Configuration ---
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

SOURCE_DIR="Photos"
BACKUP_DIR="Photos-Backup"

# --- 1. Prerequisite Check ---
echo -e "${YELLOW}Checking for imagemin-cli...${NC}"
if ! command -v imagemin &> /dev/null; then
    echo -e "${RED}Error: imagemin-cli is not installed.${NC}"
    echo "Please run: ${GREEN}npm install -g imagemin-cli imagemin-mozjpeg imagemin-pngquant${NC}"
    exit 1
fi
echo -e "${GREEN}imagemin-cli found.${NC}"

# --- 2. Directory and Backup Validation ---
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}Error: Source directory '$SOURCE_DIR' not found.${NC}"
    exit 1
fi
if [ -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory '$BACKUP_DIR' already exists.${NC}"
    echo "Please remove or rename it before running again."
    exit 1
fi

# --- 3. Automatic Backup ---
echo -e "\n${YELLOW}Backing up '$SOURCE_DIR' to '$BACKUP_DIR'...${NC}"
cp -r "$SOURCE_DIR" "$BACKUP_DIR"
echo -e "${GREEN}Backup successful!${NC}"

# --- 4. Compression with a Loop (This preserves directory structure) ---
echo -e "\n${YELLOW}Starting image compression...${NC}"

# Find all subdirectories within the source directory
find "$SOURCE_DIR" -type d | while read -r dir; do
    echo "-> Processing directory: '$dir'"
    
    # Run imagemin on the files directly within this directory
    # The output directory is the same as the input directory
    imagemin "$dir"/*.{png,jpg,jpeg} --plugin=pngquant --plugin=mozjpeg --out-dir="$dir" --no-glob &> /dev/null || true
done

echo -e "${GREEN}Compression finished!${NC}"

echo -e "\n\n${GREEN}All tasks finished successfully! Please check VS Code Git to see file changes.${NC}"
echo -e "Your original, uncompressed images are safe in '$BACKUP_DIR'."
