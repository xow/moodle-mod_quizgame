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
 * mod_quizgame generator tests
 *
 * @package    mod_quizgame
 * @category   test
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Genarator tests class for mod_quizgame.
 *
 * @package    mod_quizgame
 * @category   test
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_quizgame_generator_testcase extends advanced_testcase {

    public function test_create_instance() {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();

        $this->assertFalse($DB->record_exists('quizgame', array('course' => $course->id)));
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course));
        $records = $DB->get_records('quizgame', array('course' => $course->id), 'id');
        $this->assertCount(1, $records);
        $this->assertTrue(array_key_exists($quizgame->id, $records));

        $params = array('course' => $course->id, 'name' => 'Another quizgame');
        $quizgame = $this->getDataGenerator()->create_module('quizgame', $params);
        $records = $DB->get_records('quizgame', array('course' => $course->id), 'id');
        $this->assertCount(2, $records);
        $this->assertEquals('Another quizgame', $records[$quizgame->id]->name);
    }

    public function test_create_content() {
        global $DB;
        $this->resetAfterTest();
        $this->setAdminUser();

        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course));
        $quizgamegenerator = $this->getDataGenerator()->get_plugin_generator('mod_quizgame');

        $playthrough1 = $quizgamegenerator->create_content($quizgame);
        $playthrough2 = $quizgamegenerator->create_content($quizgame, array('score' => 3550));
        $records = $DB->get_records('quizgame_scores', array('quizgameid' => $quizgame->id), 'id');
        $this->assertCount(2, $records);
        $this->assertEquals($playthrough1->id, $records[$playthrough1->id]->id);
        $this->assertEquals($playthrough2->id, $records[$playthrough2->id]->id);
        $this->assertEquals(3550, $records[$playthrough2->id]->score);
    }
}
