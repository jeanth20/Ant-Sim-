@echo off
echo Starting Ant Simulation in Debug Mode...
echo.
echo Open your browser and navigate to one of these URLs:
echo - RECOMMENDED: Fixed Standalone Debug: http://localhost:8000/fixed
echo - Full Debug Mode: http://localhost:8000/debug
echo - Simple Debug Mode: http://localhost:8000/simple-debug
echo - Standalone Debug: http://localhost:8000/standalone
echo - Performance Test: http://localhost:8000/performance
echo - Main App with Performance Monitor: http://localhost:8000/performance-index
echo - Simple Debug Index: http://localhost:8000/simple-debug-index
echo.
echo IMPORTANT: Use the Fixed Standalone Debug page first - it should work without errors
echo and will help diagnose freezing issues
echo.
echo If the full debug mode doesn't work:
echo 1. Try the standalone or performance test pages first
echo 2. Run the diagnose.py script to check for common issues
echo 3. Check the browser console for errors (F12 > Console)
echo.
python run.py
