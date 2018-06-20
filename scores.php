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
 * Displays the high scores for a quizgame
 *
 *
 * @package    mod_quizgame
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once($CFG->dirroot . '/mod/quizgame/classes/table_scores.php');

$id = optional_param('id', 0, PARAM_INT); // The Quizgame instance.
$download = optional_param('download', '', PARAM_ALPHA);

if ($id) {
    $quizgame  = $DB->get_record('quizgame', array('id' => $id), '*', MUST_EXIST);
    $course     = $DB->get_record('course', array('id' => $quizgame->course), '*', MUST_EXIST);
    $cm         = get_coursemodule_from_instance('quizgame', $quizgame->id, $course->id, false, MUST_EXIST);
} else {
    error('You must specify a course_module ID or an instance ID');
}

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/quizgame:viewallscores', $context);


// Trigger scores viewed event.
$event = \mod_quizgame\event\game_scores_viewed::create(array(
    'objectid' => $quizgame->id,
    'context' => $context,
));

$event->add_record_snapshot('quizgame', $quizgame);
$event->trigger();

// Print the page header.
$PAGE->set_url('/mod/quizgame/scores.php', array('id' => $quizgame->id));
$PAGE->set_context($context);

// Generate the table.
$table = new table_scores('quizgame-scores');
$table->is_downloading($download, 'scores', 'scores');
if (!$table->is_downloading()) {
    // Only print headers if not asked to download data.
    // Print the page header.
    $PAGE->set_title(format_string($quizgame->name));
    $PAGE->set_heading(format_string($course->fullname));
    $url = new moodle_url('/mod/quizgame/scores.php', array('id' => $quizgame->id));
    $PAGE->navbar->add(get_string('playerscores', 'mod_quizgame'), $url);
    echo $OUTPUT->header();
    echo $OUTPUT->heading(get_string('modulename', 'mod_quizgame'));
}

// Work out the sql for the table.
$sqlconditions = 'quizgameid = :quizgameid';
$sqlparams = array('quizgameid' => $quizgame->id);
$table->set_sql('*', "{quizgame_scores}", $sqlconditions, $sqlparams);

$table->define_baseurl($PAGE->url);
$columns = array('userid', 'score', 'timecreated');
$headers = array(get_string('user'), get_string('scoreheader', 'mod_quizgame'), get_string('date'));
$table->define_columns($columns);
$table->define_headers($headers);
$table->sortable(true, 'timecreated', SORT_DESC);
$table->out(20, true);

if (!$table->is_downloading()) {
    echo $OUTPUT->footer();
}
