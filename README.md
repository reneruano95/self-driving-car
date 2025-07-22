# Self-Driving Car Simulation

![Self-Driving Car Simulation](images/nn-car.png)
 
## Overview

This project is a self-driving car simulation built using HTML, CSS, and JavaScript. It demonstrates basic concepts of physics, controls, neural networks, reinforcement learning, and rendering in a 2D space. The simulation includes AI-driven cars that learn to navigate a road with traffic.


## Features

- **Dual AI Modes with Toggle**: Easily switch between Reinforcement Learning (RL) and Neural Network (NN) car modes using the new toggle button (🔄) in the UI. Both modes share unified controls and export/import options.
- **Enhanced Neural Networks**: Advanced neural network implementation with multiple activation functions (sigmoid, tanh, ReLU, leaky ReLU) and genetic algorithm evolution.
- **AI-Driven Cars (NN Mode)**: Simulates multiple cars controlled by neural networks that evolve to improve driving performance.
- **Reinforcement Learning Agent (RL Mode)**: Includes a car controlled by RL agents that learn to drive through trial and error:
  - **Q-table Agent**: Simple tabular Q-learning for discrete state spaces
  - **DQN Agent**: Deep Q-Network using neural networks for continuous state space learning with experience replay and target networks
- **Genetic Algorithm Evolution**: Advanced population-based evolution with tournament selection, crossover, and mutation for neural networks.
- **Performance Monitoring**: Real-time FPS, memory usage, and AI performance tracking with visual overlays.
- **Configuration System**: Runtime adjustment of simulation parameters, scenarios, and AI settings through an intuitive UI panel.
- **Unified Save/Load/Export/Import**: Save, discard, export, or import the current AI (RL Q-table or NN brain) using the same set of buttons, with automatic detection of the current mode.
- **Traffic Simulation**: Includes dummy cars to simulate real-world traffic.
- **Neural Network Visualization**: Visualizes the neural network's structure and activity (NN mode).
- **Car Movement**: Cars can accelerate, decelerate, and turn left or right.
- **Road with Lanes**: A road with multiple lanes, lane markings, and borders.
- **Physics Simulation**: Implements acceleration, friction, and speed limits.
- **Canvas Rendering**: Renders the simulation on HTML canvas elements.
- **Help System**: Comprehensive help overlay with controls and keyboard shortcuts.
- **Keyboard Shortcuts**: Quick access to all features via keyboard commands.


## Dual AI Modes: RL and Neural Network
You can now toggle between two AI modes:

- **RL Mode**: A single car controlled by reinforcement learning agents. You can switch between:
  - **Q-table Agent**: Traditional tabular Q-learning with discrete state space
  - **DQN Agent**: Deep Q-Network with neural networks, experience replay, and target networks for continuous state space learning
  
  Progress is saved as Q-table data or DQN state, which can be exported/imported or saved/discarded from localStorage. The RL car is visualized in green, and its stats are shown on the canvas.

- **NN Mode**: Multiple cars controlled by neural networks. The best-performing car's brain can be saved, exported, or imported. The NN cars are visualized in blue, and their stats (best distance, speed, etc.) are shown on the canvas.

Use the **toggle button (🔄)** in the UI to switch between RL and NN modes. In RL mode, press **'D'** to toggle between Q-table and DQN agents. All save/load/export/import actions apply to the currently active mode and agent type.

![Self-Driving Car Simulation](images/rl-car.png)

## File Structure

```
self-driving-car/
├── public/
│   └── index.html       # Main HTML file
├── src/
│   ├── css/
│   │   └── style.css    # Styling for the simulation
│   ├── js/
│   │   ├── car.js         # Car class implementation
│   │   ├── controls.js    # Keyboard controls for the car
│   │   ├── main.js        # Main script to initialize and animate the simulation
│   │   ├── network.js     # Neural network implementation
│   │   ├── enhanced_neural_network.js # Enhanced neural networks with advanced features
│   │   ├── road.js        # Road class with lane management
│   │   ├── sensor.js      # Implements the sensor class for detecting obstacles
│   │   ├── utils.js       # Utility functions (e.g., linear interpolation)
│   │   ├── rl_agent.js    # Reinforcement learning agent (Q-learning)
│   │   ├── dqn_agent.js   # Deep Q-Network agent with neural networks
│   │   ├── utils_rl.js    # Reinforcement learning utility functions
│   │   ├── performance_monitor.js # Performance monitoring and FPS tracking
│   │   ├── simulation_config.js # Configuration system for runtime parameter adjustment
│   │   ├── help_system.js # Help overlay system
│   │   └── visualizer.js  # Neural network visualization
├── images/
│   ├── nn-car.png
│   └── rl-car.png
└── README.md              # Project documentation
```

## How to Run

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Open the `public/index.html` file in a web browser.
   - Note: If the project uses `fetch` or other features requiring a server, use a local server (e.g., `Live Server` in VS Code).


