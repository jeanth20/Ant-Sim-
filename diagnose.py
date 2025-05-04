"""
Ant Simulation Diagnostic Tool

This script helps diagnose issues with the Ant Simulation application.
It checks for common problems and provides suggestions for fixing them.
"""

import os
import sys
import json
import glob
import re
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

def check_python_version():
    """Check if the Python version is compatible."""
    print_section("Checking Python Version")
    
    version = sys.version_info
    print_info(f"Python version: {sys.version}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 7):
        print_error(f"Python version {version.major}.{version.minor} is not supported. Please use Python 3.7 or higher.")
        return False
    
    print_success(f"Python version {version.major}.{version.minor} is supported.")
    return True

def check_dependencies():
    """Check if all required dependencies are installed."""
    print_section("Checking Dependencies")
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "jinja2",
        "pydantic"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print_success(f"Package '{package}' is installed.")
        except ImportError:
            print_error(f"Package '{package}' is not installed.")
            missing_packages.append(package)
    
    if missing_packages:
        print_warning(f"Missing packages: {', '.join(missing_packages)}")
        print_info("You can install them with: pip install " + " ".join(missing_packages))
        return False
    
    return True

def check_file_structure():
    """Check if the file structure is correct."""
    print_section("Checking File Structure")
    
    required_files = [
        "app/main.py",
        "app/templates/new_index.html",
        "app/templates/debug_launcher.html",
        "app/static/js/main.js",
        "app/static/js/modules/ant.js",
        "app/static/js/modules/food.js",
        "app/static/js/modules/obstacles.js",
        "app/static/js/modules/storage.js",
        "app/static/js/modules/performance.js",
        "app/static/js/modules/environment.js",
        "app/static/js/modules/predators.js",
        "app/static/css/styles.css",
        "run.py"
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if not os.path.exists(file_path):
            print_error(f"File '{file_path}' is missing.")
            missing_files.append(file_path)
        else:
            print_success(f"File '{file_path}' exists.")
    
    if missing_files:
        print_warning(f"Missing files: {', '.join(missing_files)}")
        return False
    
    return True

def check_image_files():
    """Check if the image files exist."""
    print_section("Checking Image Files")
    
    # Check if the img directory exists
    if not os.path.exists("img"):
        print_error("The 'img' directory is missing.")
        return False
    
    # Check for ant image
    ant_images = glob.glob("img/*ant*.svg")
    if not ant_images:
        print_error("No ant image found in the 'img' directory.")
        return False
    else:
        print_success(f"Found ant images: {', '.join(ant_images)}")
    
    # Check for food images
    food_images = glob.glob("img/*food*.svg") + glob.glob("img/apple.svg") + glob.glob("img/bread.svg") + glob.glob("img/cheese.svg") + glob.glob("img/sugar.svg")
    if not food_images:
        print_warning("No food images found in the 'img' directory.")
    else:
        print_success(f"Found food images: {', '.join(food_images)}")
    
    # Check for obstacle images
    obstacle_images = glob.glob("img/*obstacle*.svg") + glob.glob("img/rock.svg") + glob.glob("img/stick.svg") + glob.glob("img/leaf.svg")
    if not obstacle_images:
        print_warning("No obstacle images found in the 'img' directory.")
    else:
        print_success(f"Found obstacle images: {', '.join(obstacle_images)}")
    
    return True

def check_ant_constructor():
    """Check if the Ant constructor is correctly implemented."""
    print_section("Checking Ant Constructor")
    
    ant_js_path = "app/static/js/modules/ant.js"
    
    if not os.path.exists(ant_js_path):
        print_error(f"File '{ant_js_path}' is missing.")
        return False
    
    with open(ant_js_path, "r") as f:
        content = f.read()
    
    # Check for constructor
    constructor_match = re.search(r"constructor\s*\(([^)]*)\)", content)
    if not constructor_match:
        print_error("Ant constructor not found.")
        return False
    
    constructor_params = constructor_match.group(1)
    print_info(f"Ant constructor parameters: {constructor_params}")
    
    # Check for required parameters
    if "queen" not in constructor_params or "antImage" not in constructor_params:
        print_error("Ant constructor is missing required parameters (queen, antImage).")
        return False
    
    print_success("Ant constructor has the required parameters.")
    
    # Check for usage of parameters
    if "this.x = queen.x" not in content or "this.antImage = antImage" not in content:
        print_warning("Ant constructor might not be using the parameters correctly.")
    else:
        print_success("Ant constructor is using the parameters correctly.")
    
    return True

def check_storage_module():
    """Check if the storage module is correctly implemented."""
    print_section("Checking Storage Module")
    
    storage_js_path = "app/static/js/modules/storage.js"
    
    if not os.path.exists(storage_js_path):
        print_error(f"File '{storage_js_path}' is missing.")
        return False
    
    with open(storage_js_path, "r") as f:
        content = f.read()
    
    # Check for import of Ant class
    if "import { Ant } from './ant.js'" not in content:
        print_error("Storage module is not importing the Ant class.")
        return False
    
    print_success("Storage module is importing the Ant class.")
    
    # Check for loadGameState function
    if "export function loadGameState" not in content:
        print_error("loadGameState function not found in storage module.")
        return False
    
    print_success("loadGameState function found in storage module.")
    
    # Check for correct Ant instantiation
    ant_instantiation = re.search(r"new Ant\s*\(([^)]*)\)", content)
    if not ant_instantiation:
        print_error("Ant instantiation not found in storage module.")
        return False
    
    ant_params = ant_instantiation.group(1)
    print_info(f"Ant instantiation parameters: {ant_params}")
    
    if "queen" not in ant_params or "antImage" not in ant_params:
        print_error("Ant instantiation is missing required parameters (queen, antImage).")
        return False
    
    print_success("Ant instantiation has the required parameters.")
    
    return True

def check_main_js():
    """Check if the main.js file is correctly implemented."""
    print_section("Checking main.js")
    
    main_js_path = "app/static/js/main.js"
    
    if not os.path.exists(main_js_path):
        print_error(f"File '{main_js_path}' is missing.")
        return False
    
    with open(main_js_path, "r") as f:
        content = f.read()
    
    # Check for imports
    required_imports = [
        "import { Ant } from './modules/ant.js'",
        "import { drawFood",
        "import { drawObstacles",
        "import { saveGameState, loadGameState",
        "import { settings",
        "import { Environment } from './modules/environment.js'",
        "import { PredatorManager } from './modules/predators.js'"
    ]
    
    missing_imports = []
    
    for imp in required_imports:
        if imp not in content:
            print_error(f"Import '{imp}' not found in main.js.")
            missing_imports.append(imp)
        else:
            print_success(f"Import '{imp}' found in main.js.")
    
    if missing_imports:
        print_warning(f"Missing imports: {', '.join(missing_imports)}")
    
    # Check for initialization
    if "function initializeAnts()" not in content:
        print_error("initializeAnts function not found in main.js.")
        return False
    
    print_success("initializeAnts function found in main.js.")
    
    # Check for animation loop
    if "function animate(" not in content:
        print_error("animate function not found in main.js.")
        return False
    
    print_success("animate function found in main.js.")
    
    # Check for event listeners
    if "addEventListener('load'" not in content and "window.onload" not in content:
        print_warning("No load event listener found in main.js.")
    else:
        print_success("Load event listener found in main.js.")
    
    return True

def check_debug_module():
    """Check if the debug module is correctly implemented."""
    print_section("Checking Debug Module")
    
    debug_js_path = "app/static/js/modules/debug.js"
    
    if not os.path.exists(debug_js_path):
        print_error(f"File '{debug_js_path}' is missing.")
        return False
    
    with open(debug_js_path, "r") as f:
        content = f.read()
    
    # Check for DebugMonitor class
    if "export class DebugMonitor" not in content:
        print_error("DebugMonitor class not found in debug module.")
        return False
    
    print_success("DebugMonitor class found in debug module.")
    
    # Check for setupGlobalErrorHandling function
    if "export function setupGlobalErrorHandling" not in content:
        print_error("setupGlobalErrorHandling function not found in debug module.")
        return False
    
    print_success("setupGlobalErrorHandling function found in debug module.")
    
    # Check for monitorAnimationLoop function
    if "export function monitorAnimationLoop" not in content:
        print_error("monitorAnimationLoop function not found in debug module.")
        return False
    
    print_success("monitorAnimationLoop function found in debug module.")
    
    return True

def check_debug_integration():
    """Check if the debug integration is correctly implemented."""
    print_section("Checking Debug Integration")
    
    debug_integration_js_path = "app/static/js/debug-integration.js"
    
    if not os.path.exists(debug_integration_js_path):
        print_error(f"File '{debug_integration_js_path}' is missing.")
        return False
    
    with open(debug_integration_js_path, "r") as f:
        content = f.read()
    
    # Check for import of debug module
    if "import('./modules/debug.js')" not in content:
        print_error("Debug integration is not importing the debug module.")
        return False
    
    print_success("Debug integration is importing the debug module.")
    
    # Check for window.addEventListener('load'
    if "window.addEventListener('load'" not in content:
        print_error("Debug integration is not adding a load event listener.")
        return False
    
    print_success("Debug integration is adding a load event listener.")
    
    return True

def check_debug_launcher():
    """Check if the debug launcher is correctly implemented."""
    print_section("Checking Debug Launcher")
    
    debug_launcher_path = "app/templates/debug_launcher.html"
    
    if not os.path.exists(debug_launcher_path):
        print_error(f"File '{debug_launcher_path}' is missing.")
        return False
    
    with open(debug_launcher_path, "r") as f:
        content = f.read()
    
    # Check for script imports
    if 'src="/static/js/main.js"' not in content:
        print_error("Debug launcher is not importing main.js.")
        return False
    
    print_success("Debug launcher is importing main.js.")
    
    if 'src="/static/js/debug-integration.js"' not in content:
        print_error("Debug launcher is not importing debug-integration.js.")
        return False
    
    print_success("Debug launcher is importing debug-integration.js.")
    
    # Check for canvas
    if 'id="antCanvas"' not in content:
        print_error("Debug launcher does not have an antCanvas element.")
        return False
    
    print_success("Debug launcher has an antCanvas element.")
    
    return True

def check_fastapi_routes():
    """Check if the FastAPI routes are correctly implemented."""
    print_section("Checking FastAPI Routes")
    
    main_py_path = "app/main.py"
    
    if not os.path.exists(main_py_path):
        print_error(f"File '{main_py_path}' is missing.")
        return False
    
    with open(main_py_path, "r") as f:
        content = f.read()
    
    # Check for debug route
    if '@app.get("/debug"' not in content:
        print_error("Debug route not found in main.py.")
        return False
    
    print_success("Debug route found in main.py.")
    
    # Check for debug-viewer route
    if '@app.get("/debug-viewer"' not in content:
        print_error("Debug viewer route not found in main.py.")
        return False
    
    print_success("Debug viewer route found in main.py.")
    
    # Check for api/debug-log route
    if '@app.post("/api/debug-log"' not in content:
        print_error("API debug log route not found in main.py.")
        return False
    
    print_success("API debug log route found in main.py.")
    
    return True

def check_logs_directory():
    """Check if the logs directory exists and is writable."""
    print_section("Checking Logs Directory")
    
    # Check if the logs directory exists
    if not os.path.exists("logs"):
        print_warning("The 'logs' directory does not exist. It will be created when needed.")
        try:
            os.makedirs("logs")
            print_success("Created 'logs' directory.")
        except Exception as e:
            print_error(f"Failed to create 'logs' directory: {e}")
            return False
    else:
        print_success("The 'logs' directory exists.")
    
    # Check if the logs directory is writable
    try:
        test_file_path = "logs/test_write.txt"
        with open(test_file_path, "w") as f:
            f.write("Test write")
        os.remove(test_file_path)
        print_success("The 'logs' directory is writable.")
    except Exception as e:
        print_error(f"The 'logs' directory is not writable: {e}")
        return False
    
    return True

def check_run_script():
    """Check if the run script is correctly implemented."""
    print_section("Checking Run Script")
    
    run_py_path = "run.py"
    
    if not os.path.exists(run_py_path):
        print_error(f"File '{run_py_path}' is missing.")
        return False
    
    with open(run_py_path, "r") as f:
        content = f.read()
    
    # Check for uvicorn.run
    if "uvicorn.run" not in content:
        print_error("uvicorn.run not found in run.py.")
        return False
    
    print_success("uvicorn.run found in run.py.")
    
    # Check for app.main:app
    if "app.main:app" not in content:
        print_error("app.main:app not found in run.py.")
        return False
    
    print_success("app.main:app found in run.py.")
    
    return True

def check_debug_bat():
    """Check if the debug batch file is correctly implemented."""
    print_section("Checking Debug Batch File")
    
    debug_bat_path = "run_debug.bat"
    
    if not os.path.exists(debug_bat_path):
        print_error(f"File '{debug_bat_path}' is missing.")
        return False
    
    with open(debug_bat_path, "r") as f:
        content = f.read()
    
    # Check for python run.py
    if "python run.py" not in content:
        print_error("python run.py not found in run_debug.bat.")
        return False
    
    print_success("python run.py found in run_debug.bat.")
    
    # Check for http://localhost:8000/debug
    if "http://localhost:8000/debug" not in content:
        print_error("http://localhost:8000/debug not found in run_debug.bat.")
        return False
    
    print_success("http://localhost:8000/debug found in run_debug.bat.")
    
    return True

def suggest_fixes():
    """Suggest fixes for common issues."""
    print_section("Suggested Fixes")
    
    print_info("1. If the simulation doesn't start, try the following:")
    print_info("   - Check the browser console for errors (F12 > Console)")
    print_info("   - Try the simple debug page: http://localhost:8000/simple-debug")
    print_info("   - Click the 'Force Reset' button on the debug page")
    print_info("   - Try refreshing the page")
    
    print_info("\n2. If you see errors about missing images:")
    print_info("   - Make sure the 'img' directory exists and contains the required images")
    print_info("   - Check that the image paths in the code are correct")
    
    print_info("\n3. If you see errors about the Ant constructor:")
    print_info("   - Make sure the Ant constructor has the required parameters (type, queen, antImage)")
    print_info("   - Make sure the storage.js file is importing the Ant class")
    print_info("   - Make sure the loadGameState function is passing all required parameters to the Ant constructor")
    
    print_info("\n4. If the debug viewer is empty:")
    print_info("   - Make sure you've saved some logs by clicking the 'Save Logs' button")
    print_info("   - Check that the 'logs' directory exists and is writable")
    print_info("   - Check the browser console for errors")
    
    print_info("\n5. If the simulation freezes:")
    print_info("   - Try reducing the number of ants using the settings panel")
    print_info("   - Enable frame skipping and other performance optimizations")
    print_info("   - Check the debug overlay for long frames and function timings")
    print_info("   - Save logs and analyze them with the analyze_logs.py script")

def main():
    """Run all checks and suggest fixes."""
    print_header("Ant Simulation Diagnostic Tool")
    
    checks = [
        check_python_version,
        check_dependencies,
        check_file_structure,
        check_image_files,
        check_ant_constructor,
        check_storage_module,
        check_main_js,
        check_debug_module,
        check_debug_integration,
        check_debug_launcher,
        check_fastapi_routes,
        check_logs_directory,
        check_run_script,
        check_debug_bat
    ]
    
    results = []
    
    for check in checks:
        results.append(check())
    
    print_header("Diagnostic Results")
    
    if all(results):
        print_success("All checks passed! The application should work correctly.")
    else:
        print_error(f"{results.count(False)} out of {len(results)} checks failed.")
        print_warning("Please fix the issues mentioned above and run this script again.")
    
    suggest_fixes()
    
    print("\nFor more help, try the simple debug page: http://localhost:8000/simple-debug")
    print("This page will help you test basic functionality without the full application.")

if __name__ == "__main__":
    main()
