const STATE_SIZE = 9; // 5 sensor rays + speed + angle + normalized x position + normalized y position
const ACTION_SIZE = 7; // [forward, forward+left, forward+right, reverse, left, right, no-op]
const BATCH_SIZE = 32; // Default batch size for learning
const SENSOR_OFFSET = 0.5; // Offset for sensor rays to avoid collision with other cars
const STEPS_COUNT = 50; // Steps after which to save the Q-table
const Y_NORMALIZATION_SCALE = 2000; // Scale for normalizing Y position
const MIN_SPEED_THRESHOLD = 0.1; // Minimum speed to avoid penalty
const TRAFFIC_COUNT = 50; // Number of traffic cars

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

setupRLCar();

function getRLState(car) {
  const sensorReadings = car.sensor
    ? car.sensor.readings.map((s) => (s === null ? 0 : 1 - s.offset))
    : Array(5).fill(0);
  // Add car's angle (normalized), x position (normalized), and y position (normalized)
  const angle = car.angle / Math.PI; // Normalize angle to [-1, 1]
  const xNorm = (car.x - road.left) / (road.right - road.left); // Normalize x to [0, 1] within road
  const yNorm = car.y / Y_NORMALIZATION_SCALE; // Normalize y with configurable scale

  const rawState = [...sensorReadings, car.speed, angle, xNorm, yNorm];

  // Validate and clamp state values to expected ranges
  return validateState(rawState);
}

/**
 * Validates and clamps state values to ensure they are within expected bounds.
 * This prevents the RL agent from receiving invalid or extreme values.
 * @param {number[]} state - Raw state array
 * @returns {number[]} Validated and clamped state array
 */
function validateState(state) {
  const validatedState = state.map((value, index) => {
    // Handle NaN or undefined values
    if (isNaN(value) || value === undefined || value === null) {
      console.warn(`Invalid state value at index ${index}: ${value}, setting to 0`);
      return 0;
    }

    // Define bounds for different state components
    if (index < 5) {
      // Sensor readings: should be between 0 and 1
      return Math.max(0, Math.min(1, value));
    } else if (index === 5) {
      // Speed: clamp to reasonable range (0 to 10)
      return Math.max(0, Math.min(10, value));
    } else if (index === 6) {
      // Angle: should be between -1 and 1 (normalized by PI)
      return Math.max(-1, Math.min(1, value));
    } else if (index === 7) {
      // X position: should be between 0 and 1 (normalized by road width)
      return Math.max(-0.5, Math.min(1.5, value)); // Allow some overshoot for off-road scenarios
    } else if (index === 8) {
      // Y position: allow negative values but clamp extremes
      return Math.max(-2, Math.min(2, value));
    }

    // Default: clamp to [-1, 1] for any other values
    return Math.max(-1, Math.min(1, value));
  });

  // Additional validation: ensure state has correct length
  if (validatedState.length !== STATE_SIZE) {
    console.error(`State validation error: expected ${STATE_SIZE} elements, got ${validatedState.length}`);
    // Pad with zeros or truncate as needed
    while (validatedState.length < STATE_SIZE) {
      validatedState.push(0);
    }
    validatedState.length = STATE_SIZE;
  }

  return validatedState;
}

/**
 * Validates that the selected action is within the valid range.
 * @param {number} action - Raw action from RL agent
 * @returns {number} Validated action within bounds
 */
function validateAction(action) {
  if (isNaN(action) || action === undefined || action === null) {
    console.warn(`Invalid action: ${action}, defaulting to no-op (6)`);
    return 6; // Default to no-op
  }

  // Ensure action is within valid range [0, ACTION_SIZE-1]
  const clampedAction = Math.max(0, Math.min(ACTION_SIZE - 1, Math.floor(action)));

  if (clampedAction !== action) {
    console.warn(`Action ${action} out of bounds, clamped to ${clampedAction}`);
  }

  return clampedAction;
}

/**
 * Logs state statistics for debugging purposes.
 * Call this periodically to monitor state value distributions.
 * @param {number[]} state - The current state array
 */
function logStateStats(state) {
  const stateLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'Speed', 'Angle', 'X', 'Y'];
  const stateInfo = state.map((val, i) => `${stateLabels[i]}: ${val.toFixed(3)}`).join(', ');
  console.log(`State: [${stateInfo}]`);
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
  const action = validateAction(rawAction);
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
  }

  episodeReward += reward;
  episodeStep++;

  // Next state after action
  const nextState = getRLState(rlCar);
  const done = rlCar.damaged;

  // Log state statistics for debugging 
  // if (rlStepCount % 100 === 0) {
  //   logStateStats(state);
  // }

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

// Overlay stats on the canvas
function drawStats(ctx) {
  const rectWidth = 250; // Width of the stats rectangle
  const rectHeight = 110; // Height of the stats rectangle
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
  ctx.font = "18px monospace";
  // Show current action and epsilon on screen
  ctx.fillText(`Action: ${currentAction}, ε: ${rlAgent.epsilon.toFixed(3)}`, x + 10, y + 100);
  ctx.fillText(`Episode: ${episode}`, x + 10, y + 20);
  ctx.fillText(`Reward: ${episodeReward.toFixed(2)}`, x + 10, y + 40);
  ctx.fillText(`Steps: ${episodeStep}`, x + 10, y + 60);
  ctx.fillText(
    `Last: R=${lastEpisodeReward.toFixed(2)}, S=${lastEpisodeSteps}`,
    x + 10,
    y + 80
  );
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

animate();

function animate() {
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
