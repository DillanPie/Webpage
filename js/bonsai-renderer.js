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

    // 1. Fetch the seed
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

    // 2. Create and initialize the PRNG
    let numericSeed = 0;
    for (let i = 0; i < seedString.length; i++) {
        numericSeed += seedString.charCodeAt(i);
    }
    const random = mulberry32(numericSeed);

    // ==================================================================
    // --- CONFIGURATION: Tweak these values to style your bonsai! ---
    // ==================================================================
    const config = {
        // --- Tree Structure ---
        maxDepth: 8,                  // Maximum number of recursive branches.
        trunkHeight: 120,             // Base height of the main trunk.
        trunkHeightRandom: 40,        // Randomness added to the trunk height.
        trunkThickness: 18,           // Base thickness of the main trunk.
        trunkThicknessRandom: 12,     // Randomness added to the trunk thickness.

        // --- Branch Sizing & Tapering ---
        branchLengthFactor: 0.8,      // Base factor for branch length (multiplied by trunk height).
        branchLengthRandom: 0.4,      // Randomness added to branch length.
        taperBase: 0.65,              // Base factor for how much a branch thins out. Higher = less taper.
        taperRandom: 0.15,            // Randomness added to the taper.

        // --- Branch Shape & Angles ---
        wobbleFactor1: 0.8,           // Controls the "wobble" of the first Bezier curve handle. Higher = more wobble.
        wobbleFactor2: 0.4,           // Controls the "wobble" of the second Bezier curve handle.
        branchingProbability: 0.4,    // Probability of a branch splitting in two (vs. just one). Lower = more splits.
        singleBranchAngle: 1.6,       // Random angle range for a single new branch. Higher = more chaotic.
        vShapeSpread: 0.6,            // The angle of the "V" when a branch splits in two. Higher = wider "V".
        vShapeRandomness: 0.5,        // Randomness added to the "V" shape branches.

        // --- Forces ---
        gravity: 2000,                // The strength of the gravity effect. Lower = stronger gravity (more weeping).

        // --- Leaf Appearance ---
        minDepthForLeaves: 1,         // How many branches deep before leaves appear. 1 = no leaves on trunk.
        leafSize: 2.5,                // Base size (radius) of the leaves.
        leafSizeRandom: 2,            // Randomness added to leaf size.
        leafOpacity: 0.75,            // Opacity of the leaves.
    };

    // --- FIX: Corrected the leaf color calculation ---
    // It now correctly constructs the full HSL color string.
    const colorPalette = {
        trunk: `hsl(25, ${15 + random() * 20}%, ${25 + random() * 10}%)`,
        leaf: `hsl(${80 + random() * 50}, ${40 + random() * 20}%, 55%)`,
        potBody: `hsl(${200 + random() * 30}, 20%, 40%)`,
        potLip: `hsl(${200 + random() * 30}, 25%, 32%)`,
        potStroke: `hsl(200, 20%, 25%)`
    };

    canvas.innerHTML = '';
    
    function drawBranch(x, y, angle, thickness, depth) {
        if (depth > config.maxDepth || thickness < 0.5) {
            if (depth > config.minDepthForLeaves) {
                const leaf = createSvgElement('circle', {
                    cx: x, cy: y,
                    r: config.leafSize + random() * config.leafSizeRandom,
                    fill: colorPalette.leaf,
                    opacity: config.leafOpacity,
                });
                canvas.appendChild(leaf);
            }
            return;
        }

        const branchLength = (config.trunkHeight / (depth + 1.5)) * (config.branchLengthFactor + random() * config.branchLengthRandom);
        const endX = x + Math.cos(angle) * branchLength;
        const endY = y + Math.sin(angle) * branchLength;

        const cp1X = x + Math.cos(angle + (random() - 0.5) * config.wobbleFactor1) * branchLength * 0.3;
        const cp1Y = y + Math.sin(angle + (random() - 0.5) * config.wobbleFactor1) * branchLength * 0.3;
        const cp2X = x + Math.cos(angle + (random() - 0.5) * config.wobbleFactor2) * branchLength * 0.7;
        const cp2Y = y + Math.sin(angle + (random() - 0.5) * config.wobbleFactor2) * branchLength * 0.7;
        const pathData = `M ${x} ${y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
        
        const branchPath = createSvgElement('path', {
            d: pathData,
            'stroke-width': thickness,
            stroke: colorPalette.trunk,
            fill: 'none'
        });
        canvas.appendChild(branchPath);

        const branchCount = random() > config.branchingProbability ? 2 : 1;
        
        for (let i = 0; i < branchCount; i++) {
            const newThickness = thickness * (config.taperBase + random() * config.taperRandom);
            const gravityEffect = (endX - 250) / config.gravity;
            let newAngle;

            if (branchCount === 1) {
                newAngle = angle + (random() - 0.5) * config.singleBranchAngle + gravityEffect;
            } else {
                const direction = (i === 0) ? -1 : 1;
                newAngle = angle + (direction * config.vShapeSpread) + (random() - 0.5) * config.vShapeRandomness + gravityEffect;
            }
            
            drawBranch(endX, endY, newAngle, newThickness, depth + 1);
        }
    }

    const potHeight = 60 + random() * 20;
    const potWidth = 150 + random() * 50;
    const potTopY = 480;
    const potLipHeight = 15;
    const potTopLeftX = 250 - potWidth / 2;
    const potTopRightX = 250 + potWidth / 2;
    const potBottomLeftX = potTopLeftX + 20;
    const potBottomRightX = potTopRightX - 20;

    const potBodyPath = `M ${potTopLeftX},${potTopY - potHeight + potLipHeight} L ${potTopRightX},${potTopY - potHeight + potLipHeight} L ${potBottomRightX},${potTopY} L ${potBottomLeftX},${potTopY} Z`;
    const potBody = createSvgElement('path', {
        d: potBodyPath, fill: colorPalette.potBody, stroke: colorPalette.potStroke, 'stroke-width': 2
    });
    canvas.appendChild(potBody);

    const initialTrunkHeight = config.trunkHeight + random() * config.trunkHeightRandom;
    const initialTrunkThickness = config.trunkThickness + random() * config.trunkThicknessRandom;
    const startX = 250;
    // --- FIX: Corrected the starting Y-coordinate for the tree trunk ---
    // This ensures the trunk starts at the bottom of the lip, not inside it.
    const startY = potTopY - potHeight + potLipHeight -15;
    const initialAngle = -Math.PI / 2;
    drawBranch(startX, startY, initialAngle, initialTrunkThickness, 0);

    const potLip = createSvgElement('path', {
        d: `M ${potTopLeftX - 3} ${potTopY - potHeight} L ${potTopRightX + 3} ${potTopY - potHeight} L ${potTopRightX + 3} ${potTopY - potHeight + potLipHeight} L ${potTopLeftX - 3} ${potTopY - potHeight + potLipHeight} Z`,
        fill: colorPalette.potLip, stroke: colorPalette.potStroke, 'stroke-width': 2
    });
    canvas.appendChild(potLip);
}

generateBonsai();
