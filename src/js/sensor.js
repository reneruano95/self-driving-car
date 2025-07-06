/**
 * Represents a car's sensors that cast rays to detect obstacles or road boundaries.
 *
 * @class Sensor
 * @property {Car} car - The car that the sensor is attached to.
 * @property {number} rayCount - The number of rays to cast (default: 5).
 * @property {number} rayLength - The length of each ray (default: 100).
 * @property {number} raySpread - The angle spread of the rays in radians (default: Math.PI / 2).
 * @property {Array} rays - Array of rays, each represented by two points (start and end).
 * @property {Array} readings - Array of readings from the rays, representing intersections with road borders or traffic.
 *
 * @method update - Updates the rays and readings based on the car's position and angle.
 * @method #getReading - Finds the closest intersection point for a specific ray with road borders or traffic.
 * @method #castRays - Generates rays from the car's position at specified angles.
 * @method draw - Draws the rays and their intersections on the canvas.
 */
class Sensor {
  /**
   * Initializes a new instance of the `Sensor` class.
   *
   * @param {Car} car - The car that the sensor is attached to.
   */
  constructor(car) {
    this.car = car;
    this.rayCount = 5; // Number of rays to cast
    this.rayLength = 150; // Length of each ray
    this.raySpread = Math.PI / 2; // Spread angle of the rays

    this.rays = []; // Array to hold the rays
    this.readings = []; // Array to hold the readings from the rays
  }

  /**
   * Updates the rays and readings based on the car's position and angle.
   *
   * Casts rays from the car's position and calculates their intersections with road borders
   * and traffic. Stores the closest intersection for each ray in the `readings` array.
   *
   * @param {Array} roadBorders - Represents the road borders to check for intersections.
   * @param {Array} traffic - Represents other cars on the road for intersection detection.
   * @returns {void}
   */

  update(roadBorders, traffic) {
    this.#castRays(); // Cast the rays based on the car's position and angle
    this.readings = []; // Reset readings array
    for (let i = 0; i < this.rays.length; i++) {
      this.readings.push(this.#getReading(this.rays[i], roadBorders, traffic)); // Get the closest intersection for each ray
    }
  }

  /**
   * Finds the closest intersection point for a specific ray with road borders or traffic.
   *
   * @private
   * @param {Array} ray - The ray, represented by its start and end points.
   * @param {Array} roadBorders - An array of road borders, each defined by two points (start and end).
   * @param {Array} traffic - An array of other cars, each represented by a polygon.
   * @returns {Object|null} The closest intersection point, including its offset, or null if no intersection is found.
   */
  #getReading(ray, roadBorders, traffic) {
    let touches = []; // Array to hold the intersections with road borders
    for (let i = 0; i < roadBorders.length; i++) {
      const touch = getIntersection(
        ray[0],
        ray[1],
        roadBorders[i][0],
        roadBorders[i][1]
      );
      if (touch) {
        touches.push(touch); // Add intersection point if it exists
      }
    }

    for (let i = 0; i < traffic.length; i++) {
      const poly = traffic[i].polygon; // Get the polygon of the traffic car
      for (let j = 0; j < poly.length; j++) {
        const nextIndex = (j + 1) % poly.length; // Get the next index for the polygon
        const touch = getIntersection(ray[0], ray[1], poly[j], poly[nextIndex]);

        if (touch) {
          touches.push(touch); // Add intersection point if it exists
        }
      }
    }

    if (touches.length === 0) {
      return null; // No intersection found
    } else {
      // Find the closest intersection point
      const offsets = touches.map((e) => e.offset);
      const minOffset = Math.min(...offsets);
      return touches.find((e) => e.offset === minOffset); // Return the closest intersection
    }
  }

  /**
   * Generates rays from the car's position at specified angles for obstacle detection.
   *
   * Calculates the angles for each ray based on the car's orientation and the specified
   * rayCount, rayLength, and raySpread. Determines the start and end points of each ray
   * and stores them in the `rays` array.
   *
   * @private
   * @returns {void}
   */
  #castRays() {
    this.rays = []; // Reset rays array
    for (let i = 0; i < this.rayCount; i++) {
      const rayAngle =
        lerp(
          this.raySpread / 2,
          -this.raySpread / 2,
          this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)
        ) + this.car.angle; // Calculate the angle for each ray

      // Calculate the start point of the ray based on the car's position
      // The start point is the car's position, which is represented by its x and y coordinates
      const start = {
        x: this.car.x,
        y: this.car.y,
      };

      // Calculate the end point of the ray based on the car's position, angle, and ray length
      // The end point is calculated using trigonometric functions to determine the x and y coordinates
      const end = {
        x: this.car.x - Math.sin(rayAngle) * this.rayLength,
        y: this.car.y - Math.cos(rayAngle) * this.rayLength,
      };

      this.rays.push([start, end]); // Add the ray to the rays array
    }
  }

  /**
   * Draws the rays and their intersections on the canvas.
   *
   * Renders each ray from its start point to its intersection point (if any) or its end point.
   * Also highlights the intersection points on the canvas.
   *
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @returns {void}
   */
  draw(ctx) {
    for (let i = 0; i < this.rayCount; i++) {
      const ray = this.rays[i]; // Get the current ray
      let end = ray[1]; // Default end point of the ray

      if (this.readings[i]) {
        end = this.readings[i]; // If a reading exists, use it as the end point
      }

      ctx.beginPath(); // Start a new path for the ray
      ctx.lineWidth = 2; // Set the line width for the ray
      ctx.strokeStyle = "yellow"; // Set the stroke color for the ray

      ctx.moveTo(ray[0].x, ray[0].y); // Move to the start point of the ray
      ctx.lineTo(end.x, end.y); // Draw a line to the end point of the ray

      ctx.stroke(); // Render the ray on the canvas

      ctx.beginPath(); // Start a new path for the ray end point
      ctx.lineWidth = 2; // Set the line width for the ray end point
      ctx.strokeStyle = "black"; // Set the stroke color for the ray end point
      ctx.moveTo(ray[1].x, ray[1].y); // Move to the start point of the ray
      ctx.lineTo(end.x, end.y); // Draw a line to the end point of the ray
      ctx.stroke(); // Render the end point circle on the canvas
    }
  }
}
