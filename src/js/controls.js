/**
 * Manages keyboard inputs for car movement.
 * Listens for key events and updates the state of the car's controls.
 *
 * @class Controls
 * @property {boolean} forward - Indicates if the forward key is pressed (default: false).
 * @property {boolean} left - Indicates if the left key is pressed (default: false).
 * @property {boolean} right - Indicates if the right key is pressed (default: false).
 * @property {boolean} reverse - Indicates if the reverse key is pressed (default: false).
 * @param {string} controlType - Specifies the type of control.
 *                                Accepts "KEYS" for keyboard input or "DUMMY" for default forward movement.
 */
class Controls {
  /**
   * Initializes the control states and sets up listeners based on the control type.
   * @param {string} controlType - The type of control ("KEYS" or "DUMMY").
   */
  constructor(controlType) {
    this.forward = false;
    this.left = false;
    this.right = false;
    this.reverse = false;

    switch (controlType) {
      case "KEYS":
        this.#addKeyboardListeners();
        break;
      case "DUMMY":
        this.forward = true;
        break;
    }
  }

  /**
   * Adds keyboard listeners to control the car's movement.
   * This private method listens for `keydown` and `keyup` events to update the control states.
   * Supported keys:
   * - ArrowLeft: Moves the car left.
   * - ArrowRight: Moves the car right.
   * - ArrowUp: Moves the car forward.
   * - ArrowDown: Moves the car in reverse.
   * @private
   * @returns {void} This method does not return a value.
   */
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
