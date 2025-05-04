// Import modules
import { Ant } from './modules/ant.js';
import { drawFood, drawFoodItem, updateFoodDecay } from './modules/food.js';
import { drawObstacles, drawObstacle, isPointInObstacle } from './modules/obstacles.js';
import { saveGameState, loadGameState, showNotification } from './modules/storage.js';
import { settings, updateSpatialGrid, getNearbyObjects, isOnScreen } from './modules/performance.js';
import { Environment } from './modules/environment.js';
import { PredatorManager } from './modules/predators.js';
import { Tutorial } from './modules/tutorial.js';

// Global variables
const canvas = document.getElementById('antCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const gameContainer = document.getElementById('game-container');
const magnifyingGlassElement = document.getElementById('magnifying-glass');
const performanceMonitor = document.getElementById('performance-monitor');

// Set canvas size
canvas.width = gameContainer.clientWidth;
canvas.height = window.innerHeight;

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = gameContainer.clientWidth;
  canvas.height = window.innerHeight;
});

// Track mouse position for hover effects
let lastMouseX = 0;
let lastMouseY = 0;

canvas.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  // Update magnifying glass position if active
  if (magnifyingActive) {
    updateMagnifyingGlassPosition(e);
  }
});

// Load images
const antImage = new Image();
antImage.src = '/img/simple-ant.svg'; // Use our simple SVG ant

// Add error handling for ant image loading
antImage.onerror = function() {
  console.error('Failed to load ant image');
  // Create a fallback image using canvas
  const canvas = document.createElement('canvas');
  canvas.width = 30;
  canvas.height = 30;
  const ctx = canvas.getContext('2d');

  // Draw a simple ant shape
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.ellipse(15, 15, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw legs
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(15, 15);
    ctx.lineTo(15 + Math.cos(angle) * 12, 15 + Math.sin(angle) * 12);
    ctx.stroke();
  }

  // Use this canvas as the image source
  antImage.src = canvas.toDataURL();
};

// Load background image
const backgroundImage = new Image();
backgroundImage.src = '/img/plainsidewalk.jpg';

const foodImages = {
  apple: new Image(),
  bread: new Image(),
  cheese: new Image(),
  sugar: new Image()
};

foodImages.apple.src = '/img/apple.svg';
foodImages.bread.src = '/img/bread.svg';
foodImages.cheese.src = '/img/cheese.svg';
foodImages.sugar.src = '/img/sugar.svg';

// Load obstacle images
const obstacleImages = {
  rock: new Image(),
  stick: new Image(),
  leaf: new Image()
};

obstacleImages.rock.src = '/img/rock.svg';
obstacleImages.stick.src = '/img/stick.svg';
obstacleImages.leaf.src = '/img/leaf.svg';

// Load tool images
const toolImages = {
  magnifyingGlass: new Image()
};

toolImages.magnifyingGlass.src = '/img/magnifying-glass.svg';

// Game state
const ants = [];
const food = [];
const obstacles = [];
const queen = { x: canvas.width / 2, y: canvas.height - 50 };
let score = 0;
let lastAntAddedScore = 0;

// Environment and predators
const environment = new Environment();
const predatorManager = new PredatorManager();

// Tutorial system
const tutorial = new Tutorial();

// Environment indicators
const timeIndicator = document.getElementById('time-indicator');
const timeIcon = document.getElementById('time-icon');
const timeText = document.getElementById('time-text');
const weatherIndicator = document.getElementById('weather-indicator');
const weatherIcon = document.getElementById('weather-icon');
const weatherText = document.getElementById('weather-text');

// Debug mode
window.debugMode = false;

// Track ant types
let scoutCount = 3;
let workerCount = 7;

// Food selection
const foodItems = document.querySelectorAll('.food-item');
let selectedFoodType = 'apple';
let selectedFoodDecay = 15;
let selectedFoodAnts = 2;

