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
 * Library of interface functions and constants for module quizgame
 *
 * All the core Moodle functions, neeeded to allow the module to work
 * integrated in Moodle should be placed here.
 * All the quizgame specific functions, needed to implement all the module
 * logic, should go to locallib.php. This will help to save some memory when
 * Moodle is performing actions across all modules.
 *
 * @package    mod_quizgame
 * @copyright  2014 John Okely <john@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the information on whether the module supports a feature
 *
 * @see plugin_supports() in lib/moodlelib.php
 * @param string $feature FEATURE_xx constant for requested feature
 * @return mixed true if the feature is supported, null if unknown
 */
function quizgame_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        default:
            return null;
    }
}

/**
 * Saves a new instance of the quizgame into the database
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will create a new instance and return the id number
 * of the new instance.
 *
 * @param stdClass $quizgame An object from the form in mod_form.php
 * @param mod_quizgame_mod_form $mform The add instance form
 * @return int The id of the newly inserted quizgame record
 */
function quizgame_add_instance(stdClass $quizgame, mod_quizgame_mod_form $mform = null) {
    global $DB;

    $quizgame->timecreated = time();

    // TODO: Highscores.

    return $DB->insert_record('quizgame', $quizgame);
}

/**
 * Updates an instance of the quizgame in the database
 *
 * Given an object containing all the necessary data,
 * (defined by the form in mod_form.php) this function
 * will update an existing instance with new data.
 *
 * @param stdClass $quizgame An object from the form in mod_form.php
 * @param mod_quizgame_mod_form $mform
 * @return boolean Success/Fail
 */
function quizgame_update_instance(stdClass $quizgame, mod_quizgame_mod_form $mform = null) {
    global $DB;

    $quizgame->timemodified = time();
    $quizgame->id = $quizgame->instance;

    return $DB->update_record('quizgame', $quizgame);
}

/**
 * Removes an instance of the quizgame from the database
 *
 * Given an ID of an instance of this module,
 * this function will permanently delete the instance
 * and any data that depends on it.
 *
 * @param int $id Id of the module instance
 * @return boolean Success/Failure
 */
function quizgame_delete_instance($id) {
    global $DB;

    if (! $quizgame = $DB->get_record('quizgame', array('id' => $id))) {
        return false;
    }

    // TODO: Delete highscores.

    $DB->delete_records('quizgame', array('id' => $quizgame->id));

    return true;
}

/**
 * Returns a small object with summary information about what a
 * user has done with a given particular instance of this module
 * Used for user activity reports.
 * $return->time = the time they did it
 * $return->info = a short text description
 *
 * @param stdClass $course The course record.
 * @param stdClass $user The user record.
 * @param cm_info|stdClass $mod The course module info object or record.
 * @param stdClass $quizgame The quizgame instance record.
 * @return stdclass|null
 */
function quizgame_user_outline($course, $user, $mod, $quizgame) {

    $return = new stdClass();
    $return->time = 0;
    $return->info = '';
    return $return;
}

/**
 * Prints a detailed representation of what a user has done with
 * a given particular instance of this module, for user activity reports.
 *
 * @param stdClass $course the current course record
 * @param stdClass $user the record of the user we are generating report for
 * @param cm_info $mod course module info
 * @param stdClass $quizgame the module instance record
 * @return void, is supposed to echp directly
 */
function quizgame_user_complete($course, $user, $mod, $quizgame) {
}

/**
 * Given a course and a time, this module should find recent activity
 * that has occurred in quizgame activities and print it out.
 * Return true if there was output, or false is there was none.
 *
 * @param stdClass $course The course record.
 * @param bool $viewfullnames boolean to determine whether to show full names or not
 * @param int $timestart the time the rendering started
 * @return boolean True if the activity was printed, false otherwise
 */
function quizgame_print_recent_activity($course, $viewfullnames, $timestart) {
    return false;  // True if anything was printed, otherwise false.
}

/**
 * Prepares the recent activity data
 *
 * This callback function is supposed to populate the passed array with
 * custom activity records. These records are then rendered into HTML via
 * {@link quizgame_print_recent_mod_activity()}.
 *
 * @param array $activities sequentially indexed array of objects with the 'cmid' property
 * @param int $index the index in the $activities to use for the next record
 * @param int $timestart append activity since this time
 * @param int $courseid the id of the course we produce the report for
 * @param int $cmid course module id
 * @param int $userid check for a particular user's activity only, defaults to 0 (all users)
 * @param int $groupid check for a particular group's activity only, defaults to 0 (all groups)
 * @return void adds items into $activities and increases $index
 */
function quizgame_get_recent_mod_activity(&$activities, &$index, $timestart, $courseid, $cmid, $userid=0, $groupid=0) {
}

/**
 * Prints single activity item prepared by quizgame_get_recent_mod_activity
 *
 * @see quizgame_get_recent_mod_activity()
 *
 * @param object $activity The activity object of the quizgame
 * @param int $courseid The id of the course the quizgame resides in
 * @param bool $detail not used, but required for compatibilty with other modules
 * @param int $modnames not used, but required for compatibilty with other modules
 * @param bool $viewfullnames boolean to determine whether to show full names or not
 * @return void
 */
function quizgame_print_recent_mod_activity($activity, $courseid, $detail, $modnames, $viewfullnames) {
}

/**
 * Function to be run periodically according to the moodle cron
 * This function searches for things that need to be done, such
 * as sending out mail, toggling flags etc ...
 *
 * @return boolean
 * @todo Finish documenting this function
 **/
