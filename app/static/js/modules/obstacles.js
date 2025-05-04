// Draw a single obstacle (for optimization)
export function drawObstacle(o, ctx, obstacleImages, lastMouseX, lastMouseY, currentMode, isPointInObstacle) {
  const obstacleImage = obstacleImages[o.type];
  
  ctx.save();
  
  // Draw the obstacle image with appropriate size based on type
  if (o.type === 'rock') {
    ctx.drawImage(obstacleImage, o.x - 20, o.y - 15, 40, 30);
  } else if (o.type === 'stick') {
    ctx.drawImage(obstacleImage, o.x - 30, o.y - 10, 60, 20);
  } else if (o.type === 'leaf') {
    ctx.drawImage(obstacleImage, o.x - 20, o.y - 20, 40, 40);
  }
  
  // Add a subtle highlight when hovering
  const rect = ctx.canvas.getBoundingClientRect();
  const mouseX = lastMouseX - rect.left;
  const mouseY = lastMouseY - rect.top;
  
  if (isPointInObstacle(mouseX, mouseY, o) && currentMode === 'obstacle') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    if (o.type === 'rock' || o.type === 'leaf') {
      ctx.arc(o.x, o.y, 20, 0, Math.PI * 2);
    } else {
      ctx.rect(o.x - 30, o.y - 10, 60, 20);
    }
    ctx.fill();
    
    // Show "click to remove" text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Click to remove', o.x, o.y - 30);
  }
  
  ctx.restore();
}

// Draw all obstacles
export function drawObstacles(obstacles, ctx, obstacleImages, lastMouseX, lastMouseY, currentMode, isPointInObstacle) {
  obstacles.forEach(o => drawObstacle(o, ctx, obstacleImages, lastMouseX, lastMouseY, currentMode, isPointInObstacle));
}

// Function to check if a point is inside an obstacle
export function isPointInObstacle(x, y, obstacle) {
  // Different hit detection based on obstacle type
  if (obstacle.type === 'rock') {
    const dx = x - obstacle.x;
    const dy = y - obstacle.y;
    return Math.sqrt(dx * dx + dy * dy) < 20; // Rock radius
  } else if (obstacle.type === 'stick') {
    // For stick, check if point is within rectangle
    return x >= obstacle.x - 30 && x <= obstacle.x + 30 &&
           y >= obstacle.y - 10 && y <= obstacle.y + 10;
  } else if (obstacle.type === 'leaf') {
    // For leaf, check if point is within circle
    const dx = x - obstacle.x;
    const dy = y - obstacle.y;
    return Math.sqrt(dx * dx + dy * dy) < 20; // Leaf radius
  }
  return false;
}
