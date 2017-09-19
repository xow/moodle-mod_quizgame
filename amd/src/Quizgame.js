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
 * @module    mod_quizgame/Quizgame
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'mod_quizgame/QuizgameControls', 'mod_quizgame/GameObject', 'mod_quizgame/Enemy', 'mod_quizgame/MatchEnemy', 'mod_quizgame/Laser'], function($, QuizgameControls, GameObject, Enemy, MatchEnemy, Laser) {

    "use strict";

    var degrees = Math.PI / 180;

    var Quizgame = function Quizgame(q) {
        this.laserFullCharge = 0.1;
        this.laserWaitTime = 0.6;
        this.laserCharge = 0;
        this.laserSide = -1;
        this.horizon = 800000;
        this.clock = new THREE.Clock();
        this.objects = [];

        this.camera;
        this.scene;
        this.renderer;
        this.effect;
        this.controls;
        this.container;

        this.laserGeo
        this.laserMaterialFriendly
        this.laserMaterialUnfriendly;
        this.enemyModel;
        this.enemyChoiceModel;
        this.enemyStemModel;
        this.raycaster;
        this.eyeview = {width: screen.width, height: screen.height};
        this.hudCanvas;
        this.hudTexture;
        this.hudPlane;
        this.hudBitmap;
        this.sceneHUD;
        this.cameraHUD;
        this.aimed = false;
        this.currentTeam = [];
        this.currentPointsLeft = 0;
        this.enemiesGameObjects = 0;
        this.enemiesSoFar = 0;
        this.questions = q;
        this.level = 0;
        this.score = 0;
        this.vrMode = 0;
        this.soundOn;
        this.enemies;
        this.startGame();
    }

    Quizgame.prototype.initGame = function() {

        this.raycaster = new THREE.Raycaster();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.autoClear = false;
        var element = this.renderer.domElement;
        this.container = document.getElementById('mod_quizgame_game');
        this.container.appendChild(element);

        this.effect = new THREE.StereoEffect(this.renderer);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(90, 1, 0.001, this.horizon);
        this.camera.position.set(0, 1, 0);
        this.scene.add(this.camera);

        this.controls = new QuizgameControls(this.camera);
        this.controls.movementSpeed = 3;
        this.controls.lookSpeed = 0.4;
        this.controls.noFly = true;

        var setOrientationControls = function(e) {
            if (!e.alpha) {
              return;
            }
            this.controls = new THREE.DeviceOrientationControls(this.camera, true);
            this.controls.connect();
            this.controls.update();

            this.updateHUD();

            document.body.addEventListener('click', this.fullscreen, false);
            window.removeEventListener('deviceorientation', setOrientationControls, true);
        };


      var light = new THREE.HemisphereLight(0xFFFFFF, 0x000000, 1);
      this.scene.add(light);

      setTimeout(this.resize.bind(this), 1);

      this.loadModels().then(function() {
          this.loadLevel();
      }.bind(this));

      window.addEventListener('deviceorientation', setOrientationControls.bind(this), true);

      window.addEventListener('resize', this.resize.bind(this), false);
    }
    Quizgame.prototype.startGame = function(sound) {
        this.soundOn = sound;
        this.initGame();
        this.animate();
    }

    Quizgame.prototype.loadModels = function() {
      var promise = $.Deferred();
      var promises = [];
      var loadPromise;
      var textureLoader = new THREE.TextureLoader();
      var modelLoader = new THREE.ColladaLoader();
      modelLoader.options.convertUpAxis = true;
      modelLoader.options.upAxis = 'X';

      this.enemies = new THREE.Object3D();
      this.scene.add(this.enemies);

      var scope = this;

      loadPromise = $.Deferred();
      //promises.push(loadPromise);
      modelLoader.load('models/enemy.dae', function (result) {
          scope.enemyModel = result.scene.clone();
          loadPromise.resolve();
      }.bind(this));

      loadPromise = $.Deferred();
      //promises.push(loadPromise);
      modelLoader.load('models/enemyChoice.dae', function (result) {
          scope.enemyChoiceModel = result.scene.clone();
          loadPromise.resolve();
      }.bind(this));

      loadPromise = $.Deferred();
      //promises.push(loadPromise);
      modelLoader.load('models/enemyStem.dae', function (result) {
          scope.enemyStemModel = result.scene.clone();
          loadPromise.resolve();
      });

      loadPromise = $.Deferred();
      //promises.push(loadPromise);
      modelLoader.load('models/base.dae', function (result) {
          // Create lots of enemies
          scope.scene.add(result.scene.clone());
          loadPromise.resolve();
      });

      this.laserGeo = new THREE.CylinderGeometry(0, 0.04, 2, 4);
      this.laserGeo.rotateX(90*degrees);
      this.laserMaterialFriendly = new THREE.MeshBasicMaterial({
          color: 0x0000FF
      });
      this.laserMaterialUnfriendly = new THREE.MeshBasicMaterial({
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

      var skyGeo = new THREE.SphereGeometry(this.horizon, 25, 25);
      skyGeo.rotateY(90*degrees);
      var texture = textureLoader.load("textures/Panorama.jpg");
      var material = new THREE.MeshBasicMaterial({
          map: texture
      });
      var sky = new THREE.Mesh(skyGeo, material);
      sky.material.side = THREE.BackSide;
      this.scene.add(sky);

      this.createHUD();

      $.when.apply($, promises).then(promise.resolve);

      return promise;
    };

    Quizgame.prototype.createHUD = function() {
        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = this.eyeview.width;
        this.hudCanvas.height = this.eyeview.height;
        this.hudTexture = new THREE.Texture(this.hudCanvas);
        this.updateHUD();
        var material = new THREE.MeshBasicMaterial( {map: this.hudTexture } );
        material.transparent = true;
        var planeGeometry = new THREE.PlaneGeometry( this.eyeview.width, this.eyeview.height );
        this.hudPlane = new THREE.Mesh( planeGeometry, material );
        this.cameraHUD = new THREE.OrthographicCamera(-this.eyeview.width/2, this.eyeview.width/2, this.eyeview.height/2, -this.eyeview.height/2, 0, 200 );
        this.sceneHUD = new THREE.Scene();
        this.sceneHUD.add(this.hudPlane);
        this.hudPlane.translateZ(-100);
    };

    Quizgame.prototype.updateHUD = function() {
        this.eyeview.width = window.innerWidth;
        this.eyeview.height = window.innerHeight;
        var fontsize = Math.round(this.eyeview.height/25);
        this.hudCanvas.width = this.eyeview.width;
        this.hudCanvas.height = this.eyeview.height;
        this.hudBitmap = this.hudCanvas.getContext('2d');
        this.hudBitmap.clearRect(0, 0, this.eyeview.width, this.eyeview.height);
        this.hudBitmap.font = fontsize+"px Arial";
        this.hudBitmap.textAlign = 'center';
        this.hudBitmap.fillStyle = "#f98012";
        var qnum = Math.min(this.level, this.questions.length-1);
        this.wrapText(this.hudBitmap, this.questions[qnum].question, this.eyeview.width / 2, this.eyeview.height*0.25, this.eyeview.width*0.66, fontsize);
        this.hudBitmap.font = fontsize+"px Arial";
        this.hudBitmap.textAlign = 'center';
        this.hudBitmap.fillStyle = "#f98012";
        this.hudBitmap.fillText('Score: ' + Math.round(this.score) + ' Level: ' + (this.level+1), this.eyeview.width / 2, this.eyeview.height*0.75);
        this.hudBitmap.beginPath();
        if (this.aimed) {
            this.hudBitmap.lineWidth = this.eyeview.height/100;
        } else {
            this.hudBitmap.lineWidth = this.eyeview.height/300;
        }
        this.hudBitmap.strokeStyle="#f98012";
        this.hudBitmap.arc(this.eyeview.width/2,this.eyeview.height/2,this.eyeview.height/20,0,2*Math.PI);
        this.hudBitmap.stroke();
        this.hudTexture.needsUpdate = true;
    }

    Quizgame.prototype.wrapText = function(context, text, x, y, maxWidth, lineHeight) {
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

    Quizgame.prototype.loadLevel = function() {
        for (var i = 0; i < this.currentTeam.length; i++) {
            var enemy = this.currentTeam[i];
            if (enemy.alive) {
                enemy.die(null, this);
            }
        }
        this.currentTeam = [];
        if (this.questions[this.level].type == 'multichoice') {
            var answers = this.questions[this.level].answers;
            for (var i  = 0; i < answers.length; i++) {
                var answer = answers[i];
                var enemy = this.enemyModel.clone();
                this.enemies.add(enemy);
                var enemyObject = new Enemy(enemy, answer.text, answer.fraction);
                this.objects.push(enemyObject);
                this.currentTeam.push(enemyObject);
                if (answer.fraction > 0) {
                    this.currentPointsLeft += answer.fraction;
                }
            }
        } else if (this.questions[this.level].type == 'match') {
            var i = 0;
            var stems = this.questions[this.level].stems;
            var fraction = 1 / stems.length;
            for (var i  = 0; i < stems.length; i++) {
                var stem = stems[i];
                this.currentPointsLeft += 1;
                var questionModel = this.enemyStemModel.clone();
                var answerModel = this.enemyChoiceModel.clone();
                var question = new MatchEnemy(questionModel, stem.question, fraction, -i);
                var answer = new MatchEnemy(answerModel, stem.answer, fraction, i);
                this.enemies.add(questionModel);
                this.enemies.add(answerModel);
                this.objects.push(question);
                this.objects.push(answer);
                this.currentTeam.push(question);
                this.currentTeam.push(answer);
            }
        }
        this.updateHUD();
    }
    Quizgame.prototype.nextLevel = function() {
        this.level++;
        if (this.level >= this.questions.length) {
            this.level = 0;
            //enemySpeed *= 1.3;
        }
        this.loadLevel();
    }

    Quizgame.prototype.resize = function() {
      var width = this.container.offsetWidth;
      var height = this.container.offsetHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.effect.setSize(width, height);
    }

    Quizgame.prototype.update = function(dt) {

      this.camera.updateProjectionMatrix();

      this.controls.update(dt);

      this.updateObjects(dt);
    }

    Quizgame.prototype.render = function(dt) {
        this.renderer.render(this.scene, this.camera);
        this.renderer.render(this.sceneHUD, this.cameraHUD);
    }

    Quizgame.prototype.animate = function(t) {

      this.update(this.clock.getDelta());
      this.render(this.clock.getDelta());

      requestAnimationFrame(Quizgame.prototype.animate.bind(this));
    }

    Quizgame.prototype.fullscreen = function() {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen();
      } else if (container.msRequestFullscreen) {
        this.container.msRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        this.container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        this.container.webkitRequestFullscreen();
      }
    }

    Quizgame.prototype.updateObjects = function(dt) {
        this.handleLaser(dt);
        for (var i = 0; i < this.objects.length; i++) {
            var object = this.objects[i];
            object.update(dt, this);
        }
    }

    Quizgame.prototype.shootLaser = function(position, rotation) {
        var laser = new THREE.Mesh(this.laserGeo, this.laserMaterialFriendly);
        this.scene.add(laser);
        this.objects.push(new Laser(laser, position, rotation));
        this.laserCharge = this.laserWaitTime;
        this.laserSide = -this.laserSide;
    }

    Quizgame.prototype.handleLaser = function(dt) {
        // See if we are currently pointing at a ship
        // update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera( new THREE.Vector2(0, 0), this.camera );

        // calculate objects intersecting the picking ray
        var intersects = this.raycaster.intersectObjects( this.enemies.children, true );
        var lastKnownAimed = this.aimed;
        this.aimed = false;

        for ( var i = 0; i < intersects.length; i++ ) {

            this.aimed = true;
            break;

        }
        if (!this.aimed) {
            this.laserCharge=0;
        }
        if (this.aimed != lastKnownAimed) {
            this.updateHUD();
        }
        if (this.laserCharge >= this.laserWaitTime+this.laserFullCharge && this.aimed) {
            var startingObj = new THREE.Object3D()
            startingObj.position.set(this.camera.position.x, this.camera.position.y-0.2, this.camera.position.z);
            startingObj.rotation.copy(this.camera.rotation);
            startingObj.translateX(this.laserSide*0.2);
            this.shootLaser(startingObj.position, startingObj.rotation);
        } else {
            this.laserCharge+=dt;
        }
    }

    Quizgame.prototype.playSound = function(soundName) {
        if (this.soundOn) {
            var soundElement = document.getElementById("mod_quizgame_sound_" + soundName);
            soundElement.currentTime = 0;
            soundElement.play();
        }
    }

    return Quizgame;
});
