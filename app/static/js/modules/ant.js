// Ant class
export class Ant {
  constructor(type = 'worker', queen, antImage) {
    this.x = queen.x + Math.random() * 50 - 25;
    this.y = queen.y + Math.random() * 50 - 25;
    this.type = type; // 'scout' or 'worker'
    this.speed = type === 'scout' ? 1.8 : 1.2; // Scouts are faster
    this.target = null;
    this.carrying = false;
    this.assignedFood = null;
    this.assignedWorkers = [];
    this.followingScout = null;
    this.antImage = antImage;
    this.active = true; // Used to mark ants that have been eaten by predators
    this.fleeing = false; // Whether the ant is fleeing from a predator
    this.fleeTarget = null; // Where the ant is fleeing to
  }

  update(food, ants, queen, obstacles, settings, environment) {
    // Skip if inactive
    if (!this.active) return;

    if (this.type === 'scout') {
      this.updateScout(food, ants, queen, obstacles, settings, environment);
    } else {
      this.updateWorker(food, ants, queen, obstacles, settings, environment);
    }
  }

  updateScout(food, ants, queen, obstacles, settings, environment) {
    // Check if we should flee from predators
    if (this.checkForPredators(ants, queen, obstacles, settings, environment)) {
      return; // We're fleeing, don't do anything else
    }

    // Validate queen exists
    if (!queen || typeof queen.x !== 'number' || typeof queen.y !== 'number') {
      console.warn("Invalid queen object in updateScout");
      this.wander(environment);
      return;
    }

    if (this.assignedFood) {
      // Validate assignedFood still exists and has valid coordinates
      if (!this.assignedFood || typeof this.assignedFood.x !== 'number' || typeof this.assignedFood.y !== 'number') {
        console.warn("Invalid assignedFood in updateScout");
        this.assignedFood = null;
        this.assignedWorkers = [];
        this.target = null;
        this.wander(environment);
        return;
      }

      // Scout is leading workers to food
      this.moveToward(this.assignedFood, obstacles, settings, environment);

      // If the food is gone or fully assigned, go back to searching
      if (!food.includes(this.assignedFood) ||
          this.assignedFood.assignedAnts >= this.assignedFood.antsNeeded) {
        this.assignedFood = null;
        this.assignedWorkers = [];
        this.target = null;
      }
    } else if (!this.carrying) {
      // Scout looking for food
      if (!this.target || !food.includes(this.target)) {
        // Find food that doesn't have enough ants assigned yet
        const availableFood = food.filter(f =>
          f && typeof f.x === 'number' && typeof f.y === 'number' &&
          (!f.assignedAnts || f.assignedAnts < f.antsNeeded));

        if (availableFood.length > 0) {
          this.target = availableFood.sort((a, b) =>
            this.distance(a) - this.distance(b))[0];
        } else {
          this.target = null;
        }
      }

      if (this.target) {
        // Validate target still exists and has valid coordinates
        if (typeof this.target.x !== 'number' || typeof this.target.y !== 'number') {
          console.warn("Invalid target in updateScout");
          this.target = null;
          this.wander(environment);
          return;
        }

        this.moveToward(this.target, obstacles, settings, environment);
        if (this.distance(this.target) < 15) {
          // Found food, assign it to this scout
          this.assignedFood = this.target;

          // If food only needs one ant, collect it directly
          if (this.assignedFood.antsNeeded === 1) {
            this.carrying = true;
            this.assignedFood.assignedAnts = 1;
            this.target = queen;
          } else {
            // Otherwise, recruit workers
            this.assignedFood.assignedAnts = this.assignedFood.assignedAnts || 0;
          }
        }
      } else {
        this.wander(environment);
      }
    } else {
      // Scout carrying food back to queen
      if (!this.target) {
        console.warn("Scout carrying food but has no target");
        this.target = queen; // Set queen as default target
      }

      this.moveToward(this.target, obstacles, settings, environment); // target is queen
      if (this.distance(this.target) < 10) {
        // Increment score - direct approach
        try {
          // Directly increment the score in the parent window
          window.score = (window.score || 0) + 1;
          console.log("Scout delivered food! Score is now: " + window.score);

          // Flash the score display
          if (typeof window.flashScore === 'function') {
            window.flashScore('green');
          }
        } catch (e) {
          console.error("Error updating score:", e);
        }

        this.carrying = false;

        // Remove the food from the array
        if (this.assignedFood) {
          const foodIndex = food.indexOf(this.assignedFood);
          if (foodIndex !== -1) {
            food.splice(foodIndex, 1);
          }
        }

        this.assignedFood = null;
        this.target = null;
      }
    }
  }

