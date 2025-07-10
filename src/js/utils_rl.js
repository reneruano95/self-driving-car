// utils_rl.js
// Utility functions for reinforcement learning in the self-driving car project

/**
 * Calculates a bonus for staying near the closest lane center.
 * @param {Object} car - The car object with an x property.
 * @param {Object} road - The road object with laneCount, getLaneCenter, left, and right properties.
 * @returns {number} The lane center bonus (max 0.5, min 0).
 */
function laneCenterBonus(car, road) {
    let minDist = Infinity;
    for (let i = 0; i < road.laneCount; i++) {
        const center = road.getLaneCenter(i);
        const dist = Math.abs(car.x - center);
        if (dist < minDist) minDist = dist;
    }
    const laneWidth = road.right - road.left;
    const distFromAnyLane = minDist / laneWidth;
    return 0.5 * (1 - Math.min(distFromAnyLane, 1));
}
