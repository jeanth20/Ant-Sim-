/**
 * Simple Performance Monitor
 * 
 * This script adds a performance monitor to the page that tracks FPS, frame time,
 * memory usage, and other metrics. It also logs long frames and can help identify
 * performance bottlenecks.
 */

// Create the performance monitor element
function createPerformanceMonitor() {
  // Check if it already exists
  if (document.getElementById('simple-performance-monitor')) {
    return;
  }
  
  // Create the monitor element
  const monitor = document.createElement('div');
  monitor.id = 'simple-performance-monitor';
  monitor.style.position = 'fixed';
  monitor.style.bottom = '10px';
  monitor.style.left = '10px';
  monitor.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  monitor.style.color = 'white';
  monitor.style.padding = '10px';
  monitor.style.borderRadius = '5px';
  monitor.style.fontFamily = 'monospace';
  monitor.style.fontSize = '12px';
  monitor.style.zIndex = '10000';
  monitor.style.pointerEvents = 'none'; // Don't interfere with mouse events
  
  // Create the content
  monitor.innerHTML = `
    <div>FPS: <span id="simple-fps">0</span></div>
    <div>Frame Time: <span id="simple-frame-time">0</span> ms</div>
    <div>Ants: <span id="simple-ant-count">0</span></div>
    <div>Memory: <span id="simple-memory">0</span> MB</div>
    <div>Long Frames: <span id="simple-long-frames">0</span></div>
  `;
  
  // Add to the document
  document.body.appendChild(monitor);
  
  console.log('Performance monitor created');
}

// Performance monitoring state
const performanceState = {
  frameCount: 0,
  lastTime: 0,
  lastFpsUpdate: 0,
  fps: 0,
  frameTime: 0,
  longFrames: 0,
  longFrameThreshold: 100, // ms
  memoryUsage: 0,
  isMonitoring: false,
  frameTimeHistory: [],
  maxHistoryLength: 100
};

// Start monitoring performance
function startPerformanceMonitoring() {
  if (performanceState.isMonitoring) {
    return;
  }
  
  createPerformanceMonitor();
  
  // Initialize state
  performanceState.lastTime = performance.now();
  performanceState.lastFpsUpdate = performance.now();
  performanceState.frameCount = 0;
  performanceState.isMonitoring = true;
  
  // Patch requestAnimationFrame to monitor performance
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    return originalRequestAnimationFrame(function(timestamp) {
      // Measure frame time
      const now = performance.now();
      const frameTime = now - performanceState.lastTime;
      performanceState.frameTime = frameTime;
      performanceState.lastTime = now;
      
      // Track frame time history
      performanceState.frameTimeHistory.push(frameTime);
      if (performanceState.frameTimeHistory.length > performanceState.maxHistoryLength) {
        performanceState.frameTimeHistory.shift();
      }
      
      // Check for long frames
      if (frameTime > performanceState.longFrameThreshold) {
        performanceState.longFrames++;
        console.warn(`Long frame detected: ${frameTime.toFixed(2)}ms`);
        
        // Log additional information
        console.warn(`Ants: ${window.ants ? window.ants.length : 'unknown'}`);
        console.warn(`Food: ${window.food ? window.food.length : 'unknown'}`);
        console.warn(`Obstacles: ${window.obstacles ? window.obstacles.length : 'unknown'}`);
      }
      
      // Update FPS counter
      performanceState.frameCount++;
      if (now - performanceState.lastFpsUpdate >= 1000) {
        performanceState.fps = Math.round((performanceState.frameCount * 1000) / (now - performanceState.lastFpsUpdate));
        performanceState.frameCount = 0;
        performanceState.lastFpsUpdate = now;
        
        // Update memory usage if available
        if (window.performance && window.performance.memory) {
          performanceState.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        
        // Update display
        updatePerformanceDisplay();
      }
      
      // Call the original callback
      callback(timestamp);
    });
  };
  
  console.log('Performance monitoring started');
}

// Update the performance display
function updatePerformanceDisplay() {
  const fpsElement = document.getElementById('simple-fps');
  const frameTimeElement = document.getElementById('simple-frame-time');
  const antCountElement = document.getElementById('simple-ant-count');
  const memoryElement = document.getElementById('simple-memory');
  const longFramesElement = document.getElementById('simple-long-frames');
  
  if (fpsElement) fpsElement.textContent = performanceState.fps;
  if (frameTimeElement) frameTimeElement.textContent = performanceState.frameTime.toFixed(2);
  if (antCountElement) antCountElement.textContent = window.ants ? window.ants.length : 'unknown';
  if (memoryElement) memoryElement.textContent = performanceState.memoryUsage;
  if (longFramesElement) longFramesElement.textContent = performanceState.longFrames;
}

// Get performance statistics
function getPerformanceStats() {
  // Calculate average frame time
  const avgFrameTime = performanceState.frameTimeHistory.length > 0 ?
    performanceState.frameTimeHistory.reduce((sum, time) => sum + time, 0) / performanceState.frameTimeHistory.length : 0;
  
  // Calculate max frame time
  const maxFrameTime = performanceState.frameTimeHistory.length > 0 ?
    Math.max(...performanceState.frameTimeHistory) : 0;
  
  return {
    fps: performanceState.fps,
    frameTime: performanceState.frameTime,
    avgFrameTime: avgFrameTime,
    maxFrameTime: maxFrameTime,
    longFrames: performanceState.longFrames,
    memoryUsage: performanceState.memoryUsage,
    antCount: window.ants ? window.ants.length : 'unknown',
    foodCount: window.food ? window.food.length : 'unknown',
    obstacleCount: window.obstacles ? window.obstacles.length : 'unknown'
  };
}

// Add a watchdog timer to detect freezes
function addWatchdogTimer() {
  let lastFrameTime = performance.now();
  
  // Update last frame time in animation loop
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    return originalRequestAnimationFrame(function(timestamp) {
      lastFrameTime = performance.now();
      callback(timestamp);
    });
  };
  
  // Check for freezes every second
  setInterval(() => {
    const now = performance.now();
    const timeSinceLastFrame = now - lastFrameTime;
    
    // If more than 5 seconds have passed since the last frame, the simulation might be frozen
    if (timeSinceLastFrame > 5000) {
      console.error(`Possible freeze detected: ${(timeSinceLastFrame / 1000).toFixed(1)} seconds since last frame`);
      
      // Try to recover by reducing complexity
      if (window.ants && window.ants.length > 20) {
        console.log(`Attempting recovery: Reducing ant count from ${window.ants.length} to 20`);
        window.ants.length = 20;
        
        // Update counts if they exist
        if (window.scoutCount !== undefined && window.workerCount !== undefined) {
          window.scoutCount = window.ants.filter(a => a.type === 'scout').length;
          window.workerCount = window.ants.filter(a => a.type === 'worker').length;
        }
        
        // Try to update stats if the function exists
        if (typeof window.updateStats === 'function') {
          try {
            window.updateStats();
          } catch (e) {
            console.error('Error updating stats:', e);
          }
        }
      }
    }
  }, 1000);
  
  console.log('Watchdog timer added');
}

// Initialize on page load
window.addEventListener('load', function() {
  console.log('Performance monitor script loaded');
  
  // Start monitoring after a short delay
  setTimeout(() => {
    startPerformanceMonitoring();
    addWatchdogTimer();
  }, 2000);
});
