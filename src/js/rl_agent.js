/**
 * RLAgent: Tabular Q-learning Agent for Self-Driving Car Simulation (Pure JavaScript)
 *
 * - State: Array of sensor readings, speed, etc. (discretized for Q-table)
 * - Actions: [forward, left, right, reverse] (discrete indices)
 *
 * Usage:
 *   const agent = new RLAgent(stateSize, actionSize);
 *   // In simulation loop:
 *   const action = agent.selectAction(state);
 *   agent.storeExperience(state, action, reward, nextState, done);
 *   agent.learn();
 *
 * Note: This is a simple Q-table implementation for demonstration.
 * For large/continuous state spaces, replace with a neural network (DQN).
 */
class RLAgent {
  /**
   * @param {number} stateSize - Number of dimensions in the state space.
   * @param {number} actionSize - Number of possible discrete actions.
   * @param {number} batchSize - Number of experiences to sample per learning step (default: 32)
   */
  constructor(stateSize, actionSize, batchSize = 32) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.memory = [];
    this.gamma = 0.95; // Discount factor
    this.epsilon = 1.0; // Exploration rate
    this.epsilonMin = 0.05; // Minimum exploration rate
    this.epsilonDecay = 0.999; // Decay rate for exploration
    this.learningRate = 0.005; // Learning rate for Q-value updates
    this.batchSize = batchSize; // Default batch size for learning
    // For simplicity, Q-table is used here; replace with NN for DQN
    this.qTable = {};
  }

  /**
   * Converts a state array to a unique string key for Q-table indexing.
   * Discretizes each state value to reduce Q-table size while preserving important information.
   * @param {number[]} state - The state array (continuous values).
   * @returns {string} A comma-separated string representing the discretized state.
   *
   * Note: The discretization level affects generalization and table size.
   * For high-dimensional or highly variable states, consider coarser discretization.
   */
  _stateKey(state) {
    // More nuanced discretization: 1 decimal for sensor readings, round for others
    return state.map((x, i) => {
      if (i < 5) { // Sensor readings (first 5 elements)
        return (Math.round(x * 10) / 10).toFixed(1);
      } else { // Speed, angle, position
        return Math.round(x * 100) / 100; // 2 decimal places
      }
    }).join(",");
  }

  /**
   * Selects an action using epsilon-greedy policy.
   * @param {number[]} state - Current state array.
   * @returns {number} Action index.
   */
  selectAction(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }
    const key = this._stateKey(state);
    const qValues = this.qTable[key] || Array(this.actionSize).fill(0);

    // Handle ties by random selection among best actions
    const maxQ = Math.max(...qValues);
    const bestActions = qValues.map((q, i) => q === maxQ ? i : -1).filter(i => i !== -1);
    
    return bestActions[Math.floor(Math.random() * bestActions.length)];
  }

  /**
   * Stores an experience tuple for learning.
   * @param {number[]} state - Current state array.
   * @param {number} action - Action index taken.
   * @param {number} reward - Reward received.
   * @param {number[]} nextState - Next state array.
   * @param {boolean} done - Whether the episode is done.
   */
  storeExperience(state, action, reward, nextState, done) {
    this.memory.push({ state, action, reward, nextState, done });
    // More efficient memory management - use circular buffer concept
    if (this.memory.length > 10000) {
      this.memory = this.memory.slice(-8000); // Keep most recent 8000 experiences
    }
  }

  /**
   * Performs a Q-learning update using a batch of random experiences from memory.
   * @param {number} batchSize - Number of experiences to sample per learning step (default: uses constructor value)
   */
  learn(batchSize = this.batchSize) {
    if (this.memory.length < Math.min(batchSize, 100)) return; // Wait for sufficient experiences

    // Sample a batch of experiences
    const actualBatchSize = Math.min(batchSize, this.memory.length);
    const batch = [];
    for (let i = 0; i < actualBatchSize; i++) {
      batch.push(this.memory[Math.floor(Math.random() * this.memory.length)]);
    }

    for (const { state, action, reward, nextState, done } of batch) {
      const key = this._stateKey(state);
      const nextKey = this._stateKey(nextState);

      if (!this.qTable[key]) {
        this.qTable[key] = Array(this.actionSize).fill(0);
      }
      if (!this.qTable[nextKey]) {
        this.qTable[nextKey] = Array(this.actionSize).fill(0);
      }

      const target =
        reward + (done ? 0 : this.gamma * Math.max(...this.qTable[nextKey]));

      this.qTable[key][action] +=
        this.learningRate * (target - this.qTable[key][action]);
    }

    // Decay epsilon less frequently (only when we have sufficient experiences)
    if (this.memory.length > 500 && this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }
}
