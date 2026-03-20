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

// ==================================================================
// --- Global State & DOM Elements ---
// ==================================================================
let config;
let age = 0;
let initialSeedString = "";
let numericSeed = 0;
let random;
let masterPrunedSet = new Set();
let treeData = { branches: [], leaves: [], pot: null };

const canvas = document.getElementById('bonsai-canvas');
const seedDisplay = document.getElementById('seed-display');
const ageDisplay = document.getElementById('age-display');
const passTimeBtn = document.getElementById('pass-time-btn');
const saveBtn = document.getElementById('save-state-btn');
const loadBtn = document.getElementById('load-state-btn');
const stateOutput = document.getElementById('state-string-output');
const stateInput = document.getElementById('state-string-input');
const newSeedInput = document.getElementById('new-seed-input');
const newTreeBtn = document.getElementById('new-tree-btn');

// ==================================================================
// --- 1. UNIFIED TREE TRAVERSAL LOGIC ---
// ==================================================================

/**
 * [RE-ARCHITECTED, FINAL VERSION] The single source of truth for tree structure.
 * This function is guaranteed to be synchronized because both modes ('GENERATE' and 'SIMULATE')
 * consume the exact same sequence of random numbers.
 */
function traverseTree(parentBranch, context) {
    const { mode, config, rand, prunedSet, hierarchy, data } = context;

    // --- Exit Condition (Identical for both modes) ---
    if (parentBranch.depth >= config.maxDepth || parentBranch.thickness < 0.5) {
        if (parentBranch.depth > config.minDepthForLeaves) {
            const leafSizeRandomness = rand(); // Consume random for leaf size
            if (mode === 'GENERATE' && !prunedSet.has(parentBranch.id)) {
                data.leaves.push({
                    id: `${parentBranch.id}-leaf`,
                    parentId: parentBranch.id,
                    x: parentBranch.endX,
                    y: parentBranch.endY,
                    size: config.leafSize + leafSizeRandomness * config.leafSizeRandom,
                });
            }
        }
        return;
    }

    // --- Branch Generation Logic (Identical for both modes) ---
    const branchCount = rand() > config.branchingProbability ? 2 : 1;

    for (let i = 0; i < branchCount; i++) {
        const id = `${parentBranch.id}-${i}`;
        const newThickness = parentBranch.thickness * (config.taperBase + rand() * config.taperRandom);
        const gravityEffect = (parentBranch.endX - 250) / config.gravity;
        let newAngle;

        if (branchCount === 1) {
            newAngle = parentBranch.angle + (rand() - 0.5) * config.singleBranchAngle + gravityEffect;
        } else {
            const direction = (i === 0) ? -1 : 1;
            newAngle = parentBranch.angle + (direction * config.vShapeSpread) + (rand() - 0.5) * config.vShapeRandomness + gravityEffect;
        }

        const branchLength = (config.trunkHeight / (parentBranch.depth + 1.5)) * (config.branchLengthFactor + rand() * config.branchLengthRandom);
        const endX = parentBranch.endX + Math.cos(newAngle) * branchLength;
        const endY = parentBranch.endY + Math.sin(newAngle) * branchLength;

        // Consume wobble factors for both modes to stay in sync.
        const wobble1 = rand() - 0.5;
        const wobble2 = rand() - 0.5;
        const wobble3 = rand() - 0.5;
        const wobble4 = rand() - 0.5;

        const newBranch = {
            id, parentId: parentBranch.id, thickness: newThickness, depth: parentBranch.depth + 1, angle: newAngle, endX, endY
        };

        // --- Mode-Specific Actions ---
        if (mode === 'GENERATE') {
            if (!prunedSet.has(id)) {
                const cp1X = parentBranch.endX + Math.cos(newAngle + wobble1 * config.wobbleFactor1) * branchLength * 0.3;
                const cp1Y = parentBranch.endY + Math.sin(newAngle + wobble2 * config.wobbleFactor1) * branchLength * 0.3;
                const cp2X = parentBranch.endX + Math.cos(newAngle + wobble3 * config.wobbleFactor2) * branchLength * 0.7;
                const cp2Y = parentBranch.endY + Math.sin(newAngle + wobble4 * config.wobbleFactor2) * branchLength * 0.7;
                data.branches.push({
                    ...newBranch, startX: parentBranch.endX, startY: parentBranch.endY, cp1X, cp1Y, cp2X, cp2Y
                });
            }
        } else { // SIMULATE
            hierarchy.push(newBranch);
        }

        // --- Recurse for the next level ---
        traverseTree(newBranch, context);
    }
}

