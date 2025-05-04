// Predator system for the ant simulation
export class Predator {
  constructor(type, x, y) {
    this.type = type; // 'spider', 'beetle', or 'lizard'
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.speed = this.getSpeedForType();
    this.size = this.getSizeForType();
    this.huntRadius = this.getHuntRadiusForType();
    this.eatRadius = this.size / 2;
    this.target = null;
    this.cooldown = 0;
    this.active = true;
    this.health = 100;
    this.maxHealth = 100;
    this.hunger = 50; // 0-100, increases over time
    this.direction = Math.random() * Math.PI * 2;
    this.wanderTimer = 0;
    this.wanderInterval = 2 + Math.random() * 3; // seconds
    this.imageLoaded = false;
    this.imageError = false;

    // Load image
    this.image = new Image();

    // Add event listeners for image loading
    this.image.onload = () => {
      this.imageLoaded = true;
    };

    this.image.onerror = (e) => {
      console.error(`Error loading predator image for ${type}:`, e);
      this.imageError = true;
    };

    // Set the source after adding event listeners
    this.image.src = `/img/${type}.svg`;
  }

  getSpeedForType() {
    switch (this.type) {
      case 'spider': return 1.5;
      case 'beetle': return 0.8;
      case 'lizard': return 2.0;
      default: return 1.0;
    }
  }

  getSizeForType() {
    switch (this.type) {
      case 'spider': return 30;
      case 'beetle': return 35;
      case 'lizard': return 50;
      default: return 30;
    }
  }

  getHuntRadiusForType() {
    switch (this.type) {
      case 'spider': return 150;
      case 'beetle': return 100;
      case 'lizard': return 200;
      default: return 150;
    }
  }

  update(deltaTime, ants, environment) {
    // Skip update if inactive
    if (!this.active) return;

    // Increase hunger over time
    this.hunger += deltaTime / 1000 * 2; // 2 hunger points per second

    // If too hungry, start losing health
    if (this.hunger > 80) {
      this.health -= deltaTime / 1000 * 5; // 5 health points per second
    }

    // Die if health reaches 0
    if (this.health <= 0) {
      this.active = false;
      return;
    }

    // Decrease cooldown
    if (this.cooldown > 0) {
      this.cooldown -= deltaTime / 1000;
    }

    // If we have a target, move toward it
    if (this.target) {
      // Check if target is still valid
      if (!ants.includes(this.target) || !this.target.active) {
        this.target = null;
      } else {
        // Move toward target
        this.moveToward(this.target.x, this.target.y, deltaTime, environment);

        // Check if we can eat the target
        if (Math.hypot(this.x - this.target.x, this.y - this.target.y) < this.eatRadius) {
          this.eatAnt(this.target, ants);
        }
      }
    } else {
      // No target, look for one if hungry enough
      if (this.hunger > 30 && this.cooldown <= 0) {
        this.findTarget(ants);
      }

      // If still no target, wander around
      if (!this.target) {
        this.wander(deltaTime, environment);
      }
    }
  }

  moveToward(x, y, deltaTime, environment) {
    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) return;

    // Get speed multiplier from environment
    const speedMultiplier = environment.getAntSpeedMultiplier(this.x, this.y);

    // Calculate movement
    const moveX = (dx / dist) * this.speed * speedMultiplier * (deltaTime / 1000);
    const moveY = (dy / dist) * this.speed * speedMultiplier * (deltaTime / 1000);

    // Update position
    this.x += moveX;
    this.y += moveY;

