// Debug module for performance monitoring and issue detection
export class DebugMonitor {
  constructor() {
    // Performance metrics
    this.metrics = {
      fps: [],
      frameTime: [],
      memoryUsage: [],
      antCount: [],
      foodCount: [],
      obstacleCount: [],
      predatorCount: [],
      longFrames: [], // Frames that took too long to process
      errors: [],     // Errors that occurred
      warnings: []    // Warnings (potential issues)
    };

    // Configuration
    this.config = {
      enabled: true,
      logToConsole: true,
      logToServer: false,
      logInterval: 1000, // ms
      maxMetricsHistory: 100,
      longFrameThreshold: 100, // ms
      serverEndpoint: '/api/debug-log',
      visualOverlay: true,
      trackMemory: true,
      trackFunctionTiming: true,
      trackObjectCounts: true
    };

    // Timing data for functions
    this.functionTimings = {};

    // Last log time
    this.lastLogTime = 0;

    // Create debug overlay if enabled
    if (this.config.visualOverlay) {
      this.createDebugOverlay();
    }

    // Start memory tracking if enabled
    if (this.config.trackMemory) {
      this.startMemoryTracking();
    }

    console.log('Debug monitor initialized');
  }

  // Create visual debug overlay
  createDebugOverlay() {
    // Check if overlay already exists
    if (document.getElementById('debug-overlay')) {
      return;
    }

    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
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
    overlay.style.maxHeight = '80vh';
    overlay.style.overflowY = 'auto';
    overlay.style.maxWidth = '400px';
    overlay.style.display = this.config.enabled ? 'block' : 'none';

    // Create sections
    const performanceSection = document.createElement('div');
    performanceSection.id = 'debug-performance';
    performanceSection.innerHTML = '<h3>Performance</h3><div id="debug-fps">FPS: 0</div><div id="debug-frame-time">Frame Time: 0ms</div><div id="debug-memory">Memory: 0MB</div>';

    const countsSection = document.createElement('div');
    countsSection.id = 'debug-counts';
    countsSection.innerHTML = '<h3>Object Counts</h3><div id="debug-ants">Ants: 0</div><div id="debug-food">Food: 0</div><div id="debug-obstacles">Obstacles: 0</div><div id="debug-predators">Predators: 0</div>';

    const timingsSection = document.createElement('div');
    timingsSection.id = 'debug-timings';
    timingsSection.innerHTML = '<h3>Function Timings (ms)</h3><div id="debug-timing-content"></div>';

    const issuesSection = document.createElement('div');
    issuesSection.id = 'debug-issues';
    issuesSection.innerHTML = '<h3>Issues</h3><div id="debug-issues-content"></div>';

    // Add toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug';
    toggleButton.style.marginTop = '10px';
    toggleButton.style.padding = '5px';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = '#fff';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.cursor = 'pointer';

    toggleButton.addEventListener('click', () => {
      this.config.enabled = !this.config.enabled;
      overlay.style.display = this.config.enabled ? 'block' : 'none';
      console.log(`Debug overlay ${this.config.enabled ? 'enabled' : 'disabled'}`);
    });

    // Add sections to overlay
    overlay.appendChild(performanceSection);
    overlay.appendChild(countsSection);
    overlay.appendChild(timingsSection);
    overlay.appendChild(issuesSection);
    overlay.appendChild(toggleButton);

    // Add to document
    document.body.appendChild(overlay);

    console.log('Debug overlay created');
  }

  // Start tracking memory usage
  startMemoryTracking() {
    if (window.performance && window.performance.memory) {
      this.memoryInterval = setInterval(() => {
        const memory = window.performance.memory;
        this.addMetric('memoryUsage', Math.round(memory.usedJSHeapSize / (1024 * 1024)));
      }, 1000);

      console.log('Memory tracking started');
    } else {
      console.warn('Memory API not available in this browser');
    }
  }

  // Add a metric value to the history
  addMetric(metricName, value) {
    if (!this.config.enabled) return;

    if (this.metrics[metricName]) {
      this.metrics[metricName].push({
        time: Date.now(),
        value: value
      });

      // Trim history if needed
      if (this.metrics[metricName].length > this.config.maxMetricsHistory) {
        this.metrics[metricName].shift();
      }
    }
  }

