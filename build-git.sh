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

# Write GitHub clone URL directly into the repository configuration
echo "https://github.com/DillanPie/Webpage" > /repos/portfolio.git/url

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

# 1. Stagit relies on log.html as the main page.
cp log.html log-full.html

# 2. Hide commits after the 10th row using inline CSS on log.html
sed -i 's|</head>|<style>table#log tbody tr:nth-child(n+11) { display: none; }</style></head>|' log.html

# 3. Inject the "View Full Commit History" button at the bottom of the page (right before </body>)
sed -i 's|</body>|<div style="text-align: center; margin: 40px 0;"><a href="log-full.html" style="font-size: 1.1em; color: var(--gruvbox-yellow); font-weight: bold; border: 1px solid var(--gruvbox-bg-border); padding: 10px 20px; border-radius: 6px; background: var(--gruvbox-bg-soft); transition: background 0.2s; text-decoration: none;">View Full Commit History \&rarr;</a></div></body>|' log.html
# -----------------------

# 4. Generate the Root Index Page
echo "Generating stagit index..."


# 4. Generate the Root Index Page
echo "Generating stagit index..."
cd /repos

# Run stagit-index on the copied folder. 
# This guarantees it outputs <a href="portfolio/log.html">portfolio</a>
stagit-index portfolio.git > "$OUT_DIR/index.html"

echo "Stagit build complete."
