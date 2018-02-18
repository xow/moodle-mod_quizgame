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
 * This file keeps track of upgrades to the quizgame module
 *
 * Sometimes, changes between versions involve alterations to database
 * structures and other major things that may break installations. The upgrade
 * function in this file will attempt to perform all the necessary actions to
 * upgrade your older installation to the current version. If there's something
 * it cannot do itself, it will tell you what you need to do.  The commands in
 * here will all be database-neutral, using the functions defined in DLL libraries.
 *
 * @package    mod_quizgame
 * @copyright  2014 John Okely <john@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Execute quizgame upgrade from the given old version
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_quizgame_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager(); // Loads ddl manager and xmldb classes.

    if ($oldversion < 2014091101) {

        // Define field quizgameid to be added to quizgame_scores.
        $table = new xmldb_table('quizgame_scores');
        $field = new xmldb_field('quizgameid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null, 'id');

        // Conditionally launch add field quizgameid.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Quizgame savepoint reached.
        upgrade_mod_savepoint(true, 2014091101, 'quizgame');
    }

    if ($oldversion < 2015011300) {

        // Define field questioncategory to be added to quizgame.
        $table = new xmldb_table('quizgame');
        $field = new xmldb_field('questioncategory', XMLDB_TYPE_TEXT, null, null, null, null, null, 'timemodified');

        // Conditionally launch add field questioncategory.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Quizgame savepoint reached.
        upgrade_mod_savepoint(true, 2015011300, 'quizgame');
    }

    if ($oldversion < 2017011100) {

        // Define field grade to be added to quizgame.
        $table = new xmldb_table('quizgame');
        $field = new xmldb_field('grade', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '100', 'questioncategory');

        // Conditionally launch add field grade.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Quizgame savepoint reached.
        upgrade_mod_savepoint(true, 2017011100, 'quizgame');
    }

    if ($oldversion < 2018021300) {

        // Define field timecreated to be added to quizgame_scores.
        $table = new xmldb_table('quizgame_scores');
        $field = new xmldb_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, null, null, null, 'score');

        // Conditionally launch add field timecreated.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Quizgame savepoint reached.
        upgrade_mod_savepoint(true, 2018021300, 'quizgame');
    }

    if ($oldversion < 2018021700) {

        // Define field completionscore to be added to quizgame.
        $table = new xmldb_table('quizgame');
        $field = new xmldb_field('completionscore', XMLDB_TYPE_INTEGER, '20', null, null, null, null, 'grade');

        // Conditionally launch add field completionscore.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Quizgame savepoint reached.
        upgrade_mod_savepoint(true, 2018021700, 'quizgame');
    }

    // Final return of upgrade result (true, all went good) to Moodle.
    return true;
}
