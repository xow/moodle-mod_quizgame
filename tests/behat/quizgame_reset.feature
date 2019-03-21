@mod @mod_quizgame
Feature: Quizgame reset
  In order to reuse past quizgame activities
  As a teacher
  I need to remove all previous data.

  Background:
    Given the following "users" exist:
      | username | firstname | lastname | email |
      | teacher | Teacher | 1 | teacher1@example.com |
      | student1 | Student | 1 | student1@example.com |
      | student2 | Student | 2 | student2@example.com |
    And the following "courses" exist:
      | fullname | shortname | category |
      | Course 1 | C1 | 0 |
    And the following "course enrolments" exist:
      | user | course | role |
      | teacher | C1 | editingteacher |
      | student1 | C1 | student |
      | student2 | C1 | student |
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
    And user "student1" has played "Test quizgame name" with a score of "10110"
    And user "student2" has played "Test quizgame name" with a score of "20202"

  Scenario: Use course reset to remove all playthroughs.
    Given I log in as "teacher"
    And I am on "Course 1" course homepage
    And I follow "Test quizgame name"
    When I follow "View all attempts"
    And I should see "10110" in the "Student 1" "table_row"
    And I should see "20202" in the "Student 2" "table_row"
    And I am on "Course 1" course homepage
    And I navigate to "Reset" in current page administration
    And I set the following fields to these values:
        | id_reset_quizgame_scores | 1 |
    And I press "Reset course"
    And I should see "Remove all user scores"
    Then I should see "OK"
    And I press "Continue"
    And I follow "Course 1"
    And I follow "Test quizgame name"
    And I follow "View all attempts"
    And I should not see "10110"
    And I should not see "20202"
