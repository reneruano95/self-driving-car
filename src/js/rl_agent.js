/**
 * DQN-like Reinforcement Learning Agent for Self-Driving Car Simulation (Pure JavaScript)
 * This is a minimal scaffold for integrating RL into your project.
 *
 * State: Array of sensor readings, speed, etc.
 * Actions: [forward, left, right, reverse] (discrete)
 *
 * Methods:
 * - selectAction(state): returns an action index
 * - storeExperience(state, action, reward, nextState, done): stores experience for learning
 * - learn(): updates Q-network (placeholder for now)
 */
class RLAgent {
  constructor(stateSize, actionSize) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.memory = [];
    this.gamma = 0.95; // Discount factor
    this.epsilon = 1.0; // Exploration rate
    this.epsilonMin = 0.01;
    this.epsilonDecay = 0.995;
    this.learningRate = 0.001;
    // For simplicity, Q-table is used here; replace with NN for DQN
    this.qTable = {};
  }

  // Converts state array to a string key for Q-table
  _stateKey(state) {
    return state.map(x => x.toFixed(2)).join(',');
  }

  // Epsilon-greedy action selection
  selectAction(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }
    const key = this._stateKey(state);
    const qValues = this.qTable[key] || Array(this.actionSize).fill(0);
    return qValues.indexOf(Math.max(...qValues));
  }

  // Store experience (for future use with experience replay)
  storeExperience(state, action, reward, nextState, done) {
    this.memory.push({ state, action, reward, nextState, done });
    if (this.memory.length > 10000) this.memory.shift();
  }

  // Simple Q-learning update (tabular, for demonstration)
  learn() {
    if (this.memory.length === 0) return;
    const { state, action, reward, nextState, done } = this.memory[Math.floor(Math.random() * this.memory.length)];
    const key = this._stateKey(state);
    const nextKey = this._stateKey(nextState);
    if (!this.qTable[key]) this.qTable[key] = Array(this.actionSize).fill(0);
    if (!this.qTable[nextKey]) this.qTable[nextKey] = Array(this.actionSize).fill(0);
    const target = reward + (done ? 0 : this.gamma * Math.max(...this.qTable[nextKey]));
    this.qTable[key][action] += this.learningRate * (target - this.qTable[key][action]);
    if (this.epsilon > this.epsilonMin) this.epsilon *= this.epsilonDecay;
  }
}

// Export for use in main.js
// Usage: const agent = new RLAgent(stateSize, actionSize);
// In the simulation loop: agent.selectAction(state), agent.storeExperience(...), agent.learn();
