// Draw a single food item (for optimization)
export function drawFoodItem(f, ctx, foodImages) {
  const foodImage = foodImages[f.type];
  const size = 30; // Increased food size

  ctx.save();

  // Draw the food image
  ctx.drawImage(foodImage, f.x - size/2, f.y - size/2, size, size);

  // Draw decay bar
  const decayPercentage = f.decayTimer / f.decayTime;
  const barWidth = size * decayPercentage;

  ctx.fillStyle = decayPercentage > 0.6 ? '#4CAF50' :
                  decayPercentage > 0.3 ? '#FFC107' : '#F44336';
  ctx.fillRect(f.x - size/2, f.y + size/2 + 2, barWidth, 3);

  // Draw ants needed indicator
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(f.x + size/2, f.y - size/2, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(f.antsNeeded, f.x + size/2, f.y - size/2);

  // If ants are assigned, show progress
  if (f.assignedAnts > 0) {
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(f.x, f.y, size * 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${f.assignedAnts}/${f.antsNeeded}`, f.x, f.y + size/2 + 10);
  }

  ctx.restore();
}

// Draw all food items
export function drawFood(food, ctx, foodImages) {
  food.forEach(f => drawFoodItem(f, ctx, foodImages));
}

// Handle food decay
export function updateFoodDecay(food, environment) {
  // Decrease decay timer for each food item
  for (let i = food.length - 1; i >= 0; i--) {
    // Get environment decay multiplier
    const decayMultiplier = environment ?
      environment.getFoodDecayMultiplier(food[i].x, food[i].y) : 1.0;

    // Apply decay with environment effects
    food[i].decayTimer -= 0.02 * decayMultiplier; // Adjust speed of decay here

    // Remove food if it has decayed completely
    if (food[i].decayTimer <= 0) {
      // If ants were assigned to this food, free them
      // This is handled in the main.js file
      food.splice(i, 1);
    }
  }
}
