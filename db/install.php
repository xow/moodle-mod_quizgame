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
 * This file replaces the legacy STATEMENTS section in db/install.xml,
 * lib.php/modulename_install() post installation hook and partially defaults.php
 *
 * @package    mod_quizgame
 * @copyright  2011 Your Name <your@email.adress>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Post installation procedure
 *
 * @see upgrade_plugins_modules()
 */
function xmldb_quizgame_install() {
    global $DB, $CFG;
    require_once($CFG->dirroot.'/mod/quizgame/lib.php');
    //check or add the category
    $strhighscore = get_string('modulename', 'mod_quizgame');
    if (!$category = $DB->get_record('user_info_category', array('name'=>$strhighscore))) {
        $sql = 'SELECT MAX(sortorder) FROM {user_info_category}';
        if ($sort = $DB->get_record_sql($sql)) {
            $sortorder = $sort->max;
        } else {
            $sortorder = 0;
        }
        $category = new StdClass;
        $category->name = $strhighscore;
        $category->sortorder = $sortorder + 1;
        $category->id = $DB->insert_record('user_info_category', $category);
    }
    //check or add the user profile field
    if (!$DB->count_records('user_info_field', array('shortname'=>'quizgame_highscore'))) {
        $field = new StdClass;
        $field->shortname = 'quizgame_highscore';
        $field->name = $strhighscore;
        $field->datatype = 'text';
        $field->description = 'The highest score that the user has gotten in any quizventure game';
        $field->descriptionformat = 1;
        $field->categoryid = $category->id;
        $field->sortorder = 1;
        $field->required = 0;
        $field->locked = 0;
        $field->visible = 1;
        $field->forceunique = 0;
        $field->signup = 0;
        $field->defaultdata = '0';
        $field->defaultdataformat = 0;
        $DB->insert_record('user_info_field', $field);
    }
}

/**
 * Post installation recovery procedure
 *
 * @see upgrade_plugins_modules()
 */
function xmldb_quizgame_install_recovery() {
}
