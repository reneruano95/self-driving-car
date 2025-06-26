# Self-Driving Car Simulation

## Overview

This project is a simple self-driving car simulation built using HTML, CSS, and JavaScript. It demonstrates basic concepts of physics, controls, and rendering in a 2D space. The simulation includes a car that can be controlled using keyboard inputs to move along a road with multiple lanes.

## Features

- **Car Movement**: The car can accelerate, decelerate, and turn left or right based on keyboard inputs.
- **Road with Lanes**: A road with multiple lanes is rendered, including lane markings and borders.
- **Physics Simulation**: Basic physics concepts like acceleration, friction, and speed limits are implemented.
- **Canvas Rendering**: The simulation is rendered on an HTML canvas element.

## File Structure

```
self-driving-car/
├── public/
│   └── index.html       # Main HTML file
├── src/
│   ├── css/
│   │   └── style.css    # Styling for the simulation
│   ├── js/
│   │   ├── car.js       # Car class implementation
│   │   ├── controls.js  # Keyboard controls for the car
│   │   ├── road.js      # Road class with lane management
│   │   ├── utils.js     # Utility functions (e.g., linear interpolation)
│   │   └── main.js      # Main script to initialize and animate the simulation
└── README.md            # Project documentation
```

## How to Run

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Open the `public/index.html` file in a web browser.

## Controls

- **Arrow Up**: Move forward
- **Arrow Down**: Move backward
- **Arrow Left**: Turn left
- **Arrow Right**: Turn right

## Classes and Methods

### Car

- **Properties**:
  - `x`, `y`: Position of the car.
  - `width`, `height`: Dimensions of the car.
  - `speed`, `acceleration`, `maxSpeed`, `friction`: Physics properties.
  - `angle`: Orientation of the car.
  - `controls`: Instance of the `Controls` class.
- **Methods**:
  - `update()`: Updates the car's position and speed.
  - `draw(ctx)`: Draws the car on the canvas.

### Controls

- **Properties**:
  - `forward`, `left`, `right`, `reverse`: Boolean flags for keyboard inputs.
- **Methods**:
  - `#addKeyboardListeners()`: Adds event listeners for keyboard inputs.

### Road

- **Properties**:
  - `x`, `width`, `laneCount`: Dimensions and lane configuration.
  - `left`, `right`, `top`, `bottom`: Edges of the road.
  - `borders`: Array of road borders.
- **Methods**:
  - `getLaneCenter(laneIndex)`: Calculates the center of a specific lane.
  - `draw(ctx)`: Draws the road and its lane markings.

### Utils

- **lerp(A, B, t)**: Linear interpolation between two values.

## License

This project is licensed under the MIT License.
