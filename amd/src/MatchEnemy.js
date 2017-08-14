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
 * @module    mod_quizgame/MatchEnemy
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['mod_quizgame/Enemy', 'mod_quizgame/GameObject'], function(Enemy, GameObject) {

    var degrees = Math.PI / 180;

    /**
     * Enemy constructor
     */
    function MatchEnemy(object3d, answer, fraction, pairid) {
        Enemy.call(this, object3d, answer, fraction, pairid);
        this.pairid = pairid;
    }
    MatchEnemy.prototype = Object.create(Enemy.prototype);

    return MatchEnemy;
});
