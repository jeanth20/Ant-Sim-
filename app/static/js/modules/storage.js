// Import the Ant class
import { Ant } from './ant.js';

// Save game state to cookie
export function saveGameState(ants, food, obstacles, score, scoutCount, workerCount) {
  const gameState = {
    ants: ants.map(ant => ({
      type: ant.type,
      x: ant.x,
      y: ant.y,
      carrying: ant.carrying,
      target: ant.target ? { x: ant.target.x, y: ant.target.y } : null,
      assignedFood: ant.assignedFood ? {
        x: ant.assignedFood.x,
        y: ant.assignedFood.y,
        type: ant.assignedFood.type,
        antsNeeded: ant.assignedFood.antsNeeded,
        assignedAnts: ant.assignedFood.assignedAnts
      } : null
    })),
    food: food.map(f => ({
      type: f.type,
      x: f.x,
      y: f.y,
      decayTime: f.decayTime,
      decayTimer: f.decayTimer,
      antsNeeded: f.antsNeeded,
      assignedAnts: f.assignedAnts || 0
    })),
    obstacles: obstacles.map(o => ({
      type: o.type,
      x: o.x,
      y: o.y
    })),
    score: score,
    scoutCount: scoutCount,
    workerCount: workerCount
  };

  // Convert to JSON string and save to cookie
  const gameStateStr = JSON.stringify(gameState);
  document.cookie = `antSimulation=${encodeURIComponent(gameStateStr)}; max-age=604800; path=/`;

  // Show save confirmation
  showNotification('Game saved!');

  return true;
}

// Load game state from cookie
export function loadGameState(ants, food, obstacles, queen, updateStats) {
  // Get the cookie
  const cookies = document.cookie.split(';');
  let gameStateStr = null;

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith('antSimulation=')) {
      gameStateStr = decodeURIComponent(cookie.substring('antSimulation='.length));
      break;
    }
  }

  if (!gameStateStr) {
    showNotification('No saved game found!');
    return false;
  }

  try {
    const gameState = JSON.parse(gameStateStr);

    // Clear current state
    ants.length = 0;
    food.length = 0;
    obstacles.length = 0;

    // Restore score
    window.score = gameState.score || 0;
    window.scoutCount = gameState.scoutCount || 3;
    window.workerCount = gameState.workerCount || 7;

    // Restore obstacles
    gameState.obstacles.forEach(o => {
      obstacles.push({
        type: o.type,
        x: o.x,
        y: o.y
      });
    });

    // Restore food
    gameState.food.forEach(f => {
      food.push({
        type: f.type,
        x: f.x,
        y: f.y,
        decayTime: f.decayTime,
        decayTimer: f.decayTimer,
        antsNeeded: f.antsNeeded,
        assignedAnts: f.assignedAnts || 0
      });
    });

    // Get the ant image
    let antImage;
    // Try to get the ant image from the window
    if (window.antImage) {
      antImage = window.antImage;
    } else {
      // Create a fallback image
      console.warn('Ant image not found, creating fallback');
      antImage = new Image();
      antImage.src = '/img/simple-ant.svg';
    }

    // Restore ants
    gameState.ants.forEach(a => {
      // Create ant with all required parameters
      const ant = new Ant(a.type, queen, antImage);
      ant.x = a.x;
      ant.y = a.y;
      ant.carrying = a.carrying;

      if (a.target) {
        // Check if target is queen
        if (Math.hypot(a.target.x - queen.x, a.target.y - queen.y) < 10) {
          ant.target = queen;
        } else {
          // Otherwise, find the closest food or create a new target
          ant.target = { x: a.target.x, y: a.target.y };
        }
      }

      if (a.assignedFood) {
        // Try to find the actual food object
        const matchingFood = food.find(f =>
          Math.hypot(f.x - a.assignedFood.x, f.y - a.assignedFood.y) < 10);

        if (matchingFood) {
          ant.assignedFood = matchingFood;
        }
      }

      ants.push(ant);
    });

    updateStats();
    showNotification('Game loaded!');
    return true;
  } catch (e) {
    console.error('Error loading game state:', e);
    showNotification('Error loading game!');
    return false;
  }
}

// Show notification
export function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 2000);
  }, 10);
}
