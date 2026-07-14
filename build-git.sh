#!/bin/sh
# build-git.sh
set -e

OUT_DIR="/app/dist-git"
mkdir -p "$OUT_DIR"

# 1. Fix the Name Bug: Copy instead of symlinking!
# By physically copying the folder, Stagit sees the real name as "portfolio.git",
# and successfully strips it to "portfolio".
mkdir -p /repos
cp -R /repo/.git /repos/portfolio.git

# 2. Setup Main Index CSS
cp /repo/css/stagit.css "$OUT_DIR/style.css"

# 3. Generate Portfolio Repo Pages
echo "Generating portfolio repo..."
mkdir -p "$OUT_DIR/portfolio"
cd "$OUT_DIR/portfolio"

# Copy CSS into the repo folder
cp /repo/css/stagit.css ./style.css

# Run stagit directly on the copied repo
stagit -c ".cache" /repos/portfolio.git
cp log.html index.html

# 4. Generate the Root Index Page
echo "Generating stagit index..."
cd /repos

# Run stagit-index on the copied folder. 
# This guarantees it outputs <a href="portfolio/log.html">portfolio</a>
stagit-index portfolio.git > "$OUT_DIR/index.html"

echo "Stagit build complete."
