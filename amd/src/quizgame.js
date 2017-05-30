// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * This class manages the confirmation pop-up (also called the pre-flight check)
 * that is sometimes shown when a use clicks the start attempt button.
 *
 * This is also responsible for opening the pop-up window, if the quiz requires to be in one.
 *
 * @module    mod_quizgame/quizgame
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery'], function($) {
    var degrees = Math.PI / 180;

    var camera, scene, renderer;
    var effect, controls;
    var element, container;

    var clock = new THREE.Clock();

    var objects = [];
    var laserGeo, laserMaterial;
    var laserFullCharge = 0.1;
    var laserWaitTime = 0.6;
    var laserCharge = 0;
    var laserSide = -1;
    var horizon = 800000;
    var raycaster;
    var eyeview = {width: Math.max(screen.width, screen.height)/2, height: Math.min(screen.width, screen.height)};
    var hudBitmap, hudTexture;
    var aimed = false;

    function init() {
        raycaster = new THREE.Raycaster();
        renderer = new THREE.WebGLRenderer({ antialias: true });
        element = renderer.domElement;
        container = document.getElementById('mod_quizgame_game');
        container.appendChild(element);

        effect = new THREE.StereoEffect(renderer);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(90, 1, 0.001, horizon);
        camera.position.set(0, 10, 0);
        scene.add(camera);

        controls = new THREE.OrbitControls(camera, element);
        //controls.rotateUp(90*degrees);
        controls.target.set(
                camera.position.x + 0.1,
                camera.position.y,
                camera.position.z
            );
        controls.noZoom = true;
        controls.noPan = true;

      function setOrientationControls(e) {
        if (!e.alpha) {
          return;
        }

        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();

        document.body.addEventListener('click', fullscreen, false);
        window.removeEventListener('deviceorientation', setOrientationControls, true);
      }
      window.addEventListener('deviceorientation', setOrientationControls, true);


      var light = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 1);
      scene.add(light);

      window.addEventListener('resize', resize, false);
      setTimeout(resize, 1);

      loadModels();
    }
    function loadModels() {
      var textureLoader = new THREE.TextureLoader();
      var modelLoader = new THREE.ColladaLoader();
      modelLoader.options.convertUpAxis = true;
      modelLoader.options.upAxis = 'X';

      enemies = new THREE.Object3D();
      scene.add(enemies);
      modelLoader.load('models/enemy.dae', function (result) {
          // Create lots of enemies
          for (var i = 0; i < 8; i++) {
              var model = result.scene.clone();
              enemies.add(model);
              objects.push(new Enemy(model));
          }
      });
      laserGeo = new THREE.CylinderGeometry(0, 0.04, 2, 4);
      laserGeo.rotateX(90*degrees);
      laserMaterial = new THREE.MeshBasicMaterial({
          color: 0xFF0000
      });

      var skyGeo = new THREE.SphereGeometry(horizon, 25, 25);
      var texture = textureLoader.load("textures/Panorama.jpg");
      var material = new THREE.MeshBasicMaterial({
          map: texture
      });
      var sky = new THREE.Mesh(skyGeo, material);
      sky.material.side = THREE.BackSide;
      sky.name = "sky";
      scene.add(sky);

      var hudCanvas = document.createElement('canvas');
      hudCanvas.width = eyeview.width;
      hudCanvas.height = eyeview.height;
      hudBitmap = hudCanvas.getContext('2d');
      hudTexture = new THREE.Texture(hudCanvas)
      updateHUD();
      var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
      material.transparent = true;
      var planeGeometry = new THREE.PlaneGeometry( 1, 1 );
      var hudPlane = new THREE.Mesh( planeGeometry, material );
      camera.add( hudPlane );
      hudPlane.translateZ(-1);
    }

    function updateHUD() {
      size = eyeview.height/20;
      hudBitmap.clearRect(0, 0, eyeview.width, eyeview.height);
      hudBitmap.font = "20px Arial";
      hudBitmap.textAlign = 'center';
      hudBitmap.fillStyle = "#f98012";
      hudBitmap.fillText('Score: 0', eyeview.width / 2, eyeview.height*1);
      hudBitmap.beginPath();
      hudBitmap.lineWidth=2;
      hudBitmap.strokeStyle="#f98012";
      hudBitmap.arc(eyeview.width/2,eyeview.height/2,size,0,2*Math.PI);
      hudBitmap.stroke();
      hudBitmap.beginPath();
      if (aimed) {
          hudBitmap.lineWidth=10;
          hudBitmap.strokeStyle="#f98012";
          hudBitmap.arc(eyeview.width/2,eyeview.height/2,size,0,2*Math.PI);
          hudBitmap.stroke();
      }
      hudTexture.needsUpdate = true;
    }

    function resize() {
      var width = container.offsetWidth;
      var height = container.offsetHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      effect.setSize(width, height);
    }

    function update(dt) {
      resize();

      camera.updateProjectionMatrix();

      controls.update(dt);

      updateObjects(dt);
    }

    function render(dt) {
      effect.render(scene, camera);
    }

    function animate(t) {
      requestAnimationFrame(animate);

      update(clock.getDelta());
      render(clock.getDelta());
    }

    function fullscreen() {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    }

    function updateObjects(dt) {
        // See if we are currently pointing at a ship
        // update the picking ray with the camera and mouse position
        raycaster.setFromCamera( new THREE.Vector2(0, 0), camera );

        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects( enemies.children, true );
        var lastKnownAimed = aimed;
        aimed = false;

        for ( var i = 0; i < intersects.length; i++ ) {

            aimed = true;
            break;

        }
        if (!aimed) {
            laserCharge=0;
        }
        if (aimed != lastKnownAimed) {
            updateHUD();
        }
        if (laserCharge >= laserWaitTime+laserFullCharge && aimed) {
            var laser = new THREE.Mesh(laserGeo, laserMaterial);
            scene.add(laser);
            objects.push(new Laser(laser));
            laserCharge = laserWaitTime;
            laserSide = -laserSide;
        } else {
            laserCharge+=dt;
        }
        for (var i = 0; i < objects.length; i++) {
            var object = objects[i];
            object.update(dt);
        }
    }

    /**
     * GameObject constructor
     */
    function GameObject(object3d) {
        this.object3d = object3d;
        this.velocity = new THREE.Vector3(0, 0, 0);
    }
    GameObject.prototype.update = function(dt) {
        this.object3d.translateX(this.velocity.x*dt);
        this.object3d.translateY(this.velocity.y*dt);
        this.object3d.translateZ(this.velocity.z*dt);
    }
    GameObject.prototype.die = function(dt) {
        scene.remove(this.object3d);
        var i = objects.indexOf(this);
        objects.splice(i, 1);
    }

    /**
     * Laser constructor
     */
    function Enemy(object3d) {
        GameObject.call(this, object3d);
        object3d.position.y = Math.random()*15;
        object3d.position.x = 40+Math.random()*20;
        object3d.position.z = (Math.random()*50)-25;
        this.object3d = object3d;
        this.velocity = new THREE.Vector3(-(Math.random()*1)-1, 0, 0);
        this.answer = 'Answer to the question';
        var width = 1024;
        var height = 64;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        context = this.canvas.getContext('2d');
        context.font = "60px Arial";
        context.textAlign = 'center';
        context.fillStyle = "#FFFFFF";
        context.fillText(this.answer, width / 2, 50);
        var hudTexture = new THREE.Texture(this.canvas);
        hudTexture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
        material.transparent = true;
        var planeGeometry = new THREE.PlaneGeometry( 1024, 64 );
        this.questionPlane = new THREE.Mesh( planeGeometry, material );
        object3d.add(this.questionPlane);
        this.questionPlane.translateY(50);
        this.questionPlane.rotateY(-90*degrees);
        this.object3d.name = "enemy";
    }
    Enemy.prototype = Object.create(GameObject.prototype);
    Enemy.prototype.update = function(dt) {
        GameObject.prototype.update.call(this, dt);
        if (this.object3d.position.x < 0) {
            object3d.position.x = 60;
        }
    }

    /**
     * Laser constructor
     */
    function Laser(object3d) {
        GameObject.call(this, object3d);
        this.velocity = new THREE.Vector3(0, 0, -40);
        this.object3d.position.set(camera.position.x, camera.position.y-0.2, camera.position.z);
        this.object3d.rotation.copy(camera.rotation);
        this.object3d.translateX(laserSide*0.2);
        this.life = 3;
    }
    Laser.prototype = Object.create(GameObject.prototype);
    Laser.prototype.update = function(dt) {
        GameObject.prototype.update.call(this, dt);
        this.life -= dt;
        if (this.life < 0) {
            this.die();
        }
    }

    return {
        init: function () {
            init();
            animate();
        }
    }
});
