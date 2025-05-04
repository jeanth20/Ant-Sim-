"""
Ant Simulation Freezing Fix Tool

This script helps diagnose and fix freezing issues in the Ant Simulation.
It analyzes the code for common performance issues and suggests fixes.
"""

import os
import re
import sys
import glob
from pathlib import Path

def print_header(text):
    """Print a header with the given text."""
    print("\n" + "=" * 80)
    print(f" {text} ".center(80, "="))
    print("=" * 80)

def print_section(text):
    """Print a section header with the given text."""
    print("\n" + "-" * 80)
    print(f" {text} ".center(80, "-"))
    print("-" * 80)

def print_success(text):
    """Print a success message."""
    print(f"✅ {text}")

def print_warning(text):
    """Print a warning message."""
    print(f"⚠️ {text}")

def print_error(text):
    """Print an error message."""
    print(f"❌ {text}")

def print_info(text):
    """Print an info message."""
    print(f"ℹ️ {text}")

def check_main_js():
    """Check main.js for performance issues."""
    print_section("Checking main.js for Performance Issues")
    
    main_js_path = "app/static/js/main.js"
    
    if not os.path.exists(main_js_path):
        print_error(f"File '{main_js_path}' is missing.")
        return False
    
    with open(main_js_path, "r") as f:
        content = f.read()
    
    issues = []
    
    # Check for requestAnimationFrame
    if "requestAnimationFrame" not in content:
        issues.append("No requestAnimationFrame found. This is essential for smooth animation.")
    else:
        print_success("requestAnimationFrame is used for animation.")
    
    # Check for performance settings
    if "settings" not in content.lower() or "performance" not in content.lower():
        issues.append("No performance settings found. Consider adding settings to optimize performance.")
    else:
        print_success("Performance settings found.")
    
    # Check for spatial partitioning
    if "spatial" not in content.lower() or "partition" not in content.lower():
        issues.append("No spatial partitioning found. This can improve collision detection performance.")
    else:
        print_success("Spatial partitioning is used.")
    
    # Check for object pooling
    if "pool" not in content.lower():
        issues.append("No object pooling found. This can reduce garbage collection pauses.")
    else:
        print_success("Object pooling is used.")
    
    # Check for frame skipping
    if "skip" not in content.lower() or "frame" not in content.lower():
        issues.append("No frame skipping found. This can help maintain performance under load.")
    else:
        print_success("Frame skipping is used.")
    
    # Check for excessive console.log calls
    console_log_count = content.count("console.log")
    if console_log_count > 10:
        issues.append(f"Found {console_log_count} console.log calls. These can impact performance.")
    else:
        print_success("Reasonable number of console.log calls.")
    
    # Check for memory leaks (event listeners not being removed)
    add_event_listener_count = content.count("addEventListener")
    remove_event_listener_count = content.count("removeEventListener")
    if add_event_listener_count > remove_event_listener_count + 5:
        issues.append(f"Found {add_event_listener_count} addEventListener calls but only {remove_event_listener_count} removeEventListener calls. This might cause memory leaks.")
    else:
        print_success("Event listeners appear to be properly managed.")
    
    # Check for large arrays
    array_matches = re.findall(r"new Array\((\d+)\)", content)
    for match in array_matches:
        size = int(match)
        if size > 1000:
            issues.append(f"Found large array initialization: new Array({size}). This can cause memory issues.")
    
    # Check for inefficient loops
    nested_loop_count = content.count("for (") - content.count("for (")
    if nested_loop_count > 5:
        issues.append(f"Found {nested_loop_count} nested loops. These can cause performance issues.")
    else:
        print_success("No excessive nested loops found.")
    
    # Print issues
    if issues:
        print_warning("Found the following performance issues:")
        for i, issue in enumerate(issues):
            print(f"  {i+1}. {issue}")
        return False
    else:
        print_success("No major performance issues found in main.js.")
        return True

