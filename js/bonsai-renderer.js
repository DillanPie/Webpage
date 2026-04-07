//
// bonsai-page.js
//

// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM ELEMENT REFERENCES ---
  const svgCanvas = document.getElementById("bonsai-canvas");
  const passTimeBtn = document.getElementById("pass-time-btn");
  const ageDisplay = document.getElementById("age-display");

  // --- CORE VARIABLES ---
  // The highest ID in our new tree is 7, so the counter starts at 8.
  let branchCounter = 8;
  let age = 8; // This tree is a bit older.

  // --- TREE DATA STRUCTURE ---
  // A more complex and asymmetrical starter tree with some "imperfect" branches.
  let tree = {
    id: 0,
    x1: 250, y1: 500, x2: 250, y2: 410,
    angle: -90, length: 90, depth: 0,
    thickness: 12, // A thicker trunk
    children: [
      { // Main right-hand branch
        id: 1,
        x1: 250, y1: 430, x2: 300, y2: 390,
        angle: -38, length: 64, depth: 1,
        thickness: 7,
        children: [
          { // Upper fork
            id: 3,
            x1: 300, y1: 390, x2: 340, y2: 375,
            angle: -20, length: 42, depth: 2,
            thickness: 4,
            children: []
          },
          { // A less desirable downward fork, inviting a pruning decision
            id: 4,
            x1: 300, y1: 390, x2: 315, y2: 420,
            angle: 60, length: 33, depth: 2,
            thickness: 3,
            children: []
          }
        ]
      },
      { // Main left-hand branch
        id: 2,
        x1: 250, y1: 450, x2: 200, y2: 430,
        angle: -157, length: 54, depth: 1,
        thickness: 6,
        children: [
          {
            id: 5,
            x1: 200, y1: 430, x2: 160, y2: 420,
            angle: -165, length: 41, depth: 2,
            thickness: 3,
            children: [
              {
                id: 7,
                x1: 160, y1: 420, x2: 130, y2: 400,
                angle: -145, length: 36, depth: 3,
                thickness: 1.5,
                children: []
              }
            ]
          }
        ]
      },
      { // An extra small branch on the trunk
          id: 6,
          x1: 250, y1: 470, x2: 220, y2: 475,
          angle: 170, length: 30, depth: 1,
          thickness: 2.5,
          children: []
      }
    ]
  };

  /**
   * Recursively finds a branch by its ID in the tree data structure.
   * @param {number} id - The ID of the branch to find.
   * @param {object} branch - The current branch to search within (starts with the main tree object).
   * @returns {object|null} - The branch object if found, otherwise null.
   */
  function findBranchById(id, branch = tree) {
    if (branch.id === id) {
      return branch;
    }
    for (const child of branch.children) {
      const found = findBranchById(id, child);
      if (found) {
        return found;
      }
    }
    return null;
  }

  /**
   * Finds the parent of a branch and prunes the child.
   * It marks the parent branch as having a dormant bud for potential regrowth.
   * @param {number} childId - The ID of the branch to prune.
   * @param {object} currentBranch - The branch to start the search from.
   * @returns {boolean} - True if the branch was found and pruned, otherwise false.
   */
  function findParentAndPrune(childId, currentBranch = tree) {
    for (let i = 0; i < currentBranch.children.length; i++) {
      const child = currentBranch.children[i];
      if (child.id === childId) {
        // Found the branch to prune. Remove it from the parent's children array.
        currentBranch.children.splice(i, 1);
        
        // Mark the parent branch as having a dormant bud.
        // We will also initialize the property on the tree if it's not there.
        currentBranch.hasDormantBud = true; 
        
        return true; // Pruning was successful.
      }
      // If not found, recursively search in the children of the current branch.
      if (findParentAndPrune(childId, child)) {
        return true;
      }
    }
    return false; // Branch not found in this path.
  }

  /**
   * Handles the click event on a branch for pruning.
   * (This function remains mostly the same but now calls findParentAndPrune)
   * @param {Event} event - The click event.
   */
  function onBranchClick(event) {
    const id = parseInt(event.target.getAttribute("data-id"), 10);
    if (id === 0) {
      console.log("You cannot prune the trunk!");
      return;
    }
    
    // Call our new pruning function and redraw if it was successful.
    if (findParentAndPrune(id)) {
      console.log(`Pruned branch ${id}. A dormant bud has formed on the parent branch.`);
      drawTree();
    }
  }

  /**
   * Draws the entire tree on the SVG canvas based on the 'tree' object.
   */
   function drawTree() {
    svgCanvas.innerHTML = "";

    function drawBranch(branch) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", branch.x1);
      line.setAttribute("y1", branch.y1);
      line.setAttribute("x2", branch.x2);
      line.setAttribute("y2", branch.y2);

      // --- THIS IS THE KEY CHANGE ---
      // Use the 'thickness' property from our data structure.
      line.setAttribute("stroke-width", branch.thickness);

      line.setAttribute("stroke", "hsl(20, 40%, 30%)");
      line.classList.add("branch");
      line.setAttribute("data-id", branch.id);
      line.addEventListener("click", onBranchClick);
      svgCanvas.appendChild(line);

      branch.children.forEach(drawBranch);
    }

    drawBranch(tree);
  }

  /**
   * Checks if a given coordinate is a minimum distance away from all existing branch endpoints.
   * This prevents branches from growing on top of each other.
   * @param {number} x - The x-coordinate to check.
   * @param {number} y - The y-coordinate to check.
   * @param {number} minDistance - The minimum required distance from any other branch.
   * @param {object} branch - The current branch to start the search from (defaults to the whole tree).
   * @returns {boolean} - True if the space is free, false if it's too close to another branch.
   */
  function isSpaceFree(x, y, minDistance, branch = tree) {
    // Calculate the distance from the given point to the endpoint of the current branch.
    const dist = Math.sqrt(Math.pow(branch.x2 - x, 2) + Math.pow(branch.y2 - y, 2));

    // If the distance is less than the minimum, the space is not free.
    if (dist < minDistance) {
      return false;
    }

    // Recursively check all children. If any of them return false, propagate that result up.
    for (const child of branch.children) {
      if (!isSpaceFree(x, y, minDistance, child)) {
        return false;
      }
    }

    // If we've checked all branches in this path and found no collisions, the space is free.
    return true;
  }

  /**
   * Realistically thickens the tree based on its structure using a post-order traversal.
   * A branch's thickness increase is proportional to the number of sub-branches it supports.
   * @param {object} branch - The branch to start the process from.
   * @returns {number} - The cumulative "growth mass" supported by this branch.
   */
  function thickenTree(branch = tree) {
    // Base Case: If this is a leaf node (no children), it contributes a tiny amount of thickness to itself
    // and returns a base "mass" value to its parent.
    if (branch.children.length === 0) {
      branch.thickness += 0.5; // Leaves themselves barely thicken.
      return 0.5; // Return a base "growth mass"
    }

    // --- Recursive Step ---
    // Calculate the total mass flowing up from all children branches.
    let cumulativeMassFromChildren = 0;
    branch.children.forEach(child => {
      // The mass from the children accumulates.
      cumulativeMassFromChildren += thickenTree(child);
    });

    // The parent branch's thickness increases by a small base amount PLUS a fraction
    // of the total mass it has to support.
    const thicknessIncrease = 0.5 + (cumulativeMassFromChildren / 20);
    branch.thickness += thicknessIncrease;

    // The total mass this branch reports to ITS parent is its own base mass plus all the mass from its children.
    return 0.1 + cumulativeMassFromChildren;
  }



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
    // There's a small chance each year to spawn a single, awkward branch from old wood.
    if (Math.random() < 0.25) { // 25% chance for a sucker to appear
      const potentialParents = [];
      // Find all thick, old branches to be a potential parent for the sucker.
      function findOldWood(branch) {
        if (branch.depth < 2 && branch.id !== 0) { // Only main branches, not the trunk
          potentialParents.push(branch);
        }
        branch.children.forEach(findOldWood);
      }
      findOldWood(tree);

      if (potentialParents.length > 0) {
        didGrow = true;
        const parentBranch = potentialParents[Math.floor(Math.random() * potentialParents.length)];
        
        console.log(`An imperfect "sucker" branch grew on branch ${parentBranch.id}! You might want to prune it.`);
        
        branchCounter++;
        const newBranch = {
            id: branchCounter,
            x1: parentBranch.x1 + (parentBranch.x2 - parentBranch.x1) * 0.5, // Start from middle of parent
            y1: parentBranch.y1 + (parentBranch.y2 - parentBranch.y1) * 0.5,
            x2: parentBranch.x2, // Initially grow towards the parent's end
            y2: parentBranch.y2 + 20, // ...but with an awkward downward pull
            angle: 90, length: 25,
            depth: parentBranch.depth + 1,
            thickness: 1.5,
            children: [],
        };
        parentBranch.children.push(newBranch);
      }
    }
    
    // --- REGULAR GROWTH LOGIC ---
    growthPoints.forEach(point => {
      const parentBranch = point.branch;
      const growthType = point.type;
      const growthProbability = growthType === 'leaf' ? 0.45 : 0.65;

      if (Math.random() < growthProbability && parentBranch.depth <= 7) {
        const newLength = parentBranch.length * 0.8;
        const angles = [30, -30];
        const proposedBranches = [];
        let isBlocked = false;
        
        angles.forEach(angleOffset => {
            const newAngle = parentBranch.angle + angleOffset + (Math.random() * 15 - 7.5);
            const x2 = parentBranch.x2 + newLength * Math.cos(newAngle * (Math.PI / 180));
            const y2 = parentBranch.y2 + newLength * Math.sin(newAngle * (Math.PI / 180));
            proposedBranches.push({ x2, y2, newAngle });
        });
        
        for (const prop of proposedBranches) {
            if (!isSpaceFree(prop.x2, prop.y2, 10)) {
                isBlocked = true;
                break;
            }
        }
        
        if (!isBlocked) {
            didGrow = true;
            if (growthType === 'dormant') parentBranch.hasDormantBud = false;
            proposedBranches.forEach(prop => {
                branchCounter++;
                const newBranch = {
                    id: branchCounter,
                    x1: parentBranch.x2, y1: parentBranch.y2,
                    x2: prop.x2, y2: prop.y2,
                    angle: prop.newAngle, length: newLength,
                    depth: parentBranch.depth + 1,
                    thickness: 1,
                    children: [],
                };
                parentBranch.children.push(newBranch);
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
  // Draw the initial trunk when the page loads
  drawTree();
  console.log("Digital Bonsai Garden initialized. Click 'Pass Time' to grow your tree.");
});
