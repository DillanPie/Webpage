// js/bonsai-renderer.js

// --- Helper: Seeded Pseudo-Random Number Generator ---
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// --- SVG Drawing Helper ---
function createSvgElement(tag, attributes) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const key in attributes) {
        el.setAttribute(key, attributes[key]);
    }
    return el;
}

// --- The Main Bonsai Generation Logic ---
async function generateBonsai() {
    const canvas = document.getElementById('bonsai-canvas');
    const seedDisplay = document.getElementById('seed-display');

    // 1. Fetch the seed from the server's static API file
    let seedString;
    try {
        const response = await fetch('/api/bonsai.json');
        const data = await response.json();
        seedString = data.seed;
        seedDisplay.textContent = `Seed: ${seedString}`;
    } catch (error) {
        console.error("Could not load bonsai seed. Using a default.", error);
        seedString = "default-test-seed-enhanced";
        seedDisplay.textContent = "Error: Using default seed.";
    }

    // 2. Create a stable integer seed for the PRNG
    let numericSeed = 0;
    for (let i = 0; i < seedString.length; i++) {
        numericSeed += seedString.charCodeAt(i);
    }

    // 3. Initialize the PRNG
    const random = mulberry32(numericSeed);

    // --- Generative Parameters (Tunable) ---
    const trunkHeight = 120 + random() * 40;
    const trunkThickness = 18 + random() * 12;
    const maxDepth = 8;
    const colorPalette = {
        trunk: `hsl(25, ${15 + random() * 20}%, ${25 + random() * 10}%)`,
        leaf: `hsl(${80 + random() * 50}, ${40 + random() * 20}%, 55%)`,
        pot: `hsl(${200 + random() * 30}, 20%, 40%)`
    };

    // Clear any previous drawing
    canvas.innerHTML = '';

    // --- Recursive Function to Draw Branches ---
    function drawBranch(x, y, angle, thickness, depth) {
        if (depth > maxDepth || thickness < 0.5) {
            const leaf = createSvgElement('circle', {
                cx: x,
                cy: y,
                r: 2.5 + random() * 2,
                fill: colorPalette.leaf,
                opacity: 0.75,
            });
            canvas.appendChild(leaf);
            return;
        }

        const branchLength = trunkHeight / (depth + 1.5) * (0.8 + random() * 0.4);
        const segmentCount = 4;
        const segmentLength = branchLength / segmentCount;
        let currentX = x;
        let currentY = y;
        let d = `M ${currentX} ${currentY}`;
        let currentAngle = angle;
        let currentThickness = thickness;

        for (let i = 0; i < segmentCount; i++) {
            const wobble = (random() - 0.5) * 0.5;
            currentAngle += wobble;

            const nextX = currentX + Math.cos(currentAngle) * segmentLength;
            const nextY = currentY + Math.sin(currentAngle) * segmentLength;

            const path = createSvgElement('path', {
                d: `M ${currentX} ${currentY} L ${nextX} ${nextY}`,
                'stroke-width': currentThickness,
                stroke: colorPalette.trunk
            });
            canvas.appendChild(path);

            currentX = nextX;
            currentY = nextY;
            currentThickness *= 0.95;
        }
        
        const branchCount = random() > 0.4 ? 2 : 1;
        
        for (let i = 0; i < branchCount; i++) {
            const gravity = (currentX - 250) / 2000;
            const newAngle = currentAngle + (random() - 0.5) * 1.6 + gravity;
            const newThickness = currentThickness * (0.65 + random() * 0.15);
            drawBranch(currentX, currentY, newAngle, newThickness, depth + 1);
        }
    }
    
    // --- Draw the Pot ---
    const potHeight = 60 + random() * 20;
    const potWidth = 150 + random() * 50;
    const potTopY = 480; // The bottom of the canvas
    const potTopLeftX = 250 - potWidth / 2;
    const potTopRightX = 250 + potWidth / 2;
    const potBottomLeftX = 250 - (potWidth / 2) + 20;
    const potBottomRightX = 250 + (potWidth / 2) - 20;
    
    // The corrected path draws the pot right-side up.
    // It starts from the top-left, goes to top-right, then bottom-right, then bottom-left, and closes.
    const potPath = `M ${potTopLeftX},${potTopY - potHeight} L ${potTopRightX},${potTopY - potHeight} L ${potBottomRightX},${potTopY} L ${potBottomLeftX},${potTopY} Z`;

    const pot = createSvgElement('path', {
        d: potPath, // <-- Use the corrected path
        fill: colorPalette.pot,
        stroke: `hsl(${200}, 20%, 25%)`,
        'stroke-width': 2
    });
    canvas.appendChild(pot);


    // 4. Start the drawing process
    const startX = 250;
    // The tree now starts from inside the pot, not the absolute bottom of the canvas.
    const startY = potTopY - potHeight; // <-- Tree base is at the soil line
    const initialAngle = -Math.PI / 2; // Point straight up
    
    drawBranch(startX, startY, initialAngle, trunkThickness, 0);
}

// Run the generation when the script loads
generateBonsai();
