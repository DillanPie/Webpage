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

# --- 1. GENERATE THE GIT GRAPH ---
echo "Generating git commit graph..."

echo "Generating git commit graph..."

# Feed the external graph.txt directly into grawkit
grawkit /app/graph.txt > "$OUT_DIR/portfolio/graph.svg"

# --- 2. SETUP THE LOG PAGES ---
cp log.html log-full.html

# Hide commits after the 10th row using inline CSS on log.html
sed -i 's|</head>|<style>table#log tbody tr:nth-child(n+11) { display: none; }</style></head>|' log.html

# Inject the "View Full Commit History" button
sed -i 's|</body>|<div style="text-align: center; margin: 40px 0;"><a href="log-full.html" style="font-size: 1.1em; color: var(--gruvbox-yellow); font-weight: bold; border: 1px solid var(--gruvbox-bg-border); padding: 10px 20px; border-radius: 6px; background: var(--gruvbox-bg-soft); transition: background 0.2s; text-decoration: none;">View Full Commit History \&rarr;</a></div></body>|' log.html

# --- 3. INJECT THE GRAPH ABOVE NAVIGATION LINKS ---
# We inject the graph right before the "Log" link in both log and log-full.
# We also apply a Gruvbox-styled border and padding to make it match your theme.
GRAPH_HTML='<div style="text-align: center; margin: 20px auto;"><object data="graph.svg" type="image/svg+xml" style="max-width: 100%; max-height: 250px; background: var(--gruvbox-bg-soft); border: 1px solid var(--gruvbox-bg-border); border-radius: 8px; padding: 15px;"></object></div><a href="log.html">Log</a>'

sed -i "s|<a href=\"log.html\">Log</a>|$GRAPH_HTML|" log.html
sed -i "s|<a href=\"log.html\">Log</a>|$GRAPH_HTML|" log-full.html
# ---------------------------------------------

# 4. Generate the Root Index Page
echo "Generating stagit index..."
cd /repos

# Run stagit-index on the copied folder. 
# This guarantees it outputs <a href="portfolio/log.html">portfolio</a>
stagit-index portfolio.git > "$OUT_DIR/index.html"

echo "Stagit build complete."
