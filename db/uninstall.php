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
 * @see uninstall_plugin()
 *
 * @package    mod_quizgame
 * @copyright  2011 Your Name <your@email.adress>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Custom uninstallation procedure
 */
function xmldb_quizgame_uninstall() {
    global $DB, $CFG;
    require_once($CFG->dirroot.'/mod/quizgame/lib.php');
    // remove the category
    $strhighscore = get_string('modulename', 'mod_quizgame');
    if ($DB->count_records('user_info_category', array('name'=>$strhighscore))) {
        $DB->delete_records('user_info_category', array('name'=>$strhighscore));
    }
    // remove the user profile field
    if ($DB->count_records('user_info_field', array('shortname'=>'quizgame_highscore'))) {
        $DB->delete_records('user_info_field', array('shortname'=>'quizgame_highscore'));
    }
    return true;
}
