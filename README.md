# Self-Driving Car Simulation

![Self-Driving Car Simulation](images/nn-car.png)
 
## Overview

This project is a self-driving car simulation built using HTML, CSS, and JavaScript. It demonstrates basic concepts of physics, controls, neural networks, reinforcement learning, and rendering in a 2D space. The simulation includes AI-driven cars that learn to navigate a road with traffic.


## Features

- **Dual AI Modes with Toggle**: Easily switch between Reinforcement Learning (RL) and Neural Network (NN) car modes using the new toggle button (🔄) in the UI. Both modes share unified controls and export/import options.
- **AI-Driven Cars (NN Mode)**: Simulates multiple cars controlled by neural networks that evolve to improve driving performance.
- **Reinforcement Learning Agent (RL Mode)**: Includes a car controlled by a Q-learning RL agent that learns to drive through trial and error, with its progress saved automatically.
- **Unified Save/Load/Export/Import**: Save, discard, export, or import the current AI (RL Q-table or NN brain) using the same set of buttons, with automatic detection of the current mode.
- **Traffic Simulation**: Includes dummy cars to simulate real-world traffic.
- **Neural Network Visualization**: Visualizes the neural network's structure and activity (NN mode).
- **Car Movement**: Cars can accelerate, decelerate, and turn left or right.
- **Road with Lanes**: A road with multiple lanes, lane markings, and borders.
- **Physics Simulation**: Implements acceleration, friction, and speed limits.
- **Canvas Rendering**: Renders the simulation on HTML canvas elements.


## Dual AI Modes: RL and Neural Network
You can now toggle between two AI modes:

- **RL Mode**: A single car controlled by a Q-learning agent. Progress is saved as a Q-table, which can be exported/imported or saved/discarded from localStorage. The RL car is visualized in green, and its stats are shown on the canvas.
- **NN Mode**: Multiple cars controlled by neural networks. The best-performing car's brain can be saved, exported, or imported. The NN cars are visualized in blue, and their stats (best distance, speed, etc.) are shown on the canvas.

Use the **toggle button (🔄)** in the UI to switch between modes at any time. All save/load/export/import actions apply to the currently active mode.

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
│   │   ├── road.js        # Road class with lane management
│   │   ├── sensor.js      # Implements the sensor class for detecting obstacles
│   │   ├── utils.js       # Utility functions (e.g., linear interpolation)
│   │   ├── rl_agent.js    # Reinforcement learning agent (Q-learning)
│   │   ├── utils_rl.js    # Reinforcement learning utility functions
│   │   └── visualizer.js  # Neural network visualization
├── images/
│   ├── self-driving-car.png
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

- **Toggle Mode (🔄)**: Switch between RL and NN car modes.
- **💾 Save**: Save the current AI (Q-table or NN brain) to localStorage.
- **🗑️ Discard**: Remove the current AI from localStorage.
- **📤 Export**: Download the current AI as a JSON file.
- **📥 Import**: Load an AI from a JSON file (auto-detects RL or NN format).
- **Arrow Up**: Move forward (manual mode, if enabled)
- **Arrow Down**: Move backward
- **Arrow Left**: Turn left
- **Arrow Right**: Turn right
- Note: The default control type is "AI" for autonomous driving, but you can switch modes and manage AI data at any time.

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
