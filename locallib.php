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
 * Initialises the game and prints it to the screen
 *
 * @param array $enemies An array of Enemy objects
 * @return object
 */
function quizgame_startgame($enemies) {
}

/**
 * Initialises the game and returns its HTML code
 *
 * @param array $enemies An array of Enemy objects
 * @return string The HTML code of the game
 */
function quizgame_addgame($enemies) {
    global $PAGE;

    $PAGE->requires->js('/mod/quizgame/quizgame.js');

    $display = "";

    $questions = question_load_questions(null);

    $display .= "<ul>";

    foreach ($questions as $question) {
        $display .= "<li>" . $question->questiontext . "<ul>";
        foreach ($question->options->answers as $answer) {
            $display .= "<li>" . ($answer->fraction == 1 ? "<strong>" : "") . $answer->answer . ($answer->fraction == 1 ? "</strong>" : "") . "</li>";
        }
        $display .= "</ul></li>";
    }

    $display .= "<ul>";

    $display = "<canvas id=\"mod_quizgame_game\"></canvas>";

    return $display;
}

class Enemy extends stdClass {
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