// ==================================================================
// --- 2. RENDERING & STATE MANAGEMENT ---
// ==================================================================

function renderTreeFromData() {
    canvas.innerHTML = '';
    const colorPalette = { trunk: `hsl(25, 30%, 30%)`, leaf: `hsl(110, 45%, 55%)`, potBody: `hsl(210, 20%, 40%)`, potLip: `hsl(210, 25%, 32%)`, potStroke: `hsl(210, 20%, 25%)` };
    if (treeData.pot) {
        canvas.appendChild(createSvgElement('path', { d: treeData.pot.bodyPath, fill: colorPalette.potBody, stroke: colorPalette.potStroke, 'stroke-width': 2 }));
    }
    treeData.branches.forEach(branch => {
        const pathData = `M ${branch.startX} ${branch.startY} C ${branch.cp1X} ${branch.cp1Y}, ${branch.cp2X} ${branch.cp2Y}, ${branch.endX} ${branch.endY}`;
        canvas.appendChild(createSvgElement('path', { 'data-id': branch.id, d: pathData, 'stroke-width': branch.thickness, stroke: colorPalette.trunk, fill: 'none', cursor: 'pointer' }));
    });
    treeData.leaves.forEach(leaf => {
        canvas.appendChild(createSvgElement('circle', { cx: leaf.x, cy: leaf.y, r: leaf.size, fill: colorPalette.leaf, opacity: config.leafOpacity, 'pointer-events': 'none' }));
    });
    if (treeData.pot) {
        canvas.appendChild(createSvgElement('path', { d: treeData.pot.lipPath, fill: colorPalette.potLip, stroke: colorPalette.potStroke, 'stroke-width': 2 }));
    }
}

function growToState(targetAge, prunedIds = []) {
    age = 0;
    masterPrunedSet = new Set(prunedIds);
    initializeConfig();

    while (age < targetAge) {
        age++;
        config.trunkThickness += 0.25;
        if (age > 0 && age % 5 === 0 && config.maxDepth < 11) {
            config.maxDepth++;
        }
        config.gravity -= 100;
    }

    generateFullTreeData(masterPrunedSet);
    age = targetAge;
    ageDisplay.textContent = age;
    renderTreeFromData();
}

function passTime() {
    growToState(age + 1, Array.from(masterPrunedSet));
}

// ==================================================================
// --- 3. PRUNING LOGIC (Now using the Unified Traverse) ---
// ==================================================================

function getDescendants(branchIdToPrune, forAge) {
    const simConfig = initializeConfig(true);
    let currentSimAge = 0;
    while (currentSimAge < forAge) {
        currentSimAge++;
        simConfig.trunkThickness += 0.25;
        if (currentSimAge > 0 && currentSimAge % 5 === 0 && simConfig.maxDepth < 11) {
            simConfig.maxDepth++;
        }
        simConfig.gravity -= 100;
    }

    const simRandom = mulberry32(numericSeed);
    simRandom(); simRandom();
    const initialTrunkThickness = simConfig.trunkThickness + simRandom() * simConfig.trunkThicknessRandom;
    const trunk = {
        id: 'trunk', depth: 0, thickness: initialTrunkThickness, angle: -Math.PI / 2,
        startX: 250, startY: 0, endX: 250, endY: 0
    };
    
    const hierarchy = [];
    const context = {
        mode: 'SIMULATE', config: simConfig, rand: simRandom,
        prunedSet: new Set(), hierarchy: hierarchy, data: null
    };
    traverseTree(trunk, context);

    const descendants = new Set();
    const branchesToExplore = [branchIdToPrune];
    const visited = new Set([branchIdToPrune]);
    while (branchesToExplore.length > 0) {
        const currentId = branchesToExplore.shift();
        const children = hierarchy.filter(b => b.parentId === currentId);
        for (const child of children) {
            if (!visited.has(child.id)) {
                visited.add(child.id);
                descendants.add(child.id);
                branchesToExplore.push(child.id);
            }
        }
    }
    return descendants;
}

function handlePrune(event) {
    if (event.target.tagName !== 'path') return;
    const branchIdToPrune = event.target.getAttribute('data-id');
    if (!branchIdToPrune) return;

    masterPrunedSet.add(branchIdToPrune);
    const descendants = getDescendants(branchIdToPrune, age);
    descendants.forEach(id => masterPrunedSet.add(id));

    generateFullTreeData(masterPrunedSet);
    renderTreeFromData();
}

