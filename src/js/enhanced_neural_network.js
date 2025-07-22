/**
 * Enhanced Neural Network with different activation functions and improved architecture
 */
class EnhancedNeuralNetwork {
  constructor(neuronCounts, activationFunction = 'sigmoid') {
    this.levels = [];
    this.activationFunction = activationFunction;
    
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.levels.push(new EnhancedLevel(
        neuronCounts[i], 
        neuronCounts[i + 1], 
        activationFunction
      ));
    }
  }

  static feedForward(givenInputs, network) {
    let outputs = EnhancedLevel.feedForward(givenInputs, network.levels[0]);
    for (let i = 1; i < network.levels.length; i++) {
      outputs = EnhancedLevel.feedForward(outputs, network.levels[i]);
    }
    return outputs;
  }

  static mutate(network, amount = 1) {
    if (amount < 0 || amount > 1) {
      throw new Error("Mutation amount must be between 0 and 1.");
    }

    network.levels.forEach((level) => {
      // Mutate biases
      for (let i = 0; i < level.biases.length; i++) {
        if (Math.random() < 0.1) { // 10% chance to mutate each bias
          level.biases[i] = lerp(level.biases[i], Math.random() * 2 - 1, amount);
        }
      }

      // Mutate weights
      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          if (Math.random() < 0.1) { // 10% chance to mutate each weight
            level.weights[i][j] = lerp(
              level.weights[i][j],
              Math.random() * 2 - 1,
              amount
            );
          }
        }
      }
    });
  }

  // Add method to calculate network complexity
  getComplexity() {
    let totalConnections = 0;
    this.levels.forEach(level => {
      totalConnections += level.weights.length * level.weights[0].length;
    });
    return totalConnections;
  }

  // Add method to get network performance metrics
  getPerformanceMetrics() {
    return {
      levels: this.levels.length,
      complexity: this.getComplexity(),
      activationFunction: this.activationFunction
    };
  }
}

class EnhancedLevel {
  constructor(inputCount, outputCount, activationFunction = 'sigmoid') {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);
    this.activationFunction = activationFunction;

    this.weights = [];
    for (let i = 0; i < inputCount; i++) {
      this.weights[i] = new Array(outputCount);
    }

    EnhancedLevel.#randomize(this);
  }

  static #randomize(level) {
    // Use Xavier/Glorot initialization for better training
    const limit = Math.sqrt(6 / (level.inputs.length + level.outputs.length));
    
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = (Math.random() * 2 - 1) * limit;
      }
    }

    for (let i = 0; i < level.biases.length; i++) {
      level.biases[i] = (Math.random() * 2 - 1) * 0.1; // Smaller initial biases
    }
  }

  static feedForward(givenInputs, level) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = givenInputs[i];
    }

    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0;
      for (let j = 0; j < level.inputs.length; j++) {
        sum += level.inputs[j] * level.weights[j][i];
      }
      sum += level.biases[i];

      // Apply activation function
      level.outputs[i] = EnhancedLevel.#activationFunction(sum, level.activationFunction);
    }

    return level.outputs;
  }

  static #activationFunction(x, type) {
    switch (type) {
      case 'sigmoid':
        return 1 / (1 + Math.exp(-x));
      case 'tanh':
        return Math.tanh(x);
      case 'relu':
        return Math.max(0, x);
      case 'leaky_relu':
        return x > 0 ? x : 0.01 * x;
      case 'binary':
      default:
        return x > 0 ? 1 : 0;
    }
  }
}

/**
 * Genetic Algorithm for evolving neural networks
 */
class GeneticAlgorithm {
  constructor(populationSize, mutationRate = 0.1, eliteCount = 2) {
    this.populationSize = populationSize;
    this.mutationRate = mutationRate;
    this.eliteCount = eliteCount;
    this.generation = 0;
  }

  /**
   * Evolve population based on fitness scores
   */
  evolvePopulation(population, fitnessScores) {
    // Sort by fitness (higher is better)
    const sortedIndices = fitnessScores
      .map((fitness, index) => ({ fitness, index }))
      .sort((a, b) => b.fitness - a.fitness)
      .map(item => item.index);

    const newPopulation = [];
    
    // Keep elite individuals
    for (let i = 0; i < this.eliteCount; i++) {
      const eliteIndex = sortedIndices[i];
      newPopulation.push(this.cloneNetwork(population[eliteIndex]));
    }

    // Generate offspring through selection and crossover
    while (newPopulation.length < this.populationSize) {
      const parent1 = this.tournamentSelection(population, fitnessScores);
      const parent2 = this.tournamentSelection(population, fitnessScores);
      
      const offspring = this.crossover(parent1, parent2);
      if (Math.random() < this.mutationRate) {
        EnhancedNeuralNetwork.mutate(offspring, 0.2);
      }
      
      newPopulation.push(offspring);
    }

    this.generation++;
    return newPopulation;
  }

  /**
   * Tournament selection for choosing parents
   */
  tournamentSelection(population, fitnessScores, tournamentSize = 3) {
    let bestIndex = Math.floor(Math.random() * population.length);
    let bestFitness = fitnessScores[bestIndex];

    for (let i = 1; i < tournamentSize; i++) {
      const candidateIndex = Math.floor(Math.random() * population.length);
      if (fitnessScores[candidateIndex] > bestFitness) {
        bestIndex = candidateIndex;
        bestFitness = fitnessScores[candidateIndex];
      }
    }

    return population[bestIndex];
  }

  /**
   * Crossover between two neural networks
   */
  crossover(parent1, parent2) {
    const offspring = this.cloneNetwork(parent1);

    for (let levelIdx = 0; levelIdx < offspring.levels.length; levelIdx++) {
      const level = offspring.levels[levelIdx];
      const parent2Level = parent2.levels[levelIdx];

      // Crossover weights
      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          if (Math.random() < 0.5) {
            level.weights[i][j] = parent2Level.weights[i][j];
          }
        }
      }

      // Crossover biases
      for (let i = 0; i < level.biases.length; i++) {
        if (Math.random() < 0.5) {
          level.biases[i] = parent2Level.biases[i];
        }
      }
    }

    return offspring;
  }

  /**
   * Clone a neural network
   */
  cloneNetwork(network) {
    const neuronCounts = [network.levels[0].inputs.length];
    for (let level of network.levels) {
      neuronCounts.push(level.outputs.length);
    }

    const clone = new EnhancedNeuralNetwork(neuronCounts, network.activationFunction);

    // Copy weights and biases
    for (let i = 0; i < network.levels.length; i++) {
      const sourceLevel = network.levels[i];
      const cloneLevel = clone.levels[i];

      for (let j = 0; j < sourceLevel.weights.length; j++) {
        for (let k = 0; k < sourceLevel.weights[j].length; k++) {
          cloneLevel.weights[j][k] = sourceLevel.weights[j][k];
        }
      }

      for (let j = 0; j < sourceLevel.biases.length; j++) {
        cloneLevel.biases[j] = sourceLevel.biases[j];
      }
    }

    return clone;
  }
}