def check_ant_js():
    """Check ant.js for performance issues."""
    print_section("Checking ant.js for Performance Issues")
    
    ant_js_path = "app/static/js/modules/ant.js"
    
    if not os.path.exists(ant_js_path):
        print_error(f"File '{ant_js_path}' is missing.")
        return False
    
    with open(ant_js_path, "r") as f:
        content = f.read()
    
    issues = []
    
    # Check for update method
    if "update" not in content:
        issues.append("No update method found in Ant class.")
    else:
        print_success("Ant class has an update method.")
    
    # Check for excessive calculations in update method
    update_method = re.search(r"update\s*\([^)]*\)\s*{([^}]*)}", content)
    if update_method:
        update_code = update_method.group(1)
        
        # Check for Math.sqrt calls (expensive)
        sqrt_count = update_code.count("Math.sqrt")
        if sqrt_count > 3:
            issues.append(f"Found {sqrt_count} Math.sqrt calls in update method. Consider using squared distances instead.")
        else:
            print_success("Reasonable number of Math.sqrt calls in update method.")
        
        # Check for nested loops
        for_count = update_code.count("for (")
        if for_count > 1:
            issues.append(f"Found {for_count} loops in update method. This can cause performance issues.")
        else:
            print_success("No excessive loops in update method.")
    
    # Print issues
    if issues:
        print_warning("Found the following performance issues:")
        for i, issue in enumerate(issues):
            print(f"  {i+1}. {issue}")
        return False
    else:
        print_success("No major performance issues found in ant.js.")
        return True

def check_performance_settings():
    """Check performance settings."""
    print_section("Checking Performance Settings")
    
    performance_js_path = "app/static/js/modules/performance.js"
    
    if not os.path.exists(performance_js_path):
        print_warning(f"File '{performance_js_path}' is missing. Consider creating it to manage performance settings.")
        return False
    
    with open(performance_js_path, "r") as f:
        content = f.read()
    
    # Check for settings object
    if "settings" not in content:
        print_warning("No settings object found in performance.js.")
        return False
    
    # Check for common performance settings
    settings = [
        "cullOffscreen",
        "spatialPartitioning",
        "optimizeRendering",
        "frameSkipping",
        "simplifiedPhysics",
        "quality",
        "targetFPS",
        "maxAnts",
        "drawDistance"
    ]
    
    missing_settings = []
    for setting in settings:
        if setting.lower() not in content.lower():
            missing_settings.append(setting)
    
    if missing_settings:
        print_warning(f"Missing performance settings: {', '.join(missing_settings)}")
        return False
    else:
        print_success("All common performance settings found.")
        return True

def suggest_fixes():
    """Suggest fixes for freezing issues."""
    print_section("Suggested Fixes for Freezing Issues")
    
    print_info("1. Reduce the number of ants:")
    print_info("   - Set a lower maximum number of ants (50-100 is reasonable)")
    print_info("   - Implement automatic culling when FPS drops below a threshold")
    
    print_info("\n2. Optimize collision detection:")
    print_info("   - Implement spatial partitioning (grid-based or quadtree)")
    print_info("   - Use squared distances instead of Math.sqrt for distance checks")
    print_info("   - Only check collisions between nearby objects")
    
    print_info("\n3. Optimize rendering:")
    print_info("   - Only render objects that are visible on screen")
    print_info("   - Use simplified graphics for distant objects")
    print_info("   - Implement frame skipping when FPS drops")
    
    print_info("\n4. Reduce memory usage:")
    print_info("   - Implement object pooling to reduce garbage collection")
    print_info("   - Remove unused event listeners")
    print_info("   - Limit the size of arrays and objects")
    
    print_info("\n5. Implement performance monitoring:")
    print_info("   - Add FPS counter and frame time display")
    print_info("   - Log long frames to identify bottlenecks")
    print_info("   - Add automatic recovery when the simulation freezes")

