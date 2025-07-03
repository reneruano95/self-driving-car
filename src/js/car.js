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
 * @property {boolean} damaged - Indicates if the car is damaged (default: false).
 * @property {Sensor} sensor - The sensor for detecting obstacles or road boundaries.
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
    this.damaged = false; // Indicates if the car is damaged

    this.sensor = new Sensor(this); // Initialize the sensor for the car
    this.controls = new Controls(); // Initialize the controls for the car
  }

  /**
   * Updates the car's state, including its position, shape, and collision status.
   *
   * Checks if the car is damaged, moves the car based on controls, creates a polygon
   * representing the car's shape, and assesses collisions with road borders. Also updates
   * the sensor rays based on the car's position and angle.
   *
   * @param {Array} roadBorders - Represents the road borders to check for collisions.
   * @returns {void}
   */
  update(roadBorders) {
    if (!this.damaged) {
      this.#move(); // Move the car based on controls
      this.polygon = this.#createPolygon(); // Create the polygon representing the car's shape
      this.damaged = this.#assessDamage(roadBorders); // Check if the car is damaged by road borders
      this.sensor.update(roadBorders); // Update the sensor rays based on the car's position and angle
    }
  }

  /**
   * Checks if the car is damaged based on its collision with road borders.
   * @private
   * @param {Array} roadBorders - The road borders to check for collisions.
   * @returns {boolean} True if the car is damaged, false otherwise.
   * */
  #assessDamage(roadBorders) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true; // Car is damaged if it collides with any road border
      }
    }
    return false; // Car is not damaged if no collisions are detected
  }

  /**
   * Creates a polygon representing the car's shape based on its position, angle, width, and height.
   * @private
   * @returns {Array} An array of points representing the car's polygon.
   */
  #createPolygon() {
    const points = [];
    const rad = Math.hypot(this.width, this.height) / 2; // Calculate the radius of the car
    const alpha = Math.atan2(this.width, this.height); // Calculate the angle of the car

    points.push({
      x: this.x - Math.sin(this.angle - alpha) * rad,
      y: this.y - Math.cos(this.angle - alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(this.angle + alpha) * rad,
      y: this.y - Math.cos(this.angle + alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
    });
    points.push({
      x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
      y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
    });
    return points;
  }

  /**
   * Moves the car based on its speed, angle, and controls.
   * This method adjusts the car's speed, applies friction, and updates its position.
   * @private
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
    if (this.damaged) {
      ctx.fillStyle = "red"; // Set color to red if the car is damaged
    } else {
      ctx.fillStyle = "black"; // Set color to black if the car is not damaged
    }

    ctx.beginPath(); // Start a new path for the car
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y); // Move to the first point of the polygon
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y); // Draw lines to the other points
    }
    ctx.fill(); // Fill the car shape

    this.sensor.draw(ctx); // Draw the sensor rays
  }
}