function quizgame_cron () {
    return true;
}

/**
 * Returns all other caps used in the module
 *
 * e.g. array('moodle/site:accessallgroups');
 * @return array of capabilities used in the module
 */
function quizgame_get_extra_capabilities() {
    return array();
}

// Gradebook API.
// TODO: Highscore entries in gradebook.

/**
 * Is a given scale used by the instance of quizgame?
 *
 * This function returns if a scale is being used by one quizgame
 * if it has support for grading and scales. Commented code should be
 * modified if necessary. See forum, glossary or journal modules
 * as reference.
 *
 * @param int $quizgameid ID of an instance of this module
 * @param int $scaleid ID of the scale
 * @return bool true if the scale is used by the given quizgame instance
 */
function quizgame_scale_used($quizgameid, $scaleid) {
    global $DB;

    if ($scaleid and $DB->record_exists('quizgame', array('id' => $quizgameid, 'grade' => -$scaleid))) {
        return true;
    } else {
        return false;
    }
}

/**
 * Checks if scale is being used by any instance of quizgame.
 *
 * This is used to find out if scale used anywhere.
 *
 * @param int $scaleid The id of the scale
 * @return boolean true if the scale is used by any quizgame instance
 */
function quizgame_scale_used_anywhere($scaleid) {
    global $DB;

    return false;
}

/**
 * Creates or updates grade item for the give quizgame instance
 *
 * Needed by grade_update_mod_grades() in lib/gradelib.php
 *
 * @param stdClass $quizgame instance object with extra cmidnumber and modname property
 * @param mixed $grades optional array/object of grade(s); 'reset' means reset grades in gradebook
 * @return void
 */
function quizgame_grade_item_update(stdClass $quizgame, $grades=null) {
    global $CFG;
    require_once($CFG->libdir.'/gradelib.php');

    $item = array();
    $item['itemname'] = clean_param($quizgame->name, PARAM_NOTAGS);
    $item['gradetype'] = GRADE_TYPE_VALUE;
    $item['grademax']  = $quizgame->grade;
    $item['grademin']  = 0;

    grade_update('mod/quizgame', $quizgame->course, 'mod', 'quizgame', $quizgame->id, 0, null, $item);
}

/**
 * Update quizgame grades in the gradebook
 *
 * Needed by grade_update_mod_grades() in lib/gradelib.php
 *
 * @param stdClass $quizgame instance object with extra cmidnumber and modname property
 * @param int $userid update grade of specific user only, 0 means all participants
 * @return void
 */
function quizgame_update_grades(stdClass $quizgame, $userid = 0) {
    global $CFG, $DB;
    require_once($CFG->libdir.'/gradelib.php');

    $grades = array(); // Populate array of grade objects indexed by userid.

    grade_update('mod/quizgame', $quizgame->course, 'mod', 'quizgame', $quizgame->id, 0, $grades);
}

// File API.

/**
 * Returns the lists of all browsable file areas within the given module context
 *
 * The file area 'intro' for the activity introduction field is added automatically
 * by {@link file_browser::get_file_info_context_module()}
 *
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @return array of [(string)filearea] => (string)description
 */
function quizgame_get_file_areas($course, $cm, $context) {
    return array();
}

/**
 * File browsing support for quizgame file areas
 *
 * @package mod_quizgame
 * @category files
 *
 * @param file_browser $browser
 * @param array $areas
 * @param stdClass $course
 * @param stdClass $cm
 * @param stdClass $context
 * @param string $filearea
 * @param int $itemid
 * @param string $filepath
 * @param string $filename
 * @return file_info instance or null if not found
 */
function quizgame_get_file_info($browser, $areas, $course, $cm, $context, $filearea, $itemid, $filepath, $filename) {
    return null;
}

/**
 * Serves the files from the quizgame file areas
 *
 * @package mod_quizgame
 * @category files
 *
 * @param stdClass $course the course object
 * @param stdClass $cm the course module object
 * @param stdClass $context the quizgame's context
 * @param string $filearea the name of the file area
 * @param array $args extra arguments (itemid, path)
 * @param bool $forcedownload whether or not force download
 * @param array $options additional options affecting the file serving
 */
function quizgame_pluginfile($course, $cm, $context, $filearea, array $args, $forcedownload, array $options=array()) {
    global $DB, $CFG;

    if ($context->contextlevel != CONTEXT_MODULE) {
        send_file_not_found();
    }

    require_login($course, true, $cm);

    send_file_not_found();
}

// Navigation API.

/**
 * Extends the global navigation tree by adding quizgame nodes if there is a relevant content
 *
 * This can be called by an AJAX request so do not rely on $PAGE as it might not be set up properly.
 *
 * @param navigation_node $navref An object representing the navigation tree node of the quizgame module instance
 * @param stdclass $course The course in which navigation is currently being extended
 * @param stdclass $module The module in which navigation is currently being extended
 * @param cm_info $cm The course module info
 * @return void
 */
function quizgame_extend_navigation(navigation_node $navref, stdclass $course, stdclass $module, cm_info $cm) {
}

/**
 * Extends the settings navigation with the quizgame settings
 *
 * This function is called when the context for the page is a quizgame module. This is not called by AJAX
 * so it is safe to rely on the $PAGE.
 *
 * @param settings_navigation $settingsnav {@link settings_navigation}
 * @param navigation_node $quizgamenode {@link navigation_node}
 */
function quizgame_extend_settings_navigation(settings_navigation $settingsnav, navigation_node $quizgamenode=null) {
}
