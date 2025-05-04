// Debug integration script for the ant simulation
// This script injects the debug monitor into the existing application

// Wait for the page to fully load
window.addEventListener('load', function() {
  console.log('Debug integration script loaded');

  // Make sure the antImage is available globally
  if (!window.antImage && document.querySelector('img[src*="ant"]')) {
    window.antImage = document.querySelector('img[src*="ant"]');
    console.log('Set global antImage reference');
  }

  // Import the debug module
  import('./modules/debug.js').then(debugModule => {
    const { DebugMonitor, setupGlobalErrorHandling, monitorAnimationLoop } = debugModule;

    // Create debug monitor instance
    const debugMonitor = new DebugMonitor();

    // Set up global error handling
    setupGlobalErrorHandling(debugMonitor);

    // Store references to important objects in the window for monitoring
    window.debugMonitor = debugMonitor;

    // Expose key simulation objects to the window for debugging
    if (!window.ants) window.ants = window.antSimulation?.ants || [];
    if (!window.food) window.food = window.antSimulation?.food || [];
    if (!window.obstacles) window.obstacles = window.antSimulation?.obstacles || [];
    if (!window.predatorManager) window.predatorManager = window.antSimulation?.predatorManager;

    // Patch the requestAnimationFrame to monitor performance
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRequestAnimationFrame(function(timestamp) {
        try {
          // Call the original callback
          callback(timestamp);

          // Monitor the animation loop if we have access to the necessary objects
          if (window.ants) {
            const lastTime = window.lastAnimationTime || timestamp;
            window.lastAnimationTime = timestamp;

            monitorAnimationLoop(
              timestamp,
              lastTime,
              window.ants || [],
              window.food || [],
              window.obstacles || [],
              window.predatorManager?.predators || [],
              debugMonitor
            );
          }
        } catch (error) {
          // Log any errors that occur during animation
          debugMonitor.addError(`Error in animation loop: ${error.message}`, error);

          // Rethrow the error to maintain original behavior
          throw error;
        }
      });
    };

    // Patch key methods to monitor their performance
    // Ant update method
    if (window.Ant && window.Ant.prototype) {
      const originalUpdate = window.Ant.prototype.update;
      window.Ant.prototype.update = function(...args) {
        debugMonitor.startTiming('Ant.update');
        try {
          return originalUpdate.apply(this, args);
        } catch (error) {
          debugMonitor.addError(`Error in Ant.update: ${error.message}`, error);
          throw error;
        } finally {
          debugMonitor.endTiming('Ant.update');
        }
      };
    }

    // Set up periodic memory leak checks
    setInterval(() => {
      // Check for growing arrays
      if (window.ants && window.ants.length > 200) {
        debugMonitor.addWarning(`Possible memory leak: ${window.ants.length} ants`);
      }

      if (window.food && window.food.length > 100) {
        debugMonitor.addWarning(`Possible memory leak: ${window.food.length} food items`);
      }

      if (window.obstacles && window.obstacles.length > 50) {
        debugMonitor.addWarning(`Possible memory leak: ${window.obstacles.length} obstacles`);
      }

      // Check for growing object pools
      if (window._objectPools) {
        for (const [poolName, pool] of Object.entries(window._objectPools)) {
          if (pool.length > 1000) {
            debugMonitor.addWarning(`Possible memory leak: ${pool.length} objects in ${poolName} pool`);
          }
        }
      }
    }, 10000);

    // Add a button to toggle the debug overlay
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Debug';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '1000';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = '#fff';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';

    toggleButton.addEventListener('click', () => {
      const overlay = document.getElementById('debug-overlay');
      if (overlay) {
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
      } else {
        debugMonitor.createDebugOverlay();
      }
    });

    document.body.appendChild(toggleButton);

    // Add a button to view debug logs
    const viewLogsButton = document.createElement('button');
    viewLogsButton.textContent = 'View Logs';
    viewLogsButton.style.position = 'fixed';
    viewLogsButton.style.bottom = '10px';
    viewLogsButton.style.right = '80px';
    viewLogsButton.style.zIndex = '1000';
    viewLogsButton.style.padding = '5px 10px';
    viewLogsButton.style.backgroundColor = '#333';
    viewLogsButton.style.color = '#fff';
    viewLogsButton.style.border = 'none';
    viewLogsButton.style.borderRadius = '3px';
    viewLogsButton.style.cursor = 'pointer';

    viewLogsButton.addEventListener('click', () => {
      window.open('/debug-viewer', '_blank');
    });

    document.body.appendChild(viewLogsButton);

    // Add a button to save current debug logs
    const saveLogsButton = document.createElement('button');
    saveLogsButton.textContent = 'Save Logs';
    saveLogsButton.style.position = 'fixed';
    saveLogsButton.style.bottom = '10px';
    saveLogsButton.style.right = '160px';
    saveLogsButton.style.zIndex = '1000';
    saveLogsButton.style.padding = '5px 10px';
    saveLogsButton.style.backgroundColor = '#333';
    saveLogsButton.style.color = '#fff';
    saveLogsButton.style.border = 'none';
    saveLogsButton.style.borderRadius = '3px';
    saveLogsButton.style.cursor = 'pointer';

    saveLogsButton.addEventListener('click', () => {
      // Enable server logging
      debugMonitor.config.logToServer = true;

      // Force a log to server
      debugMonitor.logToServer();

      // Disable server logging again
      setTimeout(() => {
        debugMonitor.config.logToServer = false;
        alert('Debug logs saved!');
      }, 500);
    });

    document.body.appendChild(saveLogsButton);

    console.log('Debug monitor initialized');
  }).catch(error => {
    console.error('Error loading debug module:', error);
  });
});