  // Record the start of a function execution
  startTiming(functionName) {
    if (!this.config.enabled || !this.config.trackFunctionTiming) return;

    if (!this.functionTimings[functionName]) {
      this.functionTimings[functionName] = {
        calls: 0,
        totalTime: 0,
        lastStartTime: 0,
        maxTime: 0
      };
    }

    this.functionTimings[functionName].lastStartTime = performance.now();
    this.functionTimings[functionName].calls++;
  }

  // Record the end of a function execution
  endTiming(functionName) {
    if (!this.config.enabled || !this.config.trackFunctionTiming) return;
    if (!this.functionTimings[functionName] || !this.functionTimings[functionName].lastStartTime) return;

    const endTime = performance.now();
    const executionTime = endTime - this.functionTimings[functionName].lastStartTime;

    this.functionTimings[functionName].totalTime += executionTime;
    this.functionTimings[functionName].maxTime = Math.max(this.functionTimings[functionName].maxTime, executionTime);

    // Check if this is a long-running function
    if (executionTime > this.config.longFrameThreshold) {
      this.addWarning(`Long execution: ${functionName} took ${executionTime.toFixed(2)}ms`);
    }
  }

  // Record frame metrics
  recordFrameMetrics(fps, frameTime, antCount, foodCount, obstacleCount, predatorCount = 0) {
    try {
      if (!this.config.enabled) return;

      // Ensure all values are valid numbers
      const validFps = isNaN(fps) ? 0 : fps;
      const validFrameTime = isNaN(frameTime) ? 0 : frameTime;
      const validAntCount = isNaN(antCount) ? 0 : antCount;
      const validFoodCount = isNaN(foodCount) ? 0 : foodCount;
      const validObstacleCount = isNaN(obstacleCount) ? 0 : obstacleCount;
      const validPredatorCount = isNaN(predatorCount) ? 0 : predatorCount;

      try {
        this.addMetric('fps', validFps);
        this.addMetric('frameTime', validFrameTime);
      } catch (e) {
        console.warn("Error adding performance metrics:", e);
      }

      if (this.config.trackObjectCounts) {
        try {
          this.addMetric('antCount', validAntCount);
          this.addMetric('foodCount', validFoodCount);
          this.addMetric('obstacleCount', validObstacleCount);
          this.addMetric('predatorCount', validPredatorCount);
        } catch (e) {
          console.warn("Error adding object count metrics:", e);
        }
      }

      // Check for long frames
      if (validFrameTime > this.config.longFrameThreshold) {
        try {
          this.metrics.longFrames.push({
            time: Date.now(),
            duration: validFrameTime,
            antCount: validAntCount,
            foodCount: validFoodCount,
            obstacleCount: validObstacleCount,
            predatorCount: validPredatorCount
          });

          this.addWarning(`Long frame: ${validFrameTime.toFixed(2)}ms with ${validAntCount} ants`);
        } catch (e) {
          console.warn("Error recording long frame:", e);
        }
      }

      // Update visual overlay if enabled
      if (this.config.visualOverlay) {
        try {
          this.updateDebugOverlay(validFps, validFrameTime, validAntCount, validFoodCount, validObstacleCount, validPredatorCount);
        } catch (e) {
          console.warn("Error updating debug overlay:", e);
        }
      }

      // Log to console/server if interval has passed
      try {
        const now = Date.now();
        if (now - this.lastLogTime >= this.config.logInterval) {
          this.lastLogTime = now;

          if (this.config.logToConsole) {
            try {
              this.logToConsole();
            } catch (e) {
              console.warn("Error logging to console:", e);
            }
          }

          if (this.config.logToServer) {
            try {
              this.logToServer();
            } catch (e) {
              console.warn("Error logging to server:", e);
            }
          }
        }
      } catch (e) {
        console.warn("Error in logging interval check:", e);
      }
    } catch (e) {
      console.warn("Error in recordFrameMetrics:", e);
    }
  }

