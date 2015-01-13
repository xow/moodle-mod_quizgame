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
 * Prints a particular instance of quizgame
 *
 * You can have a rather longer description of the file as well,
 * if you like, and it can span multiple lines.
 *
 * @package    mod_quizgame
 * @copyright  2011 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');
require_once($CFG->dirroot . '/mod/quizgame/locallib.php');

$id = optional_param('id', 0, PARAM_INT); // course_module ID, or
$n  = optional_param('n', 0, PARAM_INT);  // quizgame instance ID - it should be named as the first character of the module

if ($id) {
    $cm         = get_coursemodule_from_id('quizgame', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $quizgame  = $DB->get_record('quizgame', array('id' => $cm->instance), '*', MUST_EXIST);
} elseif ($n) {
    $quizgame  = $DB->get_record('quizgame', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $quizgame->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('quizgame', $quizgame->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

/// Print the page header

$PAGE->set_url('/mod/quizgame/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($quizgame->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// other things you may want to set - remove if not needed
//$PAGE->set_cacheable(false);
//$PAGE->set_focuscontrol('some-html-id');
//$PAGE->add_body_class('quizgame-'.$somevar);

// Output starts here
echo $OUTPUT->header();

if ($quizgame->intro) { // Conditions to show the intro can change to look for own settings or whatever
    echo $OUTPUT->box(format_module_intro('quizgame', $quizgame, $cm->id), 'generalbox mod_introbox', 'quizgameintro');
}

echo $OUTPUT->heading(get_string('modulename', 'mod_quizgame'));

// game here

echo "<link href='http://fonts.googleapis.com/css?family=Audiowide' rel='stylesheet' type='text/css'>";
echo quizgame_addgame($quizgame, $context);
echo "<div class=fontloader>Loading game</div>";

// Finish the page
echo $OUTPUT->footer();
