class Car {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 0;
    this.acceleration = 0.2;
    this.maxSpeed = 3;
    this.friction = 0.05;
    this.angle = 0;

    this.controls = new Controls();
  }

  update() {
    if (this.controls.forward) {
      this.speed += this.acceleration; // Accelerate
    }

    if (this.controls.reverse) {
      this.speed -= this.acceleration; // Decelerate
    }

    if (this.speed > this.maxSpeed) {
      this.speed = this.maxSpeed; // Cap speed
    }

    if (this.speed < -this.maxSpeed / 2) {
      this.speed = -this.maxSpeed / 2; // Cap reverse speed
    }

    if (this.speed > 0) {
      this.speed -= this.friction; // Apply friction when moving forward
    }

    if (this.speed < 0) {
      this.speed += this.friction; // Apply friction when moving in reverse
    }

    if (Math.abs(this.speed) < this.friction) {
      this.speed = 0; // Stop if speed is less than friction
    }

    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1; // Determine direction of movement

      if (this.controls.left) {
        this.angle += 0.03 * flip; // Move left based on speed
      }

      if (this.controls.right) {
        this.angle -= 0.03 * flip; // Move right based on speed
      }
    }

    this.x -= Math.sin(this.angle) * this.speed; // Move left or right based on angle and speed
    this.y -= Math.cos(this.angle) * this.speed; // Move up or down based on angle and speed
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(-this.angle);

    ctx.beginPath();
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fill();

    ctx.restore();
  }
}
