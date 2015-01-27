require([
  'lib/decoupled-input/InputController',
  'lib/decoupled-input/MouseHandler',
  'lib/decoupled-input/KeyboardHandler',
  'lib/decoupled-input/GamepadHandler',

  'src/bindings',
  'src/InfiniteGround',
  'src/Controls',
  'src/terrainGenerator',
  'src/Cannon',
  'src/RadarDetector'
], function (
  InputController,
  MouseHandler,
  KeyboardHandler,
  GamepadHandler,

  bindings,
  InfiniteGround,
  Controls,
  terrainGenerator,
  Cannon,

  RadarDetector
) {

  var camera, scene, renderer,
      audioContext, gunBuffer,
      shipBuffer, shipSource, shipGainNode,
      musicBuffer, musicSource, musicNode, musicTime = 0,
      stats, lastTime, elapsedTime,
      infiniteGround, controls, input,
      cannon, targets, targetsTotal = 20, targetsToHit = 20,
      sun, hud, radar,
      topSpeed = 0;

  var meshes,
      tileSize = 256,
      meshSize = tileSize * 20,
      halfMeshSize = meshSize / 2,
      heightMap = 'img/heightmap_2.png',
      elevationLevel = 0.1;

  var SCREEN_HEIGHT = window.innerHeight;
  var SCREEN_WIDTH = window.innerWidth;

  var info = document.getElementById('info');

  var isPaused = true;

  document.addEventListener("webkitvisibilitychange", function () {
    if (document.webkitHidden){
      musicTime = audioContext.currentTime;

      musicSource.stop();
      shipSource.stop();
      isPaused || ( input.togglePause = 1 );
    } else {
      musicSource = audioContext.createBufferSource();
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;
      musicSource.connect(audioContext.destination);

      musicSource.start(0, musicTime, musicBuffer.duration - musicTime);
    }
  }, false);

  // go:
  init();

  function init () {

    /* Scene & Camera */
    scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2(0xefd1b5, 0.001);
    scene.fog = new THREE.Fog(0xefd1b5, 0, halfMeshSize);

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 1000;
    camera.far = halfMeshSize;

    camera.position.y = 100;
    scene.add(camera);

    /* Input */
    var inputController = new InputController(bindings);
    inputController.registerDeviceHandler(MouseHandler, 'mouse');
    inputController.registerDeviceHandler(KeyboardHandler, 'keyboard');
    inputController.registerDeviceHandler(GamepadHandler, 'gamepad');

    input = inputController.input;

    /* Controls */
    controls = new Controls(camera, inputController.input);

    /* Renderer */

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.sortObjects = false;
    renderer.setSize( window.innerWidth, window.innerHeight );

    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

    scene.add( new THREE.AmbientLight( 0x505050 ) );

    sun = new THREE.DirectionalLight(0xffffff, 1);
    //sun = new THREE.SpotLight( 0xffffff, 1.5 );
    sun.position.set( 0, 500, 2000 );
    sun.position.set( 1000, 500, 2000 );
    sun.position.set( camera.position.x + 1000, camera.position.y + 1000, camera.position.z + 1000);
    sun.castShadow = true;

    sun.shadowCameraNear = 0;
    sun.shadowCameraFar = meshSize; //camera.far;
    sun.shadowCameraFov = 50;

    sun.shadowBias = -0.00022;
    sun.shadowDarkness = 0.5;

    sun.shadowMapWidth = 2048;
    sun.shadowMapHeight = 2048;

    sun.target = camera;

    scene.add( sun );

    /* HUD */

    hud = {
      horizon: document.getElementById('horizon'),
      speed: document.getElementById('speed'),
      height: document.getElementById('height'),
      thrust: document.getElementById('thrust'),
      targetsLeft: document.getElementById('targetsleft'),
      targetsHit: document.getElementById('targetshit'),
      time: document.getElementById('time'),
      target: document.getElementById('target'),
      targetDistance: document.getElementById('target').getElementsByTagName('span')[0]
    };
    hud.textProperty = typeof hud.time.innerText !== 'undefined' ? 'innerText' : 'textContent';

    /* Audio */
    audioContext = new AudioContext();

    shipGainNode = audioContext.createGain();
    shipGainNode.connect(audioContext.destination);

    var request = new XMLHttpRequest();
    request.open('GET', 'audio/battle032.mp3', true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      audioContext.decodeAudioData(request.response, function(buffer) {
        gunBuffer = buffer;

        /* Cannon */

        cannon = new Cannon(camera, scene, input, audioContext, gunBuffer);

        var request = new XMLHttpRequest();
        request.open('GET', 'audio/ship.mp3', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
          shipBuffer = buffer;

          shipSource = audioContext.createBufferSource();
          shipSource.buffer = shipBuffer;
          shipSource.loop = true;
          shipSource.connect(shipGainNode);


          var request = new XMLHttpRequest();
          request.open('GET', 'audio/flex_blur-wipeout.mp3', true);
          request.responseType = 'arraybuffer';

          request.onload = function() {
            audioContext.decodeAudioData(request.response, function(buffer) {

              musicBuffer = buffer;

              musicSource = audioContext.createBufferSource();
              musicSource.buffer = buffer;
              musicSource.loop = true;
              musicSource.connect(audioContext.destination);

              musicSource.start(0);

              /* Ground */

              var img = new Image();
              img.onload = function () {
                meshes = terrainGenerator.build(img, meshSize, tileSize, elevationLevel, scene);
                onTerrainLoaded();
              };
              img.src = heightMap;
            }, function(){ console.log('ERR:', arguments); } );
          };
          request.send();

        }, function(){ console.log('ERR:', arguments); } );
      };
      request.send();

      }, function(){ console.log('ERR:', arguments); } );
    };
    request.send();


    window.addEventListener('resize', onResize, false);
  }

  function onTerrainLoaded () {

    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    /*
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild(stats.domElement);
    */

    infiniteGround = new InfiniteGround(camera, meshes, meshSize);

    /* Targets */
    targets = [];
    createTargets();
    cannon.setTargets(targets);

    radar = new RadarDetector(camera);

    elapsedTime = 0;
    lastTime = +new Date();
    animate(lastTime);

    document.documentElement.classList.remove('loading');
  }

  function onResize () {
    SCREEN_HEIGHT = window.innerHeight;
    SCREEN_WIDTH = window.innerWidth;
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
    camera.updateProjectionMatrix();
  }

  function animate(time){

    var delta = time - lastTime;
    lastTime = time;

    requestAnimationFrame(animate);

    render(delta);
  }

  function render (delta) {

    if(input.togglePause){
      isPaused = !isPaused;
      input.togglePause = 0;
      document.documentElement.classList[isPaused ? 'add' : 'remove']('paused');

      if(isPaused){
        shipSource.stop();
        //musicSource.stop();
        return;
      } else {
        shipSource = audioContext.createBufferSource();
        shipSource.buffer = shipBuffer;
        shipSource.loop = true;
        shipSource.connect(shipGainNode);
        shipSource.stop();

        /*
        musicSource = audioContext.createBufferSource();
        musicSource.buffer = musicBuffer;
        musicSource.loop = true;
        musicSource.connect(audioContext.destination);

        musicSource.start(0);
        */
      }
    }

    if(isPaused){
      return;
    }


    elapsedTime += delta;

    controls.update(delta);

    infiniteGround.update();

    shipSource.playbackRate.value = 1.0 + ( controls.speed / 20 );
    shipGainNode.gain.value = 0.4 + ( controls.speed / 20 );


    var heightOverGround = camera.position.y - terrainGenerator.getHeightAt(camera.position.x, camera.position.z);
    if(heightOverGround <= 0){
      isPaused = true;
      shipSource.stop();
      report('You crashed. Ts, ts, ts.');
      return;
    }

    if(controls.speed > topSpeed){
      topSpeed = controls.speed;
    }

    cannon.update(delta);

    sun.position.set( camera.position.x + 2000, camera.position.y + 2000, camera.position.z + 2000);

    renderer.render(scene, camera);

    //stats.update(delta * 1000);

    if(targets.length <= ( targetsTotal - targetsToHit )){
      isPaused = true;
      shipSource.stop();
      report('OMG, you saved Mars!!', true);
      return;
    }


    // find nearest target

    for(var i = 0, m = targets.length; i<m; i++){
      var target = targets[i],
          a = target.position,
          b = camera.position;
      target.distance = Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2) +
        Math.pow(a.z - b.z, 2)
      );

      var speed = 2000 / target.distance;
      target.position.x -= speed;

      var desiredHeight = terrainGenerator.getHeightAt(target.position.x - speed, target.position.z) + 500;
      var diff = target.position.y - desiredHeight;
      target.position.y -= THREE.Math.clamp(diff, -.2,.2);
    }
    targets.sort(function(a, b){ return a.distance > b.distance ? 1 : -1; });

    var nearestTarget = targets[0];
    radar.detect(nearestTarget);
    hud.target.style.left = THREE.Math.clamp(nearestTarget.radarLeft + 50, 5, 95) + '%';
    hud.target.classList[nearestTarget.isInFront ? 'remove' : 'add']('behind');
    hud.targetDistance[hud.textProperty] = ( nearestTarget.distance / 10).toFixed(0);

    hud.height[hud.textProperty] = 'ALT: ' + ( camera.position.y / 2 ).toFixed(0);
    hud.speed[hud.textProperty] = 'SPD: ' + ( controls.speed / 0.02 ).toFixed(0);
    hud.thrust[hud.textProperty] = 'THR: ' + ( controls.thrust * 10 ).toFixed(0) + '%';

    hud.time[hud.textProperty] = 'Time: ' + ( elapsedTime / 1000 ).toFixed(2);
    hud.targetsLeft[hud.textProperty] = 'Targets left: ' + ( targets.length - ( targetsTotal - targetsToHit ) );

  }

  function createTargets() {
      var geometry = new THREE.SphereGeometry(20, 16, 12);

      for (var i = 0; i < targetsTotal; i++) {

          var object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

          object.position.x = Math.random() *  meshSize - halfMeshSize;
          object.position.z = Math.random() * halfMeshSize - ( i * 500 );
          object.position.y = terrainGenerator.getHeightAt(object.position.x, object.position.z) + 500;

          object.castShadow = true;
   			  object.receiveShadow = false;

          object.hitCounter = 0;
          object.isHit = false;

        object.onDestroyed = function(){
          var ball = this;

          this.__interval = setInterval(function(){
            var stepSize = 0.05;
            var currentScale = ball.scale.x;
            var targetScale = currentScale - stepSize;
            if(currentScale > stepSize){

              ball.scale.set(targetScale, targetScale, targetScale);
              ball.matrixWorldNeedsUpdate = true;
            } else {

              clearInterval(ball.__interval);
              ball.__interval = null;
              scene.remove(ball);
            }
          }, 16);
        }.bind(object);

          targets.push(object);
          scene.add(object);
      }
  }

  function report(msg, winning) {
    var _elapsed = ( elapsedTime / 1000 );
    var _topspeed = ( topSpeed / 0.02 );
    var targetsHit = targetsTotal - targets.length;
    var _accuracy = targetsHit == 0 ? 0 : ( targetsHit / cannon.bulletsFired ) * 100;
    var node = document.getElementById('report');

    var score = (
      _accuracy * 100 +
      _topspeed
    ) / _elapsed * 1000;


    node.innerHTML = '<h1>' + msg + '</h1>\
    Elapsed Time: ' + _elapsed.toFixed(2) + 's<br>\
    Top Speed: ' + _topspeed.toFixed(2) + '<br>\
    Bullets fired: ' + cannon.bulletsFired + '<br>\
    Accuracy: ' + _accuracy.toFixed(1) + '%<br>\
    <br><br>' + (
      winning ?
      '<strong>Score: ' + score.toFixed(0) + '</strong>' :
      ''
    );

    node.style.display = 'block';
  }

});
