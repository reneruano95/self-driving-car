const STATE_SIZE = 9; // 5 sensor rays + speed + angle + normalized x position + normalized y position
const ACTION_SIZE = 7; // [forward, left, right, reverse]

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

for (let i = 0; i < 50; i++) {
  const lane = i % lanes; // Cycle through lanes consistently
  const y = trafficStartY - i * trafficSpacing; // Staggered Y positions
  traffic.push(new Car(road.getLaneCenter(lane), y, 30, 50, "DUMMY", 2));
}

// RL Agent integration (for one car as a demo)
let rlAgent;
let rlCar;

function setupRLCar() {
  rlAgent = new RLAgent(STATE_SIZE, ACTION_SIZE);
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
  const yNorm = car.y / 1000; // Normalize y (assuming 1000 is a reasonable road length scale)
  return [...sensorReadings, car.speed, angle, xNorm, yNorm];
}

let rlStepCount = 0;
// RL episode/learning stats
let episode = 1;
let episodeReward = 0;
let episodeStep = 0;
let lastEpisodeReward = 0;
let lastEpisodeSteps = 0;

function stepRLCar() {
  const state = getRLState(rlCar);
  const action = rlAgent.selectAction(state);
  // Improved action mapping: allow combinations
  rlCar.controls.forward = action === 0 || action === 1 || action === 2;
  rlCar.controls.left = action === 1 || action === 4;
  rlCar.controls.right = action === 2 || action === 5;
  rlCar.controls.reverse = action === 3;

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
    if (rlCar.speed > 0.1) {
      reward += 2;
    } else {
      reward -= 0.5; // Penalize for being too slow
    }
    // Bonus for staying near lane center
    const laneCenter = road.getLaneCenter(0);
    const laneWidth = road.right - road.left;
    const distFromCenter = Math.abs(rlCar.x - laneCenter) / laneWidth;
    reward += 0.5 * (1 - distFromCenter); // Max bonus at center, less as it deviates
  }

  episodeReward += reward;
  episodeStep++;

  // Next state after action
  const nextState = getRLState(rlCar);
  const done = rlCar.damaged;
  rlAgent.storeExperience(state, action, reward, nextState, done);
  rlAgent.learn();
  rlStepCount++;
  if (rlStepCount % 50 === 0) {
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
  const rectHeight = 90; // Height of the stats rectangle
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
  for (let i = 0; i < 50; i++) {
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
