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
        potBody: `hsl(${200 + random() * 30}, 20%, 40%)`,
        potLip: `hsl(${200 + random() * 30}, 25%, 32%)`, // Slightly darker for contrast
        potStroke: `hsl(200, 20%, 25%)`
    };

    // Clear any previous drawing
    canvas.innerHTML = '';

    // --- Recursive Function to Draw Branches ---
    function drawBranch(x, y, angle, thickness, depth) {
        if (depth > maxDepth || thickness < 0.5) {
            if (depth > 1) { // Only draw leaves on smaller branches
                 const leaf = createSvgElement('circle', {
                    cx: x,
                    cy: y,
                    r: 2.5 + random() * 2,
                    fill: colorPalette.leaf,
                    opacity: 0.75,
                });
                canvas.appendChild(leaf);
            }
            return;
        }

        const branchLength = trunkHeight / (depth + 1.5) * (0.8 + random() * 0.4);
        
        let currentX = x;
        let currentY = y;
        let currentAngle = angle;

        const endX = x + Math.cos(angle) * branchLength;
        const endY = y + Math.sin(angle) * branchLength;

        // Add a control point to create a curve
        const cp1X = x + Math.cos(angle + (random() - 0.5) * 0.8) * branchLength * 0.3;
        const cp1Y = y + Math.sin(angle + (random() - 0.5) * 0.8) * branchLength * 0.3;
        const cp2X = x + Math.cos(angle + (random() - 0.5) * 0.4) * branchLength * 0.7;
        const cp2Y = y + Math.sin(angle + (random() - 0.5) * 0.4) * branchLength * 0.7;

        const pathData = `M ${x} ${y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        
        const branchPath = createSvgElement('path', {
            d: pathData,
            'stroke-width': thickness,
            stroke: colorPalette.trunk,
            fill: 'none' // Ensure the path is not filled
        });
        canvas.appendChild(branchPath);

        const branchCount = random() > 0.4 ? 2 : 1;
        for (let i = 0; i < branchCount; i++) {
            const gravity = (endX - 250) / 2000;
            const newAngle = angle + (random() - 0.5) * 1.6 + gravity;
            const newThickness = thickness * (0.65 + random() * 0.15);
            drawBranch(endX, endY, newAngle, newThickness, depth + 1);
        }
    }

    // --- Draw the Pot & Tree with Correct Layering ---
    const potHeight = 60 + random() * 20;
    const potWidth = 150 + random() * 50;
    const potTopY = 480;
    const potLipHeight = 15;

    const potTopLeftX = 250 - potWidth / 2;
    const potTopRightX = 250 + potWidth / 2;
    const potBottomLeftX = potTopLeftX + 20;
    const potBottomRightX = potTopRightX - 20;

    // 1. Draw the main body of the pot (the back) FIRST.
    const potBodyPath = `M ${potTopLeftX},${potTopY - potHeight + potLipHeight} L ${potTopRightX},${potTopY - potHeight + potLipHeight} L ${potBottomRightX},${potTopY} L ${potBottomLeftX},${potTopY} Z`;
    const potBody = createSvgElement('path', {
        d: potBodyPath,
        fill: colorPalette.potBody,
        stroke: colorPalette.potStroke,
        'stroke-width': 2
    });
    canvas.appendChild(potBody);

    // 2. Draw the ENTIRE tree SECOND.
    const startX = 250;
    const startY = potTopY - potHeight + potLipHeight / 3; // Start inside the pot lip
    const initialAngle = -Math.PI / 2;
    drawBranch(startX, startY, initialAngle, trunkThickness, 0);

    // 3. Draw the pot's front lip LAST, so it covers the tree trunk.
    const potLip = createSvgElement('path', {
        d: `M ${potTopLeftX - 3} ${potTopY - potHeight} L ${potTopRightX + 3} ${potTopY - potHeight} L ${potTopRightX + 3} ${potTopY - potHeight + potLipHeight} L ${potTopLeftX - 3} ${potTopY - potHeight + potLipHeight} Z`,
        fill: colorPalette.potLip,
        stroke: colorPalette.potStroke,
        'stroke-width': 2
    });
    canvas.appendChild(potLip);
}

// Run the generation when the script loads
generateBonsai();
