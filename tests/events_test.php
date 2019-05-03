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
 * Unit tests for lib.php
 *
 * @package    mod_quizgame
 * @category   test
 * @copyright  2015 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/mod/quizgame/locallib.php');

/**
 * Unit tests for quizgame events.
 *
 * @package    mod_quizgame
 * @category   test
 * @copyright  2015 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_quizgame_event_testcase extends advanced_testcase {

    /**
     * Test setup.
     */
    public function setUp() {
        $this->resetAfterTest();
    }

    /**
     * Test the course_module_viewed event.
     */
    public function test_course_module_viewed() {
        global $DB;
        // There is no proper API to call to trigger this event, so what we are
        // doing here is simply making sure that the events returns the right information.

        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course->id));

        $dbcourse = $DB->get_record('course', array('id' => $course->id));
        $dbquizgame = $DB->get_record('quizgame', array('id' => $quizgame->id));
        $context = context_module::instance($quizgame->cmid);

        $event = \mod_quizgame\event\course_module_viewed::create(array(
            'objectid' => $dbquizgame->id,
            'context' => $context,
        ));

        $event->add_record_snapshot('course', $dbcourse);
        $event->add_record_snapshot('quizgame', $dbquizgame);

        // Triggering and capturing the event.
        $sink = $this->redirectEvents();
        $event->trigger();
        $events = $sink->get_events();
        $this->assertCount(1, $events);
        $event = reset($events);

        // Checking that the event contains the expected values.
        $this->assertInstanceOf('\mod_quizgame\event\course_module_viewed', $event);
        $this->assertEquals(CONTEXT_MODULE, $event->contextlevel);
        $this->assertEquals($quizgame->cmid, $event->contextinstanceid);
        $this->assertEquals($quizgame->id, $event->objectid);
        $expected = array($course->id, 'quizgame', 'view', 'view.php?id=' . $quizgame->cmid,
            $quizgame->id, $quizgame->cmid);

        $this->assertEquals(new moodle_url('/mod/quizgame/view.php', array('id' => $quizgame->cmid)), $event->get_url());
        $this->assertEventContextNotUsed($event);
    }

    /**
     * Test the course_module_instance_list_viewed event.
     */
    public function test_course_module_instance_list_viewed() {
        // There is no proper API to call to trigger this event, so what we are
        // doing here is simply making sure that the events returns the right information.

        $course = $this->getDataGenerator()->create_course();

        $event = \mod_quizgame\event\course_module_instance_list_viewed::create(array(
            'context' => context_course::instance($course->id)
        ));

        // Triggering and capturing the event.
        $sink = $this->redirectEvents();
        $event->trigger();
        $events = $sink->get_events();
        $this->assertCount(1, $events);
        $event = reset($events);

        // Checking that the event contains the expected values.
        $this->assertInstanceOf('\mod_quizgame\event\course_module_instance_list_viewed', $event);
        $this->assertEquals(CONTEXT_COURSE, $event->contextlevel);
        $this->assertEquals($course->id, $event->contextinstanceid);
        $expected = array($course->id, 'quizgame', 'view all', 'index.php?id='.$course->id, '');
        $this->assertEventLegacyLogData($expected, $event);
        $this->assertEventContextNotUsed($event);
    }

    /**
     * Test the score_added event.
     */
    public function test_score_added() {

        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course));
        $context = context_module::instance($quizgame->cmid);
        $score = mt_rand (0, 50000);

        $sink = $this->redirectEvents();
        $result = quizgame_add_highscore($quizgame, $score);

        $events = $sink->get_events();
        $this->assertCount(1, $events);
        $event = reset($events);

        // Checking that the event contains the expected values.
        $this->assertInstanceOf('\mod_quizgame\event\game_score_added', $event);
        $this->assertEquals(CONTEXT_MODULE, $event->contextlevel);
        $this->assertEquals($quizgame->cmid, $event->contextinstanceid);
        $this->assertEquals($score, $event->other['score']);
    }

    /**
     * Test the game_started event.
     */
    public function test_game_started() {

        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course));
        $context = context_module::instance($quizgame->cmid);

        $sink = $this->redirectEvents();
        $result = quizgame_log_game_start($quizgame);

        $events = $sink->get_events();
        $this->assertCount(1, $events);
        $event = reset($events);

        // Checking that the event contains the expected values.
        $this->assertInstanceOf('\mod_quizgame\event\game_started', $event);
        $this->assertEquals(CONTEXT_MODULE, $event->contextlevel);
        $this->assertEquals($quizgame->cmid, $event->contextinstanceid);
    }

    /**
     * Test the game_scores_viewed event.
     */
    public function test_game_scores_viewed() {
        // There is no proper API to call to trigger this event, so what we are
        // doing here is simply making sure that the events returns the right information.

        $this->setAdminUser();
        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course));
        $context = context_module::instance($quizgame->cmid);

        $quizgamegenerator = $this->getDataGenerator()->get_plugin_generator('mod_quizgame');
        $scores = $quizgamegenerator->create_content($quizgame);

        $event = \mod_quizgame\event\game_scores_viewed::create(array(
            'objectid' => $quizgame->id,
            'context' => $context
        ));

        $sink = $this->redirectEvents();
        $event->trigger();
        $events = $sink->get_events();
        $this->assertCount(1, $events);
        $event = reset($events);

        // Checking that the event contains the expected values.
        $this->assertInstanceOf('\mod_quizgame\event\game_scores_viewed', $event);
        $this->assertEquals(CONTEXT_MODULE, $event->contextlevel);
        $this->assertEquals($quizgame->cmid, $event->contextinstanceid);
    }
}
