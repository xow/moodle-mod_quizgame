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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * The main quizgame configuration form
 *
 * It uses the standard core Moodle formslib. For more info about them, please
 * visit: http://docs.moodle.org/en/Development:lib/formslib.php
 *
 * @package    mod_quizgame
 * @copyright  2014 John Okely <john@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/course/moodleform_mod.php');
require_once($CFG->dirroot . '/lib/questionlib.php');

/**
 * Module instance settings form
 * @copyright  2014 John Okely <john@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mod_quizgame_mod_form extends moodleform_mod
{
    /**
     * Defines forms elements
     */
    public function definition()
    {
        global $CFG, $COURSE;

        $mform = $this->_form;

        // Adding the "general" fieldset, where all the common settings are showed.
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Adding the standard "name" field.
        $mform->addElement('text', 'name', get_string('quizgamename', 'quizgame'), ['size' => '64']);
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEAN);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        $mform->addHelpButton('name', 'quizgamename', 'quizgame');

        // Adding the standard "intro" and "introformat" fields.
        if ($CFG->branch >= 29) {
            $this->standard_intro_elements();
        } else {
            $this->add_intro_editor();
        }

        // Restrict selectable categories to this course/activity contexts only.
        $contexts = [];
        $coursecontext = context_course::instance($COURSE->id);
        $contexts[$coursecontext->id] = $coursecontext;
        if (!empty($this->_cm)) {
            $modulecontext = context_module::instance($this->_cm->id);
            $contexts[$modulecontext->id] = $modulecontext;
        }

        // Include any shareable question-bank instances configured for this course (Moodle 5.0+).
        if (class_exists('core_question\local\bank\question_bank_helper')) {
            $sharedbanks = \core_question\local\bank\question_bank_helper::get_activity_instances_with_shareable_questions([$COURSE->id]);
            foreach ($sharedbanks as $bank) {
                $sharedcontext = \context_module::instance($bank->modid);
                $contexts[$sharedcontext->id] = $sharedcontext;
            }
        }

        $options = ['' => get_string('choosedots')];
        if (class_exists('qbank_managecategories\helper')) {
            $categoryoptions = \qbank_managecategories\helper::question_category_options(array_values($contexts), false, 0);
            foreach ($categoryoptions as $contextname => $opts) {
                if (is_array($opts)) {
                    foreach ($opts as $id => $name) {
                        $options[$id] = $name;
                    }
                    continue;
                }
                $options[$contextname] = $opts;
            }
        }

        // If no categories found, keep the empty "Choose..." option; admins can create categories later.

        $mform->addElement('select', 'questioncategory', get_string('questioncategory', 'quizgame'), $options);
        $mform->addHelpButton('questioncategory', 'questioncategory', 'quizgame');
        $mform->addRule('questioncategory', null, 'required', null, 'client');

        // Add standard elements, common to all modules.
        $this->standard_coursemodule_elements();
        // Add standard buttons, common to all modules.
        $this->add_action_buttons();
    }

    /**
     * Define custom completion rules
     * @return array
     */
    public function add_completion_rules()
    {
        $mform =& $this->_form;
        $group = [];
        $group[] =& $mform->createElement(
            'checkbox',
            'completionscoreenabled',
            '',
            get_string('completionscore', 'quizgame')
        );
        $group[] =& $mform->createElement('text', 'completionscore', '', ['size' => 3]);
        $mform->setType('completionscore', PARAM_INT);
        $mform->addGroup(
            $group,
            'completionscoregroup',
            get_string('completionscoregroup', 'quizgame'),
            [' '],
            false
        );
        $mform->disabledIf('completionscore', 'completionscoreenabled', 'notchecked');
        $mform->addHelpButton('completionscoregroup', 'completionscoregroup', 'quizgame');
        return ['completionscoregroup'];
    }

    /**
     * Determines if custom criteria is active.
     * @param array $data
     * @return bool
     */
    public function completion_rule_enabled($data)
    {
        return (!empty($data['completionscoreenabled']) && $data['completionscore'] != 0);
    }

    /**
     * Loads custom completion data.
     * @return boolean
     */
    public function get_data()
    {
        $data = parent::get_data();
        if (!$data) {
            return false;
        }
        if (!empty($data->completionunlocked)) {
            // Turn off completion settings if the checkboxes aren't ticked.
            $autocompletion = !empty($data->completion) && $data->completion == COMPLETION_TRACKING_AUTOMATIC;
            if (empty($data->completionscoreenabled) || !$autocompletion) {
                $data->completionscore = 0;
            }
        }
        return $data;
    }

    /**
     * Used to pre-populate mform.
     * @param array $defaultvalues
     */
    public function data_preprocessing(&$defaultvalues)
    {
        parent::data_preprocessing($defaultvalues);

        // Set up the completion checkboxes which aren't part of standard data.
        // We also make the default value (if you turn on the checkbox) for those
        // numbers to be 1, this will not apply unless checkbox is ticked.
        if (!empty($defaultvalues['completionscore'])) {
            $defaultvalues['completionscoreenabled'] = 1;
        } else {
            $defaultvalues['completionscoreenabled'] = 0;
        }
        if (empty($defaultvalues['completionscore'])) {
            $defaultvalues['completionscore'] = 10000;
        }
    }
}
