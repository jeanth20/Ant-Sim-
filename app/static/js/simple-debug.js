/**
 * Simple Debug Monitor
 * 
 * A lightweight debug monitor for the ant simulation that doesn't rely on the original debug.js file.
 * This file can be included directly in the HTML to add basic performance monitoring.
 */

// Create the debug monitor when the page loads
window.addEventListener('load', function() {
  console.log('Simple Debug Monitor loaded');
  
  // Create the debug monitor
  const debugMonitor = new SimpleDebugMonitor();
  
  // Make it available globally
  window.debugMonitor = debugMonitor;
  
  // Start monitoring
  debugMonitor.start();
});

// Simple Debug Monitor class
class SimpleDebugMonitor {
  constructor() {
    // Performance metrics
    this.metrics = {
      fps: 0,
      frameTime: 0,
      antCount: 0,
      foodCount: 0,
      obstacleCount: 0,
      predatorCount: 0,
      memoryUsage: 0,
      longFrames: 0
    };
    
    // Configuration
    this.config = {
      enabled: true,
      overlayEnabled: true,
      longFrameThreshold: 100, // ms
      updateInterval: 1000, // ms
      watchdogInterval: 5000 // ms
    };
    
    // Timing data
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.lastUpdateTime = performance.now();
    
    // Create the overlay
    this.createOverlay();
    
    // Set up global error handling
    this.setupErrorHandling();
    
    console.log('Simple Debug Monitor initialized');
  }
  
  // Create the debug overlay
  createOverlay() {
    // Check if overlay already exists
    if (document.getElementById('simple-debug-overlay')) {
      return;
    }
    
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'simple-debug-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.right = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.color = '#fff';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '12px';
    overlay.style.zIndex = '1000';
    overlay.style.display = this.config.overlayEnabled ? 'block' : 'none';
    
    // Create content
    overlay.innerHTML = `
      <div>FPS: <span id="simple-debug-fps">0</span></div>
      <div>Frame Time: <span id="simple-debug-frame-time">0</span> ms</div>
      <div>Ants: <span id="simple-debug-ants">0</span></div>
      <div>Food: <span id="simple-debug-food">0</span></div>
      <div>Obstacles: <span id="simple-debug-obstacles">0</span></div>
      <div>Memory: <span id="simple-debug-memory">0</span> MB</div>
      <div>Long Frames: <span id="simple-debug-long-frames">0</span></div>
    `;
    
    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle';
    toggleButton.style.marginTop = '10px';
    toggleButton.style.padding = '5px';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = '#fff';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';
    
    toggleButton.addEventListener('click', () => {
      this.config.overlayEnabled = !this.config.overlayEnabled;
      overlay.style.display = this.config.overlayEnabled ? 'block' : 'none';
    });
    
    overlay.appendChild(toggleButton);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Add a reset button
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Simulation';
    resetButton.style.position = 'fixed';
    resetButton.style.bottom = '10px';
    resetButton.style.right = '10px';
    resetButton.style.backgroundColor = '#D32F2F';
    resetButton.style.color = '#fff';
    resetButton.style.padding = '10px';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.zIndex = '1000';
    
    resetButton.addEventListener('click', () => {
      this.resetSimulation();
    });
    
    document.body.appendChild(resetButton);
  }
  
  // Set up global error handling
  setupErrorHandling() {
    // Handle uncaught exceptions
    window.addEventListener('error', (event) => {
      console.error(`Uncaught error: ${event.message}`, event.error);
      this.showErrorMessage(`Uncaught error: ${event.message}`);
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error(`Unhandled promise rejection: ${event.reason}`, event.reason);
      this.showErrorMessage(`Unhandled promise rejection: ${event.reason}`);
    });
  }
  
  // Show an error message
  showErrorMessage(message) {
    // Create error message container
    const errorContainer = document.createElement('div');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '50%';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translate(-50%, -50%)';
    errorContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.9)';
    errorContainer.style.color = '#fff';
    errorContainer.style.padding = '20px';
    errorContainer.style.borderRadius = '5px';
    errorContainer.style.maxWidth = '80%';
    errorContainer.style.zIndex = '2000';
    