    // Update direction for drawing
    this.direction = Math.atan2(dy, dx);
  }

  wander(deltaTime, environment) {
    // Update wander timer
    this.wanderTimer += deltaTime / 1000;

    // Change direction periodically
    if (this.wanderTimer >= this.wanderInterval) {
      this.wanderTimer = 0;
      this.wanderInterval = 2 + Math.random() * 3;
      this.direction = Math.random() * Math.PI * 2;

      // Set a new target point
      const distance = 100 + Math.random() * 100;
      this.targetX = this.x + Math.cos(this.direction) * distance;
      this.targetY = this.y + Math.sin(this.direction) * distance;

      // Keep within canvas bounds
      const canvas = document.getElementById('antCanvas');
      this.targetX = Math.max(this.size, Math.min(canvas.width - this.size, this.targetX));
      this.targetY = Math.max(this.size, Math.min(canvas.height - this.size, this.targetY));
    }

    // Move toward the target point
    this.moveToward(this.targetX, this.targetY, deltaTime, environment);
  }

  findTarget(ants) {
    // Find the closest ant within hunt radius
    let closestAnt = null;
    let closestDist = this.huntRadius;

    for (const ant of ants) {
      if (!ant.active) continue;

      const dist = Math.hypot(this.x - ant.x, this.y - ant.y);
      if (dist < closestDist) {
        closestAnt = ant;
        closestDist = dist;
      }
    }

    this.target = closestAnt;
  }

  eatAnt(ant, ants) {
    // Remove the ant
    const index = ants.indexOf(ant);
    if (index !== -1) {
      // Mark ant as inactive instead of removing
      ant.active = false;

      // Decrease hunger
      this.hunger = Math.max(0, this.hunger - 20);

      // Increase health
      this.health = Math.min(this.maxHealth, this.health + 10);

      // Set cooldown before hunting again
      this.cooldown = 2;

      // Clear target
      this.target = null;
    }
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();

    // Draw predator
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction);

    // Draw the predator using the appropriate method
    this.drawPredatorShape(ctx);

    // Draw health bar if damaged
    if (this.health < this.maxHealth) {
      const barWidth = this.size;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;

      ctx.fillStyle = '#333';
      ctx.fillRect(-barWidth/2, -this.size/2 - 10, barWidth, barHeight);

      ctx.fillStyle = healthPercent > 0.5 ? '#00CC00' :
                      healthPercent > 0.25 ? '#FFCC00' :
                      '#CC0000';
      ctx.fillRect(-barWidth/2, -this.size/2 - 10, barWidth * healthPercent, barHeight);
    }

    ctx.restore();

    // Debug: draw hunt radius
    if (window.debugMode) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.huntRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Helper method to draw the predator shape
  drawPredatorShape(ctx) {
    // If image is loaded successfully, use it
    if (this.imageLoaded && !this.imageError && this.image.complete) {
      try {
        ctx.drawImage(this.image, -this.size/2, -this.size/2, this.size, this.size);
        return;
      } catch (e) {
        console.error(`Error drawing predator image for ${this.type}:`, e);
        this.imageError = true;
      }
    }

    // Fallback: draw a shape based on predator type
    this.drawFallbackShape(ctx);
  }

  // Fallback method to draw a simple shape for the predator
  drawFallbackShape(ctx) {
    // Set color based on predator type
    ctx.fillStyle = this.type === 'spider' ? '#333' :
                    this.type === 'beetle' ? '#663300' :
                    '#006600'; // lizard

    // Draw different shapes based on predator type
    if (this.type === 'spider') {
      this.drawSpiderShape(ctx);
    } else if (this.type === 'beetle') {
      this.drawBeetleShape(ctx);
    } else {
      this.drawLizardShape(ctx);
    }
  }

  // Draw a simple spider shape
  drawSpiderShape(ctx) {
    const size = this.size / 2;

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(size * 0.4, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // Draw 8 legs
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const legLength = size * 1.2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Add a slight curve to the legs
      const midX = Math.cos(angle) * legLength * 0.6;
      const midY = Math.sin(angle) * legLength * 0.6;
      ctx.quadraticCurveTo(
        midX, midY,
        Math.cos(angle) * legLength, Math.sin(angle) * legLength
      );
      ctx.stroke();
    }
  }

  // Draw a simple beetle shape
  drawBeetleShape(ctx) {
    const size = this.size / 2;

    // Body (oval)
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(size * 0.5, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#663300';
    ctx.lineWidth = 2;

    // Draw 6 legs
    for (let i = 0; i < 6; i++) {
      // Distribute legs on both sides
      const side = i % 2 === 0 ? 1 : -1;
      const offset = (Math.floor(i / 2) - 1) * size * 0.4;

      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset, side * size * 0.7);
      ctx.stroke();
    }
  }

  // Draw a simple lizard shape
  drawLizardShape(ctx) {
    const size = this.size / 2;

    // Body (elongated)
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.2, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(size * 0.9, 0, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, 0);
    ctx.quadraticCurveTo(-size * 1.5, size * 0.5, -size * 2, 0);
    ctx.stroke();

    // Legs
    ctx.strokeStyle = '#006600';
    ctx.lineWidth = 2;

    // Front legs
    ctx.beginPath();
    ctx.moveTo(size * 0.5, size * 0.4);
    ctx.lineTo(size * 0.7, size * 0.8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size * 0.5, -size * 0.4);
    ctx.lineTo(size * 0.7, -size * 0.8);
    ctx.stroke();

    // Back legs
    ctx.beginPath();
    ctx.moveTo(-size * 0.5, size * 0.4);
    ctx.lineTo(-size * 0.7, size * 0.8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-size * 0.5, -size * 0.4);
    ctx.lineTo(-size * 0.7, -size * 0.8);
    ctx.stroke();
  }
}

