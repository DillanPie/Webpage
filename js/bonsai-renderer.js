//
// bonsai-page.js
//

document.addEventListener("DOMContentLoaded", () => {
  // --- ARTISTIC & GROWTH CONFIGURATION ---
  // Tweak these values to change the tree's appearance and growth patterns.
  const STYLE_CONFIG = {
    // -- Probabilities --
    leafGrowthProbability: 0.7,   // Chance (0-1) for a leaf branch to sprout.
    dormantBudGrowthProbability: 0.7, // Chance (0-1) for a pruned spot to sprout.
    suckerBranchChance: 0.15,         // Chance (0-1) for an awkward "sucker" branch to grow.

    // -- Branch Geometry --
    lengthReductionFactor: 0.85,      // How much shorter new branches are than their parent (e.g., 0.85 = 85% of parent's length).
    dormantLengthFactor: 0.6,
    forkAngle: 35,                    // The base angle in degrees for a new fork.
    forkAngleRandomness: 20,          // Randomness (in degrees) added to the fork angle.
    maxDepth: 7,                      // Maximum number of branches from trunk to leaf.

    // -- Thickness & Aging --
    newBranchThickness: 2.0,          // Starting thickness for all new shoots.
    baseThickenAmount: 0.15,          // The minimum amount every branch thickens each year.
    massThickenFactor: 0.05,          // How much the supported "mass" of children adds to the parent's thickness.
    leafMass: 0.1,                    // The base "mass" that a single leaf contributes to the system.

    // -- Collision & Color --
    collisionDistance: 10,            // Minimum distance (in pixels) between branch tips to prevent overlap.
    branchColor: "hsl(22, 45%, 35%)", // The color of the branches.
    
    // --- NEW: Leaf Configuration ---
    showLeaves: true,                     // Set to false to hide leaves
    leafColor: "hsl(110, 40%, 50%)",      // A pleasant, natural green
    leafSize: 5,                          // The radius of the leaf circles
    maxLeafThickness: 3.5,
  };

  // --- DOM ELEMENT REFERENCES ---
  const svgCanvas = document.getElementById("bonsai-canvas");
  const passTimeBtn = document.getElementById("pass-time-btn");
  const ageDisplay = document.getElementById("age-display");

  // --- CORE VARIABLES ---
  let branchCounter = 8;
  let age = 8;

  // --- TREE DATA STRUCTURE ---
  let tree = {
    id: 0, x1: 250, y1: 500, x2: 250, y2: 410,
    angle: -90, length: 90, depth: 0, thickness: 12,
    children: [
      {
        id: 1, x1: 250, y1: 430, x2: 300, y2: 390,
        angle: -38, length: 64, depth: 1, thickness: 7,
        children: [
          {
            id: 3, x1: 300, y1: 390, x2: 340, y2: 375,
            angle: -20, length: 42, depth: 2, thickness: 4,
            children: []
          },
          {
            id: 4, x1: 300, y1: 390, x2: 315, y2: 420,
            angle: 60, length: 33, depth: 2, thickness: 3,
            children: []
          }
        ]
      },
      {
        id: 2, x1: 250, y1: 450, x2: 200, y2: 430,
        angle: -157, length: 54, depth: 1, thickness: 6,
        children: [
          {
            id: 5, x1: 200, y1: 430, x2: 160, y2: 420,
            angle: -165, length: 41, depth: 2, thickness: 3,
            children: [
              {
                id: 7, x1: 160, y1: 420, x2: 130, y2: 400,
                angle: -145, length: 36, depth: 3, thickness: 1.5,
                children: []
              }
            ]
          }
        ]
      },
      {
          id: 6, x1: 250, y1: 470, x2: 220, y2: 475,
          angle: 170, length: 30, depth: 1, thickness: 2.5,
          children: []
      }
    ]
  };

  /**
   * Recursively finds a branch by its ID in the tree data structure.
   */
  function findBranchById(id, branch = tree) {
    if (branch.id === id) return branch;
    for (const child of branch.children) {
      const found = findBranchById(id, child);
      if (found) return found;
    }
    return null;
  }

  /**
   * Finds the parent of a branch and prunes the child.
   */
  function findParentAndPrune(childId, currentBranch = tree) {
    for (let i = 0; i < currentBranch.children.length; i++) {
      const child = currentBranch.children[i];
      if (child.id === childId) {
        currentBranch.children.splice(i, 1);
        currentBranch.hasDormantBud = true; 
        return true;
      }
      if (findParentAndPrune(childId, child)) return true;
    }
    return false;
  }

  /**
   * Handles the click event on a branch for pruning.
   */
  function onBranchClick(event) {
    const id = parseInt(event.target.getAttribute("data-id"), 10);
    if (id === 0) {
      console.log("You cannot prune the trunk!");
      return;
    }
    if (findParentAndPrune(id)) {
      console.log(`Pruned branch ${id}. A dormant bud has formed on the parent branch.`);
      drawTree();
    }
  }

  /**
   * Draws the entire tree, using "smarter" rules for leaf placement.
   */
  function drawTree() {
    svgCanvas.innerHTML = "";

    function drawBranch(branch) {
      // --- Draw the Branch Line (no changes here) ---
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", branch.x1);
      line.setAttribute("y1", branch.y1);
      line.setAttribute("x2", branch.x2);
      line.setAttribute("y2", branch.y2);
      line.setAttribute("stroke-width", branch.thickness);
      line.setAttribute("stroke", STYLE_CONFIG.branchColor);
      line.classList.add("branch");
      line.setAttribute("data-id", branch.id);
      line.addEventListener("click", onBranchClick);
      svgCanvas.appendChild(line);

      // --- "SMARTER" LEAF LOGIC ---
      // A leaf should only grow on a branch if ALL these conditions are met:
      // 1. The global 'showLeaves' flag is true.
      // 2. It's a terminal branch (has no children).
      // 3. It is NOT a dormant bud site (i.e., not a freshly pruned stump).
      // 4. It is thin enough to be considered a twig.
      const isTerminal = branch.children.length === 0;
      const isDormantStump = branch.hasDormantBud;
      const isThinEnough = branch.thickness <= STYLE_CONFIG.maxLeafThickness;

      if (STYLE_CONFIG.showLeaves && isTerminal && !isDormantStump && isThinEnough) {
        const leaf = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        leaf.setAttribute("cx", branch.x2);
        leaf.setAttribute("cy", branch.y2);
        leaf.setAttribute("r", STYLE_CONFIG.leafSize);
        leaf.setAttribute("fill", STYLE_CONFIG.leafColor);
        leaf.classList.add("leaf");
        svgCanvas.appendChild(leaf);
      }
      // --- End of Leaf Logic ---

      // Recursively draw children (no changes here)
      branch.children.forEach(drawBranch);
    }

    drawBranch(tree);
  }

  /**
   * Checks if a given coordinate is a minimum distance away from all existing branch endpoints.
   */
  function isSpaceFree(x, y, minDistance, branch = tree) {
    const dist = Math.sqrt(Math.pow(branch.x2 - x, 2) + Math.pow(branch.y2 - y, 2));
    if (dist < minDistance) return false;
    for (const child of branch.children) {
      if (!isSpaceFree(x, y, minDistance, child)) return false;
    }
    return true;
  }

  /**
   * Realistically thickens the tree based on its structure using post-order traversal.
   */
  function thickenTree(branch = tree) {
    if (branch.children.length === 0) {
      branch.thickness += STYLE_CONFIG.baseThickenAmount;
      return STYLE_CONFIG.leafMass;
    }
    let cumulativeMassFromChildren = 0;
    branch.children.forEach(child => {
      cumulativeMassFromChildren += thickenTree(child);
    });
    const thicknessIncrease = STYLE_CONFIG.baseThickenAmount + (cumulativeMassFromChildren * STYLE_CONFIG.massThickenFactor);
    branch.thickness += thicknessIncrease;
    return STYLE_CONFIG.leafMass + cumulativeMassFromChildren;
  }

  /**
   * The main function that simulates a year of growth, now with ramification logic.
   */
  function growTree() {
    const growthPoints = [];
    function findGrowthPoints(branch) {
      if (branch.children.length === 0) growthPoints.push({ branch, type: 'leaf' });
      if (branch.hasDormantBud) growthPoints.push({ branch, type: 'dormant' });
      branch.children.forEach(findGrowthPoints);
    }
    findGrowthPoints(tree);

    if (growthPoints.length === 0) {
      thickenTree();
      drawTree();
      return; 
    }

    let didGrow = false;

    // --- IMPERFECT GROWTH: "SUCKERS" ---
    if (Math.random() < STYLE_CONFIG.suckerBranchChance) {
      // (This section remains unchanged)
      const potentialParents = [];
      function findOldWood(branch) {
        if (branch.depth < 2 && branch.id !== 0) potentialParents.push(branch);
        branch.children.forEach(findOldWood);
      }
      findOldWood(tree);
      if (potentialParents.length > 0) {
        didGrow = true;
        const parentBranch = potentialParents[Math.floor(Math.random() * potentialParents.length)];
        branchCounter++;
        parentBranch.children.push({
            id: branchCounter,
            x1: parentBranch.x1 + (parentBranch.x2 - parentBranch.x1) * 0.5,
            y1: parentBranch.y1 + (parentBranch.y2 - parentBranch.y1) * 0.5,
            x2: parentBranch.x2, y2: parentBranch.y2 + 20, angle: 90, length: 25,
            depth: parentBranch.depth + 1,
            thickness: STYLE_CONFIG.newBranchThickness,
            children: [],
        });
      }
    }
    
    // --- REGULAR & RAMIFICATION GROWTH LOGIC ---
    growthPoints.forEach(point => {
      const parentBranch = point.branch;
      const growthType = point.type;
      const growthProbability = growthType === 'leaf' ? STYLE_CONFIG.leafGrowthProbability : STYLE_CONFIG.dormantBudGrowthProbability;

      if (Math.random() < growthProbability && parentBranch.depth <= STYLE_CONFIG.maxDepth) {
        
        // --- THIS IS THE KEY CHANGE FOR RAMIFICATION ---
        // Decide which length factor to use based on the growth type.
        const lengthFactor = (growthType === 'dormant')
          ? STYLE_CONFIG.dormantLengthFactor   // Use smaller factor for pruned sites.
          : STYLE_CONFIG.lengthReductionFactor; // Use regular factor for leaf growth.
          
        const newLength = parentBranch.length * lengthFactor;
        // --- END OF KEY CHANGE ---

        const baseAngle = STYLE_CONFIG.forkAngle;
        const angleRandomness = STYLE_CONFIG.forkAngleRandomness;
        const angles = [baseAngle, -baseAngle];
        const proposedBranches = [];
        let isBlocked = false;
        
        angles.forEach(angleOffset => {
            const newAngle = parentBranch.angle + angleOffset + (Math.random() * angleRandomness - (angleRandomness / 2));
            const x2 = parentBranch.x2 + newLength * Math.cos(newAngle * (Math.PI / 180));
            const y2 = parentBranch.y2 + newLength * Math.sin(newAngle * (Math.PI / 180));
            proposedBranches.push({ x2, y2, newAngle });
        });
        
        for (const prop of proposedBranches) {
          if (!isSpaceFree(prop.x2, prop.y2, STYLE_CONFIG.collisionDistance)) {
            isBlocked = true;
            break;
          }
        }
        
        if (!isBlocked) {
            didGrow = true;
            if (growthType === 'dormant') {
              parentBranch.hasDormantBud = false;
              console.log(`Ramification growth on branch ${parentBranch.id}! New branches are shorter.`);
            }
            proposedBranches.forEach(prop => {
                branchCounter++;
                parentBranch.children.push({
                    id: branchCounter,
                    x1: parentBranch.x2, y1: parentBranch.y2,
                    x2: prop.x2, y2: prop.y2,
                    angle: prop.newAngle, length: newLength,
                    depth: parentBranch.depth + 1,
                    thickness: STYLE_CONFIG.newBranchThickness,
                    children: [],
                });
            });
        }
      }
    });

    // --- AGING and DRAWING ---
    if (didGrow) {
      age++;
      ageDisplay.textContent = age;
      thickenTree();
    }
    drawTree();
  }

  // --- EVENT LISTENERS ---
  passTimeBtn.addEventListener("click", growTree);

  // --- INITIALIZATION ---
  drawTree();
  console.log("Digital Bonsai Garden initialized. Have fun shaping your tree!");
});
