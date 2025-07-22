/**
 * Enhanced Deep Q-Network (DQN) implementation to replace the simple Q-table
 * Provides continuous state space learning with neural networks
 */
class DQNAgent {
  constructor(stateSize, actionSize, config = {}) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    
    // Hyperparameters
    this.gamma = config.gamma || 0.95;
    this.epsilon = config.epsilon || 1.0;
    this.epsilonMin = config.epsilonMin || 0.01;
    this.epsilonDecay = config.epsilonDecay || 0.995;
    this.learningRate = config.learningRate || 0.001;
    this.batchSize = config.batchSize || 32;
    this.memorySize = config.memorySize || 10000;
    this.targetUpdateFreq = config.targetUpdateFreq || 100;
    
    // Experience replay buffer
    this.memory = [];
    this.memoryIndex = 0;
    
    // Neural networks
    this.qNetwork = new NeuralNetwork([stateSize, 64, 32, actionSize]);
    this.targetNetwork = new NeuralNetwork([stateSize, 64, 32, actionSize]);
    
    // Copy weights to target network
    this.updateTargetNetwork();
    
    this.trainStep = 0;
  }

  /**
   * Select action using epsilon-greedy policy with neural network
   */
  selectAction(state) {
    if (Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSize);
    }

    const qValues = NeuralNetwork.feedForward(state, this.qNetwork);
    return this.argMax(qValues);
  }

  /**
   * Store experience in replay buffer (circular buffer)
   */
  storeExperience(state, action, reward, nextState, done) {
    const experience = { state, action, reward, nextState, done };
    
    if (this.memory.length < this.memorySize) {
      this.memory.push(experience);
    } else {
      this.memory[this.memoryIndex] = experience;
      this.memoryIndex = (this.memoryIndex + 1) % this.memorySize;
    }
  }

  /**
   * Train the DQN using experience replay
   */
  learn() {
    if (this.memory.length < this.batchSize) return;

    // Sample random batch from memory
    const batch = this.sampleBatch();
    
    // Prepare training data
    const states = batch.map(exp => exp.state);
    const nextStates = batch.map(exp => exp.nextState);
    
    // Get current Q-values and target Q-values
    const currentQBatch = states.map(state => NeuralNetwork.feedForward(state, this.qNetwork));
    const nextQBatch = nextStates.map(state => NeuralNetwork.feedForward(state, this.targetNetwork));
    
    // Calculate target values
    for (let i = 0; i < batch.length; i++) {
      const { action, reward, done } = batch[i];
      const targetQ = currentQBatch[i].slice(); // Copy current Q-values
      
      if (done) {
        targetQ[action] = reward;
      } else {
        const maxNextQ = Math.max(...nextQBatch[i]);
        targetQ[action] = reward + this.gamma * maxNextQ;
      }
      
      // Simplified training: adjust weights towards target
      this.trainNetwork(states[i], targetQ);
    }

    // Decay epsilon
    if (this.epsilon > this.epsilonMin) {
      this.epsilon *= this.epsilonDecay;
    }

    this.trainStep++;
    
    // Update target network periodically
    if (this.trainStep % this.targetUpdateFreq === 0) {
      this.updateTargetNetwork();
    }
  }

  /**
   * Simple network training (gradient descent approximation)
   */
  trainNetwork(inputState, targetOutput) {
    const currentOutput = NeuralNetwork.feedForward(inputState, this.qNetwork);
    
    // Simplified backpropagation: adjust weights proportionally to error
    for (let levelIdx = 0; levelIdx < this.qNetwork.levels.length; levelIdx++) {
      const level = this.qNetwork.levels[levelIdx];
      
      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          if (levelIdx === this.qNetwork.levels.length - 1) {
            // Output layer: use target error
            const error = targetOutput[j] - currentOutput[j];
            level.weights[i][j] += this.learningRate * error * level.inputs[i];
          } else {
            // Hidden layers: simple random adjustment (simplified)
            const adjustment = (Math.random() - 0.5) * this.learningRate * 0.1;
            level.weights[i][j] += adjustment;
          }
        }
      }
      
      // Adjust biases
      for (let j = 0; j < level.biases.length; j++) {
        if (levelIdx === this.qNetwork.levels.length - 1) {
          const error = targetOutput[j] - currentOutput[j];
          level.biases[j] += this.learningRate * error;
        }
      }
    }
  }

  /**
   * Copy weights from main network to target network
   */
  updateTargetNetwork() {
    for (let i = 0; i < this.qNetwork.levels.length; i++) {
      const sourceLevel = this.qNetwork.levels[i];
      const targetLevel = this.targetNetwork.levels[i];
      
      // Copy weights
      for (let j = 0; j < sourceLevel.weights.length; j++) {
        for (let k = 0; k < sourceLevel.weights[j].length; k++) {
          targetLevel.weights[j][k] = sourceLevel.weights[j][k];
        }
      }
      
      // Copy biases
      for (let j = 0; j < sourceLevel.biases.length; j++) {
        targetLevel.biases[j] = sourceLevel.biases[j];
      }
    }
  }

  /**
   * Sample random batch from experience replay buffer
   */
  sampleBatch() {
    const batch = [];
    for (let i = 0; i < this.batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[randomIndex]);
    }
    return batch;
  }

  /**
   * Find index of maximum value in array
   */
  argMax(array) {
    let maxIndex = 0;
    let maxValue = array[0];
    
    for (let i = 1; i < array.length; i++) {
      if (array[i] > maxValue) {
        maxValue = array[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  /**
   * Save agent state
   */
  save() {
    return {
      qNetwork: this.qNetwork,
      targetNetwork: this.targetNetwork,
      epsilon: this.epsilon,
      trainStep: this.trainStep,
      memory: this.memory.slice(-1000) // Save last 1000 experiences
    };
  }

  /**
   * Load agent state
   */
  load(savedState) {
    if (savedState.qNetwork) this.qNetwork = savedState.qNetwork;
    if (savedState.targetNetwork) this.targetNetwork = savedState.targetNetwork;
    if (savedState.epsilon !== undefined) this.epsilon = savedState.epsilon;
    if (savedState.trainStep !== undefined) this.trainStep = savedState.trainStep;
    if (savedState.memory) this.memory = savedState.memory;
  }
}
