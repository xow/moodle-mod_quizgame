@mod @mod_quizgame
Feature: Teachers can review student progress on all quizgames in a course by viewing the complete report
  As a teacher
  I need to view the complete report for one of my students.

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email |
      | teacher1 | Teacher | 1 | teacher1@example.com |
      | student1 | Student | 1 | student1@example.com |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1 | 0 |
    And the following "course enrolments" exist:
      | user | course | role |
      | teacher1 | C1 | editingteacher |
      | student1 | C1 | student |
    And the following "question categories" exist:
      | contextlevel | reference | name           |
      | Course       | C1        | Test questions |
    And the following "questions" exist:
      | questioncategory | qtype       | name  | questiontext    |
      | Test questions   | truefalse   | TF1   | First question  |
      | Test questions   | truefalse   | TF2   | Second question |
    And the following "activities" exist:
      | activity | course | idnumber | name               | intro                     | questioncategory |
      | quizgame | C1     | qg1      | Test quizgame name | Test quizgame description | Test questions   |

  Scenario: Complete report of a student who does not play anything.
    Given I log in as "teacher1"
    And I am on "Course 1" course homepage
    And I follow "Participants"
    And I follow "Student 1"
    And I follow "Complete report"
    Then I should see "Not yet played"

  Scenario: Complete report of a student who plays the game.
    Given user "student1" has played "Test quizgame name" with a score of "10110"
    And I wait "1" seconds
    And user "student1" has played "Test quizgame name" with a score of "12345"
    And I wait "1" seconds
    And user "student1" has played "Test quizgame name" with a score of "-1000"
    When I log in as "teacher1"
    And I am on "Course 1" course homepage
    And I follow "Participants"
    And I follow "Student 1"
    And I follow "Complete report"
    Then I should see "Attempt #1: Achieved a high score of 10110"
    And I should see "Attempt #2: Achieved a high score of 12345"
    And I should see "Attempt #3: Achieved a high score of -1000"
