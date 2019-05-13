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
 * table_sql class for viewing and exporting player scores.
 *
 * @package    mod_quizgame
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->libdir . '/tablelib.php');

/**
 * table_sql class for viewing and exporting player scores.
 *
 * @package    mod_quizgame
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class table_scores extends table_sql {

    /** @var array list of user fullnames shown in report */
    private $userfullnames = array();

    /**
     * Constructor
     * @param int $uniqueid all tables have to have a unique id, this is used
     *      as a key when storing table properties like sort order in the session.
     */
    public function __construct($uniqueid) {
        parent::__construct($uniqueid);
        // Define the list of columns to show.
        $columns = array('userid', 'score', 'timecreated');
        $this->define_columns($columns);

        // Define the titles of columns to show in header.
        $headers = array(get_string('user'), get_string('scoreheader', 'mod_quizgame'), get_string('date'));
        $this->define_headers($headers);
    }

    /**
     * Generate the time column.
     *
     * @param stdClass $record data.
     * @return string HTML for the time column
     */
    public function col_timecreated($record) {

        if (empty($this->download)) {
            $dateformat = get_string('strftimerecentfull', 'core_langconfig');
        } else {
            $dateformat = get_string('strftimedatetimeshort', 'core_langconfig');
        }
        return userdate($record->timecreated, $dateformat);
    }

    /**
     * Generate the user name column.
     *
     * @param stdClass $record data.
     * @return string HTML for the time column
     */
    public function col_userid($record) {
        global $DB;

        if (!empty($this->userfullnames[$record->userid])) {
            return $this->userfullnames[$record->userid];
        }

        // If we reach that point new users logs have been generated since the last users db query.
        list($usql, $uparams) = $DB->get_in_or_equal($record->userid);
        $sql = "SELECT id," . get_all_user_name_fields(true) . " FROM {user} WHERE id " . $usql;
        if (!$user = $DB->get_records_sql($sql, $uparams)) {
            // This should never happen.
            return 'UNKNOWN';
        }

        $this->userfullnames[$record->userid] = fullname($user[$record->userid]);
        return $this->userfullnames[$record->userid];
    }
}
