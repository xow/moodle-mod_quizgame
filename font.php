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
 * Workaround to serve out fonts used by plugin since serving from Google causes GDPR issues.
 *
 * @package   mod_quizgame
 * @copyright 2022 Stephen Bourget
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
$PAGE->set_url('/mod/quizgame/font.php');
require_login();

// Echo out a CSS file with the font path.
header("Content-Type: text/css");
echo "/* audiowide-regular - latin */";
echo "@font-face {";
echo "  font-family: 'Audiowide';";
echo "  font-style: normal;";
echo "  font-weight: 400;";
echo "  src: local(''),";
// Modern Browser Support - Chrome 26+, Opera 23+, Firefox 39+.
echo "       url('$CFG->wwwroot/mod/quizgame/lib/audiowide/audiowide-v14-latin-ext_latin-regular.woff2') format('woff2'),";
// Older Browser Support -  Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+.
echo "       url('$CFG->wwwroot/mod/quizgame/lib/audiowide/audiowide-v14-latin-ext_latin-regular.woff') format('woff');";
echo "}";
