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
 * Internal library of functions for module quizgame
 *
 * All the quizgame specific functions, needed to implement the module
 * logic, should go here. Never include this file from your lib.php!
 *
 * @package    mod_quizgame
 * @copyright  2014 John Okely <john@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/questionlib.php');

/**
 * Function to prepare strings to be printed out as JSON.
 *
 * @param stdClass $string The string to be cleaned
 * @return string The string, ready to be printed as JSON
 */
function quizgame_cleanup($string) {
    $string = strip_tags($string);
    $string = preg_replace('/"/', '\"', $string);
    $string = preg_replace('/[\n\r]/', ' ', $string);
    return $string;
}
/**
 * Function to add the students score to the DB.
 * @global type $USER
 * @global type $DB
 * @param type $quizgame
 * @param type $score
 * @return type
 */
function quizgame_add_highscore($quizgame, $score) {
    global $USER, $DB;

    $cm = get_coursemodule_from_instance('quizgame', $quizgame->id, 0, false, MUST_EXIST);
    $context = context_module::instance($cm->id);

    // Write the high score to the DB.
    $record = new stdClass();
    $record->quizgameid = $quizgame->id;
    $record->userid = $USER->id;
    $record->score = $score;
    $record->timecreated = time();
    $record->id = $DB->insert_record('quizgame_scores', $record);

    // Trigger the game score added event.
    $event = \mod_quizgame\event\game_score_added::create(array(
        'objectid' => $record->id,
        'context' => $context,
        'other' => array('score' => $score)
    ));

    $event->add_record_snapshot('quizgame', $quizgame);
    $event->add_record_snapshot('quizgame_scores', $record);
    $event->trigger();

    return $record->id;
}
