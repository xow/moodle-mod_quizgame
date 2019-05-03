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
 * Structure step to restore one quizgame activity.
 *
 * @package mod_quizgame
 * @subpackage backup-moodle2
 * @copyright 2018 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Structure step to restore one quizgame activity.
 *
 * @package mod_quizgame
 * @subpackage backup-moodle2
 * @copyright 2018 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class restore_quizgame_activity_structure_step extends restore_activity_structure_step {

    /**
     * DB structure for a quizgame.
     */
    protected function define_structure() {

        $paths = array();
        $userinfo = $this->get_setting_value('userinfo');

        $paths[] = new restore_path_element('quizgame', '/activity/quizgame');
        if ($userinfo) {
            $paths[] = new restore_path_element('quizgame_score', '/activity/quizgame/scores/score');
        }

        // Return the paths wrapped into standard activity structure.
        return $this->prepare_activity_structure($paths);
    }

    /**
     * Function to restore the quizgame activity
     * @param StdClass $data
     */
    protected function process_quizgame($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;
        $oldcourse = $data->course;
        $data->course = $this->get_courseid();

        // Map the category in the QB.
        // Data is stored either as id / context or just id.
        $category = explode(",", $data->questioncategory);
        if (count($category) > 1) {
            // Question category here was stored as id,context.
            // Get the new mapping to the category.
            $newcat = $this->get_mappingid('question_category', $category[0]);
            // Now get the context for this category.
            $newcontext = $DB->get_field('question_categories', 'contextid', array('id' => $newcat));
            // Assemble the field data.
            if (!empty($newcat)) {
                $data->questioncategory = implode(',', array($newcat, $newcontext));
            } else {
                if (!$this->task->is_samesite() || $data->course != $oldcourse) {
                    // We cannot map to the question category.
                    // They were not included in the backup since they were at a higher context.
                    // This can happen when we are backing up the activity alone and trying to restore it elsewhere.
                    $this->log('question category ' . $category[0] . ' was associated with the quizgame ' .
                        $data->id . ' but cannot actually be used as it is not available in this backup. ' .
                        'The category needs to be re-selected.', backup::LOG_INFO);

                    // Remove the old data.
                    $data->questioncategory = "";
                }
            }

        } else {
            // The qustion category was just stored as an ID, so find the new mapping.
            $data->questioncategory = $this->get_mappingid('question_category', $category);
        }
        // Insert the quizgame record.
        $newitemid = $DB->insert_record('quizgame', $data);
        // Immediately after inserting "activity" record, call this.
        $this->apply_activity_instance($newitemid);
        $this->set_mapping('quizgame', $oldid, $newitemid);
    }

    /**
     * Function to restore a single play through
     * @param StdClass $data
     */
    protected function process_quizgame_score($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->quizgameid = $this->get_new_parentid('quizgame');
        $data->userid = $this->get_mappingid('user', $data->userid);

        $newitemid = $DB->insert_record('quizgame_scores', $data);
        $this->set_mapping('quizgame_scores', $oldid, $newitemid, true); // Files by this itemname.
    }

    /**
     * After restore hook, process file attachments.
     */
    protected function after_execute() {
        // Add quizgame related files, no need to match by itemname (just internally handled context).
        $this->add_related_files('mod_quizgame', 'intro', null);

    }
}
