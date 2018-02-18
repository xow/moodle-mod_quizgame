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
 * @copyright  2014 John Okely <john@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');
require_once($CFG->dirroot . '/mod/quizgame/locallib.php');

$id = optional_param('id', 0, PARAM_INT); // Either course_module ID, or ...
$n  = optional_param('q', 0, PARAM_INT);  // ...quizgame instance ID - it should be named as the first character of the module.

if ($id) {
    $cm         = get_coursemodule_from_id('quizgame', $id, 0, false, MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $quizgame  = $DB->get_record('quizgame', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $quizgame  = $DB->get_record('quizgame', array('id' => $n), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $quizgame->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('quizgame', $quizgame->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);

// Trigger module viewed event.
$event = \mod_quizgame\event\course_module_viewed::create(array(
    'objectid' => $quizgame->id,
    'context' => $context,
));

$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('course_modules', $cm);
$event->add_record_snapshot('quizgame', $quizgame);
$event->trigger();

// Mark as viewed.
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Print the page header.

$PAGE->set_url('/mod/quizgame/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($quizgame->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);
$PAGE->set_focuscontrol('mod_quizgame_game');
$renderer = $PAGE->get_renderer('mod_quizgame');

// Output starts here.
echo $OUTPUT->header();

if ($quizgame->intro) {
    echo $OUTPUT->box(format_module_intro('quizgame', $quizgame, $cm->id), 'generalbox mod_introbox', 'quizgameintro');
}

echo $OUTPUT->heading(get_string('modulename', 'mod_quizgame'));

// Game here.
echo "<link href='http://fonts.googleapis.com/css?family=Audiowide' rel='stylesheet' type='text/css'>";
echo $renderer->render_game($quizgame, $context);
echo "<div class=fontloader>Loading game</div>";

// Finish the page.
echo $OUTPUT->footer();
