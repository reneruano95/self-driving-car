/**
 * Represents a neural network with multiple levels.
 * Each level connects a set of input neurons to a set of output neurons.
 *
 * @class NeuralNetwork
 * @property {Array<Level>} levels - An array of levels representing the layers of the neural network.
 */
class NeuralNetwork {
  /**
   * Initializes a new instance of the `NeuralNetwork` class.
   * @param {Array<number>} neuronCounts - An array representing the number of neurons in each layer.
   */
  constructor(neuronCounts) {
    this.levels = [];
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
    }
  }

  /**
   * Performs a feedforward operation through the neural network.
   * @param {Array<number>} givenInputs - The input values for the neural network.
   * @param {NeuralNetwork} network - The neural network to process the inputs.
   * @returns {Array<number>} The output values from the neural network.s
   */
  static feedForward(givenInputs, network) {
    let outputs = Level.feedForward(givenInputs, network.levels[0]);
    for (let i = 1; i < network.levels.length; i++) {
      outputs = Level.feedForward(outputs, network.levels[i]);
    }
    return outputs;
  }

  static mutate(network, amount = 1) {
    network.levels.forEach((level) => {
      for (let i = 0; i < level.biases.length; i++) {
        level.biases[i] = lerp(level.biases[i], Math.random() * 2 - 1, amount);
      }

      for (let i = 0; i < level.weights.length; i++) {
        for (let j = 0; j < level.weights[i].length; j++) {
          level.weights[i][j] = lerp(
            level.weights[i][j],
            Math.random() * 2 - 1,
            amount
          );
        }
      }
    });
  }
}

/**
 * Represents a single layer in a neural network.
 * Handles the connections between input and output neurons.
 *
 * @class Level
 * @property {Array<number>} inputs - The input values for the layer.
 * @property {Array<number>} outputs - The output values from the layer.
 * @property {Array<number>} biases - The biases for each output neuron.
 * @property {Array<Array<number>>} weights - The weights connecting input neurons to output neurons.
 */
class Level {
  /**
   * Initializes a new instance of the `Level` class.
   * @param {number} inputCount - The number of input neurons.
   * @param {number} outputCount - The number of output neurons.
   */
  constructor(inputCount, outputCount) {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);

    this.weights = [];
    for (let i = 0; i < inputCount; i++) {
      this.weights[i] = new Array(outputCount);
    }

    Level.#randomize(this);
  }

  /**
   * Randomizes the weights and biases for the level.
   * @private
   * @param {Level} level - The level to randomize.
   * @returns {void}
   */
  static #randomize(level) {
    for (let i = 0; i < level.inputs.length; i++) {
      for (let j = 0; j < level.outputs.length; j++) {
        level.weights[i][j] = Math.random() * 2 - 1;
      }
    }

    for (let i = 0; i < level.biases.length; i++) {
      level.biases[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Performs a feedforward operation through the level.
   * @param {Array<number>} givenInputs - The input values for the level.
   * @param {Level} level - The level to process the inputs.
   * @returns {Array<number>} The output values from the level.
   */
  static feedForward(givenInputs, level) {
    for (let i = 0; i < level.inputs.length; i++) {
      level.inputs[i] = givenInputs[i];
    }

    for (let i = 0; i < level.outputs.length; i++) {
      let sum = 0;
      for (let j = 0; j < level.inputs.length; j++) {
        sum += level.inputs[j] * level.weights[j][i];
      }

      if (sum > level.biases[i]) {
        level.outputs[i] = 1;
      } else {
        level.outputs[i] = 0;
      }
    }

    return level.outputs;
  }
}