// Food properties by type
const foodProperties = {
  apple: { decay: 15, antsNeeded: 2 },
  bread: { decay: 30, antsNeeded: 3 },
  cheese: { decay: 20, antsNeeded: 4 },
  sugar: { decay: 10, antsNeeded: 1 }
};

// Obstacle selection
const obstacleItems = document.querySelectorAll('.obstacle-item');
let selectedObstacleType = null;
let placingObstacle = false;

// Tool selection
const toolItems = document.querySelectorAll('.tool-item');
let selectedTool = null;

// Mode tracking
let currentMode = 'food'; // 'food', 'obstacle', 'tool', or 'remove'

// Magnifying glass elements
let magnifyingActive = false;
let magnifyingHoverTime = 0;
let magnifyingHoverAnt = null;
let burningEffects = [];

// Function to deselect all items
function deselectAllItems() {
  foodItems.forEach(i => i.classList.remove('selected'));
  obstacleItems.forEach(i => i.classList.remove('selected'));
  toolItems.forEach(i => i.classList.remove('selected'));

  // Reset magnifying glass
  if (magnifyingActive) {
    deactivateMagnifyingGlass();
  }
}

// Update stats display
function updateStats() {
  const antCountElement = document.getElementById('ant-count');
  const scoutCountElement = document.getElementById('scout-count');
  const workerCountElement = document.getElementById('worker-count');

  antCountElement.textContent = `Ants: ${ants.length}`;
  scoutCountElement.textContent = `Scouts: ${scoutCount}`;
  workerCountElement.textContent = `Workers: ${workerCount}`;

  // Add warning if ant count is low
  const totalAnts = ants.length;
  if (totalAnts <= 3) {
    antCountElement.style.color = 'red';
    antCountElement.style.fontWeight = 'bold';

    // Flash the display if very low
    if (totalAnts <= 1) {
      if (!antCountElement.classList.contains('flashing')) {
        antCountElement.classList.add('flashing');
      }
    } else {
      antCountElement.classList.remove('flashing');
    }
  } else {
    antCountElement.style.color = '';
    antCountElement.style.fontWeight = '';
    antCountElement.classList.remove('flashing');
  }
}

// Initialize ants with proper types
function initializeAnts() {
  // Clear existing ants
  ants.length = 0;

  // Create scout ants (30% of total)
  for (let i = 0; i < scoutCount; i++) {
    ants.push(new Ant('scout', queen, antImage));
  }

  // Create worker ants (70% of total)
  for (let i = 0; i < workerCount; i++) {
    ants.push(new Ant('worker', queen, antImage));
  }

  updateStats();
}

// Add a new ant based on score
function addNewAnt() {
  // Add a new ant every 10 points
  if (score > 0 && score % 10 === 0 && score !== lastAntAddedScore) {
    lastAntAddedScore = score;

    // Decide whether to add a scout or worker (maintain roughly 30% scouts)
    const currentScoutPercentage = scoutCount / (scoutCount + workerCount);

    if (currentScoutPercentage < 0.3) {
      // Add a scout
      ants.push(new Ant('scout', queen, antImage));
      scoutCount++;
    } else {
      // Add a worker
      ants.push(new Ant('worker', queen, antImage));
      workerCount++;
    }

    updateStats();
    flashScore('#4CAF50'); // Green flash for new ant
  }
}

// Make flashScore globally accessible for the ant.js module
window.flashScore = function(color) {
  scoreDisplay.style.background = color;
  scoreDisplay.textContent = `Score: ${score}`;
  setTimeout(() => {
    scoreDisplay.style.background = '#222';
  }, 200);
}

// Make score globally accessible by creating a getter/setter
Object.defineProperty(window, 'score', {
  get: function() { return score; },
  set: function(value) {
    score = value;
    // Update the score display whenever score changes
    scoreDisplay.textContent = `Score: ${score}`;
  }
});

