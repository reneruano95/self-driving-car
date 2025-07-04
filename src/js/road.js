/**
 * Represents a road with multiple lanes for the self-driving car simulation.
 * Provides methods to calculate lane centers and draw the road with lane markings.
 * The road's borders are used for collision detection.
 *
 * @class Road
 * @property {number} x - The x-coordinate of the center of the road.
 * @property {number} width - The total width of the road.
 * @property {number} laneCount - The number of lanes on the road (default: 3).
 * @property {number} left - The x-coordinate of the left edge of the road.
 * @property {number} right - The x-coordinate of the right edge of the road.
 * @property {number} top - The y-coordinate of the top edge of the road.
 * @property {number} bottom - The y-coordinate of the bottom edge of the road.
 * @property {Array} borders - An array of road borders, each represented by two points (top and bottom).
 */
class Road {
  /**
   * Initializes the road with its position, width, and number of lanes.
   * @param {number} x - The x-coordinate of the center of the road.
   * @param {number} width - The total width of the road.
   * @param {number} [laneCount=3] - The number of lanes on the road.
   */
  constructor(x, width, laneCount = 3) {
    this.x = x;
    this.width = width;
    this.laneCount = laneCount;

    this.left = x - width / 2; // Left edge of the road
    this.right = x + width / 2; // Right edge of the road

    const infinity = 1000000; // Large value for drawing lines
    this.top = -infinity; // Top edge of the road
    this.bottom = infinity; // Bottom edge of the road

    const topLeft = { x: this.left, y: this.top }; // Top left corner
    const topRight = { x: this.right, y: this.top }; // Top right corner
    const bottomLeft = { x: this.left, y: this.bottom }; // Bottom left
    const bottomRight = { x: this.right, y: this.bottom }; // Bottom right

    // Borders of the road represented as pairs of points
    // Each border is an array of two points (top and bottom)
    this.borders = [
      [topLeft, bottomLeft], // Left border
      [topRight, bottomRight], // Right border
    ];
  }

  /**
   * Calculates the center of a specific lane.
   * Ensures the lane index does not exceed the number of lanes.
   * @param {number} laneIndex - The index of the lane (0-based).
   * @returns {number} The x-coordinate of the center of the specified lane.
   */
  getLaneCenter(laneIndex) {
    const laneWidth = this.width / this.laneCount; // Width of each lane
    return (
      this.left +
      laneWidth / 2 +
      Math.min(laneIndex, this.laneCount - 1) * laneWidth
    ); // Center of the specified lane
  }

  /**
   * Draws the road and its lane markings on the canvas.
   * Uses dashed lines for lane markings and solid lines for road borders.
   * @param {CanvasRenderingContext2D} ctx - The canvas rendering context.
   * @returns {void} This method does not return a value.
   */
  draw(ctx) {
    ctx.lineWidth = 5;
    ctx.strokeStyle = "white";

    // Draw the lane lines
    for (let i = 1; i <= this.laneCount - 1; i++) {
      const x = lerp(this.left, this.right, i / this.laneCount);

      if (i > 0 && i < this.laneCount) {
        ctx.setLineDash([20, 20]); // Dashed line for lane markings
      } else {
        ctx.setLineDash([]); // Solid line for road edges
      }
      ctx.beginPath();
      ctx.moveTo(x, this.top);
      ctx.lineTo(x, this.bottom);
      ctx.stroke();
    }

    ctx.setLineDash([]); // Reset line dash for solid lines
    // Draw the road borders
    this.borders.forEach((border) => {
      ctx.beginPath();
      ctx.moveTo(border[0].x, border[0].y);
      ctx.lineTo(border[1].x, border[1].y);
      ctx.stroke();
    });
  }
}
