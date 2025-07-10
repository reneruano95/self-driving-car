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
   * Discretizes each state value to 2 decimal places to reduce Q-table size.
   * @param {number[]} state - The state array (continuous values).
   * @returns {string} A comma-separated string representing the discretized state.
   *
   * Note: The discretization level (2 decimals) affects generalization and table size.
   * For high-dimensional or highly variable states, consider coarser discretization.
   */
  _stateKey(state) {
    // Coarse discretization: round to nearest integer for each value
    return state.map((x) => Math.round(x).toString()).join(",");
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

    return qValues.indexOf(Math.max(...qValues));
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
    if (this.memory.length > 10000) this.memory.shift();
  }

  /**
   * Performs a Q-learning update using a batch of random experiences from memory.
   * @param {number} batchSize - Number of experiences to sample per learning step (default: 16)
   */
  learn(batchSize = this.batchSize) {
    if (this.memory.length === 0) return;
    // Sample a batch of experiences
    const batch = [];
    for (let i = 0; i < batchSize; i++) {
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

    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }
  }
}