    // Create content
    errorContainer.innerHTML = `
      <h3>Error Detected</h3>
      <p>${message}</p>
      <button id="error-close">Close</button>
      <button id="error-reset">Reset Simulation</button>
    `;
    
    // Add to document
    document.body.appendChild(errorContainer);
    
    // Add event listeners
    document.getElementById('error-close').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
    });
    
    document.getElementById('error-reset').addEventListener('click', () => {
      document.body.removeChild(errorContainer);
      this.resetSimulation();
    });
  }
  
  // Reset the simulation
  resetSimulation() {
    console.log('Resetting simulation...');
    
    // Try to reset using the resetGame function if it exists
    if (typeof window.resetGame === 'function') {
      try {
        window.resetGame();
        console.log('Simulation reset using resetGame()');
        return;
      } catch (e) {
        console.error('Error resetting simulation using resetGame():', e);
      }
    }
    
    // Try to reset manually
    try {
      // Clear ants
      if (window.ants) {
        window.ants.length = 0;
        console.log('Cleared ants array');
      }
      
      // Clear food
      if (window.food) {
        window.food.length = 0;
        console.log('Cleared food array');
      }
      
      // Clear obstacles
      if (window.obstacles) {
        window.obstacles.length = 0;
        console.log('Cleared obstacles array');
      }
      
      // Reset counts
      if (window.scoutCount !== undefined) window.scoutCount = 3;
      if (window.workerCount !== undefined) window.workerCount = 7;
      
      // Try to initialize ants
      if (typeof window.initializeAnts === 'function') {
        window.initializeAnts();
        console.log('Initialized ants using initializeAnts()');
      }
      
      console.log('Manual simulation reset completed');
    } catch (e) {
      console.error('Error during manual reset:', e);
      
      // As a last resort, reload the page
      if (confirm('Failed to reset simulation. Reload the page?')) {
        window.location.reload();
      }
    }
  }
  
  // Start monitoring
  start() {
    console.log('Starting performance monitoring');
    
    // Patch requestAnimationFrame to monitor performance
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      return originalRequestAnimationFrame((timestamp) => {
        // Calculate frame time
        const now = performance.now();
        const frameTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Update metrics
        this.metrics.frameTime = frameTime;
        this.frameCount++;
        
        // Check for long frames
        if (frameTime > this.config.longFrameThreshold) {
          this.metrics.longFrames++;
          console.warn(`Long frame detected: ${frameTime.toFixed(2)}ms`);
        }
        
        // Update FPS and other metrics periodically
        if (now - this.lastUpdateTime >= this.config.updateInterval) {
          // Calculate FPS
          this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastUpdateTime));
          this.frameCount = 0;
          this.lastUpdateTime = now;
          
          // Update object counts
          this.updateObjectCounts();
          
          // Update memory usage
          this.updateMemoryUsage();
          
          // Update overlay
          this.updateOverlay();
        }
        
        // Call the original callback
        callback(timestamp);
      });
    };
    
    // Set up watchdog timer to detect freezes
    this.setupWatchdog();
    
    console.log('Performance monitoring started');
  }
  
  // Set up watchdog timer
  setupWatchdog() {
    // Last frame time for watchdog
    let lastWatchdogTime = performance.now();
    
    // Update last frame time in animation loop
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRequestAnimationFrame(function(timestamp) {
        lastWatchdogTime = performance.now();
        callback(timestamp);
      });
    };
    
    // Check for freezes periodically
    setInterval(() => {
      const now = performance.now();
      const timeSinceLastFrame = now - lastWatchdogTime;
      
      // If more than watchdogInterval ms have passed, the simulation might be frozen
      if (timeSinceLastFrame > this.config.watchdogInterval) {
        console.error(`Possible freeze detected: ${(timeSinceLastFrame / 1000).toFixed(1)} seconds since last frame`);
        
        // Try to recover
        this.recoverFromFreeze();
      }
    }, 1000);
  }
  
  // Try to recover from a freeze
  recoverFromFreeze() {
    console.log('Attempting to recover from freeze...');
    
    // Try to reduce ant count
    if (window.ants && window.ants.length > 20) {
      const originalCount = window.ants.length;
      window.ants.length = 20;
      
      // Update counts
      if (window.scoutCount !== undefined && window.workerCount !== undefined) {
        window.scoutCount = window.ants.filter(a => a.type === 'scout').length;
        window.workerCount = window.ants.filter(a => a.type === 'worker').length;
      }
      
      console.log(`Reduced ant count from ${originalCount} to ${window.ants.length}`);
      
      // Show a message
      alert(`Simulation was frozen. Reduced ant count from ${originalCount} to ${window.ants.length} to recover.`);
    } else {
      // If ant count is already low, try a full reset
      this.resetSimulation();
    }
  }
  
  // Update object counts
  updateObjectCounts() {
    try {
      // Update ant count
      if (window.ants) {
        this.metrics.antCount = window.ants.length;
      }
      
      // Update food count
      if (window.food) {
        this.metrics.foodCount = window.food.length;
      }
      
      // Update obstacle count
      if (window.obstacles) {
        this.metrics.obstacleCount = window.obstacles.length;
      }
      
      // Update predator count
      if (window.predatorManager && window.predatorManager.predators) {
        this.metrics.predatorCount = window.predatorManager.predators.length;
      }
    } catch (e) {
      console.warn('Error updating object counts:', e);
    }
  }
  
  // Update memory usage
  updateMemoryUsage() {
    try {
      if (window.performance && window.performance.memory) {
        this.metrics.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      }
    } catch (e) {
      console.warn('Error updating memory usage:', e);
    }
  }
  
  // Update the overlay
  updateOverlay() {
    if (!this.config.overlayEnabled) return;
    
    try {
      // Update FPS
      const fpsElement = document.getElementById('simple-debug-fps');
      if (fpsElement) {
        fpsElement.textContent = this.metrics.fps;
        
        // Change color based on FPS
        if (this.metrics.fps < 15) {
          fpsElement.style.color = '#F44336'; // Red
        } else if (this.metrics.fps < 30) {
          fpsElement.style.color = '#FFC107'; // Yellow
        } else {
          fpsElement.style.color = '#4CAF50'; // Green
        }
      }
      
      // Update frame time
      const frameTimeElement = document.getElementById('simple-debug-frame-time');
      if (frameTimeElement) {
        frameTimeElement.textContent = this.metrics.frameTime.toFixed(2);
        
        // Change color based on frame time
        if (this.metrics.frameTime > 100) {
          frameTimeElement.style.color = '#F44336'; // Red
        } else if (this.metrics.frameTime > 33) {
          frameTimeElement.style.color = '#FFC107'; // Yellow
        } else {
          frameTimeElement.style.color = '#4CAF50'; // Green
        }
      }
      
      // Update ant count
      const antsElement = document.getElementById('simple-debug-ants');
      if (antsElement) {
        antsElement.textContent = this.metrics.antCount;
      }
      
      // Update food count
      const foodElement = document.getElementById('simple-debug-food');
      if (foodElement) {
        foodElement.textContent = this.metrics.foodCount;
      }
      
      // Update obstacle count
      const obstaclesElement = document.getElementById('simple-debug-obstacles');
      if (obstaclesElement) {
        obstaclesElement.textContent = this.metrics.obstacleCount;
      }
      
      // Update memory usage
      const memoryElement = document.getElementById('simple-debug-memory');
      if (memoryElement) {
        memoryElement.textContent = this.metrics.memoryUsage;
      }
      
      // Update long frames count
      const longFramesElement = document.getElementById('simple-debug-long-frames');
      if (longFramesElement) {
        longFramesElement.textContent = this.metrics.longFrames;
      }
    } catch (e) {
      console.warn('Error updating overlay:', e);
    }
  }
}
