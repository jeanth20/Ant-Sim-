/**
 * Add Performance Monitor
 * 
 * This script adds the performance monitor to the main application.
 * Include this script in the HTML file to enable performance monitoring.
 */

// Load the performance monitor script
(function() {
  // Create script element
  const script = document.createElement('script');
  script.src = '/static/js/performance-monitor.js';
  script.async = true;
  
  // Add to document
  document.head.appendChild(script);
  
  console.log('Performance monitor script added');
})();

// Add a button to toggle the performance monitor
window.addEventListener('load', function() {
  // Create button
  const button = document.createElement('button');
  button.textContent = 'Performance';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.right = '10px';
  button.style.zIndex = '10000';
  button.style.padding = '5px 10px';
  button.style.backgroundColor = '#333';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '3px';
  button.style.cursor = 'pointer';
  
  // Add click event
  button.addEventListener('click', function() {
    const monitor = document.getElementById('simple-performance-monitor');
    if (monitor) {
      monitor.style.display = monitor.style.display === 'none' ? 'block' : 'none';
    }
  });
  
  // Add to document
  document.body.appendChild(button);
  
  console.log('Performance monitor toggle button added');
});
