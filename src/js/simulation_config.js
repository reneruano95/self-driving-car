/**
 * Configuration system for the self-driving car simulation
 * Allows runtime adjustment of parameters and different scenarios
 */
class SimulationConfig {
  constructor() {
    this.configs = {
      // Physics settings
      physics: {
        carAcceleration: 0.2,
        carMaxSpeed: 3,
        carFriction: 0.05,
        turnSpeed: 0.03
      },

      // AI settings
      ai: {
        rl: {
          stateSize: 9,
          actionSize: 7,
          gamma: 0.95,
          epsilon: 1.0,
          epsilonMin: 0.05,
          epsilonDecay: 0.999,
          learningRate: 0.005,
          batchSize: 32
        },
        nn: {
          populationSize: 100,
          mutationRate: 0.1,
          eliteCount: 2,
          hiddenLayers: [6, 4],
          activationFunction: 'sigmoid'
        }
      },

      // Environment settings
      environment: {
        trafficCount: 50,
        trafficSpacing: 180,
        laneCount: 3,
        roadWidth: 180,
        sensorRayCount: 5,
        sensorRayLength: 150,
        sensorRaySpread: Math.PI / 2
      },

      // Rendering settings
      rendering: {
        targetFPS: 60,
        showPerformanceOverlay: true,
        showDebugInfo: false,
        carColors: {
          rl: 'green',
          nn: 'blue',
          traffic: 'red',
          damaged: 'gray'
        }
      },

      // Scenario presets
      scenarios: {
        highway: {
          trafficCount: 30,
          trafficSpacing: 200,
          carMaxSpeed: 4
        },
        city: {
          trafficCount: 80,
          trafficSpacing: 120,
          carMaxSpeed: 2
        },
        empty: {
          trafficCount: 0,
          trafficSpacing: 0,
          carMaxSpeed: 5
        }
      }
    };

    this.currentScenario = 'highway';
    this.callbacks = new Map(); // For notifying components of config changes
  }

  /**
   * Get configuration value by path (e.g., 'ai.rl.gamma')
   */
  get(path) {
    return this.getNestedValue(this.configs, path);
  }

  /**
   * Set configuration value by path
   */
  set(path, value) {
    this.setNestedValue(this.configs, path, value);
    this.notifyChange(path, value);
  }

  /**
   * Load a scenario preset
   */
  loadScenario(scenarioName) {
    if (!this.configs.scenarios[scenarioName]) {
      console.warn(`Scenario '${scenarioName}' not found`);
      return;
    }

    const scenario = this.configs.scenarios[scenarioName];
    for (const [key, value] of Object.entries(scenario)) {
      this.set(`environment.${key}`, value);
    }

    this.currentScenario = scenarioName;
    this.notifyChange('scenario', scenarioName);
  }

  /**
   * Register callback for configuration changes
   */
  onChange(path, callback) {
    if (!this.callbacks.has(path)) {
      this.callbacks.set(path, []);
    }
    this.callbacks.get(path).push(callback);
  }

  /**
   * Notify all registered callbacks of a change
   */
  notifyChange(path, value) {
    // Notify exact path matches
    if (this.callbacks.has(path)) {
      this.callbacks.get(path).forEach(callback => callback(value, path));
    }

    // Notify wildcard listeners (e.g., 'ai.*' for any AI config change)
    for (const [callbackPath, callbacks] of this.callbacks) {
      if (callbackPath.endsWith('*') && path.startsWith(callbackPath.slice(0, -1))) {
        callbacks.forEach(callback => callback(value, path));
      }
    }
  }

  /**
   * Get nested object value by dot notation path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) =>
      current && current[key] !== undefined ? current[key] : undefined, obj
    );
  }

  /**
   * Set nested object value by dot notation path
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Export current configuration as JSON
   */
  export() {
    return JSON.stringify(this.configs, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  import(configJson) {
    try {
      const imported = JSON.parse(configJson);
      this.configs = { ...this.configs, ...imported };
      this.notifyChange('*', this.configs);
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.configs = new SimulationConfig().configs;
    this.notifyChange('*', this.configs);
  }

  /**
   * Create a configuration UI panel
   */
  createConfigUI() {
    const panel = document.createElement('div');
    panel.id = 'configPanel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 1000;
      max-height: 500px;
      overflow-y: auto;
      display: none;
    `;

    panel.innerHTML = `
      <h3>Simulation Config</h3>
      <div>
        <label>Scenario:</label>
        <select id="scenarioSelect">
          <option value="highway">Highway</option>
          <option value="city">City</option>
          <option value="empty">Empty Road</option>
        </select>
      </div>
      <div>
        <label>Traffic Count:</label>
        <input type="range" id="trafficCount" min="0" max="100" value="${this.get('environment.trafficCount')}">
        <span id="trafficCountValue">${this.get('environment.trafficCount')}</span>
      </div>
      <div>
        <label>Car Max Speed:</label>
        <input type="range" id="carMaxSpeed" min="1" max="10" step="0.1" value="${this.get('physics.carMaxSpeed')}">
        <span id="carMaxSpeedValue">${this.get('physics.carMaxSpeed')}</span>
      </div>
      <div>
        <label>Mutation Rate:</label>
        <input type="range" id="mutationRate" min="0" max="1" step="0.01" value="${this.get('ai.nn.mutationRate')}">
        <span id="mutationRateValue">${this.get('ai.nn.mutationRate')}</span>
      </div>
      <div>
        <button 
          style="
          background: #4CAF50; 
          color: white; border: none; 
          width: 100px; 
          height: 40px; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;"
         id="exportConfig">Export Config</button>
        <button 
          style="background: #f44336; 
          color: white; 
          border: none; 
          width: 100px; 
          height: 40px; 
          border-radius: 5px; 
          cursor: pointer;
          font-size: 14px;"
          id="resetConfig">Reset</button>
      </div>
    `;

    // Add event listeners
    const scenarioSelect = panel.querySelector('#scenarioSelect');
    scenarioSelect.addEventListener('change', (e) => {
      this.loadScenario(e.target.value);
    });

    const sliders = ['trafficCount', 'carMaxSpeed', 'mutationRate'];
    sliders.forEach(sliderId => {
      const slider = panel.querySelector(`#${sliderId}`);
      const valueDisplay = panel.querySelector(`#${sliderId}Value`);

      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        valueDisplay.textContent = value;

        switch (sliderId) {
          case 'trafficCount':
            this.set('environment.trafficCount', value);
            break;
          case 'carMaxSpeed':
            this.set('physics.carMaxSpeed', value);
            break;
          case 'mutationRate':
            this.set('ai.nn.mutationRate', value);
            break;
        }
      });
    });

    panel.querySelector('#exportConfig').addEventListener('click', () => {
      const configJson = this.export();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'simulation-config.json';
      a.click();
    });

    panel.querySelector('#resetConfig').addEventListener('click', () => {
      this.reset();
      // Update UI elements
      panel.querySelector('#trafficCount').value = this.get('environment.trafficCount');
      panel.querySelector('#trafficCountValue').textContent = this.get('environment.trafficCount');
      // ... update other UI elements
    });

    document.body.appendChild(panel);
    return panel;
  }

  /**
   * Toggle configuration panel visibility
   */
  toggleConfigPanel() {
    let panel = document.getElementById('configPanel');
    if (!panel) {
      panel = this.createConfigUI();
    }
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

// Create global configuration instance
const simulationConfig = new SimulationConfig();
