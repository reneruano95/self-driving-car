/**
 * Performance monitoring utility for the self-driving car simulation
 * Tracks FPS, memory usage, and AI performance metrics
 */
class PerformanceMonitor {
  constructor() {
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fpsHistory = [];
    this.maxHistoryLength = 60; // Keep 60 frames of history
    
    this.aiMetrics = {
      rlRewardHistory: [],
      nnDistanceHistory: [],
      learningRate: 0
    };
  }

  /**
   * Update FPS counter - call this every frame
   */
  update() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) { // Update every second
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.fpsHistory.push(this.fps);
      
      if (this.fpsHistory.length > this.maxHistoryLength) {
        this.fpsHistory.shift();
      }
      
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Get average FPS over recent history
   */
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 0;
    return Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);
  }

  /**
   * Track AI performance metrics
   */
  trackAIMetrics(mode, value) {
    if (mode === 'RL') {
      this.aiMetrics.rlRewardHistory.push(value);
      if (this.aiMetrics.rlRewardHistory.length > 100) {
        this.aiMetrics.rlRewardHistory.shift();
      }
    } else if (mode === 'NN') {
      this.aiMetrics.nnDistanceHistory.push(value);
      if (this.aiMetrics.nnDistanceHistory.length > 100) {
        this.aiMetrics.nnDistanceHistory.shift();
      }
    }
  }

  /**
   * Draw performance overlay on canvas
   */
  drawOverlay(ctx, x = 10, y = 10) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 200, 100);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${this.fps} (avg: ${this.getAverageFPS()})`, x + 5, y + 20);
    
    // Memory usage (if available)
    if (performance.memory) {
      const memUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
      ctx.fillText(`Memory: ${memUsed}MB`, x + 5, y + 40);
    }
    
    ctx.fillText(`Frame: ${this.frameCount}`, x + 5, y + 60);
    ctx.restore();
  }

  /**
   * Get performance report
   */
  getReport() {
    return {
      currentFPS: this.fps,
      averageFPS: this.getAverageFPS(),
      fpsHistory: [...this.fpsHistory],
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      } : null,
      aiMetrics: { ...this.aiMetrics }
    };
  }
}
