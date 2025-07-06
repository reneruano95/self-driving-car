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

  bestCar = cars.find((c) => c.y === Math.min(...cars.map((c) => c.y))); // Find the best AI car based on y position

  // bestCar = cars.reduce(
  //   (prev, curr) => (curr.y < prev.y ? curr : prev),
  //   cars[0]
  // ); // Find the car with the minimum y value

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCanvasContext.save(); // Save the current state of the canvas
  carCanvasContext.translate(0, -bestCar.y + carCanvas.height * 0.7);

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

  carCanvasContext.restore();

  networkCanvasContext.lineDashOffset = -time / 50; // Animate the line dash offset for the neural network visualization
  Visualizer.drawNetwork(networkCanvasContext, bestCar.brain); // Draw the neural network
  requestAnimationFrame(animate);
}
