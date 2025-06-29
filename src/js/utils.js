/**
 * Performs linear interpolation between two values.
 *
 * @param {number} A - The starting value.
 * @param {number} B - The ending value.
 * @param {number} t - The interpolation factor (0 to 1).
 * @returns {number} The interpolated value.
 * @example
 * const result = lerp(0, 10, 0.5); // Returns 5
 */
function lerp(A, B, t) {
  return A + (B - A) * t; // Linear interpolation between A and B based on t
}

/**
 * Calculates the intersection point of two line segments.
 *
 * @param {Object} A - The first point of the first line segment ({x, y}).
 * @param {Object} B - The second point of the first line segment ({x, y}).
 * @param {Object} C - The first point of the second line segment ({x, y}).
 * @param {Object} D - The second point of the second line segment ({x, y}).
 * @returns {Object|null} The intersection point ({x, y, offset}) or null if no intersection exists.
 * @example
 * const intersection = getIntersection({x: 0, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}, {x: 10, y: 0});
 * // Returns {x: 5, y: 5, offset: 0.5}
 */
function getIntersection(A, B, C, D) {
  const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
  const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
  const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

  if (bottom !== 0) {
    const t = tTop / bottom;
    const u = uTop / bottom;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: lerp(A.x, B.x, t),
        y: lerp(A.y, B.y, t),
        offset: t,
      }; // Return intersection point and offset
    }
  }
}
