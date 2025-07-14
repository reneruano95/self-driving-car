const STATE_SIZE = 9; // 5 sensor rays + speed + angle + normalized x position + normalized y position
const ACTION_SIZE = 7; // [forward, forward+left, forward+right, reverse, left, right, no-op]
const BATCH_SIZE = 32; // Default batch size for learning
const SENSOR_OFFSET = 0.5; // Offset for sensor rays to avoid collision with other cars
const STEPS_COUNT = 50; // Steps after which to save the Q-table
const Y_NORMALIZATION_SCALE = 2000; // Scale for normalizing Y position
const MIN_SPEED_THRESHOLD = 0.1; // Minimum speed to avoid penalty
const TRAFFIC_COUNT = 50; // Number of traffic cars
const MAX_EPISODE_STEPS = 2000; // Maximum steps per episode
const N_CARS = 100; // Number of neural network cars

// Car mode toggle
let carMode = "RL"; // "RL" for Reinforcement Learning, "NN" for Neural Network
let time = 0;

const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

const carCanvasContext = carCanvas.getContext("2d");
const networkCanvasContext = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

const traffic = [];
const lanes = road.laneCount;
const trafficSpacing = 180; // Fixed spacing between traffic cars
const trafficStartY = -100; // Starting Y position for traffic cars

