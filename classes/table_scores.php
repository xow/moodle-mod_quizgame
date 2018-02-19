<?php
/**
 * Test table class to be put in test_table.php of root of Moodle installation.
 *  for defining some custom column names and proccessing
 * Username and Password fields using custom and other column methods.
 */
global $CFG;
require_once($CFG->libdir . '/tablelib.php');

class table_scores extends table_sql {

    /** @var array list of user fullnames shown in report */
    private $userfullnames = array();

    /**
     * Constructor
     * @param int $uniqueid all tables have to have a unique id, this is used
     *      as a key when storing table properties like sort order in the session.
     */
    function __construct($uniqueid) {
        parent::__construct($uniqueid);
        // Define the list of columns to show.
        $columns = array('userid', 'score', 'timecreated');
        $this->define_columns($columns);

        // Define the titles of columns to show in header.
        $headers = array(get_string('user'), get_string('scoreheader','mod_quizgame'), get_string('date'));
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
