// Environment system for day/night cycle and weather effects
export class Environment {
  constructor() {
    // Time is measured in game hours (0-24)
    this.time = 8; // Start at 8 AM
    this.dayLength = 240; // seconds for a full day/night cycle
    this.isNight = false;
    
    // Weather system
    this.weatherTypes = ['clear', 'rain', 'fog', 'heat'];
    this.currentWeather = 'clear';
    this.weatherDuration = 60; // seconds
    this.weatherTimer = 0;
    this.weatherIntensity = 0; // 0 to 1
    this.weatherTransitioning = false;
    this.nextWeather = 'clear';
    
    // Terrain types
    this.terrainTypes = ['normal', 'sand', 'mud', 'grass'];
    this.terrainMap = {}; // Will store terrain by grid coordinates
    
    // Environment effects on gameplay
    this.effects = {
      // Speed multipliers for different conditions
      antSpeed: {
        day: 1.0,
        night: 0.7,
        clear: 1.0,
        rain: 0.6,
        fog: 0.8,
        heat: 1.2,
        normal: 1.0,
        sand: 0.7,
        mud: 0.5,
        grass: 1.2
      },
      // Food decay multipliers
      foodDecay: {
        day: 1.0,
        night: 0.5,
        clear: 1.0,
        rain: 1.5,
        fog: 0.8,
        heat: 2.0,
        normal: 1.0,
        sand: 1.2,
        mud: 0.7,
        grass: 0.9
      },
      // Visibility multipliers
      visibility: {
        day: 1.0,
        night: 0.5,
        clear: 1.0,
        rain: 0.7,
        fog: 0.4,
        heat: 0.9
      }
    };
    
    // Create terrain patches
    this.generateTerrain();
    
    // Load images
    this.images = {
      sun: new Image(),
      moon: new Image(),
      rain: new Image(),
      fog: new Image(),
      heat: new Image(),
      sand: new Image(),
      mud: new Image(),
      grass: new Image()
    };
    
    this.images.sun.src = '/img/sun.svg';
    this.images.moon.src = '/img/moon.svg';
    this.images.rain.src = '/img/rain.svg';
    this.images.fog.src = '/img/fog.svg';
    this.images.heat.src = '/img/heat.svg';
    this.images.sand.src = '/img/sand.svg';
    this.images.mud.src = '/img/mud.svg';
    this.images.grass.src = '/img/grass.svg';
  }
  
  // Generate random terrain patches
  generateTerrain() {
    const gridSize = 50; // Size of each terrain patch
    const canvasWidth = document.getElementById('antCanvas').width;
    const canvasHeight = document.getElementById('antCanvas').height;
    
    // Create a grid of terrain
    for (let x = 0; x < canvasWidth; x += gridSize) {
      for (let y = 0; y < canvasHeight; y += gridSize) {
        // Skip the center area where the queen is
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight - 50;
        const distToCenter = Math.hypot(x + gridSize/2 - centerX, y + gridSize/2 - centerY);
        
        if (distToCenter < 100) {
          // Normal terrain near the queen
          this.setTerrain(x, y, 'normal');
          continue;
        }
        
        // Randomly assign terrain types with weights
        const rand = Math.random();
        if (rand < 0.7) {
          this.setTerrain(x, y, 'normal');
        } else if (rand < 0.8) {
          this.setTerrain(x, y, 'sand');
        } else if (rand < 0.9) {
          this.setTerrain(x, y, 'mud');
        } else {
          this.setTerrain(x, y, 'grass');
        }
      }
    }
  }
  
  // Set terrain at a specific grid location
  setTerrain(x, y, type) {
    const gridX = Math.floor(x / 50);
    const gridY = Math.floor(y / 50);
    const key = `${gridX},${gridY}`;
    this.terrainMap[key] = type;
  }
  
  // Get terrain at a specific position
  getTerrainAt(x, y) {
    const gridX = Math.floor(x / 50);
    const gridY = Math.floor(y / 50);
    const key = `${gridX},${gridY}`;
    return this.terrainMap[key] || 'normal';
  }
  
  // Update environment based on elapsed time
  update(deltaTime) {
    // Update time of day
    this.time = (this.time + (deltaTime / 1000) * (24 / this.dayLength)) % 24;
    this.isNight = this.time < 6 || this.time > 18;
    
    // Update weather
    this.weatherTimer += deltaTime / 1000;
    
    // Weather transition
    if (this.weatherTransitioning) {
      this.weatherIntensity += deltaTime / 1000 / 5; // 5 seconds to transition
      
      if (this.weatherIntensity >= 1) {
        this.weatherIntensity = 1;
        this.weatherTransitioning = false;
        this.currentWeather = this.nextWeather;
      }
    } else if (this.weatherTimer >= this.weatherDuration) {
      // Time to change weather
      this.weatherTimer = 0;
      
      // Decide next weather
      if (this.currentWeather !== 'clear') {
        // Higher chance to return to clear weather
        this.nextWeather = Math.random() < 0.7 ? 'clear' : this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
      } else {
        // From clear, randomly select a new weather
        this.nextWeather = Math.random() < 0.3 ? this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)] : 'clear';
      }
      
