<?php
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
 * Quizgame external functions and service definitions.
 *
 * @package    mod_quizgame
 * @category   external
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @since      Moodle 3.5
 */

defined('MOODLE_INTERNAL') || die;

$functions = array(

    'mod_quizgame_update_score' => array(
        'classname'     => 'mod_quizgame_external',
        'methodname'    => 'update_score',
        'description'   => 'Record the score and write to the database.',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'mod/quizgame:view',
    ),
        'mod_quizgame_start_game' => array(
        'classname'     => 'mod_quizgame_external',
        'methodname'    => 'start_game',
        'description'   => 'Log the player starting the game',
        'type'          => 'write',
        'ajax'          => true,
        'capabilities'  => 'mod/quizgame:view',
    )
);
