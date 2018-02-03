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
 * @package mod_quizgame
 * @subpackage backup-moodle2
 * @copyright 2018 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Structure step to restore one quizgame activity.
 */
class restore_quizgame_activity_structure_step extends restore_activity_structure_step {

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

    protected function process_quizgame($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;
        $data->course = $this->get_courseid();

        // Map the category in the QB.
        $data->questioncategory = $this->get_mappingid('question_category', $data->questioncategory);
        // Insert the quizgame record.
        $newitemid = $DB->insert_record('quizgame', $data);
        // Immediately after inserting "activity" record, call this.
        $this->apply_activity_instance($newitemid);
        $this->set_mapping('quizgame', $oldid, $newitemid);
    }

    protected function process_quizgame_score($data) {
        global $DB;

        $data = (object)$data;
        $oldid = $data->id;

        $data->quizgameid = $this->get_new_parentid('quizgame');
        $data->userid = $this->get_mappingid('user', $data->userid);

        $newitemid = $DB->insert_record('quizgame_scores', $data);
        $this->set_mapping('quizgame_scores', $oldid, $newitemid, true); // Files by this itemname.
    }


    protected function after_execute() {
        // Add quizgame related files, no need to match by itemname (just internally handled context).
        $this->add_related_files('mod_quizgame', 'intro', null);

    }
}