      if (this.nextWeather !== this.currentWeather) {
        this.weatherTransitioning = true;
        this.weatherIntensity = 0;
      }
    }
    
    // Apply environmental effects to document
    this.applyVisualEffects();
  }
  
  // Apply visual effects to the document based on environment
  applyVisualEffects() {
    // Day/night cycle
    const brightness = this.isNight ? 0.3 : 1.0;
    document.documentElement.style.setProperty('--ambient-light', brightness);
    
    // Weather effects
    let weatherOpacity = 0;
    
    if (this.currentWeather !== 'clear') {
      weatherOpacity = this.weatherIntensity * 0.5; // Max 50% opacity
    }
    
    document.documentElement.style.setProperty('--weather-opacity', weatherOpacity);
    document.documentElement.style.setProperty('--weather-effect', this.currentWeather);
  }
  
  // Get the current speed multiplier for ants based on environment
  getAntSpeedMultiplier(x, y) {
    const terrain = this.getTerrainAt(x, y);
    const timeMultiplier = this.isNight ? this.effects.antSpeed.night : this.effects.antSpeed.day;
    const weatherMultiplier = this.effects.antSpeed[this.currentWeather];
    const terrainMultiplier = this.effects.antSpeed[terrain];
    
    return timeMultiplier * weatherMultiplier * terrainMultiplier;
  }
  
  // Get the current food decay multiplier based on environment
  getFoodDecayMultiplier(x, y) {
    const terrain = this.getTerrainAt(x, y);
    const timeMultiplier = this.isNight ? this.effects.foodDecay.night : this.effects.foodDecay.day;
    const weatherMultiplier = this.effects.foodDecay[this.currentWeather];
    const terrainMultiplier = this.effects.foodDecay[terrain];
    
    return timeMultiplier * weatherMultiplier * terrainMultiplier;
  }
  
  // Get the current visibility multiplier based on environment
  getVisibilityMultiplier() {
    const timeMultiplier = this.isNight ? this.effects.visibility.night : this.effects.visibility.day;
    const weatherMultiplier = this.effects.visibility[this.currentWeather];
    
    return timeMultiplier * weatherMultiplier;
  }
  
  // Draw environment effects
  draw(ctx) {
    // Draw terrain
    this.drawTerrain(ctx);
    
    // Draw day/night indicator
    this.drawTimeIndicator(ctx);
    
    // Draw weather effects
    this.drawWeatherEffects(ctx);
  }
  
  // Draw terrain patches
  drawTerrain(ctx) {
    const gridSize = 50;
    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    ctx.save();
    ctx.globalAlpha = 0.2; // Subtle terrain visualization
    
    for (let x = 0; x < canvasWidth; x += gridSize) {
      for (let y = 0; y < canvasHeight; y += gridSize) {
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        const key = `${gridX},${gridY}`;
        const terrain = this.terrainMap[key] || 'normal';
        
        if (terrain !== 'normal') {
          const terrainImage = this.images[terrain];
          if (terrainImage.complete) {
            ctx.drawImage(terrainImage, x, y, gridSize, gridSize);
          } else {
            // Fallback if image isn't loaded
            switch (terrain) {
              case 'sand':
                ctx.fillStyle = 'rgba(255, 235, 153, 0.3)';
                break;
              case 'mud':
                ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
                break;
              case 'grass':
                ctx.fillStyle = 'rgba(124, 252, 0, 0.3)';
                break;
            }
            ctx.fillRect(x, y, gridSize, gridSize);
          }
        }
      }
    }
    
    ctx.restore();
  }
  
  // Draw time of day indicator
  drawTimeIndicator(ctx) {
    const size = 40;
    const padding = 20;
    
    ctx.save();
    
    // Draw sun or moon based on time
    if (this.isNight) {
      if (this.images.moon.complete) {
        ctx.drawImage(this.images.moon, ctx.canvas.width - size - padding, padding, size, size);
      } else {
        // Fallback
        ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width - size/2 - padding, size/2 + padding, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      if (this.images.sun.complete) {
        ctx.drawImage(this.images.sun, ctx.canvas.width - size - padding, padding, size, size);
      } else {
        // Fallback
        ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(ctx.canvas.width - size/2 - padding, size/2 + padding, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw clock time
    const hours = Math.floor(this.time);
    const minutes = Math.floor((this.time - hours) * 60);
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(timeString, ctx.canvas.width - size/2 - padding, size + padding + 20);
    
    ctx.restore();
  }
  
  // Draw weather effects
  drawWeatherEffects(ctx) {
    if (this.currentWeather === 'clear' && !this.weatherTransitioning) {
      return;
    }
    
    const weatherType = this.weatherTransitioning ? this.nextWeather : this.currentWeather;
    const intensity = this.weatherIntensity;
    
    ctx.save();
    ctx.globalAlpha = intensity * 0.5;
    
    switch (weatherType) {
      case 'rain':
        this.drawRain(ctx);
        break;
      case 'fog':
        this.drawFog(ctx);
        break;
      case 'heat':
        this.drawHeat(ctx);
        break;
    }
    
    // Draw weather icon
    const size = 30;
    const padding = 20;
    const weatherImage = this.images[weatherType];
    
    if (weatherImage && weatherImage.complete) {
      ctx.globalAlpha = intensity;
      ctx.drawImage(weatherImage, ctx.canvas.width - size - padding, padding * 3 + size, size, size);
    }
    
    ctx.restore();
  }
  
  // Draw rain effect
  drawRain(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.lineWidth = 1;
    
    // Draw rain drops
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const length = 10 + Math.random() * 10;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - length/2, y + length);
      ctx.stroke();
    }
  }
  
  // Draw fog effect
  drawFog(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a gradient for fog
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    gradient.addColorStop(0, 'rgba(200, 200, 200, 0.1)');
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.5)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw heat effect
  drawHeat(ctx) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create a gradient for heat haze
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255, 150, 50, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 100, 50, 0.3)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw heat waves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
      const y = Math.random() * height;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      
      for (let x = 0; x < width; x += 20) {
        const waveHeight = Math.sin(x * 0.01 + Date.now() * 0.001) * 5;
        ctx.lineTo(x, y + waveHeight);
      }
      
      ctx.stroke();
    }
  }
}
