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
    var crosshairs;

    init();
    animate();

    function init() {

      renderer = new THREE.WebGLRenderer({ antialias: true });
      element = renderer.domElement;
      container = document.getElementById('mod_quizgame_game');
      container.appendChild(element);

      effect = new THREE.StereoEffect(renderer);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
      camera.position.set(0, 10, 0);
      scene.add(camera);

      controls = new THREE.OrbitControls(camera, element);
      controls.rotateUp(Math.PI / 4);
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

      var textureLoader = new THREE.TextureLoader();
      /*var texture = textureLoader.load(
        'textures/patterns/grid.png'
      );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat = new THREE.Vector2(768, 786);
      texture.anisotropy = renderer.getMaxAnisotropy();

      var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0xffffff,
        shininess: 20,
        shading: THREE.FlatShading,
        map: texture
      });

      var geometry = new THREE.PlaneGeometry(1000, 1000);

      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);*/

      window.addEventListener('resize', resize, false);
      setTimeout(resize, 1);

      var loader = new THREE.ColladaLoader();
      loader.load('models/enemy.dae', function (result) {
          // Create lots of enemies
          for (var i = 0; i < 8; i++) {
              var model = result.scene.clone();
              scene.add(model);
              objects.push(new Enemy(model));
          }
      });

      var skyGeo = new THREE.SphereGeometry(700, 25, 25);
      var texture = textureLoader.load("textures/Panorama.jpg");
      var material = new THREE.MeshBasicMaterial({
          map: texture
      });
      var sky = new THREE.Mesh(skyGeo, material);
      sky.material.side = THREE.BackSide;
      scene.add(sky);
      /*var urlPrefix = "textures/patterns/spacebox/";
      var urls = [ urlPrefix + "posx.jpg", urlPrefix + "negx.jpg",
      urlPrefix + "posy.jpg", urlPrefix + "negy.jpg",
      urlPrefix + "posz.jpg", urlPrefix + "negz.jpg" ];
      var cubeLoader = new THREE.CubeTextureLoader();
      var textureCube = cubeLoader.load( urls );
      // Build the skybox Mesh.
      skyboxMesh = new THREE.Mesh( new THREE.CubeGeometry( 100000, 100000, 100000, 1, 1, 1, null, true ), material );
      skyboxMesh.scale.set(-1,1,1);
      // Add it to the scene.
      scene.add(skyboxMesh);*/

      // Cross hairs.
      var texture = textureLoader.load(
        'textures/crosshairs.png'
      );
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = renderer.getMaxAnisotropy();

      var material = new THREE.MeshBasicMaterial({
        transparent: true,
        map: texture,
      });

      var geometry = new THREE.PlaneGeometry(0.1, 0.1);

      crosshairs = new THREE.Mesh(geometry, material);
      camera.add(crosshairs);
      crosshairs.translateZ(-1);

      var width = screen.width/2;
      var height = screen.height;
      var hudCanvas = document.createElement('canvas');
      hudCanvas.width = width;
      hudCanvas.height = height;
      var hudBitmap = hudCanvas.getContext('2d');
      hudBitmap.font = "40px Arial";
      hudBitmap.textAlign = 'center';
      hudBitmap.fillStyle = "rgba(255,140,0,1)";
      hudBitmap.fillText('Score: 0', width / 2, height * 0.8);
      var hudTexture = new THREE.Texture(hudCanvas)
      hudTexture.needsUpdate = true;
      var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
      material.transparent = true;
      var planeGeometry = new THREE.PlaneGeometry( 1, 1 );
      var hudPlane = new THREE.Mesh( planeGeometry, material );
      camera.add( hudPlane );
      hudPlane.translateZ(-1);
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
        /*crosshairs.position.x = camera.position.x;
        crosshairs.position.y = camera.position.y;
        crosshairs.position.z = camera.position.z;
        crosshairs.rotation.x = camera.rotation.x;
        crosshairs.rotation.y = camera.rotation.y;
        crosshairs.rotation.z = camera.rotation.z;
        crosshairs.translateZ(-0.5);*/
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
        //this.object3d.rotateZ((Math.random()*0.03)-0.015);
    }

    /**
     * Enemy constructor
     */
    function Enemy(object3d) {
        GameObject.call(this, object3d);
        object3d.rotation.x = -90 * degrees;
        object3d.rotation.z = -90 * degrees;
        object3d.position.y = Math.random()*15;
        object3d.position.x = 40+Math.random()*20;
        object3d.position.z = (Math.random()*50)-25;
        this.object3d = object3d;
        this.velocity = new THREE.Vector3(0, -(Math.random()*1)-1, 0);
        this.answer = 'Quizventure answer';
        var width = 1024;
        var height = 768;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        context = this.canvas.getContext('2d');
        context.font = "40px Arial";
        context.textAlign = 'center';
        context.fillStyle = "rgba(255,140,0,1)";
        context.fillText(this.answer, width / 2, height / 2);
        var hudTexture = new THREE.Texture(this.canvas);
        hudTexture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
        material.transparent = true;
        var planeGeometry = new THREE.PlaneGeometry( 1024, 768 );
        this.questionPlane = new THREE.Mesh( planeGeometry, material );
        object3d.add(this.questionPlane);
        this.questionPlane.translateZ(50);
        this.questionPlane.rotateX(90*degrees);
    }
    Enemy.prototype = Object.create(GameObject.prototype);
    Enemy.prototype.update = function(dt) {
        GameObject.prototype.update.call(this, dt);
    }
});