for (let i = 0; i < TRAFFIC_COUNT; i++) {
  const lane = i % lanes; // Cycle through lanes consistently
  const y = trafficStartY - i * trafficSpacing; // Staggered Y positions
  traffic.push(new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", 2));
}

// RL Agent integration (for one car as a demo)
let rlAgent;
let rlCar;

// Neural Network cars (for neural network mode)
let cars = [];
let bestCar;

// Initialize simulation 
initializeSimulation();

setupRLCar();

function getRLState(car) {
  const sensorReadings = car.sensor
    ? car.sensor.readings.map((s) => (s === null ? 0 : 1 - s.offset))
    : Array(5).fill(0);
  // Add car's angle (normalized), x position (normalized), and y position (normalized)
  const angle = car.angle / Math.PI; // Normalize angle to [-1, 1]
  const xNorm = (car.x - road.left) / (road.right - road.left); // Normalize x to [0, 1] within road
  const yNorm = car.y / Y_NORMALIZATION_SCALE; // Normalize y with configurable scale

  // Normalize speed to a more reasonable range (0-1 for typical speeds)
  const speedNorm = Math.min(car.speed / car.maxSpeed, 1); // Assuming max useful speed is car.maxSpeed

  const rawState = [...sensorReadings, speedNorm, angle, xNorm, yNorm];

  // Validate and clamp state values to expected ranges
  return validateState(rawState, STATE_SIZE);
}

let rlStepCount = 0;
// RL episode/learning stats
let episode = 1;
let episodeReward = 0;
let episodeStep = 0;
let lastEpisodeReward = 0;
let lastEpisodeSteps = 0;
let currentAction = 0; // Store current action for display

function stepRLCar() {
  const state = getRLState(rlCar);
  const rawAction = rlAgent.selectAction(state);

  // Validate action is within bounds
  const action = validateAction(rawAction, ACTION_SIZE);
  currentAction = action; // Store for display purposes

  // Reset all controls first
  rlCar.controls.forward = false;
  rlCar.controls.left = false;
  rlCar.controls.right = false;
  rlCar.controls.reverse = false;

  // Improved action mapping: handle all 7 actions including no-op
  switch (action) {
    case 0: // forward
      rlCar.controls.forward = true;
      break;
    case 1: // forward + left
      rlCar.controls.forward = true;
      rlCar.controls.left = true;
      break;
    case 2: // forward + right
      rlCar.controls.forward = true;
      rlCar.controls.right = true;
      break;
    case 3: // reverse
      rlCar.controls.reverse = true;
      break;
    case 4: // left only
      rlCar.controls.left = true;
      break;
    case 5: // right only
      rlCar.controls.right = true;
      break;
    case 6: // no-op (do nothing)
    default:
      // All controls remain false
      break;
  }

  // --- RL reward calculation and experience storage ---
  // Reward: +2 for moving forward, -15 for crash, -0.05 for each step, -0.5 for being too slow, +0.5 for staying in lane center
  let reward = -0.05; // Small penalty for each step (encourage faster completion)

  // Check for episode termination conditions
  if (episodeStep >= MAX_EPISODE_STEPS) {
    reward = -5; // Penalty for taking too long
    console.warn(`Episode ${episode} terminated: Max steps (${MAX_EPISODE_STEPS}) reached`);
    lastEpisodeReward = episodeReward;
    lastEpisodeSteps = episodeStep;
    episode++;
    episodeReward = 0;
    episodeStep = 0;
    resetRLCar();
    return; // Exit early
  }

  if (rlCar.damaged) {
    reward = -15;
    console.warn(
      `Episode ${episode} ended. Reward: ${episodeReward}, Steps: ${episodeStep}`
    );
    try {
      localStorage.setItem("rlQTable", JSON.stringify(rlAgent.qTable));
    } catch (e) {
      console.error("Failed to save Q-table:", e);
    }
    lastEpisodeReward = episodeReward;
    lastEpisodeSteps = episodeStep;
    episode++;
    episodeReward = 0;
    episodeStep = 0;
    resetRLCar();

  } else {
    // Reward for moving forward
    if (rlCar.speed > MIN_SPEED_THRESHOLD) {
      reward += 2;
    } else {
      reward -= 0.5; // Penalize for being too slow
    }

    // Penalty for being blocked by an obstacle ahead, and bonus for attempting to change lanes
    const centerIdx = Math.floor(rlCar.sensor.readings.length / 2);
    const frontSensor = rlCar.sensor && rlCar.sensor.readings[centerIdx];
    if (frontSensor && frontSensor.offset < SENSOR_OFFSET) {
      // Very close obstacle ahead
      reward -= 2; // Penalize for being blocked
      if (rlCar.controls.left || rlCar.controls.right) {
        reward += 1; // Encourage lane change when blocked
      }
    }

    // Bonus for staying near the closest lane center
    reward += laneCenterBonus(rlCar, road);

    // Distance-based reward: encourage forward progress
    const distanceReward = Math.max(0, -rlCar.y / 1000); // Reward for negative Y (forward movement)
    reward += distanceReward * 0.1; // Small bonus for distance traveled

    // Add success rewards for reaching certain distances
    if (rlCar.y < -5000) { // Traveled far
      reward += 50; // Big success bonus
    }
  }

  episodeReward += reward;
  episodeStep++;

  // Next state after action
  const nextState = getRLState(rlCar);
  const done = rlCar.damaged;

  // Store experience for learning
  rlAgent.storeExperience(state, action, reward, nextState, done);
  rlAgent.learn();
  rlStepCount++;
  if (rlStepCount % STEPS_COUNT === 0) {
    try {
      localStorage.setItem("rlQTable", JSON.stringify(rlAgent.qTable));
    } catch (e) {
      console.error("Failed to save Q-table:", e);
    }
  }
}

// Save function for the existing save button (saves to localStorage)
function save() {
  if (carMode === "RL") {
    saveRL();
  } else if (carMode === "NN") {
    saveNN();
  }
}

function saveRL() {
  try {
    localStorage.setItem("rlQTable", JSON.stringify(rlAgent.qTable));
    console.log('Q-table saved to localStorage');
  } catch (e) {
    console.error("Failed to save Q-table to localStorage:", e);
  }
}

function saveNN() {
  try {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
    console.log('Neural network saved to localStorage');
  } catch (e) {
    console.error("Failed to save neural network to localStorage:", e);
  }
}

// Discard function for the existing discard button
function discard() {
  if (carMode === "RL") {
    discardRL();
  } else if (carMode === "NN") {
    discardNN();
  }
}

function discardRL() {
  try {
    localStorage.removeItem("rlQTable");
    rlAgent.qTable = {};
    console.log('Q-table discarded from localStorage');
  } catch (e) {
    console.error("Failed to discard Q-table:", e);
  }
}

function discardNN() {
  try {
    localStorage.removeItem("bestBrain");
    console.log('Neural network discarded from localStorage');
  } catch (e) {
    console.error("Failed to discard neural network:", e);
  }
}

// Overlay stats on the canvas
function drawStats(ctx) {
  const rectWidth = 280; // Increased width for more stats
  const rectHeight = 130; // Increased height for more stats
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous stats

  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const x = (canvasWidth - rectWidth) / 2;
  const y = (canvasHeight - rectHeight) / 2;

  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, rectWidth, rectHeight);
  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace"; // Slightly smaller font to fit more info

  ctx.fillText(`Mode: ${carMode}`, x + 10, y + 20);

  if (carMode === "RL") {
    // Action names for better readability
    const actionNames = ['FWD', 'FWD+L', 'FWD+R', 'REV', 'LEFT', 'RIGHT', 'NO-OP'];
    const actionName = actionNames[currentAction] || 'UNKNOWN';

    ctx.fillText(`Episode: ${episode}`, x + 10, y + 40);
    ctx.fillText(`Reward: ${episodeReward.toFixed(2)}`, x + 10, y + 60);
    ctx.fillText(`Steps: ${episodeStep}/${MAX_EPISODE_STEPS}`, x + 10, y + 80);
    ctx.fillText(`Action: ${actionName} (${currentAction})`, x + 10, y + 100);
    ctx.fillText(`ε: ${rlAgent.epsilon.toFixed(3)}, Speed: ${rlCar.speed.toFixed(2)}`, x + 10, y + 120);
  } else if (carMode === "NN") {
    const aliveCars = cars.filter(c => !c.damaged).length;
    const totalDistance = bestCar ? bestCar.y : 0;

    ctx.fillText(`Cars: ${aliveCars}/${cars.length}`, x + 10, y + 40);
    ctx.fillText(`Best Distance: ${Math.abs(totalDistance).toFixed(0)}`, x + 10, y + 60);
    ctx.fillText(`Speed: ${bestCar ? bestCar.speed.toFixed(2) : 0}`, x + 10, y + 80);
    ctx.fillText(`Time: ${Math.floor(time / 60)}s`, x + 10, y + 100);
    ctx.fillText(`Best Car Position: ${bestCar ? bestCar.y.toFixed(0) : 0}`, x + 10, y + 120);
  }

  ctx.restore();
}

