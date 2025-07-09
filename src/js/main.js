const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCanvasContext = carCanvas.getContext("2d");
const networkCanvasContext = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const N = 500; // Number of AI cars to generate
const cars = generateCars(N); // Generate AI cars
let bestCar = cars[0]; // Initialize the best car as the first AI car

if (localStorage.getItem("bestBrain")) {
  for (let i = 0; i < cars.length; i++) {
    cars[i].brain = JSON.parse(localStorage.getItem("bestBrain")); // Load the saved brain for each AI car

    if (i !== 0) {
      NeuralNetwork.mutate(cars[i].brain, 0.1); // Mutate the brain of each AI car except the first one
    }
  }
}

const traffic = [];
const lanes = road.laneCount;
const trafficSpacing = 180; // Fixed spacing between traffic cars
const trafficStartY = -100; // Starting Y position for traffic cars

for (let i = 0; i < 50; i++) {
  const lane = i % lanes; // Cycle through lanes consistently
  const y = trafficStartY - i * trafficSpacing; // Staggered Y positions
  traffic.push(new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", 2));
}

// RL Agent integration (for one car as a demo)
let rlAgent;
let rlCar;

function setupRLCar() {
  const stateSize = 6; // 5 sensor rays + 1 speed (adjust if needed)
  const actionSize = 4; // [forward, left, right, reverse]
  rlAgent = new RLAgent(stateSize, actionSize);
  // Load Q-table from localStorage if available
  const savedQTable = localStorage.getItem("rlQTable");
  if (savedQTable) {
    try {
      rlAgent.qTable = JSON.parse(savedQTable);
    } catch (e) {
      rlAgent.qTable = {};
    }
  }
  rlCar = new Car(road.getLaneCenter(0), 100, 30, 50, "PLAYER");
}

setupRLCar();

function getRLState(car) {
  const sensorReadings = car.sensor ? car.sensor.readings.map(s => (s === null ? 0 : 1 - s.offset)) : Array(5).fill(0);
  return [...sensorReadings, car.speed];
}

let rlStepCount = 0;
function stepRLCar() {
  if (rlCar.damaged) return;
  const state = getRLState(rlCar);
  const action = rlAgent.selectAction(state);
  // Map action index to controls
  rlCar.controls.forward = action === 0;
  rlCar.controls.left = action === 1;
  rlCar.controls.right = action === 2;
  rlCar.controls.reverse = action === 3;
  // --- RL reward calculation and experience storage ---
  // Reward: +1 for moving forward, -10 for crash, small penalty for not moving
  let reward = 0;
  if (rlCar.damaged) {
    reward = -10;
    localStorage.setItem("rlQTable", JSON.stringify(rlAgent.qTable)); // Save Q-table after crash
  } else if (rlCar.speed > 0.1) {
    reward = 1;
  } else {
    reward = -0.01;
  }
  // Next state after action
  const nextState = getRLState(rlCar);
  const done = rlCar.damaged;
  rlAgent.storeExperience(state, action, reward, nextState, done);
  rlAgent.learn();
  rlStepCount++;
  if (rlStepCount % 50 === 0) {
    localStorage.setItem("rlQTable", JSON.stringify(rlAgent.qTable));
  }
}

animate();

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain)); // Save the best AI car's brain to local storage
}

function discard() {
  localStorage.removeItem("bestBrain"); // Remove the saved brain from local storage
}

function generateCars(N) {
  const cars = [];
  for (let i = 1; i <= N; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
  }
  return cars;
}

function animate(time) {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []); // Update each traffic car
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic); // Update each AI car
  }
  stepRLCar();
  rlCar.update(road.borders, traffic);

  bestCar = cars.find((c) => c.y === Math.min(...cars.map((c) => c.y))); // Find the best AI car based on y position

  // bestCar = cars.reduce(
  //   (prev, curr) => (curr.y < prev.y ? curr : prev),
  //   cars[0]
  // ); // Find the car with the minimum y value

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCanvasContext.save(); // Save the current state of the canvas
  // carCanvasContext.translate(0, -bestCar.y + carCanvas.height * 0.7); // Translate the canvas to center the best car vertically

  carCanvasContext.translate(0, -rlCar.y + carCanvas.height * 0.7); // Translate the canvas to center the RL car vertically

  road.draw(carCanvasContext); // Draw the road
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCanvasContext, "red"); // Draw each traffic car
  }

  carCanvasContext.globalAlpha = 0.2; // Set transparency for AI cars
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCanvasContext, "blue"); // Draw each AI car
  }
  carCanvasContext.globalAlpha = 1; // Reset transparency for the main AI car
  bestCar.draw(carCanvasContext, "blue", true); // Draw the best AI car with sensor rays

  rlCar.draw(carCanvasContext, "green", true);

  carCanvasContext.restore();

  networkCanvasContext.lineDashOffset = -time / 50; // Animate the line dash offset for the neural network visualization
  Visualizer.drawNetwork(networkCanvasContext, bestCar.brain); // Draw the neural network
  requestAnimationFrame(animate);
}
