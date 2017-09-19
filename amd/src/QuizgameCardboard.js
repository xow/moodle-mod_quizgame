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
 * @module    mod_quizgame/QuizgameCardboard
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery', 'mod_quizgame/Quizgame'], function($, Quizgame) {
    QuizgameCardboard = function(q) {
        Quizgame.call(this, q);
        this.eyeview = {width: Math.max(screen.width, screen.height)/2, height: Math.min(screen.width, screen.height)};
    };
    QuizgameCardboard.prototype = Object.create(Quizgame.prototype);
    QuizgameCardboard.prototype.constructor = QuizgameCardboard;
    QuizgameCardboard.prototype.render = function () {
        this.effect.render(this.scene, this.camera); // Use a simple split screen for Google Cardboard.
    }
    QuizgameCardboard.prototype.createHUD = function () {
        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = this.eyeview.width;
        this.hudCanvas.height = this.eyeview.height;
        this.hudTexture = new THREE.Texture(this.hudCanvas);
        this.updateHUD();
        var material = new THREE.MeshBasicMaterial( {map: this.hudTexture } );
        material.transparent = true;
        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = this.eyeview.width;
        this.hudCanvas.height = this.eyeview.height;
        this.hudTexture = new THREE.Texture(this.hudCanvas);
        this.updateHUD();
        var material = new THREE.MeshBasicMaterial( {map: this.hudTexture } );
        material.transparent = true;
        var planeGeometry = new THREE.PlaneGeometry( 1, 1 );
        this.hudPlane = new THREE.Mesh( planeGeometry, material );
        this.camera.add(this.hudPlane);
        this.hudPlane.translateZ(-0.5);
    }

    QuizgameCardboard.prototype.updateHUD = function() {
        this.eyeview.width = window.innerWidth/2;
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
        this.wrapText(this.hudBitmap, this.questions[qnum].question, this.eyeview.width / 2, this.eyeview.height*0.3, this.eyeview.width*0.66, fontsize);
        this.hudBitmap.font = fontsize+"px Arial";
        this.hudBitmap.textAlign = 'center';
        this.hudBitmap.fillStyle = "#f98012";
        this.hudBitmap.fillText('Score: ' + Math.round(this.score) + ' Level: ' + (this.level+1), this.eyeview.width / 2, this.eyeview.height*0.7);
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
});