function resetTraffic() {
  traffic.length = 0;
  const lanes = road.laneCount;
  const trafficSpacing = 180;
  const trafficStartY = -100;
  // Place traffic cars away from the RL car's starting position
  for (let i = 0; i < TRAFFIC_COUNT; i++) {
    const lane = i % lanes;
    let y = trafficStartY - i * trafficSpacing;
    // Ensure no traffic car is too close to the RL car's starting y (100)
    if (Math.abs(y - 100) < 120) {
      y -= 200; // Move it further away if too close
    }
    traffic.push(new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", 2));
  }
  // Immediately update all traffic cars to recalculate polygons
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
}

function resetRLCar() {
  rlCar.x = road.getLaneCenter(0);
  rlCar.y = 100;
  rlCar.speed = 0;
  rlCar.angle = 0;
  rlCar.damaged = false;
  rlCar.controls.forward = false;
  rlCar.controls.left = false;
  rlCar.controls.right = false;
  rlCar.controls.reverse = false;
  if (rlCar.sensor && typeof rlCar.sensor.reset === "function") {
    rlCar.sensor.reset();
  }
  resetTraffic();
  // Immediately update RL car to recalculate polygon
  rlCar.update(road.borders, traffic);
}

// Initialize simulation based on car mode
function initializeSimulation() {
  if (carMode === "RL") {
    setupRLCar();
  } else if (carMode === "NN") {
    setupNeuralNetworkCars();
  }
  resetTraffic();
}

function setupRLCar() {
  rlAgent = new RLAgent(STATE_SIZE, ACTION_SIZE, BATCH_SIZE);
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


function setupNeuralNetworkCars() {
  cars = [];
  for (let i = 0; i <= N_CARS; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI"));
  }
  bestCar = cars[0];

  // Load best brain from localStorage if available
  if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
      if (i != 0) {
        NeuralNetwork.mutate(cars[i].brain, 0.1);
      }
    }
  }
}

// Toggle between RL and NN modes
function toggleCarMode() {
  carMode = carMode === "RL" ? "NN" : "RL";
  initializeSimulation();
  console.log(`Switched to ${carMode} mode`);
}

animate();

function animate(time) {
  if (carMode === "RL") {
    animateRL();
  } else if (carMode === "NN") {
    animateNN(time);
  }
}

function animateRL() {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []); // Update each traffic car
  }
  stepRLCar();
  rlCar.update(road.borders, traffic);

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCanvasContext.save(); // Save the current state of the canvas
  carCanvasContext.translate(0, -rlCar.y + carCanvas.height * 0.7); // Translate the canvas to center the RL car vertically

  road.draw(carCanvasContext); // Draw the road
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCanvasContext, "red"); // Draw each traffic car
  }
  rlCar.draw(carCanvasContext, "green", true);

  drawStats(networkCanvasContext); // Draw stats on the network canvas

  carCanvasContext.restore();
  requestAnimationFrame(animate);
}

