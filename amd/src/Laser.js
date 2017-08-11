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
 * @module    mod_quizgame/Laser
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['mod_quizgame/GameObject'], function(GameObject) {

    var degrees = Math.PI / 180;

    /**
     * Laser constructor
     */
    function Laser(object3d, position, rotation) {
        GameObject.call(this, object3d);
        this.velocity = new THREE.Vector3(0, 0, -60);
        this.object3d.position.set(position.x, position.y, position.z);
        this.object3d.rotation.copy(rotation);
        this.life = 3;
        this.friendly = true;
    }
    Laser.prototype = Object.create(GameObject.prototype);
    Laser.prototype.update = function(dt, game) {
        GameObject.prototype.update.call(this, dt, game);
        this.life -= dt;
        if (this.life < 0) {
            this.die(dt, game);
        }
        var direction = new THREE.Vector3( 0, 0, 1 );
        direction.applyQuaternion( this.object3d.quaternion );
        game.raycaster.set( this.object3d.position, direction );

        // calculate objects intersecting the picking ray
        if (this.friendly) {
            var intersects = game.raycaster.intersectObjects( game.enemies.children,true );
            for ( var i = 0; i < intersects.length; i++ ) {
                var shipModel = intersects[i].object.parent.parent;
                if (shipModel.userData.enemyObj) {
                    shipModel.userData.enemyObj.gotShot(this, dt, game);
                }
                break;

            }
        }
    }
    Laser.prototype.deflect = function(game) {
        this.object3d.rotateY(180*degrees);
        this.friendly = !this.friendly;
        this.object3d.material = game.laserMaterialUnfriendly;
        game.playSound("deflect");
    }

    return Laser;
});
