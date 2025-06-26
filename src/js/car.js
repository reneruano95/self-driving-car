/**
 * Represents a car in a 2D space.
 * Handles the car's position, speed, acceleration, and controls.
 *
 * @class Car
 * @property {number} x - The x-coordinate of the car's position.
 * @property {number} y - The y-coordinate of the car's position.
 * @property {number} width - The width of the car.
 * @property {number} height - The height of the car.
 * @property {number} speed - The current speed of the car (default: 0).
 * @property {number} acceleration - The rate at which the car accelerates (default: 0.2).
 * @property {number} maxSpeed - The maximum speed the car can reach (default: 3).
 * @property {number} friction - The friction applied to the car's speed (default: 0.05).
 * @property {number} angle - The angle of the car's orientation (default: 0).
 * @property {Controls} controls - The controls for the car's movement.
 *
 * @method update - Updates the car's position and speed based on controls.
 * @method draw - Draws the car on the canvas at its current position and angle.
 * @method #move - Adjusts the car's speed, applies friction, and updates its position.
 */
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

  /**
   * Updates the car's position and speed based on controls.
   * This method is called in each animation frame to update the car's state.
   * @returns {void}
   * */
  // The update method is responsible for moving the car based on the current controls.
  update() {
    this.#move(); // Move the car based on controls
  }

  /** * Moves the car based on its speed, angle, and controls.
   * This method adjusts the car's speed, applies friction, and updates its position.
   * @returns {void}
   * */
  #move() {
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
    this.y -= Math.cos(this.angle) * this.speed;
  }

  /**
   * Draws the car on the canvas.
   * This method uses the canvas context to render the car at its current position and angle.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @returns {void}
   * */
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