  // Check for nearby predators and flee if necessary
  checkForPredators(ants, queen, obstacles, settings, environment) {
    // This is a placeholder - the actual implementation would check for predators
    // from the predatorManager and make the ant flee if a predator is nearby

    // If we're already fleeing, continue to flee
    if (this.fleeing) {
      // Validate queen exists for safety target
      if (!queen || typeof queen.x !== 'number' || typeof queen.y !== 'number') {
        console.warn("Invalid queen object in checkForPredators");
        this.fleeing = false;
        this.fleeTarget = null;
        return false;
      }

      if (!this.fleeTarget || typeof this.fleeTarget.x !== 'number' || typeof this.fleeTarget.y !== 'number') {
        // Set flee target to queen (safety) if current target is invalid
        this.fleeTarget = queen;
      }

      // Move toward flee target
      this.moveToward(this.fleeTarget, obstacles, settings, environment);

      // If we reached the flee target, stop fleeing
      if (this.fleeTarget && this.distance(this.fleeTarget) < 10) {
        this.fleeing = false;
        this.fleeTarget = null;
        return false;
      }

      return true; // Still fleeing
    }

    return false; // Not fleeing
  }

  updateWorker(food, ants, queen, obstacles, settings, environment) {
    // Check if we should flee from predators
    if (this.checkForPredators(ants, queen, obstacles, settings, environment)) {
      return; // We're fleeing, don't do anything else
    }

    // Validate queen exists
    if (!queen || typeof queen.x !== 'number' || typeof queen.y !== 'number') {
      console.warn("Invalid queen object in updateWorker");
      this.wander(environment);
      return;
    }

    if (this.followingScout) {
      // Validate followingScout still exists and has valid coordinates
      if (!this.followingScout || typeof this.followingScout.x !== 'number' ||
          typeof this.followingScout.y !== 'number' || !this.followingScout.active) {
        console.warn("Invalid followingScout in updateWorker");
        this.followingScout = null;
        this.target = null;
        this.wander(environment);
        return;
      }

      // Worker following a scout to food
      this.moveToward(this.followingScout, obstacles, settings, environment);

      // If we reached the food or the scout no longer has assigned food
      if (this.followingScout.assignedFood &&
          typeof this.followingScout.assignedFood.x === 'number' &&
          typeof this.followingScout.assignedFood.y === 'number' &&
          this.distance(this.followingScout.assignedFood) < 10) {
        // Start collecting the food
        this.target = this.followingScout.assignedFood;
        this.followingScout = null;

        // Increment assigned ants count
        this.target.assignedAnts = (this.target.assignedAnts || 0) + 1;

        // If we have enough ants, start carrying
        if (this.target.assignedAnts >= this.target.antsNeeded) {
          this.carrying = true;
          this.target = queen;
        }
      } else if (!this.followingScout.assignedFood) {
        // Scout no longer has assigned food, stop following
        this.followingScout = null;
        this.target = null;
      }
    } else if (!this.carrying) {
      // Worker looking for a scout to follow or food to collect
      if (!this.target) {
        // Look for a scout with assigned food that needs workers
        const availableScouts = ants.filter(a =>
          a && a.type === 'scout' &&
          a.assignedFood &&
          typeof a.assignedFood.x === 'number' &&
          typeof a.assignedFood.y === 'number' &&
          a.active && // Only follow active scouts
          (a.assignedFood.assignedAnts || 0) < a.assignedFood.antsNeeded &&
          a.assignedWorkers && Array.isArray(a.assignedWorkers) &&
          a.assignedWorkers.length < a.assignedFood.antsNeeded - (a.assignedFood.assignedAnts || 0)
        );

        if (availableScouts.length > 0) {
          // Follow the nearest scout
          this.followingScout = availableScouts.sort((a, b) =>
            this.distance(a) - this.distance(b))[0];

          // Add this worker to the scout's assigned workers
          this.followingScout.assignedWorkers.push(this);
        } else {
          // No scouts to follow, wander around
          this.wander(environment);
        }
      }
    } else {
      // Worker carrying food back to queen
      if (!this.target) {
        console.warn("Worker carrying food but has no target");
        this.target = queen; // Set queen as default target
      }

      this.moveToward(this.target, obstacles, settings, environment); // target is queen
      if (this.distance(this.target) < 10) {
        // Increment score - direct approach
        try {
          // Directly increment the score in the parent window
          window.score = (window.score || 0) + 1;
          console.log("Worker delivered food! Score is now: " + window.score);

          // Flash the score display
          if (typeof window.flashScore === 'function') {
            window.flashScore('green');
          }
        } catch (e) {
          console.error("Error updating score:", e);
        }

        this.carrying = false;

        // If this was the last ant carrying this food, remove it
        if (this.target !== queen) {
          const foodIndex = food.indexOf(this.target);
          if (foodIndex !== -1) {
            food.splice(foodIndex, 1);
          }
        }

        this.target = null;
      }
    }
  }

