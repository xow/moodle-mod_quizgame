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
 * @module    mod_quizgame/Enemy
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['mod_quizgame/GameObject'], function(GameObject) {

    var degrees = Math.PI / 180;

    /**
     * Enemy constructor
     */
    function Enemy(object3d, answer, fraction) {
        GameObject.call(this, object3d);
        object3d.position.y = Math.random()*15;
        object3d.position.x = 40+Math.random()*20;
        object3d.position.z = (Math.random()-0.5)*50;
        this.object3d = object3d;
        this.answer = answer;
        this.fraction = fraction;
        this.rethink();
        setInterval(this.rethink.bind(this), (1+Math.random())*1000);
        this.addText();
        this.object3d.userData.enemyObj = this;
            console.log('finished constructor');
    }
    Enemy.prototype = Object.create(GameObject.prototype);
    Enemy.prototype.update = function(dt) {
        GameObject.prototype.update.call(this, dt);
        if (this.object3d.position.x < 0) {
            this.object3d.position.x = 60;
        }
        this.object3d.position.z = Math.min(this.object3d.position.z, 20);
        this.object3d.position.z = Math.max(this.object3d.position.z, -20);
        this.object3d.position.y = Math.min(this.object3d.position.y, 10);
        this.object3d.position.y = Math.max(this.object3d.position.y, -10);
    }
    Enemy.prototype.addText = function () {
        var width = 1024;
        var height = 128;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        var context = this.canvas.getContext('2d');
        context.font = "80px Arial";
        context.textAlign = 'center';
        context.fillStyle = "#FFFFFF";
        context.fillText(this.answer, width / 2, 80);
        var hudTexture = new THREE.Texture(this.canvas);
        hudTexture.needsUpdate = true;
        var material = new THREE.MeshBasicMaterial( {map: hudTexture } );
        material.transparent = true;
        var planeGeometry = new THREE.PlaneGeometry( width, height );
        this.questionPlane = new THREE.Mesh( planeGeometry, material );
        this.object3d.add(this.questionPlane);
        this.questionPlane.translateY(50);
        this.questionPlane.rotateY(-90*degrees);
    }
    Enemy.prototype.rethink = function() {
        this.velocity = new THREE.Vector3(
            -(Math.random()-0.25)*2,
            (Math.random()-0.25)*3,
            (Math.random()-0.5)*15
        );
        //this.rotationspeed = new THREE.Vector3(0, Math.random()*6-3, 0);
    }
    Enemy.prototype.die = function(dt, game) {
        //var i = currentTeam.indexOf(this);
        //currentTeam.splice(i, 1);
        this.alive = false;
        game.enemies.remove(this.object3d, game);
        GameObject.prototype.die.call(this, dt, game);
        game.score += this.fraction * 1000;
        if (this.fraction > 0) {
            game.currentPointsLeft -= this.fraction;
        }
    }
    Enemy.prototype.gotShot = function(shot, dt, game) {
        if (this.fraction > 0) {
            shot.die(dt, game);
            this.die(dt, game);
            if (this.fraction >= 1 || (this.fraction > 0 && game.currentPointsLeft <= 0)) {
                game.nextLevel();
            }
            game.playSound("explosion");
        } else {
            game.score += (this.fraction - 0.5) * 1;
            game.updateHUD();
            shot.deflect(game);
        }
    }

    return Enemy;
});
