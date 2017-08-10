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
define(['jquery', 'mod_quizgame/QuizgameControls'], function($, QuizgameControls) {
    var degrees = Math.PI / 180;

    var camera, scene, renderer;
    var effect, controls;
    var element, container;

    var clock = new THREE.Clock();

    var objects = [];
    var laserGeo, laserMaterialFriendly, laserMaterialUnfriendly;
    var enemyModel;
    var laserFullCharge = 0.1;
    var laserWaitTime = 0.6;
    var laserCharge = 0;
    var laserSide = -1;
    var horizon = 800000;
    var raycaster;
    var eyeview = {width: screen.width, height: screen.height};
    var hudCanvas, hudTexture, hudPlane, hudBitmap, sceneHUD, cameraHUD;
    var aimed = false;
    var currentTeam = [];
    var currentPointsLeft = 0;
    var enemiesGameObjects = 0;
    var enemiesSoFar = 0;
    var questions;
    var level = 0;
    var score = 0;
    var vrMode = 0;
    var soundOn;
    var VR_NONE = 0;
    var VR_CARDBOARD = 1;
    var VR_VIVE = 2;
    var controller1, controller2;

    function initGame() {
        raycaster = new THREE.Raycaster();
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.autoClear = false;
        element = renderer.domElement;
        container = document.getElementById('mod_quizgame_game');
        container.appendChild(element);

        effect = new THREE.StereoEffect(renderer);

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(90, 1, 0.001, horizon);
        camera.position.set(0, 10, 0);
        scene.add(camera);

        controls = new QuizgameControls(camera);
        controls.movementSpeed = 3;
        controls.lookSpeed = 0.4;
        controls.noFly = true;

      function setOrientationControls(e) {
        if (!e.alpha) {
          return;
        }
        controls = new THREE.DeviceOrientationControls(camera, true);
        controls.connect();
        controls.update();
        updateHUD();

        document.body.addEventListener('click', fullscreen, false);
        window.removeEventListener('deviceorientation', setOrientationControls, true);
      }


      var light = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 1);
      scene.add(light);

      setTimeout(resize, 1);

      loadModels().then(function() {
          loadLevel();
      });

      if (vrMode == VR_VIVE) {
          initVive();
      } else if (vrMode == VR_CARDBOARD) {
          window.addEventListener('deviceorientation', setOrientationControls, true);
      }

      window.addEventListener('resize', resize, false);
    }

    function initVive() {
        // Load controllers
        var loader = new THREE.OBJLoader();
        loader.setPath( 'models/obj/vive-controller/' );
        loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

            var loader = new THREE.TextureLoader();
            loader.setPath( 'models/obj/vive-controller/' );

            var controller = object.children[ 0 ];
            controller.material.map = loader.load( 'onepointfive_texture.png' );
            controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

            controller1.add( object.clone() );
            controller2.add( object.clone() );
            controller2.add( hudPlane );

        } );

        renderer.vr.enabled = true;
        renderer.vr.standing = true;

        controller1 = new THREE.ViveController(0);
        controller1.standingMatrix = renderer.vr.getStandingMatrix();
		  controller1.addEventListener( 'triggerdown', handleViveTrigger1 );
        scene.add( controller1 );

        controller2 = new THREE.ViveController(1);
        controller2.standingMatrix = renderer.vr.getStandingMatrix();
		  controller2.addEventListener( 'triggerdown', handleViveTrigger2 );
        scene.add( controller2 );

		  var geometry = new THREE.Geometry();
		  geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		  geometry.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

          var material = new THREE.LineBasicMaterial({
        	color: 0xf98012
        });

		  var line = new THREE.Line( geometry, material );
		  line.name = 'line';
		  line.scale.z = 20;

		  controller1.add( line.clone() );
		  controller2.add( line.clone() );

        WEBVR.getVRDisplay( function ( display ) {
        	  renderer.vr.setDevice( display );
        	  document.body.appendChild( WEBVR.getButton( display, renderer.domElement ) );
        } );
        WEBVR.checkAvailability().catch( function( message ) {
				document.body.appendChild( WEBVR.getMessageContainer( message ) );
			} );
    }

    function loadModels() {
      var promise = $.Deferred();
      var textureLoader = new THREE.TextureLoader();
      var modelLoader = new THREE.ColladaLoader();
      modelLoader.options.convertUpAxis = true;
      modelLoader.options.upAxis = 'X';

      enemies = new THREE.Object3D();
      scene.add(enemies);
      modelLoader.load('models/enemy.dae', function (result) {
          // Create lots of enemies
          enemyModel = result.scene.clone();
          promise.resolve();
      });
      laserGeo = new THREE.CylinderGeometry(0, 0.04, 2, 4);
      laserGeo.rotateX(90*degrees);
      laserMaterialFriendly = new THREE.MeshBasicMaterial({
          color: 0x0000FF
      });
      laserMaterialUnfriendly = new THREE.MeshBasicMaterial({
          color: 0xFF0000
      });

      /*var sphereGeo = new THREE.SphereGeometry(8, 25, 25);
      var material = new THREE.MeshBasicMaterial({
          color: 0x00FF00
      });
      var sphere = new THREE.Mesh(sphereGeo, material);
      sphere.position.z = -10;
      scene.add(sphere);

      var cylinderGeo = new THREE.CylinderGeometry(0, 5, 5, 25);
      cylinderGeo.rotateX(90*degrees);
      cylinderGeo.translate(0, -5, -20);
      var material = new THREE.MeshPhongMaterial({
        color: 0x996633,
        specular: 0x050505,
        shininess: 100
      });
      var cylinder = new THREE.Mesh(cylinderGeo, material);
      scene.add(cylinder);
      objects.push(new PowerUp(cylinder));*/

      var skyGeo = new THREE.SphereGeometry(horizon, 25, 25);
      skyGeo.rotateY(90*degrees);
      var texture = textureLoader.load("textures/Panorama.jpg");
      var material = new THREE.MeshBasicMaterial({
          map: texture
      });
      var sky = new THREE.Mesh(skyGeo, material);
      sky.material.side = THREE.BackSide;
      scene.add(sky);

      hudCanvas = document.createElement('canvas');
      hudCanvas.width = eyeview.width;
      hudCanvas.height = eyeview.height;
      hudTexture = new THREE.Texture(hudCanvas);
      updateHUD();
      var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
      material.transparent = true;
      if (vrMode == VR_CARDBOARD) {
          planeGeometry = new THREE.PlaneGeometry( 1, 1 );
          hudPlane = new THREE.Mesh( planeGeometry, material );
          camera.add(hudPlane);
          hudPlane.translateZ(-0.5);
      } else {
          planeGeometry = new THREE.PlaneGeometry( eyeview.width, eyeview.height );
          hudPlane = new THREE.Mesh( planeGeometry, material );
          new THREE.VRControls(cameraHUD);
          cameraHUD = new THREE.OrthographicCamera(-eyeview.width/2, eyeview.width/2, eyeview.height/2, -eyeview.height/2, 0, 200 );
          sceneHUD = new THREE.Scene();
          sceneHUD.add(hudPlane);
          hudPlane.translateZ(-100);
      }
      return promise;
    }

    function updateHUD() {
        if (vrMode == VR_VIVE) {
            updateHUDVive();
        } else {
            updateHUDBase();
        }
    }

    function updateHUDVive() {
        eyeview.width = window.innerWidth;
        eyeview.height = window.innerHeight;
        fontsize = Math.round(eyeview.height/25);
        hudCanvas.width = eyeview.width;
        hudCanvas.height = eyeview.height;
        hudBitmap = hudCanvas.getContext('2d');
        hudBitmap.clearRect(0, 0, eyeview.width, eyeview.height);
        hudBitmap.font = fontsize+"px Arial";
        hudBitmap.textAlign = 'center';
        hudBitmap.fillStyle = "#f98012";
        var qnum = Math.min(level, questions.length-1);
        wrapText(hudBitmap, questions[qnum].question, eyeview.width / 2, eyeview.height*0.25, eyeview.width*0.66, fontsize);
        hudBitmap.font = fontsize+"px Arial";
        hudBitmap.textAlign = 'center';
        hudBitmap.fillStyle = "#f98012";
        hudBitmap.fillText('Score: ' + Math.round(score) + ' Level: ' + (level+1), eyeview.width / 2, eyeview.height*0.75);
        hudBitmap.beginPath();
        if (aimed) {
            hudBitmap.lineWidth=eyeview.height/100;
        } else {
            hudBitmap.lineWidth=eyeview.height/300;
        }
        hudBitmap.strokeStyle="#f98012";
        hudBitmap.arc(eyeview.width/2,eyeview.height/2,eyeview.height/20,0,2*Math.PI);
        hudBitmap.stroke();
        hudTexture.needsUpdate = true;
    }

    function updateHUDBase() {
        eyeview.width = window.innerWidth;
        eyeview.height = window.innerHeight;
        fontsize = Math.round(eyeview.height/25);
        hudCanvas.width = eyeview.width;
        hudCanvas.height = eyeview.height;
        hudBitmap = hudCanvas.getContext('2d');
        hudBitmap.clearRect(0, 0, eyeview.width, eyeview.height);
        hudBitmap.font = fontsize+"px Arial";
        hudBitmap.textAlign = 'center';
        hudBitmap.fillStyle = "#f98012";
        var qnum = Math.min(level, questions.length-1);
        wrapText(hudBitmap, questions[qnum].question, eyeview.width / 2, eyeview.height*0.25, eyeview.width*0.66, fontsize);
        hudBitmap.font = fontsize+"px Arial";
        hudBitmap.textAlign = 'center';
        hudBitmap.fillStyle = "#f98012";
        hudBitmap.fillText('Score: ' + Math.round(score) + ' Level: ' + (level+1), eyeview.width / 2, eyeview.height*0.75);
        hudBitmap.beginPath();
        if (aimed) {
            hudBitmap.lineWidth=eyeview.height/100;
        } else {
            hudBitmap.lineWidth=eyeview.height/300;
        }
        hudBitmap.strokeStyle="#f98012";
        hudBitmap.arc(eyeview.width/2,eyeview.height/2,eyeview.height/20,0,2*Math.PI);
        hudBitmap.stroke();
        hudTexture.needsUpdate = true;
    }

    function wrapText(context, text, x, y, maxWidth, lineHeight) {
        var words = text.split(' ');
        var line = '';

        for(var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }

    function loadLevel() {
        for (var i = 0; i < currentTeam.length; i++) {
            enemy = currentTeam[i];
            if (enemy.alive) {
                enemy.die();
            }
        }
        currentTeam = [];
        if (questions[level].type == 'multichoice') {
        var answers = questions[level].answers;
            for (var i  = 0; i < answers.length; i++) {
                var answer = answers[i];
                var enemy = enemyModel.clone();
                enemies.add(enemy);
                var enemyObject = new Enemy(enemy, answer.text, answer.fraction);
                objects.push(enemyObject);
                currentTeam.push(enemyObject);
                if (answer.fraction > 0) {
                    currentPointsLeft += answer.fraction;
                }
            }
        }
        updateHUD();
    }
    function nextLevel() {
        level++;
        if (level >= questions.length) {
            level = 0;
            //enemySpeed *= 1.3;
        }
        loadLevel();
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

      camera.updateProjectionMatrix();

      controls.update(dt);

      updateObjects(dt);
    }

    function render(dt) {
        switch (vrMode) {
            case VR_CARDBOARD:
                effect.render(scene, camera); // Use a simple split screen for Google Cardboard.
                break;
            case VR_VIVE:
                if (vrMode == VR_VIVE) {
                    controller1.update();
                    controller2.update();
                }
                renderer.render(scene, camera);
                break;
            case VR_NONE:
                renderer.render(scene, camera);
                break;

        }
        renderer.render(sceneHUD, cameraHUD);
    }

    function animate(t) {

      update(clock.getDelta());
      render(clock.getDelta());

      requestAnimationFrame(animate);
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
        handleLaser(dt);
        for (var i = 0; i < objects.length; i++) {
            var object = objects[i];
            object.update(dt);
        }
    }

    function handleViveTrigger1() {
        shootLaser(controller1, false);
    }

    function handleViveTrigger2() {
        shootLaser(controller2, false);
    }

    function shootLaser(starting, alternate) {
        var laser = new THREE.Mesh(laserGeo, laserMaterialFriendly);
        scene.add(laser);
        objects.push(new Laser(laser, starting, alternate));
        laserCharge = laserWaitTime;
        laserSide = -laserSide;
        playSound("laser");
    }

    function handleLaser(dt) {
        if (vrMode == VR_VIVE) {
            // We have controls, so we can have a more interactive way to shoot. See handleViveTrigger
        } else {
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
                shootLaser(camera, true);
            } else {
                laserCharge+=dt;
            }
        }
    }

    function playSound(soundName) {
        if (soundOn) {
            var soundElement = document.getElementById("mod_quizgame_sound_" + soundName);
            soundElement.currentTime = 0;
            soundElement.play();
        }
    }

    /**
     * GameObject constructor
     */
    function GameObject(object3d) {
        this.object3d = object3d;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.alive = true;
    }
    GameObject.prototype.update = function(dt) {
        this.object3d.translateX(this.velocity.x*dt);
        this.object3d.translateY(this.velocity.y*dt);
        this.object3d.translateZ(this.velocity.z*dt);
    }
    GameObject.prototype.remove = function(dt) {
        scene.remove(this.object3d);
        var i = objects.indexOf(this);
        objects.splice(i, 1);
    }
    GameObject.prototype.die = function(dt) {
        this.remove(dt);
    }
    GameObject.prototype.gotShot = function(shot) {
        // By default nothing happens.
    }

    /**
     * Laser constructor
     */
    function Enemy(object3d, answer, fraction) {
        GameObject.call(this, object3d);
        object3d.position.y = Math.random()*15;
        object3d.position.x = 40+Math.random()*20;
        object3d.position.z = (Math.random()*50)-25;
        this.object3d = object3d;
        this.velocity = new THREE.Vector3(-(Math.random()*1)-1, 0, 0);
        this.answer = answer;
        this.fraction = fraction;
        var width = 1024;
        var height = 128;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        context = this.canvas.getContext('2d');
        context.font = "80px Arial";
        context.textAlign = 'center';
        context.fillStyle = "#FFFFFF";
        context.fillText(this.answer, width / 2, 80);
        var hudTexture = new THREE.Texture(this.canvas);
        hudTexture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
        material.transparent = true;
        var planeGeometry = new THREE.PlaneGeometry( 1024, 128 );
        this.questionPlane = new THREE.Mesh( planeGeometry, material );
        object3d.add(this.questionPlane);
        this.questionPlane.translateY(50);
        this.questionPlane.rotateY(-90*degrees);
        this.object3d.userData.enemyObj = this;
    }
    Enemy.prototype = Object.create(GameObject.prototype);
    Enemy.prototype.update = function(dt) {
        GameObject.prototype.update.call(this, dt);
        if (this.object3d.position.x < 0) {
            this.object3d.position.x = 60;
        }
    }
    Enemy.prototype.die = function() {
        //var i = currentTeam.indexOf(this);
        //currentTeam.splice(i, 1);
        this.alive = false;
        enemies.remove(this.object3d);
        GameObject.prototype.die.call(this);
        score += this.fraction * 1000;
        if (this.fraction > 0) {
            currentPointsLeft -= this.fraction;
        }
        if (this.fraction >= 1 || (this.fraction > 0 && currentPointsLeft <= 0)) {
            nextLevel();
        }
        playSound("explosion");
    }
    Enemy.prototype.gotShot = function(shot) {
        if (this.fraction > 0) {
            shot.die();
            this.die();
        } else {
            score += (this.fraction - 0.5) * 1;
            updateHUD();
            shot.deflect();
        }
    }

    /**
     * Laser constructor
     */
    function Laser(object3d, starting, alternate) {
        GameObject.call(this, object3d);
        this.velocity = new THREE.Vector3(0, 0, -60);
        this.object3d.position.set(starting.position.x, starting.position.y-0.2, starting.position.z);
        this.object3d.rotation.copy(starting.rotation);
        if (alternate) {
            this.object3d.translateX(laserSide*0.2);
        }
        this.life = 3;
        this.friendly = true;
    }
    Laser.prototype = Object.create(GameObject.prototype);
    Laser.prototype.update = function(dt) {
        GameObject.prototype.update.call(this, dt);
        this.life -= dt;
        if (this.life < 0) {
            this.die();
        }
        var direction = new THREE.Vector3( 0, 0, 1 );
        direction.applyQuaternion( this.object3d.quaternion );
        raycaster.set( this.object3d.position, direction );

        // calculate objects intersecting the picking ray
        if (this.friendly) {
            var intersects = raycaster.intersectObjects( enemies.children,true );
            for ( var i = 0; i < intersects.length; i++ ) {
                var shipModel = intersects[i].object.parent.parent;
                if (shipModel.userData.enemyObj) {
                    shipModel.userData.enemyObj.gotShot(this);
                }
                break;

            }
        }
    }
    Laser.prototype.deflect = function() {
        this.object3d.rotateY(180*degrees);
        this.friendly = !this.friendly;
        this.object3d.material = laserMaterialUnfriendly;
        playSound("deflect");
    }

    return {
        init: function (q) {
            questions = q;
        },
        startGame: function(sound, vr) {
            soundOn = sound;
            vrMode = parseInt(vr);
            initGame();
            animate();
        }
    }
});
