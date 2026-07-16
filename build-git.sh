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

# --- 3. INJECT THE GRAPH INTO THE LEFT MARGIN ---

# 1. Single-line CSS (Added max-height and overflow-y: auto for scrolling!)
GRAPH_STYLE="<style>#content { position: relative; } .git-graph-sidebar { position: absolute; top: 0; left: -280px; width: 250px; height: 100%; z-index: 1; } .git-graph-sticky { position: sticky; top: 80px; background: var(--gruvbox-bg-soft); border: 1px solid var(--gruvbox-bg-border); border-radius: 8px; padding: 15px; max-height: calc(100vh - 100px); overflow-y: auto; } @media (max-width: 1650px) { .git-graph-sidebar { position: static; left: 0; width: 100%; height: auto; margin-bottom: 25px; display: flex; justify-content: center; } .git-graph-sticky { position: static; max-width: 1050px; width: 100%; max-height: 500px; } }</style>"
# 2. Single-line HTML (Changed <object> to <img> so it scales correctly!)
GRAPH_HTML="<div class=\"git-graph-sidebar\"><div class=\"git-graph-sticky\"><img src=\"graph.svg\" alt=\"Git Graph\" style=\"width: 100%; height: auto; display: block;\" /></div></div>"

# 3. Inject the CSS right before the closing </head> tag
sed -i "s|</head>|$GRAPH_STYLE</head>|" log.html
sed -i "s|</head>|$GRAPH_STYLE</head>|" log-full.html

# 4. Inject the Graph inside #content, right before the log table
sed -i "s|<table id=\"log\">|$GRAPH_HTML<table id=\"log\">|" log.html
sed -i "s|<table id=\"log\">|$GRAPH_HTML<table id=\"log\">|" log-full.html
# ---------------------------------------------

# 4. Generate the Root Index Page
echo "Generating stagit index..."
cd /repos

# Run stagit-index on the copied folder. 
# This guarantees it outputs <a href="portfolio/log.html">portfolio</a>
stagit-index portfolio.git > "$OUT_DIR/index.html"

echo "Stagit build complete."
