@mod @mod_quizgame
Feature: Teachers can create a quizgame activity for students to review content
  As a teacher
  I need to create the activity.

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

  @javascript
  Scenario: Create the activity.
    Given I log in as "teacher1"
    And I add a quizgame activity to course "Course 1" section "1" and I fill the form with:
      | Quizventure name  | Test quizventure name        |
      | Description       | Test quizventure description |
      | ID number         | Test quizventure name        |
      | Question category | Test questions               |
    And I am on the "Test quizventure name" Activity page
    Then I should see "Test quizventure description"
    And I should see "View all attempts"
