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
 * @copyright  2011 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/questionlib.php');

/**
 * Initialises the game and returns its HTML code
 *
 * @param context $context The context
 * @return string The HTML code of the game
 */
function quizgame_addgame($context, $course) {
    global $PAGE, $DB;

    $PAGE->requires->strings_for_js(array(
            'score',
            'emptyquiz',
            'endofgame',
            'spacetostart'
        ), 'mod_quizgame');
    $PAGE->requires->js('/mod/quizgame/quizgame.js');

    $categories = $DB->get_records('question_categories', array('contextid' => $context->get_parent_context()->__get('id')));
    $category_ids = [];
    foreach ($categories as $category) {
        $category_ids[] = $category->id;
    }

    $questions = question_load_questions(null);

    $display = "<script>var questions = [\n";

    foreach ($questions as $question) {
        if ($question->qtype == "multichoice" && in_array($question->category, $category_ids)) {
            $display .= "{\nquestion: \"" . preg_replace('/\n/', ' ', strip_tags($question->questiontext)) . "\",\nanswers: [";
            foreach ($question->options->answers as $answer) {
                $display .= "{text: \"" . preg_replace('/\n/', ' ', strip_tags($answer->answer)) . "\", fraction: " . $answer->fraction. "},\n";
            }
            $display .= "]\n},\n";
        }
    }

    $display .= "];</script>";

    $display .= '<canvas id="mod_quizgame_game"></canvas>';
    $display .= '<audio id="mod_quizgame_sound_laser" preload="auto">'.
                '<source src="sound/Laser.wav" type="audio/wav" />'.
                '</audio>';
    $display .= '<audio id="mod_quizgame_sound_explosion" preload="auto">'.
                '<source src="sound/Explosion.wav" type="audio/wav" />'.
                '</audio>';
    $display .= '<audio id="mod_quizgame_sound_deflect" preload="auto">'.
                '<source src="sound/Deflect.wav" type="audio/wav" />'.
                '</audio>';
    $display .= '<audio id="mod_quizgame_sound_enemylaser" preload="auto">'.
                '<source src="sound/EnemyLaser.wav" type="audio/wav" />'.
                '</audio>';

    return $display;
}

/**
 * Does something really useful with the passed things
 *
 * @param array $things
 * @return object
 */
//function quizgame_do_something_useful(array $things) {
//    return new stdClass();
//}
