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
 * The mod_quizgame course module viewed event.
 *
 * @package    mod_quizgame
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace mod_quizgame\event;

/**
 * The mod_quizgame course module viewed event class.
 *
 * @package    mod_quizgame
 * @copyright  2018 Stephen Bourget
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class course_module_viewed extends \core\event\course_module_viewed {

    /**
     * Init method.
     */
    protected function init() {
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
        $this->data['objecttable'] = 'quizgame';
    }

    /**
     * Get URL related to the action.
     *
     * @return \moodle_url
     */
    public function get_url() {
        $params = ['id' => $this->contextinstanceid];
        if (!empty($this->other['mode'])) {
            $params['mode'] = $this->other['mode'];
        }
        return new \moodle_url("/mod/$this->objecttable/view.php", $params);
    }

    /**
     * Used for mapping log data upon restore.
     * @return array
     */
    public static function get_objectid_mapping() {
        return ['db' => 'quizgame', 'restore' => 'quizgame'];
    }
}

