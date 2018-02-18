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

defined('MOODLE_INTERNAL') || die();

class mod_quizgame_renderer extends plugin_renderer_base {
    /**
     * Initialises the game and returns its HTML code
     *
     * @param stdClass $quizgame The quizgame to be added
     * @param context $context The context
     * @return string The HTML code of the game
     */
    public function render_game($quizgame, $context) {
        global $DB;

        $categoryid = explode(',', $quizgame->questioncategory)[0];
        $questionids = array_keys($DB->get_records('question', array('category' => intval($categoryid)), '', 'id'));
        $questions = question_load_questions($questionids);

        $this->page->requires->strings_for_js(array(
                'score',
                'emptyquiz',
                'endofgame',
                'spacetostart'
            ), 'mod_quizgame');

        $qjson = [];
        foreach ($questions as $question) {
            if ($question->qtype == "multichoice") {
                $questiontext = quizgame_cleanup($question->questiontext);
                $answers = [];
                foreach ($question->options->answers as $answer) {
                    $answertext = quizgame_cleanup($answer->answer);
                    $answers[] = ["text" => $answertext, "fraction" => $answer->fraction];
                }
                $qjson[] = ["question" => $questiontext, "answers" => $answers, "type" => $question->qtype];
            }
            if ($question->qtype == "match") {
                $subquestions = [];
                foreach ($question->options->subquestions as $subquestion) {
                    $questiontext = quizgame_cleanup($subquestion->questiontext);
                    $answertext = quizgame_cleanup($subquestion->answertext);
                    $subquestions[] = ["question" => $questiontext, "answer" => $answertext];
                }
                $qjson[] = ["question" => get_string("match", "quiz"), "stems" => $subquestions, "type" => $question->qtype];
            }
        }

        $this->page->requires->js_call_amd('mod_quizgame/quizgame', 'init', array($qjson, $quizgame->id));

        $display = '<canvas id="mod_quizgame_game"></canvas>';
        $display .= '<audio id="mod_quizgame_sound_laser" preload="auto">'.
                    '<source src="sound/Laser.wav" type="audio/wav" />'.
                    '</audio>';
        $display .= '<audio id="mod_quizgame_sound_explosion" preload="auto">'.
                    '<source src="sound/Explosion.wav" type="audio/wav" />'.
                    '</audio>';
        $display .= '<audio id="mod_quizgame_sound_deflect" preload="auto">'.
                    '<source src="sound/Deflect.wav" type="audio/wav" />'.
                    '</audio>';
        $display .= '<audio id="mod_quizgame_sound_enemylaser" preload="auto">'.
                    '<source src="sound/EnemyLaser.wav" type="audio/wav" />'.
                    '</audio>';

        $display .= '<input id="mod_quizgame_fullscreen_button" type="button" value="' .
                    get_string('fullscreen', 'mod_quizgame') . '">';
        $display .= html_writer::checkbox('sound', '', false,
                                          get_string('sound', 'mod_quizgame'),
                                          array('id' => 'mod_quizgame_sound_on'));

        return $display;
    }

}
