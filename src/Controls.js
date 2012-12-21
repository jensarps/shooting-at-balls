define(function(){

  var _i = 0;

  var Controls = function(object, input){
    this.object = object;
    this.object.useQuaternion = true;
    this.input = input;

    this.quaternion = new THREE.Quaternion();


    this._rollTotal = 0;
    this._yawTotal = 0;
    this._pitchTotal = 0;
  };

  Controls.prototype = {

    input: null,

    object: null,

    speed: 0,

    thrust: 0,

    roll: 0,

    pitch: 0,

    quaternion: null,

    update: function(delta){

      var factor = delta / 16,
          speed = this.speed,
          thrust = this.thrust,
          input = this.input,
          object = this.object;

      thrust += (input.accelerate - input.decelerate) / 20;
      thrust = THREE.Math.clamp(thrust, 1, 10);

      var breakingForce = ( object.position.y + 50 ) / 200;
      var relThrust = THREE.Math.clamp(thrust - breakingForce, 1, 10);

      speed += THREE.Math.clamp(relThrust - speed, -0.04, 0.02);

      var speedMultiplier = speed / 20 + 0.5;

      if (input.boost) {
        speed *= 1.5;
      }

      this.speed = speed;
      this.thrust = thrust;

      object.translateZ(-speed * factor);

      var pitch = (input.pitch / 150) * speedMultiplier;
      var roll = (input.roll / 100) * speedMultiplier;
      var yaw = (input.yawLeft - input.yawRight) / 1000;

      //pitch += Math.abs(object.quaternion.z) * 0.01;
      //yaw += object.quaternion.z * 0.002;

      yaw = THREE.Math.clamp(yaw, -0.0015, 0.0015);
      pitch = THREE.Math.clamp(pitch, -0.005, 0.005);

/*
      this._rollTotal += roll * factor;
      this._pitchTotal += pitch * factor;
      this._yawTotal += yaw * factor;

      var _rollFactor = Math.PI - 0.007;
      this._rollDegrees = ( ( this._rollTotal % _rollFactor ) / _rollFactor ) * 360;
*/

      this.quaternion.set(pitch * factor, yaw * factor, roll * factor, 1).normalize();
      object.quaternion.multiplySelf(this.quaternion);

      object.matrixWorldNeedsUpdate = true;
    }
  };

  return Controls;
});
