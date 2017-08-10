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
 * @module    mod_quizgame/QuizgameVive
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'mod_quizgame/Quizgame'], function($, Quizgame) {
    QuizgameVive = function(q) {
        Quizgame.call(this, q);
        this.controller1;
        this.controller2;
    };
    QuizgameVive.prototype = Object.create(Quizgame.prototype);
    QuizgameVive.prototype.constructor = QuizgameVive;
    QuizgameVive.prototype.render = function () {
        this.controller1.update();
        this.controller2.update();
        this.renderer.render(this.scene, this.camera);
    }
    QuizgameVive.prototype.handleLaser = function (dt) {
        // We have controls, so we can have a more interactive way to shoot. See handleViveTrigger
    }
    QuizgameVive.prototype.initGame = function () {
        Quizgame.prototype.initGame.call(this);

        this.renderer.vr.enabled = true;
        this.renderer.vr.standing = true;

		  var geometry = new THREE.Geometry();
		  geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		  geometry.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

          var material = new THREE.LineBasicMaterial({
        	color: 0xf98012
            });

		  var line = new THREE.Line( geometry, material );
		  line.name = 'line';
		  line.scale.z = 20;

        this.controller1 = new THREE.ViveController(0);
        console.log(this.controller1);
        this.controller1.standingMatrix = this.renderer.vr.getStandingMatrix();
		this.controller1.addEventListener( 'triggerdown', this.handleViveTrigger1.bind(this) );
		this.controller1.add( line.clone() );
        this.scene.add( this.controller1 );

        this.controller2 = new THREE.ViveController(1);
        this.controller2.standingMatrix = this.renderer.vr.getStandingMatrix();
		this.controller2.addEventListener( 'triggerdown', this.handleViveTrigger2.bind(this) );
	    this.controller2.add( line.clone() );
        this.scene.add( this.controller2 );

        // Load controllers
        var loader = new THREE.OBJLoader();
        loader.setPath( 'models/obj/vive-controller/' );
        loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

            var loader = new THREE.TextureLoader();
            loader.setPath( 'models/obj/vive-controller/' );

            var controller = object.children[ 0 ];
            controller.material.map = loader.load( 'onepointfive_texture.png' );
            controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

            this.controller1.add( object.clone() );
            this.controller2.add( object.clone() );
            this.controller2.add( this.hudPlane );

        }.bind(this) );

        WEBVR.getVRDisplay( function ( display ) {
        	  this.renderer.vr.setDevice( display );
        	  document.body.appendChild( WEBVR.getButton( display, this.renderer.domElement ) );
        }.bind(this) );
        WEBVR.checkAvailability().catch( function( message ) {
				document.body.appendChild( WEBVR.getMessageContainer( message ) );
			} );
    }

    QuizgameVive.prototype.handleViveTrigger1 = function() {
        this.shootLaser(this.controller1, false);
    }

    QuizgameVive.prototype.handleViveTrigger2 = function() {
        this.shootLaser(this.controller2, false);
    }
});
