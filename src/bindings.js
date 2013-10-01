define(function () {

  var KEYBOARD = 'keyboard',
      MOUSE = 'mouse',
      GAMEPAD = 'gamepad';

  var bindings = {

    accelerate: [
      {
        device: KEYBOARD,
        inputId: 87, // w
        down: true,
        up: true
      },
      {
        device: GAMEPAD,
        inputId: 'button-3', // 'Y'
        down: true,
        up: true
      }
    ],

    decelerate: [
      {
        device: KEYBOARD,
        inputId: 83, // s
        down: true,
        up: true
      },
      {
        device: GAMEPAD,
        inputId: 'button-0', // 'A'
        down: true,
        up: true
      }
    ],

    cannon: [
      {
        device: MOUSE,
        inputId: 0,
        down: true,
        up: true
      },
      {
        device: GAMEPAD,
        inputId: 'button-1', // B
        down: true,
        up: true
      }
    ],

    pitch: [
      {
        device: MOUSE,
        inputId: 'y',
        invert: true
      },
      {
        device: GAMEPAD,
        inputId: 'axis-1'
      }
    ],

    roll: [
      {
        device: MOUSE,
        inputId: 'x'
      },
      {
        device: GAMEPAD,
        inputId: 'axis-0',
        invert: true
      }
    ],

    yawLeft: [
      {
        device: KEYBOARD,
        inputId: 65, // a
        down: true,
        up: true
      },
      {
        device: GAMEPAD,
        inputId: 'button-6', // left shoulder
        down: true,
        up: true
      }
    ],

    yawRight: [
      {
        device: KEYBOARD,
        inputId: 68, // d
        down: true,
        up: true
      },
      {
        device: GAMEPAD,
        inputId: 'button-7', // right shoulder
        down: true,
        up: true
      }
    ],

    togglePause: {
      device: KEYBOARD,
      inputId: 80, // p
      down: true,
      up: false
    }
  };

  return bindings;
});
