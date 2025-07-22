/**
 * Help system for displaying controls and keyboard shortcuts
 */
class HelpSystem {
  constructor() {
    this.isVisible = false;
    this.helpPanel = null;
  }

  createHelpPanel() {
    if (this.helpPanel) return this.helpPanel;

    const panel = document.createElement('div');
    panel.id = 'helpPanel';
    panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 2000;
      display: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;

    panel.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #4CAF50;">🚗 Self-Driving Car Controls</h2>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <h3 style="color: #2196F3; margin-bottom: 10px;">🎮 Controls</h3>
          <div style="line-height: 1.6;">
            <strong>🔄</strong> Toggle RL/NN Mode<br>
            <strong>💾</strong> Save AI to Storage<br>
            <strong>🗑️</strong> Discard AI<br>
            <strong>📤</strong> Export AI to File<br>
            <strong>📥</strong> Import AI from File<br>
            <strong>⚡</strong> Toggle Enhanced NN<br>
            <strong>⚙️</strong> Configuration Panel (Not implemented yet)<br>
          </div>
        </div>
        
        <div>
          <h3 style="color: #FF9800; margin-bottom: 10px;">⌨️ Keyboard Shortcuts</h3>
          <div style="line-height: 1.6;">
            <strong>C</strong> - Config. Panel (Not implemented yet)<br>
            <strong>E</strong> - Enhanced Neural Network<br>
            <strong>D</strong> - Toggle DQN (in RL mode)<br>
            <strong>P</strong> - Performance Overlay<br>
            <strong>H</strong> - This Help Panel<br>
            <strong>R</strong> - Reset Simulation<br>
            <strong>Space</strong> - Pause/Resume<br>
            <strong>Ctrl+Del</strong> - Clear All Data
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #9C27B0; margin-bottom: 10px;">🤖 AI Modes</h3>
        <div style="line-height: 1.6;">
          <strong>RL Mode:</strong> Single car using reinforcement learning<br>
          &nbsp;&nbsp;• Q-table: Simple tabular learning (default)<br>
          &nbsp;&nbsp;• DQN: Deep Q-Network with neural networks<br>
          <strong>NN Mode:</strong> Multiple cars using neural networks with genetic algorithm<br>
          <strong>Enhanced NN:</strong> Advanced neural networks with different activation functions
        </div>
      </div>
      
      <div style="margin-top: 20px;">
        <h3 style="color: #F44336; margin-bottom: 10px;">📊 Performance Metrics</h3>
        <div style="line-height: 1.6;">
          • FPS monitoring and optimization<br>
          • Memory usage tracking<br>
          • AI learning progress visualization<br>
          • Generation evolution in genetic algorithms
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px;">
        <button onclick="helpSystem.toggle()" style="
          background: #4CAF50;
          color: white;
          border: none;
          width: 100px;
          height: 40px;
          border-radius: 5px;
          cursor: pointer;
                  ">
        <p style="
        margin: 0;
        font-size: 14px;
        ">Close Help</p>
        </button>
      </div>
    `;

    document.body.appendChild(panel);
    this.helpPanel = panel;
    return panel;
  }

  toggle() {
    if (!this.helpPanel) {
      this.createHelpPanel();
    }

    this.isVisible = !this.isVisible;
    this.helpPanel.style.display = this.isVisible ? 'block' : 'none';
  }

  show() {
    if (!this.helpPanel) {
      this.createHelpPanel();
    }
    this.isVisible = true;
    this.helpPanel.style.display = 'block';
  }

  hide() {
    if (this.helpPanel) {
      this.isVisible = false;
      this.helpPanel.style.display = 'none';
    }
  }
}

// Create global help system instance
const helpSystem = new HelpSystem();

// Add help button function
function toggleHelp() {
  helpSystem.toggle();
}