  moveToward(target, obstacles, settings, environment) {
    // Skip if inactive or if target is null/undefined
    if (!this.active || !target) {
      console.warn("Ant.moveToward called with null/undefined target or inactive ant");
      return;
    }

    // Ensure target has x and y properties
    if (typeof target.x !== 'number' || typeof target.y !== 'number') {
      console.warn("Ant.moveToward called with invalid target:", target);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    // If we're already very close to the target, just arrive there
    if (dist < 0.1) {
      this.x = target.x;
      this.y = target.y;
      return;
    }

    // Get speed multiplier from environment
    const speedMultiplier = environment ?
      environment.getAntSpeedMultiplier(this.x, this.y) : 1.0;

    // Calculate the next position with environment effects
    let nextX = this.x + (dx / dist) * this.speed * speedMultiplier;
    let nextY = this.y + (dy / dist) * this.speed * speedMultiplier;

    // Check if the next position would be inside an obstacle
    let obstacleAvoidance = { x: 0, y: 0 };

    // Use spatial partitioning to only check nearby obstacles
    let nearbyObstacles;
    if (settings.useSpatialPartitioning) {
      // Get obstacles within a certain radius
      nearbyObstacles = getNearbyObjects(this.x, this.y, 50)
        .filter(obj => obstacles.includes(obj));
    } else {
      nearbyObstacles = obstacles;
    }

    // Limit the number of obstacles we check for performance
    const maxObstaclesToCheck = 5;
    if (nearbyObstacles.length > maxObstaclesToCheck) {
      // Sort by distance and take the closest ones
      nearbyObstacles = nearbyObstacles
        .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))
        .slice(0, maxObstaclesToCheck);
    }

