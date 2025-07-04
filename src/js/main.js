const canvas = document.getElementById("myCanvas");
canvas.width = 200;

const ctx = canvas.getContext("2d");

const road = new Road(canvas.width / 2, canvas.width * 0.9);
const car = new Car(road.getLaneCenter(2), 100, 30, 50, "KEYS");
const traffic = [new Car(road.getLaneCenter(1), -100, 30, 50, "DUMMY", 2)];

animate();

function animate() {
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []); // Update each traffic car
  }
  car.update(road.borders, traffic);

  canvas.height = window.innerHeight;

  ctx.save(); // Save the current state of the canvas
  ctx.translate(0, -car.y + canvas.height * 0.7); // Center the road on the car

  road.draw(ctx); // Draw the road
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(ctx, "red"); // Draw each traffic car
  }
  car.draw(ctx, "blue"); // Draw the car

  ctx.restore();
  requestAnimationFrame(animate);
}
