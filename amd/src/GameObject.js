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
 * @module    mod_quizgame/GameObject
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define([], function() {
    /**
     * GameObject constructor
     */
    function GameObject(object3d) {
        this.object3d = object3d;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotationspeed = new THREE.Vector3(0, 0, 0);
        this.alive = true;
    }
    GameObject.prototype.update = function(dt) {
        this.object3d.translateX(this.velocity.x*dt);
        this.object3d.translateY(this.velocity.y*dt);
        this.object3d.translateZ(this.velocity.z*dt);
        this.object3d.rotateX(this.rotationspeed.x*dt);
        this.object3d.rotateY(this.rotationspeed.y*dt);
        this.object3d.rotateZ(this.rotationspeed.z*dt);
    }
    GameObject.prototype.remove = function(dt, game) {
        game.scene.remove(this.object3d);
        var i = game.objects.indexOf(this);
        game.objects.splice(i, 1);
    }
    GameObject.prototype.die = function(dt, game) {
        this.remove(dt, game);
    }
    GameObject.prototype.gotShot = function(shot) {
        // By default nothing happens.
    }

    return GameObject;
});