  // Update the debug overlay with current metrics
  updateDebugOverlay(fps, frameTime, antCount, foodCount, obstacleCount, predatorCount) {
    try {
      // Ensure all values are valid numbers
      const validFps = isNaN(fps) ? 0 : fps;
      const validFrameTime = isNaN(frameTime) ? 0 : frameTime;
      const validAntCount = isNaN(antCount) ? 0 : antCount;
      const validFoodCount = isNaN(foodCount) ? 0 : foodCount;
      const validObstacleCount = isNaN(obstacleCount) ? 0 : obstacleCount;
      const validPredatorCount = isNaN(predatorCount) ? 0 : predatorCount;

      // Get DOM elements safely
      const fpsElement = document.getElementById('debug-fps');
      const frameTimeElement = document.getElementById('debug-frame-time');
      const memoryElement = document.getElementById('debug-memory');
      const antsElement = document.getElementById('debug-ants');
      const foodElement = document.getElementById('debug-food');
      const obstaclesElement = document.getElementById('debug-obstacles');
      const predatorsElement = document.getElementById('debug-predators');
      const timingsElement = document.getElementById('debug-timing-content');
      const issuesElement = document.getElementById('debug-issues-content');

      // Update FPS and frame time
      try {
        if (fpsElement) fpsElement.textContent = `FPS: ${validFps.toFixed(1)}`;
        if (frameTimeElement) frameTimeElement.textContent = `Frame Time: ${validFrameTime.toFixed(2)}ms`;
      } catch (e) {
        console.warn("Error updating FPS/frame time display:", e);
      }

      // Memory usage
      try {
        if (memoryElement && this.metrics.memoryUsage && this.metrics.memoryUsage.length > 0) {
          const lastMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].value;
          memoryElement.textContent = `Memory: ${lastMemory}MB`;
        }
      } catch (e) {
        console.warn("Error updating memory display:", e);
      }

      // Object counts
      try {
        if (antsElement) antsElement.textContent = `Ants: ${validAntCount}`;
        if (foodElement) foodElement.textContent = `Food: ${validFoodCount}`;
        if (obstaclesElement) obstaclesElement.textContent = `Obstacles: ${validObstacleCount}`;
        if (predatorsElement) predatorsElement.textContent = `Predators: ${validPredatorCount}`;
      } catch (e) {
        console.warn("Error updating object counts display:", e);
      }

      // Function timings
      try {
        if (timingsElement && this.functionTimings) {
          let timingsHTML = '';
          for (const [funcName, timing] of Object.entries(this.functionTimings)) {
            if (timing && typeof timing.calls === 'number' && typeof timing.totalTime === 'number') {
              const avgTime = timing.calls > 0 ? timing.totalTime / timing.calls : 0;
              const maxTime = timing.maxTime || 0;
              timingsHTML += `<div>${funcName}: ${avgTime.toFixed(2)} (max: ${maxTime.toFixed(2)})</div>`;
            }
          }
          timingsElement.innerHTML = timingsHTML;
        }
      } catch (e) {
        console.warn("Error updating function timings display:", e);
      }

      // Issues
      try {
        if (issuesElement) {
          let issuesHTML = '';

          // Show last 5 warnings
          if (this.metrics.warnings && this.metrics.warnings.length > 0) {
            issuesHTML += '<div class="debug-warnings">';
            const recentWarnings = this.metrics.warnings.slice(-5);
            for (const warning of recentWarnings) {
              if (warning && warning.time && warning.message) {
                try {
                  issuesHTML += `<div>${new Date(warning.time).toLocaleTimeString()}: ${warning.message}</div>`;
                } catch (e) {
                  issuesHTML += `<div>Warning: ${warning.message || 'Unknown warning'}</div>`;
                }
              }
            }
            issuesHTML += '</div>';
          }

          // Show last 5 errors
          if (this.metrics.errors && this.metrics.errors.length > 0) {
            issuesHTML += '<div class="debug-errors">';
            const recentErrors = this.metrics.errors.slice(-5);
            for (const error of recentErrors) {
              if (error && error.time && error.message) {
                try {
                  issuesHTML += `<div>${new Date(error.time).toLocaleTimeString()}: ${error.message}</div>`;
                } catch (e) {
                  issuesHTML += `<div>Error: ${error.message || 'Unknown error'}</div>`;
                }
              }
            }
            issuesHTML += '</div>';
          }

          issuesElement.innerHTML = issuesHTML;
        }
      } catch (e) {
        console.warn("Error updating issues display:", e);
      }
    } catch (e) {
      console.warn("Error in updateDebugOverlay:", e);
    }
  }

  // Add an error to the log
  addError(message, error = null) {
    if (!this.config.enabled) return;

    const errorObj = {
      time: Date.now(),
      message: message,
      stack: error ? error.stack : null
    };

    this.metrics.errors.push(errorObj);

    // Trim history if needed
    if (this.metrics.errors.length > this.config.maxMetricsHistory) {
      this.metrics.errors.shift();
    }

    // Log to console
    console.error(`[DEBUG] ${message}`, error);
  }

  // Add a warning to the log
  addWarning(message) {
    if (!this.config.enabled) return;

    const warningObj = {
      time: Date.now(),
      message: message
    };

    this.metrics.warnings.push(warningObj);

    // Trim history if needed
    if (this.metrics.warnings.length > this.config.maxMetricsHistory) {
      this.metrics.warnings.shift();
    }

    // Log to console
    console.warn(`[DEBUG] ${message}`);
  }

  // Log current metrics to console
  logToConsole() {
    if (!this.config.enabled || !this.config.logToConsole) return;

    // Calculate averages
    const lastFps = this.metrics.fps.length > 0 ?
      this.metrics.fps.slice(-10).reduce((sum, item) => sum + item.value, 0) / Math.min(10, this.metrics.fps.length) : 0;

    const lastFrameTime = this.metrics.frameTime.length > 0 ?
      this.metrics.frameTime.slice(-10).reduce((sum, item) => sum + item.value, 0) / Math.min(10, this.metrics.frameTime.length) : 0;

    console.log(`[DEBUG] Performance: FPS=${lastFps.toFixed(1)}, Frame Time=${lastFrameTime.toFixed(2)}ms`);

    // Log object counts
    if (this.config.trackObjectCounts) {
      const lastAntCount = this.metrics.antCount.length > 0 ? this.metrics.antCount[this.metrics.antCount.length - 1].value : 0;
      const lastFoodCount = this.metrics.foodCount.length > 0 ? this.metrics.foodCount[this.metrics.foodCount.length - 1].value : 0;
      const lastObstacleCount = this.metrics.obstacleCount.length > 0 ? this.metrics.obstacleCount[this.metrics.obstacleCount.length - 1].value : 0;

      console.log(`[DEBUG] Objects: Ants=${lastAntCount}, Food=${lastFoodCount}, Obstacles=${lastObstacleCount}`);
    }

    // Log memory usage
    if (this.config.trackMemory && this.metrics.memoryUsage.length > 0) {
      const lastMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1].value;
      console.log(`[DEBUG] Memory: ${lastMemory}MB`);
    }

    // Log function timings
    if (this.config.trackFunctionTiming) {
      console.log('[DEBUG] Function Timings:');
      for (const [funcName, timing] of Object.entries(this.functionTimings)) {
        if (timing.calls > 0) {
          const avgTime = timing.totalTime / timing.calls;
          console.log(`  ${funcName}: avg=${avgTime.toFixed(2)}ms, max=${timing.maxTime.toFixed(2)}ms, calls=${timing.calls}`);
        }
      }
    }

    // Log recent issues
    if (this.metrics.warnings.length > 0 || this.metrics.errors.length > 0) {
      console.log('[DEBUG] Recent Issues:');

      // Show last 3 warnings
      if (this.metrics.warnings.length > 0) {
        const recentWarnings = this.metrics.warnings.slice(-3);
        for (const warning of recentWarnings) {
          console.log(`  WARNING: ${warning.message}`);
        }
      }

      // Show last 3 errors
      if (this.metrics.errors.length > 0) {
        const recentErrors = this.metrics.errors.slice(-3);
        for (const error of recentErrors) {
          console.log(`  ERROR: ${error.message}`);
        }
      }
    }
  }

  // Log metrics to server
  logToServer() {
    if (!this.config.enabled || !this.config.logToServer) return;

    // Prepare data to send
    const data = {
      timestamp: Date.now(),
      metrics: {
        fps: this.metrics.fps.slice(-10),
        frameTime: this.metrics.frameTime.slice(-10),
        antCount: this.metrics.antCount.slice(-1)[0]?.value || 0,
        foodCount: this.metrics.foodCount.slice(-1)[0]?.value || 0,
        obstacleCount: this.metrics.obstacleCount.slice(-1)[0]?.value || 0,
        predatorCount: this.metrics.predatorCount.slice(-1)[0]?.value || 0,
        memoryUsage: this.metrics.memoryUsage.slice(-1)[0]?.value || 0
      },
      longFrames: this.metrics.longFrames.slice(-5),
      errors: this.metrics.errors.slice(-5),
      warnings: this.metrics.warnings.slice(-5),
      functionTimings: this.functionTimings
    };

    // Send to server
    fetch(this.config.serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch(error => {
      console.error('Error sending debug data to server:', error);
    });
  }

  // Create a wrapper function that times execution
  createTimedFunction(originalFunction, functionName) {
    const self = this;

    return function(...args) {
      self.startTiming(functionName);
      try {
        return originalFunction.apply(this, args);
      } catch (error) {
        self.addError(`Error in ${functionName}: ${error.message}`, error);
        throw error;
      } finally {
        self.endTiming(functionName);
      }
    };
  }

  // Instrument an object by wrapping its methods with timing functions
  instrumentObject(obj, objName) {
    if (!this.config.enabled || !this.config.trackFunctionTiming) return obj;

    for (const key of Object.keys(obj)) {
      const prop = obj[key];
      if (typeof prop === 'function') {
        const functionName = `${objName}.${key}`;
        obj[key] = this.createTimedFunction(prop, functionName);
      }
    }

    return obj;
  }

  // Clean up resources
  destroy() {
    // Clear memory tracking interval
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }

    // Remove debug overlay
    const overlay = document.getElementById('debug-overlay');
    if (overlay) {
      document.body.removeChild(overlay);
    }

    console.log('Debug monitor destroyed');
  }
}

