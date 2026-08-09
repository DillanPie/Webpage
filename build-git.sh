#!/bin/bash
# build-git.sh
set -euo pipefail

# ==========================================
# Configuration
# ==========================================

OUT_DIR="/app/dist-git"
REPOS_DIR="/repos"
CONFIG_FILE="/app/repos.conf"
STAGIT_CSS="/repo/css/stagit.css"

# ==========================================
# Cleanup
# ==========================================

rm -rf "$OUT_DIR"
rm -rf "$REPOS_DIR"

mkdir -p "$OUT_DIR"
mkdir -p "$REPOS_DIR"

# ==========================================
# Load Repository Configuration
# ==========================================

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Repository configuration not found:"
    echo "       $CONFIG_FILE"
    exit 1
fi

# shellcheck disable=SC1090
source "$CONFIG_FILE"

if [[ ${#REPOS[@]} -eq 0 ]]; then
    echo "Error: No repositories defined in $CONFIG_FILE"
    exit 1
fi

echo ">>> Loaded ${#REPOS[@]} repositories."

# ==========================================
# Setup Main Stagit CSS
# ==========================================

if [[ ! -f "$STAGIT_CSS" ]]; then
    echo "Error: Stagit CSS not found:"
    echo "       $STAGIT_CSS"
    exit 1
fi

cp "$STAGIT_CSS" "$OUT_DIR/style.css"

# ==========================================
# Generate Individual Repository Pages
# ==========================================

for repo_config in "${REPOS[@]}"; do

    IFS='|' read -r \
        SLUG \
        REPO_PATH \
        NAME \
        URL \
        OWNER \
        DESCRIPTION <<< "$repo_config"

    echo
    echo "=========================================="
    echo "Generating repository: $NAME"
    echo "=========================================="

    # --------------------------------------
    # Validate configuration
    # --------------------------------------

    if [[ -z "$SLUG" ||
          -z "$REPO_PATH" ||
          -z "$NAME" ||
          -z "$URL" ||
          -z "$OWNER" ||
          -z "$DESCRIPTION" ]]; then

        echo "Error: Invalid repository configuration:"
        echo "$repo_config"
        exit 1
    fi

    # --------------------------------------
    # Determine repository directory
    # --------------------------------------

    REPO_DIR="$REPO_PATH"

    # Make sure the path is under /repos
    case "$REPO_DIR" in
        "$REPOS_DIR"/*)
            ;;
        *)
            echo "Error: Repository path must be under $REPOS_DIR:"
            echo "       $REPO_DIR"
            exit 1
            ;;
    esac

    # --------------------------------------
    # Obtain repository
    # --------------------------------------

    if [[ "$SLUG" == "webpage" ]]; then

        echo ">>> Using local Webpage repository..."

        # Copy the actual Git repository.
        cp -R /repo/.git "$REPO_DIR"

    else

        echo ">>> Cloning repository from GitHub..."
        echo "    $URL"

        git clone --bare "$URL" "$REPO_DIR"

    fi

    # --------------------------------------
    # Write Stagit metadata
    # --------------------------------------

    echo ">>> Writing repository metadata..."

    echo "$URL" \
        > "$REPO_DIR/url"

    echo "$OWNER" \
        > "$REPO_DIR/owner"

    echo "$DESCRIPTION" \
        > "$REPO_DIR/description"

    # --------------------------------------
    # Prepare output directory
    # --------------------------------------

    REPO_OUTPUT="$OUT_DIR/$SLUG"

    mkdir -p "$REPO_OUTPUT"

    cd "$REPO_OUTPUT"

    # Copy repository-specific CSS
    cp "$STAGIT_CSS" ./style.css

    # --------------------------------------
    # Generate Stagit pages
    # --------------------------------------

    echo ">>> Running stagit..."

    stagit -c ".cache" "$REPO_DIR"

    echo ">>> $NAME generated successfully."

done

# ==========================================
# Generate Git Commit Graph
# ==========================================

echo
echo "=========================================="
echo "Generating Webpage Git Graph"
echo "=========================================="

# The graph is currently specific to your Webpage
# repository, so don't generate one for every project.

WEBPAGE_OUTPUT="$OUT_DIR/webpage"

if [[ -f "/app/graph.txt" ]]; then

    GRUVBOX_PALETTE="#928374,#cc241d,#98971a,#d79921,#458588,#b16286,#689d6a,#d65d0e,#928374"
    COMMIT_FILL="#ebdbb2"
    LABEL_FILL="#3c3836"
    LABEL_TEXT="#ebdbb2"

    BRANCH_SPACING="70"
    BRANCH_STROKE_WIDTH="20"
    COMMIT_SPACING="80"
    LABEL_FONT="Fira Code, monospace"
    LABEL_FONT_SIZE="70"
    LABEL_SPACING="10"
    LABEL_ROUND="10"

    grawkit \
        --palette="$GRUVBOX_PALETTE" \
        --commit-fill="$COMMIT_FILL" \
        --label-fill="$LABEL_FILL" \
        --label-text="$LABEL_TEXT" \
        --branch-spacing="$BRANCH_SPACING" \
        --commit-spacing="$COMMIT_SPACING" \
        --label-font="$LABEL_FONT" \
        --label-font-size="$LABEL_FONT_SIZE" \
        --label-spacing="$LABEL_SPACING" \
        --branch-stroke-width="$BRANCH_STROKE_WIDTH" \
        --label-round="$LABEL_ROUND" \
        /app/graph.txt \
        > "$WEBPAGE_OUTPUT/graph.svg"

else

    echo "Warning: /app/graph.txt not found."
    echo "         Skipping Git graph."

fi

# ==========================================
# Customize Webpage Log Pages
# ==========================================

echo
echo "=========================================="
echo "Customizing Webpage Log Pages"
echo "=========================================="

cd "$WEBPAGE_OUTPUT"

# ------------------------------------------
# Create full log page
# ------------------------------------------

cp log.html log-full.html

# ------------------------------------------
# Hide commits after the 10th row
# ------------------------------------------

sed -i \
    's|</head>|<style>table#log tbody tr:nth-child(n+11) { display: none; }</style></head>|' \
    log.html

# ------------------------------------------
# Add "View Full Commit History" button
# ------------------------------------------

sed -i \
    's|</body>|<div style="text-align: center; margin: 40px 0;"><a href="log-full.html" style="font-size: 1.1em; color: var(--gruvbox-yellow); font-weight: bold; border: 1px solid var(--gruvbox-bg-border); padding: 10px 20px; border-radius: 6px; background: var(--gruvbox-bg-soft); transition: background 0.2s; text-decoration: none;">View Full Commit History \&rarr;</a></div></body>|' \
    log.html

# ==========================================
# Inject Git Graph
# ==========================================

GRAPH_STYLE='<style>#content { position: relative; } .git-graph-sidebar { position: absolute; top: 0; left: -380px; width: 350px; height: 100%; z-index: 1; } .git-graph-sticky { position: sticky; top: 80px; background: var(--gruvbox-bg-soft); border: 1px solid var(--gruvbox-bg-border); border-radius: 8px; padding: 15px; box-sizing: border-box; height: 600px; max-height: calc(100vh - 100px); display: flex; justify-content: center; align-items: center; } .git-graph-sticky img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; } @media (max-width: 1750px) { .git-graph-sidebar { position: static; left: 0; width: 100%; height: auto; margin-bottom: 25px; } .git-graph-sticky { width: 100%; max-width: 1050px; height: 500px; margin: 0 auto; } }</style>'

GRAPH_HTML='<div class="git-graph-sidebar"><div class="git-graph-sticky"><img src="graph.svg" alt="Git Graph" /></div></div>'

# Inject graph CSS
sed -i \
    "s|</head>|$GRAPH_STYLE</head>|" \
    log.html

sed -i \
    "s|</head>|$GRAPH_STYLE</head>|" \
    log-full.html

# Inject graph HTML
sed -i \
    "s|<table id=\"log\">|$GRAPH_HTML<table id=\"log\">|" \
    log.html

sed -i \
    "s|<table id=\"log\">|$GRAPH_HTML<table id=\"log\">|" \
    log-full.html

# ==========================================
# Generate Repository Index
# ==========================================

echo
echo "=========================================="
echo "Generating Stagit Repository Index"
echo "=========================================="

cd "$REPOS_DIR"

# stagit-index reads every *.git repository in /repos
# and generates links to their corresponding pages.
stagit-index ./*.git > "$OUT_DIR/index.html"

echo
echo "=========================================="
echo "Stagit Build Complete"
echo "=========================================="

echo "Generated repositories:"

for repo_config in "${REPOS[@]}"; do
    IFS='|' read -r SLUG REPO_PATH NAME URL OWNER DESCRIPTION <<< "$repo_config"

    echo "  - $NAME"
    echo "    /git/$SLUG/"
done