    for (const obstacle of nearbyObstacles) {
      // Check if we're too close to an obstacle
      const obstacleX = obstacle.x;
      const obstacleY = obstacle.y;
      const obstacleRadius = obstacle.type === 'stick' ? 15 : 20;

      const distToObstacle = Math.hypot(nextX - obstacleX, nextY - obstacleY);

      if (distToObstacle < obstacleRadius + 5) { // Add a small buffer
        // Calculate avoidance vector (away from obstacle)
        const avoidX = nextX - obstacleX;
        const avoidY = nextY - obstacleY;
        const avoidDist = Math.max(0.1, Math.hypot(avoidX, avoidY));

        // Add to total avoidance (weighted by how close we are)
        const weight = 1.0 - Math.min(1.0, distToObstacle / (obstacleRadius + 5));
        obstacleAvoidance.x += (avoidX / avoidDist) * weight * 2;
        obstacleAvoidance.y += (avoidY / avoidDist) * weight * 2;
      }
    }

    // Apply obstacle avoidance to movement
    const avoidMagnitude = Math.hypot(obstacleAvoidance.x, obstacleAvoidance.y);
    if (avoidMagnitude > 0) {
      // Blend between target direction and avoidance
      const blendFactor = Math.min(1.0, avoidMagnitude / 2);
      nextX = this.x + (dx / dist) * this.speed * (1 - blendFactor) +
              obstacleAvoidance.x * blendFactor;
      nextY = this.y + (dy / dist) * this.speed * (1 - blendFactor) +
              obstacleAvoidance.y * blendFactor;
    }