// Create a global error handler to catch unhandled errors
export function setupGlobalErrorHandling(debugMonitor) {
  // Handle uncaught exceptions
  window.addEventListener('error', (event) => {
    debugMonitor.addError(`Uncaught error: ${event.message}`, event.error);
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    debugMonitor.addError(`Unhandled promise rejection: ${event.reason}`, event.reason);
  });

  // Override console.error to capture errors - with safety checks
  try {
    // Store the original console.error safely
    const originalConsoleError = console.error;

    // Only override if originalConsoleError is a function
    if (typeof originalConsoleError === 'function') {
      console.error = function(...args) {
        try {
          // Call original console.error safely
          originalConsoleError.apply(console, args);
        } catch (e) {
          // Fallback if apply fails
          originalConsoleError(...args);
        }

        // Add to debug monitor if it's an error
        try {
          if (args[0] instanceof Error) {
            debugMonitor.addError(args[0].message, args[0]);
          } else if (typeof args[0] === 'string') {
            debugMonitor.addError(args[0]);
          }
        } catch (e) {
          // Ignore errors in error handling to prevent loops
        }
      };
    }
  } catch (e) {
    // If anything goes wrong, don't break the application
    console.warn("Failed to set up console.error override:", e);
  }
}

// Create a function to monitor the animation loop
export function monitorAnimationLoop(timestamp, lastTime, ants, food, obstacles, predators, debugMonitor) {
  try {
    // Calculate frame time with safety check
    const frameTime = (timestamp && lastTime) ? (timestamp - lastTime) : 0;

    // Calculate FPS with safety check to avoid division by zero
    const fps = frameTime > 0 ? (1000 / frameTime) : 0;

    // Get array lengths safely
    const antsLength = Array.isArray(ants) ? ants.length : 0;
    const foodLength = Array.isArray(food) ? food.length : 0;
    const obstaclesLength = Array.isArray(obstacles) ? obstacles.length : 0;
    const predatorsLength = Array.isArray(predators) ? predators.length : 0;

    // Record metrics
    try {
      debugMonitor.recordFrameMetrics(
        fps,
        frameTime,
        antsLength,
        foodLength,
        obstaclesLength,
        predatorsLength
      );
    } catch (e) {
      console.warn("Error recording metrics:", e);
    }

    return frameTime;
  } catch (e) {
    console.warn("Error in monitorAnimationLoop:", e);
    return 0;
  }
}
