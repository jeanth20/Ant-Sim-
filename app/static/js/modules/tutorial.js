// Tutorial system for the ant simulation
export class Tutorial {
  constructor() {
    this.tutorialPanel = document.getElementById('tutorial-panel');
    this.closeButton = document.getElementById('tutorial-close');
    this.hasSeenTutorial = false;
    
    // Check if the user has seen the tutorial before
    this.checkTutorialStatus();
    
    // Add event listener to close button
    this.closeButton.addEventListener('click', () => {
      this.closeTutorial();
    });
  }
  
  // Check if the user has seen the tutorial before
  checkTutorialStatus() {
    const tutorialSeen = localStorage.getItem('antSimulation_tutorialSeen');
    this.hasSeenTutorial = tutorialSeen === 'true';
    
    // If the user hasn't seen the tutorial, show it
    if (!this.hasSeenTutorial) {
      this.showTutorial();
    }
  }
  
  // Show the tutorial panel
  showTutorial() {
    // Add the show class to display the panel with animation
    this.tutorialPanel.classList.add('show');
  }
  
  // Close the tutorial panel and mark as seen
  closeTutorial() {
    // Remove the show class to hide the panel
    this.tutorialPanel.classList.remove('show');
    
    // Mark the tutorial as seen
    localStorage.setItem('antSimulation_tutorialSeen', 'true');
    this.hasSeenTutorial = true;
  }
  
  // Show a specific tutorial tip
  showTip(tipId) {
    // This could be expanded to show specific tips based on game events
    // For now, we'll just log the tip ID
    console.log(`Showing tip: ${tipId}`);
  }
}
