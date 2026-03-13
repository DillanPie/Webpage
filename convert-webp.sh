#!/bin/bash
# This script intelligently converts new source images (JPG/PNG) to WebP format
# using the reliable 'cwebp' utility.

# --- Enable features for robust scripting ---
set -e # Halt the script if any command fails

# --- Configuration ---
GREEN=$'\\033[0;32m'
YELLOW=$'\\033[0;33m'
RED=$'\\033[0;31m'
NC=$'\\033[0m' # No Color

SOURCE_DIR="public/Photos"
OUTPUT_DIR="public/Photos-WebP"
WEBP_QUALITY=75

# --- 1. Prerequisite Check ---
echo -e "${YELLOW}Checking for cwebp...${NC}"
if ! command -v cwebp &> /dev/null; then
    echo -e "${RED}Error: cwebp is not installed.${NC}"
    echo "Please run: ${GREEN}sudo apt-get install webp${NC}"
    exit 1
fi
echo -e "${GREEN}cwebp found.${NC}"

# --- 2. Main Logic: Find and Convert ---
echo -e "\\n${YELLOW}Scanning for new images to convert to WebP...${NC}"

find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r source_file; do

    # Construct the expected path for the final .webp file
    relative_path="${source_file#$SOURCE_DIR/}"
    webp_output_file="$OUTPUT_DIR/${relative_path%.*}.webp"

    # Check if the WebP file already exists. If NOT, it's a new file to process.
    if [ ! -f "$webp_output_file" ]; then
        echo -e "-> ${GREEN}New image detected:${NC} '$source_file'"

        # 1. Create the corresponding subdirectory in the output folder.
        output_subdir=$(dirname "$webp_output_file")
        mkdir -p "$output_subdir"

        echo "   - Converting to WebP..."
        # 2. Run cwebp. It's simple: cwebp [options] input -o output
        cwebp -q "$WEBP_QUALITY" "$source_file" -o "$webp_output_file"
    fi
done

echo -e "\\n${GREEN}Image processing finished successfully!${NC}"
echo -e "Check your '${OUTPUT_DIR}' folder."
