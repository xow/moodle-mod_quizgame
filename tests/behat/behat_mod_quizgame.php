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
 * Steps definitions related to mod_quiz.
 *
 * @package   mod_quizgame
 * @category  test
 * @copyright 2019 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test here, this file may be required by behat before including /config.php.

require_once(__DIR__ . '/../../../../lib/behat/behat_base.php');

use Behat\Gherkin\Node\TableNode as TableNode;
use Behat\Mink\Exception\ExpectationException as ExpectationException;

/**
 * Steps definitions related to mod_quizgame.
 *
 * @copyright 2019 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class behat_mod_quizgame extends behat_base {
    /**
     * Play a quizgame.
     *
     * @param string $username the username of the user that will attempt.
     * @param string $quizgamename the name of the quizgame the user will attempt.
     * @param string $score the score of the attempt.
     * @Given /^user "([^"]*)" has played "([^"]*)" with a score of "([^"]*)"$/
     */
    public function user_has_played_with_a_score_of($username, $quizgamename, $score = null) {
        global $DB;

        $quizgamegenerator = behat_util::get_data_generator()->get_plugin_generator('mod_quizgame');
        $quizgame = $DB->get_record('quizgame', ['name' => $quizgamename], '*', MUST_EXIST);
        $user = $DB->get_record('user', ['username' => $username], '*', MUST_EXIST);

        $this->set_user($user);
        $attemptdata = array();
        if (isset($user->id)) {
            $attemptdata['userid'] = $user->id;
        }
        if (!is_null($score)) {
            $attemptdata['score'] = $score;
        }

        $attempt = $quizgamegenerator->create_content($quizgame, $attemptdata);
        $this->set_user();
    }
}