// Predator manager
export class PredatorManager {
  constructor() {
    this.predators = [];
    this.spawnTimer = 0;
    this.spawnInterval = 30; // seconds
    this.maxPredators = 3;

    // Load images
    this.predatorTypes = ['spider', 'beetle', 'lizard'];
    this.images = {};
    this.imageLoadStatus = {};

    // Preload all predator images
    this.predatorTypes.forEach(type => {
      this.imageLoadStatus[type] = { loaded: false, error: false };
      this.images[type] = new Image();

      // Add event listeners for image loading
      this.images[type].onload = () => {
        console.log(`Predator image loaded: ${type}`);
        this.imageLoadStatus[type].loaded = true;
      };

      this.images[type].onerror = (e) => {
        console.error(`Error loading predator image for ${type}:`, e);
        this.imageLoadStatus[type].error = true;
      };

      // Set the source after adding event listeners
      this.images[type].src = `/img/${type}.svg`;
    });
  }

  update(deltaTime, ants, environment) {
    // Update existing predators
    this.predators.forEach(predator => {
      predator.update(deltaTime, ants, environment);
    });

    // Remove inactive predators
    this.predators = this.predators.filter(predator => predator.active);

    // Spawn new predators
    this.spawnTimer += deltaTime / 1000;

    if (this.spawnTimer >= this.spawnInterval && this.predators.length < this.maxPredators) {
      this.spawnPredator(ants);
      this.spawnTimer = 0;
    }
  }

  spawnPredator(ants) {
    try {
      const canvas = document.getElementById('antCanvas');
      if (!canvas) {
        console.error("Canvas element not found");
        return;
      }

      // Select a predator type, preferring ones with successfully loaded images
      let type = this.selectPredatorType();

      // Spawn at a random edge of the canvas
      let x, y;
      const side = Math.floor(Math.random() * 4);

      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width;
          y = 0;
          break;
        case 1: // Right
          x = canvas.width;
          y = Math.random() * canvas.height;
          break;
        case 2: // Bottom
          x = Math.random() * canvas.width;
          y = canvas.height;
          break;
        case 3: // Left
          x = 0;
          y = Math.random() * canvas.height;
          break;
        default:
          x = 0;
          y = 0;
      }

      // Create the predator
      const predator = new Predator(type, x, y);

      // If we have a preloaded image that's working, use it
      if (this.imageLoadStatus[type] && this.imageLoadStatus[type].loaded && !this.imageLoadStatus[type].error) {
        predator.image = this.images[type];
        predator.imageLoaded = true;
        predator.imageError = false;
      }

      this.predators.push(predator);

      // Show notification
      this.showPredatorNotification(type);
    } catch (e) {
      console.error("Error spawning predator:", e);
    }
  }

  // Helper method to select a predator type, preferring ones with successfully loaded images
  selectPredatorType() {
    // First try to find a predator type with a successfully loaded image
    const workingTypes = this.predatorTypes.filter(type =>
      this.imageLoadStatus[type] &&
      this.imageLoadStatus[type].loaded &&
      !this.imageLoadStatus[type].error
    );

    if (workingTypes.length > 0) {
      return workingTypes[Math.floor(Math.random() * workingTypes.length)];
    }

    // If no working images, just pick a random type
    return this.predatorTypes[Math.floor(Math.random() * this.predatorTypes.length)];
  }

  showPredatorNotification(type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification predator-alert';
    notification.innerHTML = `<strong>Warning!</strong> A ${type} has appeared!`;
    document.body.appendChild(notification);

    // Show and then hide the notification
    setTimeout(() => {
      notification.classList.add('show');

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 500);
      }, 3000);
    }, 10);
  }

  draw(ctx) {
    this.predators.forEach(predator => {
      predator.draw(ctx);
    });
  }
}
