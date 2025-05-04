// Debug script for monitoring and logging the ant simulation
import { DebugMonitor, setupGlobalErrorHandling, monitorAnimationLoop } from './modules/debug.js';

// Create debug monitor instance
const debugMonitor = new DebugMonitor();

// Set up global error handling
setupGlobalErrorHandling(debugMonitor);

// Function to instrument the main animation loop
export function instrumentAnimationLoop(originalAnimate) {
  return function(timestamp) {
    // Start timing the animation frame
    debugMonitor.startTiming('animate');
    
    try {
      // Get the last timestamp from the window object
      const lastTime = window.lastAnimationTime || timestamp;
      window.lastAnimationTime = timestamp;
      
      // Call the original animation function
      originalAnimate(timestamp);
      
      // Monitor the animation loop
      monitorAnimationLoop(
        timestamp,
        lastTime,
        window.ants || [],
        window.food || [],
        window.obstacles || [],
        window.predatorManager ? window.predatorManager.predators : [],
        debugMonitor
      );
    } catch (error) {
      // Log any errors that occur during animation
      debugMonitor.addError(`Error in animation loop: ${error.message}`, error);
      
      // Rethrow the error to maintain original behavior
      throw error;
    } finally {
      // End timing for the animation frame
      debugMonitor.endTiming('animate');
    }
    
    // Continue the animation loop
    requestAnimationFrame(instrumentAnimationLoop(originalAnimate));
  };
}

// Function to instrument an object's methods
export function instrumentObject(obj, name) {
  return debugMonitor.instrumentObject(obj, name);
}

// Function to add an error to the debug log
export function logError(message, error) {
  debugMonitor.addError(message, error);
}

// Function to add a warning to the debug log
export function logWarning(message) {
  debugMonitor.addWarning(message);
}

// Function to start timing a function
export function startTiming(functionName) {
  debugMonitor.startTiming(functionName);
}

// Function to end timing a function
export function endTiming(functionName) {
  debugMonitor.endTiming(functionName);
}

// Function to get the debug monitor instance
export function getDebugMonitor() {
  return debugMonitor;
}

// Function to check for memory leaks
export function checkForMemoryLeaks() {
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
}

// Set up periodic memory leak checks
setInterval(checkForMemoryLeaks, 10000);

// Log initialization
console.log('Debug script loaded');