function animateNN(time) {

  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }

  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }

  bestCar = cars.find(c => c.y == Math.min(...cars.map(c => c.y)));

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCanvasContext.save();
  carCanvasContext.translate(0, -bestCar.y + carCanvas.height * 0.7);

  road.draw(carCanvasContext);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCanvasContext, "red");
  }
  carCanvasContext.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCanvasContext, "blue");
  }
  carCanvasContext.globalAlpha = 1;
  bestCar.draw(carCanvasContext, "blue", true);

  carCanvasContext.restore();

  networkCanvasContext.lineDashOffset = -time / 50;
  Visualizer.drawNetwork(networkCanvasContext, bestCar.brain);
  requestAnimationFrame(animate);
}

// Save Q-table to JSON file
function saveQTableToFile() {
  if (carMode === "RL") {
    saveRLToFile();
  } else if (carMode === "NN") {
    saveNNToFile();
  }
}

function saveRLToFile() {
  const qTableData = {
    mode: "RL",
    qTable: rlAgent.qTable,
    episode: episode,
    epsilon: rlAgent.epsilon,
    timestamp: new Date().toISOString(),
    stats: {
      totalSteps: rlStepCount,
      lastEpisodeReward: lastEpisodeReward,
      lastEpisodeSteps: lastEpisodeSteps
    }
  };

  const dataStr = JSON.stringify(qTableData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `rl-qtable-episode-${episode}-${Date.now()}.json`;
  link.click();

  console.log('Q-table exported successfully!');
}

function saveNNToFile() {
  const neuralNetworkData = {
    mode: "NN",
    brain: bestCar.brain,
    timestamp: new Date().toISOString(),
    stats: {
      totalCars: cars.length,
      bestDistance: Math.abs(bestCar.y),
      time: time
    }
  };

  const dataStr = JSON.stringify(neuralNetworkData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `neural-network-${Date.now()}.json`;
  link.click();

  console.log('Neural network exported successfully!');
}

// Load Q-table from JSON file
function loadQTableFromFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // Check the mode and load accordingly
      if (data.mode === "RL" && data.qTable) {
        loadRLFromFile(data);
      } else if (data.mode === "NN" && data.brain) {
        loadNNFromFile(data);
      } else if (data.qTable && !data.mode) {
        // Legacy RL format
        loadRLFromFile(data);
      } else {
        console.error('Invalid file format or unsupported mode');
        alert('Invalid file format. Please select a valid RL or Neural Network JSON file.');
      }
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading file. Please make sure it\'s a valid JSON file.');
    }
  };
  reader.readAsText(file);
}

// New helper functions to load RL and Neural Network data from files
function loadRLFromFile(qTableData) {
  // Validate the data structure
  if (qTableData.qTable && typeof qTableData.qTable === 'object') {
    // Switch to RL mode if not already
    if (carMode !== "RL") {
      carMode = "RL";
      initializeSimulation();
    }

    rlAgent.qTable = qTableData.qTable;

    // Restore other parameters if available
    if (qTableData.epsilon !== undefined) {
      rlAgent.epsilon = qTableData.epsilon;
    }
    if (qTableData.episode !== undefined) {
      episode = qTableData.episode;
    }
    if (qTableData.stats) {
      if (qTableData.stats.totalSteps !== undefined) {
        rlStepCount = qTableData.stats.totalSteps;
      }
      if (qTableData.stats.lastEpisodeReward !== undefined) {
        lastEpisodeReward = qTableData.stats.lastEpisodeReward;
      }
      if (qTableData.stats.lastEpisodeSteps !== undefined) {
        lastEpisodeSteps = qTableData.stats.lastEpisodeSteps;
      }
    }

    // Also save to localStorage
    localStorage.setItem("rlQTable", JSON.stringify(rlAgent.qTable));

    console.log('Q-table loaded successfully!');
    alert('Q-table loaded successfully!');
  } else {
    console.error('Invalid Q-table data format');
    alert('Invalid Q-table data format. Please select a valid RL JSON file.');
  }
}

function loadNNFromFile(neuralNetworkData) {
  // Validate the data structure
  if (neuralNetworkData.brain && typeof neuralNetworkData.brain === 'object') {
    // Switch to NN mode if not already
    if (carMode !== "NN") {
      carMode = "NN";
      initializeSimulation();
    }

    // Apply the loaded brain to all cars
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(JSON.stringify(neuralNetworkData.brain));
      if (i != 0) {
        NeuralNetwork.mutate(cars[i].brain, 0.1);
      }
    }
    bestCar = cars[0];

    // Also save to localStorage
    localStorage.setItem("bestBrain", JSON.stringify(neuralNetworkData.brain));

    console.log('Neural network loaded successfully!');
    alert('Neural network loaded successfully!');
  } else {
    console.error('Invalid neural network data format');
    alert('Invalid neural network data format. Please select a valid Neural Network JSON file.');
  }
}
