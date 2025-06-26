const canvas = document.getElementById("myCanvas");
canvas.width = 200;

const ctx = canvas.getContext("2d");

const road = new Road(canvas.width / 2, canvas.width * 0.9);
const car = new Car(road.getLaneCenter(2), 100, 30, 50);

animate();

function animate() {
  car.update(road.borders);

  canvas.height = window.innerHeight;

  ctx.save(); // Save the current state of the canvas
  ctx.translate(0, -car.y + canvas.height * 0.7); // Center the road on the car

  road.draw(ctx); // Draw the road
  car.draw(ctx); // Draw the car

  ctx.restore();
  requestAnimationFrame(animate);
}
