define([
  'src/terrainGenerator'
], function (terrainGenerator) {

  var Cannon = function (camera, scene, input, audioContext, audioBuffer) {
    this.camera = camera;
    this.scene = scene;

    this.input = input;

    this.audioContext = audioContext;
    this.audioBuffer = audioBuffer;

    this.vector = new THREE.Vector3();
    this.projector = new THREE.Projector();

    this.geometry = new THREE.SphereGeometry(1);
    //this.material = new THREE.MeshLambertMaterial({ color: 0 });
    this.material = new THREE.MeshPhongMaterial({ color: 0x396FA3 });
    //396FA3
    //0xC0C040
    //this.material = new THREE.MeshBasicMaterial({ color: 0 });

    this.bullets = [];
    this.bulletPool = [];

    this.ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(), 0, this.speed);

    this.initBulletPool();

    this.setTargets([]);
  };

  Cannon.prototype = {

    bullets: null,

    bulletPool: null,

    bulletsFired: 0,

    poolSize: 50,

    camera: null,

    counter: 0,

    geometry: null,

    input: null,

    interval: 100,

    material: null,

    maxLifetime: 5000,

    projector: null,

    ray: null,

    scene: null,

    speed: 15,

    targets: null,

    vector: null,

    createBullet: function () {
      var bullet = new THREE.Mesh(this.geometry, this.material);
      //bullet.castShadow = true;
      bullet.direction = new THREE.Vector3();
      return bullet;
    },

    fire: function () {

      var camera = this.camera,
          vector = this.vector;

      var bullet = this.getBullet();

      vector.setEulerFromRotationMatrix(camera.matrix);
      bullet.rotation.x = vector.x;
      bullet.rotation.y = vector.y;
      bullet.rotation.z = vector.z;

      bullet.position.x = camera.position.x;
      bullet.position.y = camera.position.y;
      bullet.position.z = camera.position.z;

      vector.set(0, 0, -1);
      camera.matrix.rotateAxis(vector);
      bullet.direction.x = vector.x;
      bullet.direction.y = vector.y;
      bullet.direction.z = vector.z;

      //bullet.translateY(-10);
      //bullet.translateZ(-this.speed * 2);

      bullet._lifetime = 0;

      this.bullets.push(bullet);
      this.scene.add(bullet);

      var source = this.audioContext.createBufferSource(); // creates a sound source
      source.buffer = this.audioBuffer;                    // tell the source which sound to play
      source.connect(this.audioContext.destination);       // connect the source to the context's destination (the speakers)
      source.noteOn(0);

      this.bulletsFired++;
    },

    getBullet: function () {
      return this.bulletPool.length ?
        this.bulletPool.pop() :
        this.createBullet();
    },

    initBulletPool: function () {
      for (var i = 0; i < this.poolSize; i++) {
        this.bulletPool.push(this.createBullet());
      }
    },

    setTargets: function (targets) {
      this.targets = targets;
    },

    update: function (delta) {

      var interval = this.interval,
          ray = this.ray,
          scene = this.scene,
          bullets = this.bullets,
          speed = this.speed,
          targets = this.targets,
          factor = delta / 16;

      this.counter += delta;
      if (this.counter >= interval) {
        this.counter -= interval;
        if (this.input.cannon) {
          this.fire();
        }
      }

      var bulletHit;
      var targetsNeedUpdate = false;

      for (var i = bullets.length - 1; i >= 0; i--) {
        var bullet = bullets[i];

        bulletHit = false;

        if(bullet.position.y < terrainGenerator.getHeightAt(bullet.position.x, bullet.position.z)){
          bulletHit = true;
        }

        if(!bulletHit){

          ray.origin = bullet.position;
          ray.direction = bullet.direction;

          //  setSource(bullet.position, bullet.direction);

          var intersects = ray.intersectObjects(targets);
          if (intersects.length) {
            var hit = intersects[0];
            if (hit.distance <= speed) {

              //console.log('You hit', hit.object.hitCounter);

              hit.object.onDestroyed();

              bulletHit = true;
              targetsNeedUpdate = true;

              hit.object.isHit = true;
              hit.object.hitCounter++;

              var c = hit.object.material.color;
              c.r += ( (1 - c.r) / 5 );
              c.g += ( (1 - c.g) / 5 );
              c.b += ( (1 - c.b) / 5 );

            }
          }

          bullet.translateZ(-speed * factor);

          bullet._lifetime += delta;

        }

        if (bulletHit || bullet._lifetime > this.maxLifetime) {
          scene.remove(bullet);
          bullets.splice(i, 1);
          this.bulletPool.push(bullet);
        }

        if(targetsNeedUpdate){

          for(var m = targets.length - 1; m >= 0; m-- ){
            var target = targets[m];
            if(target.isHit){

              //console.log('hit target: ', target.hitCounter, target);

              target.isHit = false;

              if(target.hitCounter >= 1){
                //console.log('target gone');

                // TODO: do some anim?


                  //scene.remove(target);
                  targets.splice(m, 1);
              }
            }
          }

        }
      }

    }
  };

  return Cannon;

});
