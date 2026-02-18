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

# --- 2. Main Logic: Check if this is the first run or an update ---
if [ ! -d "$BACKUP_DIR" ]; then
    # --- FIRST RUN ---
    echo -e "\n${YELLOW}No backup directory found. Performing first-time compression...${NC}"
    
    # Automatic Backup
    echo -e "${YELLOW}Backing up '$SOURCE_DIR' to '$BACKUP_DIR'...${NC}"
    cp -r "$SOURCE_DIR" "$BACKUP_DIR"
    echo -e "${GREEN}Backup successful!${NC}"

    # Compression Loop
    echo -e "\n${YELLOW}Starting full image compression...${NC}"
    find "$SOURCE_DIR" -type d | while read -r dir; do
        echo "-> Processing directory: '$dir'"
        imagemin "$dir"/*.{png,jpg,jpeg} --plugin=pngquant --plugin=mozjpeg --out-dir="$dir" --no-glob &> /dev/null || true
    done
    echo -e "${GREEN}Full compression finished!${NC}"

else
    # --- UPDATE RUN ---
    echo -e "\n${YELLOW}Backup directory found. Scanning for new images to compress...${NC}"
    
    find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r current_file; do
        # Construct the path for the corresponding file in the backup directory
        relative_path="${current_file#$SOURCE_DIR/}"
        backup_file="$BACKUP_DIR/$relative_path"

        # Check if the file exists in the backup. If NOT, it's a new file.
        if [ ! -f "$backup_file" ]; then
            echo -e "-> ${GREEN}New image detected:${NC} '$current_file'"
            
            # 1. First, copy the new original to the backup to keep it safe
            echo "   - Backing up new image..."
            mkdir -p "$(dirname "$backup_file")"
            cp "$current_file" "$backup_file"

            # 2. Now, compress the image in the source directory
            echo "   - Compressing new image..."
            imagemin "$current_file" --plugin=pngquant --plugin=mozjpeg --out-dir="$(dirname "$current_file")"
        # else
            # Optional: Uncomment the line below to see which files are being skipped
            # echo "-> Skipping '$current_file' (already compressed)."
        fi
    done
    echo -e "${GREEN}Update scan finished!${NC}"
fi

echo -e "\n\n${GREEN}All tasks finished successfully!${NC}"