## Controls

### UI Buttons
- **🔄 Toggle Mode**: Switch between RL and NN car modes.
- **💾 Save**: Save the current AI (Q-table or NN brain) to localStorage.
- **🗑️ Discard**: Remove the current AI from localStorage.
- **📤 Export**: Download the current AI as a JSON file.
- **📥 Import**: Load an AI from a JSON file (auto-detects RL or NN format).
- **⚡ Enhanced NN**: Toggle enhanced neural networks with advanced features (NN mode only).
- **⚙️ Config Panel**: Open the configuration panel for runtime parameter adjustment.
- **❓ Help**: Show help overlay with all controls and keyboard shortcuts.

### Keyboard Shortcuts
- **C**: Open/close Configuration Panel
- **E**: Toggle Enhanced Neural Networks (NN mode only)
- **D**: Toggle DQN Agent (RL mode only - switches between Q-table and DQN)
- **P**: Toggle Performance Overlay
- **H**: Show/hide Help Panel
- **R**: Reset Simulation
- **Space**: Pause/Resume Simulation

### Manual Controls (if enabled)
- **Arrow Up**: Move forward
- **Arrow Down**: Move backward
- **Arrow Left**: Turn left
- **Arrow Right**: Turn right

**Note**: The default control type is "AI" for autonomous driving, but you can switch modes and manage AI data at any time.

## Deep Q-Network (DQN) Agent

The DQN agent is an advanced reinforcement learning implementation that uses neural networks instead of Q-tables for value function approximation. This allows for:

### Key Features
- **Continuous State Space**: Handles precise sensor readings without discretization
- **Experience Replay**: Stores experiences in a circular buffer for stable learning
- **Target Network**: Uses a separate target network updated periodically for training stability
- **Neural Network Architecture**: 64-32 hidden layer network for Q-value estimation

### Advantages over Q-table
- **Better Generalization**: Can learn complex patterns and handle unseen states
- **Scalability**: Works with high-dimensional state spaces
- **Continuous Learning**: No need for state discretization
- **Memory Efficiency**: More compact representation than large Q-tables

### Usage
1. Switch to RL mode using the toggle button (🔄)
2. Press **'D'** to enable DQN agent (you'll see "RL (DQN)" in the stats)
3. The agent will learn automatically through experience replay
4. Progress is saved automatically and can be exported/imported

### Hyperparameters
- Learning Rate: 0.001
- Batch Size: 32 experiences
- Memory Size: 10,000 experiences
- Target Network Update: Every 100 training steps
- Epsilon Decay: 0.995 (exploration rate)

## Classes and Methods

### Car

- **Properties**:
  - `x`, `y`: Position of the car.
  - `width`, `height`: Dimensions of the car.
  - `controls`: Instance of the `Controls` class.
  - `sensor`: Instance of the `Sensor` class (optional).
  - `brain`: Neural network controlling the car.
- **Methods**:
  - `update()`: Updates the car's position, speed, and collision status.
  - `draw(ctx)`: Draws the car on the canvas.

### Controls

- **Properties**:
  - `forward`, `left`, `right`, `reverse`: Boolean flags for keyboard inputs.
- **Methods**:
  - `#addKeyboardListeners()`: Adds event listeners for keyboard inputs.

### Road

- **Properties**:
  - `x`, `width`, `laneCount`: Dimensions and lane configuration.
  - `borders`: Array of road borders.
- **Methods**:
  - `getLaneCenter(laneIndex)`: Calculates the center of a specific lane.
  - `draw(ctx)`: Draws the road and its lane markings.

### NeuralNetwork

- **Properties**:
  - `levels`: Array of levels representing the layers of the neural network.
- **Methods**:
  - `feedForward(inputs)`: Processes inputs through the network.
  - `mutate(amount)`: Applies random changes to the network's weights and biases.

### Visualizer

- **Methods**:
  - `drawNetwork(ctx, network)`: Visualizes the neural network on a canvas.

### Utils

- **lerp(A, B, t)**: Linear interpolation between two values.
- **getIntersection(A, B, C, D)**: Calculates the intersection point of two line segments.
- **polysIntersect(poly1, poly2)**: Checks if two polygons intersect.
- **getRGBA(value)**: Converts a numerical value to an RGBA color string.

### Sensor

- **Purpose**: Used for detecting obstacles and road boundaries.
- **Properties**:
  - `car`: The car that the sensor is attached to.
  - `rayCount`: Number of rays cast by the sensor.
  - `rayLength`: Length of each ray.
  - `raySpread`: Angle spread of the rays.
  - `rays`: Array of rays, each represented by two points (start and end).
  - `readings`: Array of readings from the rays, representing intersections with road borders or traffic.
- **Methods**:
  - `update(roadBorders, traffic)`: Updates the rays and readings based on the car's position and angle.
  - `draw(ctx)`: Draws the rays and their intersections on the canvas.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