// Update environment indicators
function updateEnvironmentIndicators() {
  // Update time indicator
  const hours = Math.floor(environment.time);
  const minutes = Math.floor((environment.time - hours) * 60);
  timeText.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Update time icon
  if (environment.isNight) {
    timeIcon.src = '/img/moon.svg';
    timeIndicator.style.background = 'rgba(0, 0, 50, 0.7)';
  } else {
    timeIcon.src = '/img/sun.svg';
    timeIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
  }

  // Update weather indicator
  if (environment.currentWeather !== 'clear') {
    weatherIndicator.style.display = 'flex';
    weatherIcon.src = `/img/${environment.currentWeather}.svg`;
    weatherText.textContent = environment.currentWeather.charAt(0).toUpperCase() + environment.currentWeather.slice(1);

    // Set color based on weather
    switch (environment.currentWeather) {
      case 'rain':
        weatherIndicator.style.background = 'rgba(0, 50, 100, 0.7)';
        break;
      case 'fog':
        weatherIndicator.style.background = 'rgba(100, 100, 100, 0.7)';
        break;
      case 'heat':
        weatherIndicator.style.background = 'rgba(100, 50, 0, 0.7)';
        break;
    }
  } else {
    weatherIndicator.style.display = 'none';
  }
}

// Draw background
function drawBackground() {
  // Check if the image is loaded
  if (backgroundImage.complete) {
    // Draw the background image, stretching it to fit the canvas
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Add a semi-transparent overlay to darken the background slightly
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // If image isn't loaded yet, use a solid color
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawQueen() {
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.arc(queen.x, queen.y, 10, 0, Math.PI * 2);
  ctx.fill();
}

// Magnifying glass functions
function activateMagnifyingGlass() {
  magnifyingActive = true;
  gameContainer.classList.add('magnifying-cursor');
  magnifyingGlassElement.style.display = 'block';

  // Position it initially
  updateMagnifyingGlassPosition({ clientX: lastMouseX, clientY: lastMouseY });
}

function deactivateMagnifyingGlass() {
  magnifyingActive = false;
  gameContainer.classList.remove('magnifying-cursor');
  magnifyingGlassElement.style.display = 'none';
  magnifyingHoverTime = 0;
  magnifyingHoverAnt = null;

  // Remove any burning effects
  removeBurningEffects();
}

function updateMagnifyingGlassPosition(e) {
  magnifyingGlassElement.style.left = e.clientX + 'px';
  magnifyingGlassElement.style.top = e.clientY + 'px';
}

function findAntUnderMagnifyingGlass() {
  const rect = canvas.getBoundingClientRect();
  const x = lastMouseX - rect.left;
  const y = lastMouseY - rect.top;

  // Check if any ant is under the magnifying glass
  for (let i = 0; i < ants.length; i++) {
    const ant = ants[i];
    if (!ant.active) continue; // Skip inactive ants

    const distance = Math.hypot(ant.x - x, ant.y - y);

    // If ant is within 30px of the magnifying glass center
    if (distance < 30) {
      return { type: 'ant', target: ant, index: i };
    }
  }

  return null;
}

function findPredatorUnderMagnifyingGlass() {
  const rect = canvas.getBoundingClientRect();
  const x = lastMouseX - rect.left;
  const y = lastMouseY - rect.top;

  // Check if any predator is under the magnifying glass
  for (let i = 0; i < predatorManager.predators.length; i++) {
    const predator = predatorManager.predators[i];
    if (!predator.active) continue; // Skip inactive predators

    const distance = Math.hypot(predator.x - x, predator.y - y);

    // Use the predator's size to determine detection radius
    // Larger predators are easier to target
    const detectionRadius = Math.max(30, predator.size / 2);

    // If predator is within detection radius of the magnifying glass center
    if (distance < detectionRadius) {
      return { type: 'predator', target: predator, index: i };
    }
  }

  return null;
}

function findTargetUnderMagnifyingGlass() {
  // First check for ants (higher priority)
  const ant = findAntUnderMagnifyingGlass();
  if (ant) return ant;

  // Then check for predators
  const predator = findPredatorUnderMagnifyingGlass();
  if (predator) return predator;

  return null;
}

function createBurningEffect(x, y) {
  const burningEffect = document.createElement('div');
  burningEffect.className = 'burning-effect';
  burningEffect.style.left = x + 'px';
  burningEffect.style.top = y + 'px';
  gameContainer.appendChild(burningEffect);

  burningEffects.push(burningEffect);

  // Remove the effect after 1 second
  setTimeout(() => {
    if (burningEffect.parentNode) {
      burningEffect.parentNode.removeChild(burningEffect);
    }
    burningEffects = burningEffects.filter(effect => effect !== burningEffect);
  }, 1000);
}

function removeBurningEffects() {
  burningEffects.forEach(effect => {
    if (effect.parentNode) {
      effect.parentNode.removeChild(effect);
    }
  });
  burningEffects = [];
}

// Function to reset the game
function resetGame() {
  // Clear all game elements
  ants.length = 0;
  food.length = 0;
  obstacles.length = 0;

  // Reset score and ant counts
  score = 0;
  scoutCount = 3;
  workerCount = 7;

  // Initialize ants again
  initializeAnts();

  // Update stats display
  updateStats();

  // Show notification
  showNotification('Game reset!');
}

// Performance monitoring variables
let lastTime = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFps = 0;

// Optimized animation loop with performance improvements
function animate(timestamp) {
  // Calculate delta time for smooth animations
  const deltaTime = Math.min(timestamp - lastTime, 100); // Cap at 100ms to prevent huge jumps
  lastTime = timestamp;

  // FPS calculation
  frameCount++;
  if (timestamp - lastFpsUpdate >= 1000) {
    currentFps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
    frameCount = 0;
    lastFpsUpdate = timestamp;

    // Update performance monitor
    performanceMonitor.textContent = `FPS: ${currentFps} | Ants: ${ants.length} | Food: ${food.length} | Obstacles: ${obstacles.length}`;
  }

  // Frame skipping for low FPS - more aggressive when FPS is very low
  if (settings.useFrameSkipping) {
    if (currentFps < settings.targetFps / 3) {
      // Very low FPS - skip more frames
      if (frameCount % (settings.maxFrameSkip * 2) !== 0) {
        requestAnimationFrame(animate);
        return;
      }
    } else if (currentFps < settings.targetFps / 2) {
      // Low FPS - skip some frames
      if (frameCount % settings.maxFrameSkip !== 0) {
        requestAnimationFrame(animate);
        return;
      }
    }
  }

  // Split work between frames to reduce load
  const currentFramePhase = frameCount % 4;

  // Phase 0: Update environment and background
  if (currentFramePhase === 0) {
    // Update environment
    environment.update(deltaTime);

    // Update environment indicators
    updateEnvironmentIndicators();

    // Draw the background image (only once per frame)
    drawBackground();

    // Only draw environment effects if not using low quality graphics
    if (!settings.lowQualityGraphics) {
      environment.draw(ctx);
    }

    // Add a semi-transparent overlay for trail effect only if effects are not disabled
    if (!settings.disableEffects) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'; // Reduced opacity for better performance
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // Phase 1: Update food and obstacles
  if (currentFramePhase === 1) {
    // Update food decay with environment effects
    updateFoodDecay(food, environment);

    // Check if we need to add a new ant
    addNewAnt();

    // Update predators
    predatorManager.update(deltaTime, ants, environment);

    // Update spatial grid for optimization
    if (settings.useSpatialPartitioning) {
      updateSpatialGrid(ants, food, obstacles);
    }

    // Always ensure score display is up to date
    scoreDisplay.textContent = `Score: ${score}`;

    // Check if there are no ants left and reset the game if needed
    if (ants.length === 0) {
      console.log("No ants left! Resetting game...");
      showNotification('All ants are gone! Game reset.');
      resetGame();
    }
  }

  // Phase 2: Handle magnifying glass and draw obstacles/food
  if (currentFramePhase === 2) {
    // Handle magnifying glass hover
    if (magnifyingActive) {
      const targetUnderGlass = findTargetUnderMagnifyingGlass();

      // If we're hovering over a target (ant or predator)
      if (targetUnderGlass) {
        const target = targetUnderGlass.target;

        // Draw a highlight around the targeted object
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Use appropriate size for the highlight based on target type
        const highlightSize = targetUnderGlass.type === 'predator' ? target.size / 2 : 15;
        ctx.arc(target.x, target.y, highlightSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // If it's the same target we were already hovering over
        if (magnifyingHoverAnt === target) {
          // Increment hover time
          magnifyingHoverTime += deltaTime;

          // Draw a progress circle around the target
          const progress = Math.min(1, magnifyingHoverTime / 10000); // 10 seconds to burn
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
          ctx.lineWidth = 3;
          ctx.beginPath();

          // Use appropriate size for the progress circle based on target type
          const progressSize = targetUnderGlass.type === 'predator' ? target.size / 2 + 5 : 18;
          ctx.arc(target.x, target.y, progressSize,
                 -Math.PI/2, -Math.PI/2 + progress * Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // If we've been hovering for more than 10 seconds (10000ms)
          if (magnifyingHoverTime >= 10000) {
            // Burn the target!
            createBurningEffect(lastMouseX, lastMouseY);

            if (targetUnderGlass.type === 'ant') {
              // Remove the ant
              ants.splice(targetUnderGlass.index, 1);

              // Update ant counts
              if (target.type === 'scout') {
                scoutCount--;
              } else {
                workerCount--;
              }
              updateStats();

              // Show notification
              showNotification('Ant burned!');
            } else if (targetUnderGlass.type === 'predator') {
              // Mark predator as inactive (will be removed in next update)
              target.active = false;

              // Show notification based on predator type
              showNotification(`${target.type.charAt(0).toUpperCase() + target.type.slice(1)} burned!`);
            }

            // Reset hover
            magnifyingHoverTime = 0;
            magnifyingHoverAnt = null;
          }
        } else {
          // We're hovering over a different target
          magnifyingHoverAnt = target;
          magnifyingHoverTime = 0;
        }

        // Show burning effect under magnifying glass when close to burning
        if (magnifyingHoverTime > 500) {
          // Add a red glow to the magnifying glass
          const burnIntensity = (magnifyingHoverTime - 500) / 9500; // 0 to 1 over 9.5 seconds
          const burnSize = 10 + burnIntensity * 20;

          ctx.save();
          ctx.globalAlpha = burnIntensity * 0.7;
          ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

          const rect = canvas.getBoundingClientRect();
          const x = lastMouseX - rect.left;
          const y = lastMouseY - rect.top;

          ctx.beginPath();
          ctx.arc(x, y, burnSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        // Not hovering over any target
        magnifyingHoverAnt = null;
        magnifyingHoverTime = 0;
      }

      // Draw a circle showing the magnifying glass detection radius
      const rect = canvas.getBoundingClientRect();
      const x = lastMouseX - rect.left;
      const y = lastMouseY - rect.top;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw obstacles first (they're behind everything)
    // Only draw obstacles that are on screen
    if (settings.cullOffscreenObjects) {
      obstacles.filter(o => isOnScreen(o)).forEach(o => {
        drawObstacle(o, ctx, obstacleImages, lastMouseX, lastMouseY, currentMode, isPointInObstacle);
      });
    } else {
      drawObstacles(obstacles, ctx, obstacleImages, lastMouseX, lastMouseY, currentMode, isPointInObstacle);
    }

    drawQueen();

    // Only draw food that is on screen
    if (settings.cullOffscreenObjects) {
      food.filter(f => isOnScreen(f)).forEach(f => {
        drawFoodItem(f, ctx, foodImages);
      });
    } else {
      drawFood(food, ctx, foodImages);
    }

    // Draw predators
    predatorManager.draw(ctx);
  }

  // Phase 3: Update and draw ants
  // Update and draw ants with optimizations
  const viewportCenterX = canvas.width / 2;
  const viewportCenterY = canvas.height / 2;

  // Process ants in batches for better performance
  const batchSize = settings.batchSize || 10;
  const antCount = ants.length;

  // Limit the number of ants processed per frame based on FPS
  const maxAntsPerFrame = currentFps < 20 ? 30 : (currentFps < 30 ? 50 : 100);
  const antsToProcess = Math.min(antCount, maxAntsPerFrame);

  // Process a subset of ants each frame in a round-robin fashion
  const startIndex = (frameCount * batchSize) % antCount;

  for (let i = 0; i < antsToProcess; i += batchSize) {
    const index = (startIndex + i) % antCount;
    const end = Math.min(index + batchSize, antCount);

    for (let j = index; j < end; j++) {
      const ant = ants[j];

      // Skip inactive ants
      if (!ant.active) continue;

      // Update all ants
      ant.update(food, ants, queen, obstacles, settings, environment);

      // Only draw ants that are on screen or close to it
      if (!settings.cullOffscreenObjects || isOnScreen(ant)) {
        // If optimizing rendering, only draw ants within draw distance
        if (!settings.optimizeRendering ||
            Math.hypot(ant.x - viewportCenterX, ant.y - viewportCenterY) <= settings.drawDistance) {
          ant.draw(ctx, foodImages);
        }
      }
    }
  }

  // Request next frame with higher priority for smoother animation
  if ('requestIdleCallback' in window && settings.useRequestIdleCallback) {
    // Use idle callback for non-critical updates when browser is idle
    requestIdleCallback(() => {
      requestAnimationFrame(animate);
    }, { timeout: 1000 / 30 }); // Ensure it runs at least 30 times per second
  } else {
    requestAnimationFrame(animate);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Food selection
  foodItems.forEach(item => {
    item.addEventListener('click', () => {
      // Deselect all items
      deselectAllItems();

      // Select this food item
      item.classList.add('selected');
      selectedFoodType = item.getAttribute('data-type');
      selectedFoodDecay = parseInt(item.getAttribute('data-decay'));
      selectedFoodAnts = parseInt(item.getAttribute('data-ants'));

      // Set mode to food placement
      currentMode = 'food';
      placingObstacle = false;
      selectedTool = null;
    });
  });

  // Obstacle selection
  obstacleItems.forEach(item => {
    item.addEventListener('click', () => {
      // Deselect all items
      deselectAllItems();

      // Select this obstacle item
      item.classList.add('selected');
      selectedObstacleType = item.getAttribute('data-type');

      // Set mode to obstacle placement
      currentMode = 'obstacle';
      placingObstacle = true;
      selectedTool = null;
    });
  });

  // Tool selection
  toolItems.forEach(item => {
    item.addEventListener('click', () => {
      // Deselect all items
      deselectAllItems();

      // Select this tool item
      item.classList.add('selected');
      selectedTool = item.getAttribute('data-type');

      // Set mode to tool usage
      currentMode = 'tool';
      placingObstacle = false;

      // If it's the magnifying glass, activate it
      if (selectedTool === 'magnifying-glass') {
        activateMagnifyingGlass();
      }
    });
  });

  // Canvas click handler
  canvas.addEventListener('click', (e) => {
    // Calculate position relative to the canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if we're clicking on an existing obstacle (for removal)
    const obstacleFound = findObstacleAt(x, y);

    if (obstacleFound && currentMode === 'obstacle') {
      // Remove the obstacle if we're in obstacle mode and clicked on one
      obstacles.splice(obstacleFound.index, 1);
      return;
    }

    // If we're in food placement mode
    if (currentMode === 'food') {
      // Check if the position is not occupied by an obstacle
      if (!findObstacleAt(x, y)) {
        // Add the selected food type with decay timer and ants needed
        food.push({
          x: x,
          y: y,
          type: selectedFoodType,
          decayTime: selectedFoodDecay,
          decayTimer: selectedFoodDecay,
          antsNeeded: selectedFoodAnts,
          assignedAnts: 0
        });
      }
    }
    // If we're in obstacle placement mode
    else if (currentMode === 'obstacle') {
      // Add the selected obstacle type
      obstacles.push({
        x: x,
        y: y,
        type: selectedObstacleType
      });
    }
  });

  // Function to find obstacle at position
  function findObstacleAt(x, y) {
    for (let i = 0; i < obstacles.length; i++) {
      if (isPointInObstacle(x, y, obstacles[i])) {
        return { obstacle: obstacles[i], index: i };
      }
    }
    return null;
  }

  // Add event listeners for game control buttons
  document.getElementById('save-button').addEventListener('click', () => saveGameState(ants, food, obstacles, score, scoutCount, workerCount));
  document.getElementById('load-button').addEventListener('click', () => loadGameState(ants, food, obstacles, queen, updateStats));
  document.getElementById('reset-button').addEventListener('click', resetGame);

  // Settings panel event listeners
  const settingsPanel = document.getElementById('settings-panel');
  const settingsButton = document.getElementById('settings-button');
  const closeSettingsButton = document.getElementById('close-settings');

  // Settings controls
  const cullCheckbox = document.getElementById('setting-cull');
  const spatialCheckbox = document.getElementById('setting-spatial');
  const optimizeCheckbox = document.getElementById('setting-optimize');
  const frameskipCheckbox = document.getElementById('setting-frameskip');
  const simplifiedCheckbox = document.getElementById('setting-simplified');
  const qualitySelect = document.getElementById('setting-quality');
  const targetFpsSelect = document.getElementById('setting-target-fps');
  const antCountSlider = document.getElementById('setting-antcount');
  const antCountValue = document.getElementById('antcount-value');
  const drawDistanceSlider = document.getElementById('setting-draw-distance');
  const drawDistanceValue = document.getElementById('draw-distance-value');
  const applySettingsButton = document.getElementById('apply-settings');

  // Initialize settings values
  cullCheckbox.checked = settings.cullOffscreenObjects;
  spatialCheckbox.checked = settings.useSpatialPartitioning;
  optimizeCheckbox.checked = settings.optimizeRendering;
  frameskipCheckbox.checked = settings.useFrameSkipping;
  simplifiedCheckbox.checked = settings.useSimplifiedPhysics;
  qualitySelect.value = 'low'; // Default to low quality as requested
  targetFpsSelect.value = settings.targetFps.toString();
  antCountSlider.value = 100; // Default max ants
  antCountValue.textContent = antCountSlider.value;
  drawDistanceSlider.value = settings.drawDistance;
  drawDistanceValue.textContent = settings.drawDistance;

  // Apply low quality settings immediately
  settings.maxFrameSkip = 5;
  settings.drawDistance = 1000; // Very large to ensure all ants are visible
  settings.gridSize = 200;
  settings.batchSize = 30;
  settings.lowQualityGraphics = true;
  settings.disableEffects = true;
  settings.minimalAnimations = true;
  settings.simplifiedRendering = true;
  settings.cullOffscreenObjects = false; // Ensure all items display
  settings.optimizeRendering = false; // Ensure all items display

  // Settings panel toggle
  settingsButton.addEventListener('click', () => {
    settingsPanel.style.display = 'block';
  });

  closeSettingsButton.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
  });

  // Apply settings button
  applySettingsButton.addEventListener('click', () => {
    // Apply all settings at once
    settings.cullOffscreenObjects = cullCheckbox.checked;
    settings.useSpatialPartitioning = spatialCheckbox.checked;
    settings.optimizeRendering = optimizeCheckbox.checked;
    settings.useFrameSkipping = frameskipCheckbox.checked;
    settings.useSimplifiedPhysics = simplifiedCheckbox.checked;

    // Apply target FPS
    settings.targetFps = parseInt(targetFpsSelect.value);
    settings.frameInterval = 1000 / settings.targetFps;

    // Apply quality settings
    const quality = qualitySelect.value;
    if (quality === 'low') {
      // Lowest possible settings while ensuring all items display
      settings.maxFrameSkip = 5;
      settings.drawDistance = 1000; // Very large to ensure all ants are visible
      settings.gridSize = 200;
      settings.batchSize = 30;
      settings.lowQualityGraphics = true;
      settings.disableEffects = true;
      settings.minimalAnimations = true;
      settings.simplifiedRendering = true;
      settings.cullOffscreenObjects = false; // Ensure all items display
      settings.optimizeRendering = false; // Ensure all items display
    } else if (quality === 'medium') {
      settings.maxFrameSkip = 3;
      settings.drawDistance = parseInt(drawDistanceSlider.value);
      settings.gridSize = 100;
      settings.batchSize = 15;
      settings.lowQualityGraphics = false;
      settings.disableEffects = false;
      settings.minimalAnimations = false;
      settings.simplifiedRendering = false;
    } else { // high
      settings.maxFrameSkip = 2;
      settings.drawDistance = parseInt(drawDistanceSlider.value);
      settings.gridSize = 50;
      settings.batchSize = 10;
      settings.lowQualityGraphics = false;
      settings.disableEffects = false;
      settings.minimalAnimations = false;
      settings.simplifiedRendering = false;
    }

    // Update draw distance display
    drawDistanceValue.textContent = settings.drawDistance;

    // Update checkboxes to match the selected quality
    cullCheckbox.checked = settings.cullOffscreenObjects;
    optimizeCheckbox.checked = settings.optimizeRendering;

    // Show notification
    showNotification('Performance settings applied!');

    // Close settings panel
    settingsPanel.style.display = 'none';
  });

  // Settings change handlers
  cullCheckbox.addEventListener('change', () => {
    // We'll apply all settings when the Apply button is clicked
  });

  spatialCheckbox.addEventListener('change', () => {
    // We'll apply all settings when the Apply button is clicked
  });

  optimizeCheckbox.addEventListener('change', () => {
    // We'll apply all settings when the Apply button is clicked
  });

  frameskipCheckbox.addEventListener('change', () => {
    // We'll apply all settings when the Apply button is clicked
  });

  simplifiedCheckbox.addEventListener('change', () => {
    // We'll apply all settings when the Apply button is clicked
  });

  qualitySelect.addEventListener('change', () => {
    // Update draw distance based on quality
    const quality = qualitySelect.value;
    if (quality === 'low') {
      drawDistanceSlider.value = Math.min(drawDistanceSlider.value, 100);
      drawDistanceValue.textContent = drawDistanceSlider.value;
    }
  });

  drawDistanceSlider.addEventListener('input', () => {
    drawDistanceValue.textContent = drawDistanceSlider.value;
  });

  antCountSlider.addEventListener('input', () => {
    const maxAnts = parseInt(antCountSlider.value);
    antCountValue.textContent = maxAnts;

    // If we have more ants than the max, remove some
    if (ants.length > maxAnts) {
      // Remove excess ants
      const excessAnts = ants.length - maxAnts;
      ants.splice(ants.length - excessAnts, excessAnts);

      // Update counts
      scoutCount = ants.filter(a => a.type === 'scout').length;
      workerCount = ants.filter(a => a.type === 'worker').length;
      updateStats();
    }
  });

  // Try to load saved game on startup
  try {
    if (!loadGameState(ants, food, obstacles, queen, updateStats)) {
      // If no saved game, initialize a new game
      initializeAnts();
    }
  } catch (e) {
    console.error('Error loading saved game:', e);
    initializeAnts();
  }

  // Start the animation loop
  animate(0);
});
