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
        global $CFG, $COURSE, $DB;

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

        // Get question categories for this course with proper hierarchy.
        if (!empty($this->_cm)) {
            $context = context_module::instance($this->_cm->id);
        } else {
            $context = context_course::instance($COURSE->id);
        }
        $editcontexts = new \core_question\local\bank\question_edit_contexts($context);
        $contexts = $editcontexts->all();

        // For Moodle 5.0+, try to use the new question bank API if available.
        $options = ['' => get_string('choosedots')];
        if ($CFG->branch >= 500 && class_exists('qbank_managecategories\helper')) {
            // Use the new Moodle 5.0+ question bank API.
            // This properly scopes categories to the provided contexts.
            if (class_exists('core_question\local\bank\question_bank_helper')) {
                $sharedbanks = \core_question\local\bank\question_bank_helper::get_activity_instances_with_shareable_questions([$COURSE->id]);
                foreach ($sharedbanks as $bank) {
                    $contexts[] = \context_module::instance($bank->modid);
                }
            }
            $categoryoptions = \qbank_managecategories\helper::question_category_options($contexts, false, 0);
            if (!empty($categoryoptions)) {
                foreach ($categoryoptions as $contextname => $opts) {
                    if (is_array($opts)) {
                        foreach ($opts as $id => $name) {
                            $options[$id] = $name;
                        }
                    } else {
                        $options[$contextname] = $opts;
                    }
                }
            }
        } else {
            // For older Moodle versions, use the properly scoped query.
            // Get question categories scoped to this course context and its accessible parents/children.
            // This includes: the course context itself, module contexts within this course,
            // the parent course category context (if exists), and system context.
            // We exclude other course contexts to prevent cross-course access.
            $contextpath = $context->path . '/%';
            $parentcontext = $context->get_parent_context();
            $parentcontextid = ($parentcontext && $parentcontext->contextlevel == CONTEXT_COURSECAT) ? $parentcontext->id : null;

            $params = [
                'coursecontextid' => $context->id,
                'contextpath' => $contextpath,
                'modulelevel' => CONTEXT_MODULE,
                'systemlevel' => CONTEXT_SYSTEM,
            ];

            $whereconditions = [
                'ctx.id = :coursecontextid',
                '(ctx.path LIKE :contextpath AND ctx.contextlevel = :modulelevel)',
                '(ctx.contextlevel = :systemlevel AND ctx.depth = 1)',
            ];

            // If editing an existing activity, include its module context.
            if (!empty($this->_cm)) {
                $modulecontext = context_module::instance($this->_cm->id);
                $params['modulecontextid'] = $modulecontext->id;
                $whereconditions[] = 'ctx.id = :modulecontextid';
            }

            if ($parentcontextid !== null) {
                $params['parentcontextid'] = $parentcontextid;
                $params['categorylevel'] = CONTEXT_COURSECAT;
                $whereconditions[] = '(ctx.id = :parentcontextid AND ctx.contextlevel = :categorylevel)';
            }

            $categories = $DB->get_records_sql(
                "SELECT DISTINCT c.id, c.name, c.parent, c.sortorder, c.contextid
                   FROM {question_categories} c
                   JOIN {context} ctx ON c.contextid = ctx.id
                  WHERE (" . implode(' OR ', $whereconditions) . ")
               ORDER BY c.parent, c.sortorder, c.name ASC",
                $params
            );

            // Build hierarchical options array.
            $categorytree = [];

            // First pass: organize categories by parent.
            foreach ($categories as $category) {
                $categorytree[$category->parent][] = $category;
            }

            // Second pass: build hierarchical display, starting from the children of the 'top' categories
            // to prevent the 'top' categories from appearing in the dropdown.
            if (isset($categorytree[0])) {
                foreach ($categorytree[0] as $topcategory) {
                    // We are not displaying the top category itself, but its children.
                    $this->build_category_options($categorytree, $options, $topcategory->id, $context, 0);
                }
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
     * Build hierarchical category options with proper indentation
     * @param array $categorytree Categories organized by parent
     * @param array $options Reference to options array to populate
     * @param int $parentid Parent category ID
     * @param context $context Course context
     * @param int $level Current indentation level
     */
    private function build_category_options($categorytree, &$options, $parentid, $context, $level = 0)
    {
        if (!isset($categorytree[$parentid])) {
            return;
        }

        foreach ($categorytree[$parentid] as $category) {
            $indent = str_repeat('&nbsp;&nbsp;&nbsp;&nbsp;', $level);
            $name = format_string($category->name, true, ['context' => $context]);
            $options[$category->id] = $indent . $name;

            // Recursively add child categories.
            $this->build_category_options($categorytree, $options, $category->id, $context, $level + 1);
        }
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
