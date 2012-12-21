define([], function () {

  var RadarDetector = function (camera) {
    this.camera = camera;

    this.forward = new THREE.Vector3(0, 0, -1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.right = new THREE.Vector3();

    this.forwardVec = new THREE.Vector3(0, 0, -1);
    this.upVec = new THREE.Vector3(0, 1, 0);

    this.targetVector = new THREE.Vector3();

  };

  RadarDetector.prototype = {

    detect: function(targetObj){

      var camera = this.camera;

      // set Forward, Right and Up plane vectors
      camera.quaternion.multiplyVector3(this.forwardVec, this.forward).normalize();
      camera.quaternion.multiplyVector3(this.upVec, this.up).normalize();
      this.right.cross(this.forward, this.up).normalize();


      var targetVector = this.targetVector;
      targetVector.sub(targetObj.position, camera.position).normalize();

      var isInFront = targetVector.dot(this.forward) > 0;

      var projScalar = targetVector.dot(this.forward) / this.forward.lengthSq();
      targetVector.subSelf(this.forward.clone().multiplyScalar(projScalar)); // Can we somehow get rid of having to clone here?

      var left = ( targetVector.dot(this.right) / -this.right.lengthSq() ) * -100;
      var top = ( targetVector.dot(this.up) / this.up.lengthSq() ) * -100;

      targetObj.radarLeft = left;
      targetObj.isInFront = isInFront;

    }
  };

  return RadarDetector;

});