    this.x = nextX;
    this.y = nextY;
  }

  wander(environment) {
    // Skip if inactive
    if (!this.active) return;

    // Get speed multiplier from environment
    let speedMultiplier = 1.0;
    try {
      if (environment && typeof environment.getAntSpeedMultiplier === 'function') {
        speedMultiplier = environment.getAntSpeedMultiplier(this.x, this.y);
      }
    } catch (e) {
      console.warn("Error getting speed multiplier:", e);
      speedMultiplier = 1.0;
    }

    // Random movement with environment effects
    this.x += (Math.random() * 2 - 1) * speedMultiplier;
    this.y += (Math.random() * 2 - 1) * speedMultiplier;

    // Keep within canvas bounds
    try {
      const canvas = document.getElementById('antCanvas');
      if (canvas) {
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
      }
    } catch (e) {
      console.warn("Error keeping ant within canvas bounds:", e);
      // Fallback to reasonable bounds if canvas can't be found
      this.x = Math.max(0, Math.min(800, this.x));
      this.y = Math.max(0, Math.min(600, this.y));
    }
  }

  distance(obj) {
    // Check if obj is valid and has x and y properties
    if (!obj || typeof obj.x !== 'number' || typeof obj.y !== 'number') {
      console.warn("Invalid object passed to distance method:", obj);
      return Infinity; // Return a large distance to avoid further processing
    }
    return Math.hypot(this.x - obj.x, this.y - obj.y);
  }

  draw(ctx, foodImages) {
    // Skip if inactive
    if (!this.active) return;

    // Always use the placeholder method for consistent rendering
    this.drawPlaceholder(ctx);
    return;

    /* The following code is commented out to ensure we always use the placeholder
    // Ensure the ant image is loaded
    if (!this.antImage || !this.antImage.complete) {
      // If image isn't loaded, draw a simple placeholder
      this.drawPlaceholder(ctx);
      return;
    }

    ctx.save();
    const size = this.type === 'scout' ? 30 : 24; // Scouts are bigger

    try {
      // Rotate in the direction of movement if the ant has a target
      if (this.target || this.followingScout || this.assignedFood) {
        let dx, dy;

        if (this.target) {
          dx = this.target.x - this.x;
          dy = this.target.y - this.y;
        } else if (this.followingScout) {
          dx = this.followingScout.x - this.x;
          dy = this.followingScout.y - this.y;
        } else {
          dx = this.assignedFood.x - this.x;
          dy = this.assignedFood.y - this.y;
        }

        const angle = Math.atan2(dy, dx);

        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.translate(-size/2, -size/2);

        // Draw the ant image with color tint based on type
        try {
          ctx.drawImage(this.antImage, 0, 0, size, size);
        } catch (e) {
          // If drawing fails, use a fallback
          ctx.fillStyle = this.type === 'scout' ? '#ff0' : '#fff';
          ctx.fillRect(0, 0, size, size);
        }

        // Add color overlay for scout/worker - simplified for performance
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.type === 'scout' ? '#ff0' : '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 1;

        // If carrying food, show a small colored dot
        if (this.carrying) {
          // Simplified food indicator for better performance
          ctx.fillStyle = '#f0f';
          ctx.beginPath();
          ctx.arc(size/2, -5, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // If scout with assigned food, show a simplified beacon
        if (this.type === 'scout' && this.assignedFood) {
          ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
          ctx.beginPath();
          ctx.arc(size/2, size/2, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // If no target, just draw the ant without rotation
        try {
          ctx.drawImage(this.antImage, this.x - size/2, this.y - size/2, size, size);
        } catch (e) {
          // If drawing fails, use a fallback
          ctx.fillStyle = this.type === 'scout' ? '#ff0' : '#fff';
          ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        }

        // Add color overlay for scout/worker - simplified for performance
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = this.type === 'scout' ? '#ff0' : '#fff';
        ctx.fillRect(this.x - size/2, this.y - size/2, size, size);
        ctx.globalAlpha = 1;
      }
    } catch (e) {
      // If any error occurs during drawing, use the placeholder
      this.drawPlaceholder(ctx);
    }

    ctx.restore();
    */
  }

  // Fallback method to draw a simple ant shape if the image fails
  drawPlaceholder(ctx) {
    ctx.save();

    // Get movement direction if available
    let angle = 0;
    if (this.target || this.followingScout || this.assignedFood) {
      let dx, dy;
      if (this.target) {
        dx = this.target.x - this.x;
        dy = this.target.y - this.y;
      } else if (this.followingScout) {
        dx = this.followingScout.x - this.x;
        dy = this.followingScout.y - this.y;
      } else {
        dx = this.assignedFood.x - this.x;
        dy = this.assignedFood.y - this.y;
      }
      angle = Math.atan2(dy, dx);
    }

    // Draw a more detailed ant shape
    const size = this.type === 'scout' ? 15 : 12;

    // Draw with rotation
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Draw body (oval)
    ctx.fillStyle = this.type === 'scout' ? '#FFCC00' : '#DDDDDD';
    ctx.beginPath();
    ctx.ellipse(0, 0, size/2, size/3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw head (circle)
    ctx.beginPath();
    ctx.arc(size/2, 0, size/4, 0, Math.PI * 2);
    ctx.fill();

    // Draw legs
    ctx.strokeStyle = this.type === 'scout' ? '#CC9900' : '#AAAAAA';
    ctx.lineWidth = 1;

    // Three legs on each side
    for (let i = -1; i <= 1; i++) {
      // Left side legs
      ctx.beginPath();
      ctx.moveTo(-size/4, 0);
      ctx.lineTo(-size/2, i * (size/3));
      ctx.stroke();

      // Right side legs
      ctx.beginPath();
      ctx.moveTo(size/4, 0);
      ctx.lineTo(size/2, i * (size/3));
      ctx.stroke();
    }

    // If carrying food, add an indicator
    if (this.carrying) {
      ctx.fillStyle = '#FF00FF';
      ctx.beginPath();
      ctx.arc(0, -size/2, size/4, 0, Math.PI * 2);
      ctx.fill();
    }

    // If scout with assigned food, show a beacon
    if (this.type === 'scout' && this.assignedFood) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();

      // Add pulsing effect
      const pulseSize = (Math.sin(Date.now() * 0.005) * 0.3 + 0.7) * size * 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Helper function for spatial partitioning
// eslint-disable-next-line no-unused-vars
function getNearbyObjects(x, y, radius) {
  // This is a placeholder - the actual implementation is in performance.js
  // It's referenced here for the Ant class to use
  return [];
}
