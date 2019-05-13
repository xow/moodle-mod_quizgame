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
 * @copyright  2019 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

global $CFG;
require_once($CFG->dirroot . '/mod/quizgame/locallib.php');

/**
 * Unit tests for quizgame calendar events.
 *
 * @package    mod_quizgame
 * @category   test
 * @copyright  2019 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_quizgame_lib_testcase extends advanced_testcase {
    public function test_quizgame_core_calendar_provide_event_action() {
        $this->resetAfterTest();
        $this->setAdminUser();
        // Create the activity.
        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course->id));
        // Create a calendar event.
        $event = $this->create_action_event($course->id, $quizgame->id,
            \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED);
        // Create an action factory.
        $factory = new \core_calendar\action_factory();
        // Decorate action event.
        $actionevent = mod_quizgame_core_calendar_provide_event_action($event, $factory);
        // Confirm the event was decorated.
        $this->assertInstanceOf('\core_calendar\local\event\value_objects\action', $actionevent);
        $this->assertEquals(get_string('view'), $actionevent->get_name());
        $this->assertInstanceOf('moodle_url', $actionevent->get_url());
        $this->assertEquals(1, $actionevent->get_item_count());
        $this->assertTrue($actionevent->is_actionable());
    }
    public function test_quizgame_core_calendar_provide_event_action_for_non_user() {
        global $CFG;
        $this->resetAfterTest();
        $this->setAdminUser();
        // Create the activity.
        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course->id));
        // Create a calendar event.
        $event = $this->create_action_event($course->id, $quizgame->id,
                \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED);
        // Now, log out.
        $CFG->forcelogin = true; // We don't want to be logged in as guest, as guest users might still have some capabilities.
        $this->setUser();
        // Create an action factory.
        $factory = new \core_calendar\action_factory();
        // Decorate action event for the student.
        $actionevent = mod_quizgame_core_calendar_provide_event_action($event, $factory);
        // Confirm the event is not shown at all.
        $this->assertNull($actionevent);
    }
    public function test_quizgame_core_calendar_provide_event_action_for_user() {
        global $CFG;
        $this->resetAfterTest();
        $this->setAdminUser();
        // Create the activity.
        $course = $this->getDataGenerator()->create_course();
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course->id));
        $student = $this->getDataGenerator()->create_and_enrol($course, 'student');
        // Create a calendar event.
        $event = $this->create_action_event($course->id, $quizgame->id,
                \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED);
        // Now log out.
        $CFG->forcelogin = true; // We don't want to be logged in as guest, as guest users might still have some capabilities.
        $this->setUser();
        // Create an action factory.
        $factory = new \core_calendar\action_factory();
        // Decorate action event for the student.
        $actionevent = mod_quizgame_core_calendar_provide_event_action($event, $factory, $student->id);
        // Confirm the event was decorated.
        $this->assertInstanceOf('\core_calendar\local\event\value_objects\action', $actionevent);
        $this->assertEquals(get_string('view'), $actionevent->get_name());
        $this->assertInstanceOf('moodle_url', $actionevent->get_url());
        $this->assertEquals(1, $actionevent->get_item_count());
        $this->assertTrue($actionevent->is_actionable());
    }
    public function test_quizgame_core_calendar_provide_event_action_already_completed() {
        global $CFG;
        $this->resetAfterTest();
        $this->setAdminUser();
        $CFG->enablecompletion = 1;
        // Create the activity.
        $course = $this->getDataGenerator()->create_course(array('enablecompletion' => 1));
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course->id),
            array('completion' => 2, 'completionview' => 1, 'completionexpected' => time() + DAYSECS));
        // Get some additional data.
        $cm = get_coursemodule_from_instance('quizgame', $quizgame->id);
        // Create a calendar event.
        $event = $this->create_action_event($course->id, $quizgame->id,
            \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED);
        // Mark the activity as completed.
        $completion = new completion_info($course);
        $completion->set_module_viewed($cm);
        // Create an action factory.
        $factory = new \core_calendar\action_factory();
        // Decorate action event.
        $actionevent = mod_quizgame_core_calendar_provide_event_action($event, $factory);
        // Ensure result was null.
        $this->assertNull($actionevent);
    }
    public function test_quizgame_core_calendar_provide_event_action_already_completed_for_user() {
        global $CFG;
        $this->resetAfterTest();
        $this->setAdminUser();
        $CFG->enablecompletion = 1;
        // Create the activity.
        $course = $this->getDataGenerator()->create_course(array('enablecompletion' => 1));
        $quizgame = $this->getDataGenerator()->create_module('quizgame', array('course' => $course->id),
                array('completion' => 2, 'completionview' => 1, 'completionexpected' => time() + DAYSECS));
        // Create 2 students and enrol them into the course.
        $student1 = $this->getDataGenerator()->create_and_enrol($course, 'student');
        $student2 = $this->getDataGenerator()->create_and_enrol($course, 'student');
        // Get some additional data.
        $cm = get_coursemodule_from_instance('quizgame', $quizgame->id);
        // Create a calendar event.
        $event = $this->create_action_event($course->id, $quizgame->id,
                \core_completion\api::COMPLETION_EVENT_TYPE_DATE_COMPLETION_EXPECTED);
        // Mark the activity as completed for the $student1.
        $completion = new completion_info($course);
        $completion->set_module_viewed($cm, $student1->id);
        // Now log in as $student2.
        $this->setUser($student2);
        // Create an action factory.
        $factory = new \core_calendar\action_factory();
        // Decorate action event for $student1.
        $actionevent = mod_quizgame_core_calendar_provide_event_action($event, $factory, $student1->id);
        // Ensure result was null.
        $this->assertNull($actionevent);
    }
    /**
     * Creates an action event.
     *
     * @param int $courseid The course id.
     * @param int $instanceid The instance id.
     * @param string $eventtype The event type.
     * @return bool|calendar_event
     */
    private function create_action_event($courseid, $instanceid, $eventtype) {
        $event = new stdClass();
        $event->name = 'Calendar event';
        $event->modulename  = 'quizgame';
        $event->courseid = $courseid;
        $event->instance = $instanceid;
        $event->type = CALENDAR_EVENT_TYPE_ACTION;
        $event->eventtype = $eventtype;
        $event->timestart = time();
        return calendar_event::create($event);
    }
}