// ==================================================================
// --- 4. INITIALIZATION & MAIN GENERATION ---
// ==================================================================

function generateFullTreeData(prunedSet) {
    random = mulberry32(numericSeed);
    treeData = { branches: [], leaves: [], pot: null };

    const potHeight = 60 + random() * 20;
    const potWidth = 150 + random() * 50;
    const potTopY = 480;
    const potLipHeight = 15;
    const potTopLeftX = 250 - potWidth / 2;
    const potTopRightX = 250 + potWidth / 2;
    const potBottomLeftX = potTopLeftX + 20;
    const potBottomRightX = potTopRightX - 20;
    treeData.pot = {
        bodyPath: `M ${potTopLeftX},${potTopY - potHeight + potLipHeight} L ${potTopRightX},${potTopY - potHeight + potLipHeight} L ${potBottomRightX},${potTopY} L ${potBottomLeftX},${potTopY} Z`,
        lipPath: `M ${potTopLeftX - 3} ${potTopY - potHeight} L ${potTopRightX + 3} ${potTopY - potHeight} L ${potTopRightX + 3} ${potTopY - potHeight + potLipHeight} L ${potTopLeftX - 3} ${potTopY - potHeight + potLipHeight} Z`
    };

    const initialTrunkThickness = config.trunkThickness + random() * config.trunkThicknessRandom;
    const trunk = {
        id: 'trunk', parentId: null, depth: 0, thickness: initialTrunkThickness,
        angle: -Math.PI / 2, startX: 250,
        startY: potTopY - potHeight + potLipHeight - 15,
        endX: 250,
        endY: (potTopY - potHeight + potLipHeight - 15) - config.trunkHeight,
    };
    
    if (!prunedSet.has(trunk.id)) {
        treeData.branches.push({
            ...trunk,
             cp1X: 250, cp1Y: trunk.startY - config.trunkHeight * 0.3,
             cp2X: 250, cp2Y: trunk.startY - config.trunkHeight * 0.7,
        });
    }

    const context = {
        mode: 'GENERATE', config: config, rand: random,
        prunedSet: prunedSet, hierarchy: null, data: treeData
    };
    
    traverseTree(trunk, context);
}

function initializeConfig(returnOnly = false) {
    const newConfig = {
        maxDepth: 7, trunkHeight: 120, trunkHeightRandom: 40, trunkThickness: 15, trunkThicknessRandom: 10,
        branchLengthFactor: 0.8, branchLengthRandom: 0.4, taperBase: 0.65, taperRandom: 0.15,
        wobbleFactor1: 0.8, wobbleFactor2: 0.4, branchingProbability: 0.4, singleBranchAngle: 1.6,
        vShapeSpread: 0.6, vShapeRandomness: 0.5, gravity: 2500, minDepthForLeaves: 1,
        leafSize: 2.5, leafSizeRandom: 2, leafOpacity: 0.75,
    };
    if (returnOnly) return newConfig;
    config = newConfig;
}

function startNewTree(seedString) {
    initialSeedString = seedString;
    numericSeed = 0;
    for (let i = 0; i < initialSeedString.length; i++) {
        numericSeed += initialSeedString.charCodeAt(i);
    }
    seedDisplay.textContent = `Seed: ${initialSeedString}`;
    masterPrunedSet.clear();
    growToState(0);
}

// ==================================================================
// --- 5. EVENT LISTENERS & BOOTSTRAP ---
// ==================================================================
passTimeBtn.addEventListener('click', passTime);
canvas.addEventListener('click', handlePrune);

saveBtn.addEventListener('click', () => {
    const stateString = btoa(JSON.stringify({ seed: initialSeedString, age: age, pruned: Array.from(masterPrunedSet) }));
    stateOutput.value = stateString;
    navigator.clipboard.writeText(stateString).then(() => alert("Tree state copied to clipboard!"));
});

loadBtn.addEventListener('click', () => {
    if (!stateInput.value) return alert("Please paste a state code.");
    try {
        const stateObject = JSON.parse(atob(stateInput.value));
        if (!stateObject.seed || typeof stateObject.age === 'undefined') throw new Error("Invalid state.");
        startNewTree(stateObject.seed);
        growToState(stateObject.age, stateObject.pruned);
    } catch (error) {
        alert("The provided tree code is invalid or corrupted.");
    }
});

newTreeBtn.addEventListener('click', () => {
    if (!newSeedInput.value) return alert("Please enter a new seed.");
    startNewTree(newSeedInput.value);
    newSeedInput.value = '';
});

// Initial Load
startNewTree("welcome-to-your-garden");
