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

/**
 * Validates and clamps state values to ensure they are within expected bounds.
 * This prevents the RL agent from receiving invalid or extreme values.
 * @param {number[]} state - Raw state array
 * @param {number} STATE_SIZE - Expected size of the state array
 * @returns {number[]} Validated and clamped state array
 */
function validateState(state, STATE_SIZE) {
    const validatedState = state.map((value, index) => {
        // Handle NaN or undefined values
        if (isNaN(value) || value === undefined || value === null) {
            console.warn(`Invalid state value at index ${index}: ${value}, setting to 0`);
            return 0;
        }

        // Define bounds for different state components
        if (index < 5) {
            // Sensor readings: should be between 0 and 1
            return Math.max(0, Math.min(1, value));
        } else if (index === 5) {
            // Speed: clamp to reasonable range (0 to 1) - now normalized
            return Math.max(0, Math.min(1, value));
        } else if (index === 6) {
            // Angle: should be between -1 and 1 (normalized by PI)
            return Math.max(-1, Math.min(1, value));
        } else if (index === 7) {
            // X position: should be between 0 and 1 (normalized by road width)
            return Math.max(-0.5, Math.min(1.5, value)); // Allow some overshoot for off-road scenarios
        } else if (index === 8) {
            // Y position: allow negative values but clamp extremes
            return Math.max(-2, Math.min(2, value));
        }

        // Default: clamp to [-1, 1] for any other values
        return Math.max(-1, Math.min(1, value));
    });

    // Additional validation: ensure state has correct length
    if (validatedState.length !== STATE_SIZE) {
        console.error(`State validation error: expected ${STATE_SIZE} elements, got ${validatedState.length}`);
        // Pad with zeros or truncate as needed
        while (validatedState.length < STATE_SIZE) {
            validatedState.push(0);
        }
        validatedState.length = STATE_SIZE;
    }

    return validatedState;
}

/**
 * Validates that the selected action is within the valid range.
 * @param {number} action - Raw action from RL agent
 * @param {number} ACTION_SIZE - Total number of valid actions
 * @returns {number} Validated action within bounds
 */
function validateAction(action, ACTION_SIZE) {
    if (isNaN(action) || action === undefined || action === null) {
        console.warn(`Invalid action: ${action}, defaulting to no-op (6)`);
        return 6; // Default to no-op
    }

    // Ensure action is within valid range [0, ACTION_SIZE-1]
    const clampedAction = Math.max(0, Math.min(ACTION_SIZE - 1, Math.floor(action)));

    if (clampedAction !== action) {
        console.warn(`Action ${action} out of bounds, clamped to ${clampedAction}`);
    }

    return clampedAction;
}

/**
 * Logs state statistics for debugging purposes.
 * Call this periodically to monitor state value distributions.
 * @param {number[]} state - The current state array
 */
function logStateStats(state) {
    const stateLabels = ['S1', 'S2', 'S3', 'S4', 'S5', 'Speed', 'Angle', 'X', 'Y'];
    const stateInfo = state.map((val, i) => `${stateLabels[i]}: ${val.toFixed(3)}`).join(', ');
    console.log(`State: [${stateInfo}]`);
}
