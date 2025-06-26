/**
 * Manages keyboard inputs for car movement.
 * Listens for key events and updates the state of the car's controls.
 *
 * @class Controls
 * @property {boolean} forward - Indicates if the forward key is pressed (default: false).
 * @property {boolean} left - Indicates if the left key is pressed (default: false).
 * @property {boolean} right - Indicates if the right key is pressed (default: false).
 * @property {boolean} reverse - Indicates if the reverse key is pressed (default: false).
 *
 * @method #addKeyboardListeners - Adds event listeners for keyboard inputs to update control states.
 */

class Controls {
  constructor() {
    this.forward = false;
    this.left = false;
    this.right = false;
    this.reverse = false;

    this.#addKeyboardListeners();
  }

  /**
   * Adds keyboard listeners to control the car's movement.
   * This method listens for keydown and keyup events to update the control states.
   * @returns {void}
   * */

  #addKeyboardListeners() {
    document.onkeydown = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.left = true;
          break;
        case "ArrowRight":
          this.right = true;
          break;
        case "ArrowUp":
          this.forward = true;
          break;
        case "ArrowDown":
          this.reverse = true;
          break;
      }
      //   console.table(this);
    };

    document.onkeyup = (e) => {
      switch (e.key) {
        case "ArrowLeft":
          this.left = false;
          break;
        case "ArrowRight":
          this.right = false;
          break;
        case "ArrowUp":
          this.forward = false;
          break;
        case "ArrowDown":
          this.reverse = false;
          break;
      }
      //   console.table(this);
    };
  }
}
