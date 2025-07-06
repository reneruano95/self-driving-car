/**
 * Represents a car in a 2D space.
 * Handles the car's position, speed, acceleration, controls, and collision detection.
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
 * @property {number} angle - The angle of the car's orientation in radians (default: 0).
 * @property {boolean} damaged - Indicates if the car is damaged (default: false).
 * @property {Sensor} [sensor] - The sensor for detecting obstacles or road boundaries (optional).
 * @property {Controls} controls - The controls for the car's movement.
 *
 * @method update - Updates the car's state, including its position, shape, and collision status.
 * @method #assessDamage - Determines if the car is damaged by collisions with road borders or other cars.
 * @method #createPolygon - Creates a polygon representing the car's shape based on its position, angle, width, and height.
 * @method draw - Draws the car on the canvas at its current position and angle.
 * @method #move - Adjusts the car's speed, applies friction, and updates its position.
 */
class Car {
  /**
   * Initializes a new instance of the `Car` class.
   *
   * @param {number} x - The initial x-coordinate of the car.
   * @param {number} y - The initial y-coordinate of the car.
   * @param {number} width - The width of the car.
   * @param {number} height - The height of the car.
   * @param {string} controlType - The type of controls for the car (e.g., "DUMMY", "PLAYER").
   * @param {number} [maxSpeed=3] - The maximum speed the car can reach.
   */
  constructor(x, y, width, height, controlType, maxSpeed = 3) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.speed = 0; // Current speed of the car
    this.acceleration = 0.2; // Rate of acceleration
    this.maxSpeed = maxSpeed; // Maximum speed the car can reach
    this.friction = 0.05; // Friction applied to the car's speed
    this.angle = 0; // Angle of the car's orientation in radians
    this.damaged = false; // Indicates if the car is damaged

    this.useBrain = controlType === "AI"; // Use a neural network for AI control

    if (controlType !== "DUMMY") {
      this.sensor = new Sensor(this); // Initialize the sensor for the car

      this.brain = new NeuralNetwork([
        this.sensor.rayCount, // Number of rays in the sensor
        6, // Hidden layer with 6 neurons
        4, // Hidden layer with 4 neurons
      ]); // Initialize the neural network for the car
    }
    this.controls = new Controls(controlType); // Initialize the controls for the car
  }

  /**
   * Updates the car's state, including its position, shape, and collision status.
   *
   * Moves the car based on its controls, creates a polygon representing its shape,
   * and checks for collisions with road borders and other cars. Also updates the
   * sensor rays if the car has a sensor.
   *
   * @param {Array} roadBorders - Represents the road borders to check for collisions.
   * @param {Array} traffic - Represents other cars on the road for collision detection.
   * @returns {void}
   */
  update(roadBorders, traffic) {
    if (!this.damaged) {
      this.#move(); // Move the car based on controls
      this.polygon = this.#createPolygon(); // Create the polygon representing the car's shape
      this.damaged = this.#assessDamage(roadBorders, traffic); // Check if the car is damaged by road borders
    }
    if (this.sensor) {
      this.sensor.update(roadBorders, traffic); // Update the sensor rays based on the car's position and angle

      const offsets = this.sensor.readings.map((s) =>
        s === null ? 0 : 1 - s.offset
      ); // Get sensor readings

      const outputs = NeuralNetwork.feedForward(offsets, this.brain); // Feed the sensor readings into the neural network
      // console.log(outputs); // Log the outputs of the neural network

      if (this.useBrain) {
        this.controls.forward = outputs[0]; // Set forward control based on neural network output
        this.controls.left = outputs[1]; // Set left control based on neural network output
        this.controls.right = outputs[2]; // Set right control based on neural network output
        this.controls.reverse = outputs[3]; // Set reverse control based on neural network output
      }
    }
  }

  /**
   * Determines if the car is damaged by checking for collisions with road borders and other cars.
   *
   * @private
   * @param {Array} roadBorders - Represents the road borders to check for collisions.
   * @param {Array} traffic - Represents other cars on the road for collision detection.
   * @returns {boolean} True if the car is damaged, false otherwise.
   */
  #assessDamage(roadBorders, traffic) {
    for (let i = 0; i < roadBorders.length; i++) {
      if (polysIntersect(this.polygon, roadBorders[i])) {
        return true; // Car is damaged if it collides with any road border
      }
    }
    for (let i = 0; i < traffic.length; i++) {
      if (polysIntersect(this.polygon, traffic[i].polygon)) {
        return true; // Car is damaged if it collides with any other car
      }
    }
    return false; // Car is not damaged if no collisions are detected
  }

  /**
   * Creates a polygon representing the car's shape based on its position, angle, width, and height.
   *
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
   *
   * Adjusts the car's speed, applies friction, and updates its position.
   *
   * @private
   * @returns {void}
   */
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
   * Draws the car on the canvas at its current position and angle.
   *
   * If the car is damaged, it is drawn in gray. Otherwise, it is drawn in the specified color.
   * Also draws the sensor rays if the car has a sensor.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @param {string} [color="black"] - The color to fill the car shape with (default: "black").
   * @param {boolean} [drawSensor=false] - Whether to draw the sensor rays (default: false).
   * @returns {void}
   */
  draw(ctx, color, drawSensor = false) {
    if (this.damaged) {
      ctx.fillStyle = "gray"; // Set color to gray if the car is damaged
    } else {
      ctx.fillStyle = color; // Set color to the provided color if the car is not damaged
    }

    ctx.beginPath(); // Start a new path for the car
    ctx.moveTo(this.polygon[0].x, this.polygon[0].y); // Move to the first point of the polygon
    for (let i = 1; i < this.polygon.length; i++) {
      ctx.lineTo(this.polygon[i].x, this.polygon[i].y); // Draw lines to the other points
    }
    ctx.fill(); // Fill the car shape
    if (this.sensor && drawSensor) {
      this.sensor.draw(ctx); // Draw the sensor rays if the sensor exists
    }
  }
}
