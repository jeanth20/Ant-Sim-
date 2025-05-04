// Performance settings - lowest possible while ensuring all items display
export const settings = {
  targetFps: 15, // Lowest FPS for maximum performance
  frameInterval: 1000 / 15, // Target 15 FPS
  useFrameSkipping: true,
  maxFrameSkip: 5, // More aggressive frame skipping
  useObjectPooling: true,
  useSpatialPartitioning: true,
  cullOffscreenObjects: false, // Disabled to ensure all items display
  optimizeRendering: false, // Disabled to ensure all items display
  drawDistance: 1000, // Very large value to ensure all ants are visible
  gridSize: 200, // Larger grid size for better performance
  useSimplifiedPhysics: true,
  batchSize: 30, // Process more ants in each batch for better performance
  useRequestIdleCallback: true, // Use idle callback for better performance
  simplifiedRendering: true, // Use simplified rendering for better performance
  disableEffects: true, // Disable visual effects for better performance
  minimalAnimations: true, // Use minimal animations for better performance
  lowQualityGraphics: true, // Use low quality graphics for better performance
};

// Spatial grid for optimization
const spatialGrid = {};

// Function to update the spatial grid
export function updateSpatialGrid(ants, food, obstacles) {
  // Clear the grid - more efficient way
  Object.keys(spatialGrid).forEach(key => {
    spatialGrid[key] = [];
  });

  // Only update every other frame to reduce CPU usage
  const currentFrame = performance.now() / settings.frameInterval;
  const updateAnts = Math.floor(currentFrame) % 2 === 0;
  const updateFood = true; // Always update food as it's less frequent
  const updateObstacles = Math.floor(currentFrame) % 4 === 0; // Update obstacles less frequently

  // Add ants to the grid - only active ants
  if (updateAnts) {
    // Use for loop instead of forEach for better performance
    const antCount = ants.length;
    for (let i = 0; i < antCount; i++) {
      const ant = ants[i];
      if (!ant.active) continue; // Skip inactive ants

      const gridX = Math.floor(ant.x / settings.gridSize);
      const gridY = Math.floor(ant.y / settings.gridSize);
      const key = `${gridX},${gridY}`;

      if (!spatialGrid[key]) {
        spatialGrid[key] = [];
      }

      spatialGrid[key].push(ant);
    }
  }

  // Add food to the grid
  if (updateFood) {
    const foodCount = food.length;
    for (let i = 0; i < foodCount; i++) {
      const f = food[i];

      const gridX = Math.floor(f.x / settings.gridSize);
      const gridY = Math.floor(f.y / settings.gridSize);
      const key = `${gridX},${gridY}`;

      if (!spatialGrid[key]) {
        spatialGrid[key] = [];
      }

      spatialGrid[key].push(f);
    }
  }

  // Add obstacles to the grid - obstacles rarely move so update less frequently
  if (updateObstacles) {
    const obstacleCount = obstacles.length;
    for (let i = 0; i < obstacleCount; i++) {
      const o = obstacles[i];

      const gridX = Math.floor(o.x / settings.gridSize);
      const gridY = Math.floor(o.y / settings.gridSize);
      const key = `${gridX},${gridY}`;

      if (!spatialGrid[key]) {
        spatialGrid[key] = [];
      }

      spatialGrid[key].push(o);
    }
  }
}

// Function to get nearby objects
export function getNearbyObjects(x, y, radius) {
  const result = [];

  // Use a smaller search radius when there are many objects
  // This helps prevent performance issues with too many nearby objects
  const objectCount = Object.values(spatialGrid).reduce((sum, arr) => sum + arr.length, 0);
  const adjustedRadius = objectCount > 500 ? Math.min(radius, 50) : radius;

  const gridRadius = Math.ceil(adjustedRadius / settings.gridSize);
  const centerGridX = Math.floor(x / settings.gridSize);
  const centerGridY = Math.floor(y / settings.gridSize);

  // Use a more efficient search pattern - check center cell first, then expand outward
  // This helps when most relevant objects are in the center cell
  const key = `${centerGridX},${centerGridY}`;
  if (spatialGrid[key]) {
    result.push(...spatialGrid[key]);
  }

  // If we need more precision, check surrounding cells
  if (gridRadius > 0) {
    // Check immediate neighbors first (more likely to contain relevant objects)
    for (let gx = centerGridX - 1; gx <= centerGridX + 1; gx++) {
      for (let gy = centerGridY - 1; gy <= centerGridY + 1; gy++) {
        if (gx === centerGridX && gy === centerGridY) continue; // Skip center cell (already processed)

        const key = `${gx},${gy}`;
        if (spatialGrid[key]) {
          result.push(...spatialGrid[key]);
        }
      }
    }

    // Only check outer cells if radius is larger
    if (gridRadius > 1) {
      for (let gx = centerGridX - gridRadius; gx <= centerGridX + gridRadius; gx++) {
        for (let gy = centerGridY - gridRadius; gy <= centerGridY + gridRadius; gy++) {
          // Skip cells we've already checked
          if (Math.abs(gx - centerGridX) <= 1 && Math.abs(gy - centerGridY) <= 1) continue;

          const key = `${gx},${gy}`;
          if (spatialGrid[key]) {
            result.push(...spatialGrid[key]);
          }
        }
      }
    }
  }

  return result;
}

// Function to check if an object is on screen
export function isOnScreen(obj, buffer = 50) {
  // Cache canvas dimensions to avoid DOM access on every call
  if (!window._canvasDimensions || window._lastCanvasCheck < performance.now() - 1000) {
    const canvas = document.getElementById('antCanvas');
    window._canvasDimensions = {
      width: canvas.width,
      height: canvas.height
    };
    window._lastCanvasCheck = performance.now();
  }

  return obj.x >= -buffer &&
         obj.x <= window._canvasDimensions.width + buffer &&
         obj.y >= -buffer &&
         obj.y <= window._canvasDimensions.height + buffer;
}

// Add a new function to help with object pooling
export function getObjectPool(type, size) {
  if (!window._objectPools) {
    window._objectPools = {};
  }

  if (!window._objectPools[type]) {
    window._objectPools[type] = [];
  }

  // Create objects if needed
  while (window._objectPools[type].length < size) {
    window._objectPools[type].push({});
  }

  return window._objectPools[type];
}

// Add a function to throttle expensive operations
export function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = performance.now();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return func(...args);
  };
}