def create_performance_js():
    """Create a performance.js file with optimized settings."""
    print_section("Creating Optimized performance.js")
    
    performance_js_path = "app/static/js/modules/performance.js"
    
    # Check if file already exists
    if os.path.exists(performance_js_path):
        print_warning(f"File '{performance_js_path}' already exists. Backing up to '{performance_js_path}.bak'.")
        os.rename(performance_js_path, f"{performance_js_path}.bak")
    
    # Create optimized performance.js
    content = """// Performance settings for the ant simulation
export const settings = {
  // Visual settings
  quality: 'low',         // 'low', 'medium', 'high'
  drawDistance: 150,      // How far to render objects
  
  // Performance optimizations
  cullOffscreen: true,    // Don't update/render objects that are off-screen
  spatialPartitioning: true, // Use spatial partitioning for collision detection
  optimizeRendering: true, // Use various rendering optimizations
  frameSkipping: true,    // Skip frames when FPS is low
  simplifiedPhysics: true, // Use simplified physics calculations
  
  // Limits
  targetFPS: 30,          // Target FPS
  maxAnts: 100,           // Maximum number of ants
  maxFood: 20,            // Maximum number of food items
  maxObstacles: 10,       // Maximum number of obstacles
  
  // Auto-recovery
  autoRecovery: true,     // Automatically recover from freezes
  fpsThreshold: 15,       // FPS threshold for recovery
  recoveryMethod: 'reduceAnts', // 'reduceAnts', 'simplifyPhysics', 'skipFrames'
};

// Apply performance settings
export function applySettings() {
  console.log('Applying performance settings:', settings);
  
  // Update DOM elements if they exist
  if (document.getElementById('setting-cull')) {
    document.getElementById('setting-cull').checked = settings.cullOffscreen;
  }
  
  if (document.getElementById('setting-spatial')) {
    document.getElementById('setting-spatial').checked = settings.spatialPartitioning;
  }
  
  if (document.getElementById('setting-optimize')) {
    document.getElementById('setting-optimize').checked = settings.optimizeRendering;
  }
  
  if (document.getElementById('setting-frameskip')) {
    document.getElementById('setting-frameskip').checked = settings.frameSkipping;
  }
  
  if (document.getElementById('setting-simplified')) {
    document.getElementById('setting-simplified').checked = settings.simplifiedPhysics;
  }
  
  if (document.getElementById('setting-quality')) {
    document.getElementById('setting-quality').value = settings.quality;
  }
  
  if (document.getElementById('setting-target-fps')) {
    document.getElementById('setting-target-fps').value = settings.targetFPS.toString();
  }
  
  if (document.getElementById('setting-antcount')) {
    document.getElementById('setting-antcount').value = settings.maxAnts.toString();
    if (document.getElementById('antcount-value')) {
      document.getElementById('antcount-value').textContent = settings.maxAnts.toString();
    }
  }
  
  if (document.getElementById('setting-draw-distance')) {
    document.getElementById('setting-draw-distance').value = settings.drawDistance.toString();
    if (document.getElementById('draw-distance-value')) {
      document.getElementById('draw-distance-value').textContent = settings.drawDistance.toString();
    }
  }
}

// Load settings from localStorage
export function loadSettings() {
  try {
    const savedSettings = localStorage.getItem('antSimulationSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      
      // Update settings with saved values
      Object.assign(settings, parsedSettings);
      
      console.log('Loaded settings from localStorage:', settings);
    }
  } catch (e) {
    console.error('Error loading settings:', e);
  }
}

// Save settings to localStorage
export function saveSettings() {
  try {
    localStorage.setItem('antSimulationSettings', JSON.stringify(settings));
    console.log('Saved settings to localStorage:', settings);
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// Monitor performance and adjust settings if needed
export function monitorPerformance(fps) {
  if (!settings.autoRecovery) return;
  
  if (fps < settings.fpsThreshold) {
    console.warn(`Low FPS detected: ${fps}. Applying recovery method: ${settings.recoveryMethod}`);
    
    switch (settings.recoveryMethod) {
      case 'reduceAnts':
        // Reduce the number of ants
        if (window.ants && window.ants.length > 20) {
          const originalCount = window.ants.length;
          window.ants.length = Math.min(window.ants.length, Math.max(20, Math.floor(window.ants.length * 0.7)));
          
          console.log(`Reduced ant count from ${originalCount} to ${window.ants.length}`);
          
          // Update counts if they exist
          if (window.scoutCount !== undefined && window.workerCount !== undefined) {
            window.scoutCount = window.ants.filter(a => a.type === 'scout').length;
            window.workerCount = window.ants.filter(a => a.type === 'worker').length;
          }
          
          // Update stats if the function exists
          if (typeof window.updateStats === 'function') {
            try {
              window.updateStats();
            } catch (e) {
              console.error('Error updating stats:', e);
            }
          }
        }
        break;
        
      case 'simplifyPhysics':
        // Simplify physics calculations
        settings.simplifiedPhysics = true;
        settings.cullOffscreen = true;
        settings.spatialPartitioning = true;
        break;
        
      case 'skipFrames':
        // Enable frame skipping
        settings.frameSkipping = true;
        break;
    }
    
    // Apply the updated settings
    applySettings();
  }
}

// Initialize settings
export function initSettings() {
  // Load saved settings
  loadSettings();
  
  // Apply settings
  applySettings();
  
  // Add event listeners for settings changes
  document.addEventListener('DOMContentLoaded', function() {
    // Settings panel toggle
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsButton = document.getElementById('close-settings');
    const applySettingsButton = document.getElementById('apply-settings');
    
    if (settingsButton && settingsPanel) {
      settingsButton.addEventListener('click', function() {
        settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
      });
    }
    
    if (closeSettingsButton && settingsPanel) {
      closeSettingsButton.addEventListener('click', function() {
        settingsPanel.style.display = 'none';
      });
    }
    
    if (applySettingsButton) {
      applySettingsButton.addEventListener('click', function() {
        // Update settings from DOM elements
        if (document.getElementById('setting-cull')) {
          settings.cullOffscreen = document.getElementById('setting-cull').checked;
        }
        
        if (document.getElementById('setting-spatial')) {
          settings.spatialPartitioning = document.getElementById('setting-spatial').checked;
        }
        
        if (document.getElementById('setting-optimize')) {
          settings.optimizeRendering = document.getElementById('setting-optimize').checked;
        }
        
        if (document.getElementById('setting-frameskip')) {
          settings.frameSkipping = document.getElementById('setting-frameskip').checked;
        }
        
        if (document.getElementById('setting-simplified')) {
          settings.simplifiedPhysics = document.getElementById('setting-simplified').checked;
        }
        
        if (document.getElementById('setting-quality')) {
          settings.quality = document.getElementById('setting-quality').value;
        }
        
        if (document.getElementById('setting-target-fps')) {
          settings.targetFPS = parseInt(document.getElementById('setting-target-fps').value);
        }
        
        if (document.getElementById('setting-antcount')) {
          settings.maxAnts = parseInt(document.getElementById('setting-antcount').value);
        }
        
        if (document.getElementById('setting-draw-distance')) {
          settings.drawDistance = parseInt(document.getElementById('setting-draw-distance').value);
        }
        
        // Save settings
        saveSettings();
        
        // Close settings panel
        if (settingsPanel) {
          settingsPanel.style.display = 'none';
        }
        
        console.log('Applied settings:', settings);
      });
    }
    
    // Update range input displays
    const antCountInput = document.getElementById('setting-antcount');
    const antCountValue = document.getElementById('antcount-value');
    
    if (antCountInput && antCountValue) {
      antCountInput.addEventListener('input', function() {
        antCountValue.textContent = antCountInput.value;
      });
    }
    
    const drawDistanceInput = document.getElementById('setting-draw-distance');
    const drawDistanceValue = document.getElementById('draw-distance-value');
    
    if (drawDistanceInput && drawDistanceValue) {
      drawDistanceInput.addEventListener('input', function() {
        drawDistanceValue.textContent = drawDistanceInput.value;
      });
    }
  });
}

// Export default settings
export default settings;
"""
    
    # Write to file
    with open(performance_js_path, "w") as f:
        f.write(content)
    
    print_success(f"Created optimized performance.js at '{performance_js_path}'.")
    print_info("This file includes settings for:")
    print_info("  - Culling off-screen objects")
    print_info("  - Spatial partitioning for collision detection")
    print_info("  - Optimized rendering")
    print_info("  - Frame skipping")
    print_info("  - Simplified physics")
    print_info("  - Auto-recovery from freezes")
    
    return True

def main():
    """Run all checks and suggest fixes."""
    print_header("Ant Simulation Freezing Fix Tool")
    
    print_info("This tool will help diagnose and fix freezing issues in the Ant Simulation.")
    print_info("It will check for common performance issues and suggest fixes.")
    
    # Check main.js
    check_main_js()
    
    # Check ant.js
    check_ant_js()
    
    # Check performance settings
    check_performance_settings()
    
    # Suggest fixes
    suggest_fixes()
    
    # Ask if user wants to create optimized performance.js
    print_section("Create Optimized performance.js")
    print_info("This will create a new performance.js file with optimized settings.")
    print_info("The existing file will be backed up if it exists.")
    
    response = input("Create optimized performance.js? (y/n): ")
    if response.lower() == "y":
        create_performance_js()
    
    print_header("Next Steps")
    print_info("1. Run the simulation with the optimized settings")
    print_info("2. Monitor performance using the debug tools")
    print_info("3. If the simulation still freezes, try reducing the number of ants further")
    print_info("4. Consider implementing the other suggested fixes")
    
    print("\nFor more help, try the Fixed Standalone Debug page: http://localhost:8000/fixed")
    print("This page provides a simplified version of the simulation that should run smoothly.")

if __name__ == "__main__":
    main()
