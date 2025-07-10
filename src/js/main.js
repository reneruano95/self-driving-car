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
  const sensorReadings = car.sensor
    ? car.sensor.readings.map((s) => (s === null ? 0 : 1 - s.offset))
    : Array(5).fill(0);
  return [...sensorReadings, car.speed];
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
  } else if (rlCar.speed > 0.1) {
    reward = 1;
  } else {
    reward = -0.01;
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
  const rectWidth = 230;
  const rectHeight = 90;
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
  for (let i = 0; i < 50; i++) {
    const lane = i % lanes;
    const y = trafficStartY - i * trafficSpacing;
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
