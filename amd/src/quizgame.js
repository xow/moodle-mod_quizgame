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
 * This class manages the confirmation pop-up (also called the pre-flight check)
 * that is sometimes shown when a use clicks the start attempt button.
 *
 * This is also responsible for opening the pop-up window, if the quiz requires to be in one.
 *
 * @module    mod_quizgame/quizgame
 * @class     quizgame
 * @package   mod_quizgame
 * @copyright 2016 John Okely <john@moodle.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['jquery','core/yui', 'core/notification', 'core/ajax'], function($, Y, notification, ajax) {
    var questions;
    var quizgame;
    var stage;
    var score = 0;
    var particles = [];
    var gameObjects = [];
    var images = [
        'pix/icon.gif',
        'pix/planet.png',
        'pix/ship.png',
        'pix/enemy.png',
        'pix/enemystem.png',
        'pix/enemychoice.png',
        'pix/enemystemselected.png',
        'pix/enemychoiceselected.png',
        'pix/laser.png',
        'pix/enemylaser.png'
    ];
    var imagesLoaded = 0;
    var loaded = false;
    var player;
    var planet;
    var level = -1;
    var displayRect = {x: 0, y: 0, width: 0, height: 0};
    var question = "";
    var interval;
    var enemySpeed;
    var touchDown = false;
    var mouseDown = false;
    var currentTeam = [];
    var lastShot = 0;
    var currentPointsLeft = 0;
    var context;
    var inFullscreen = false;

    $('#mod_quizgame_fullscreen_button').on('click', function () {
        if (inFullscreen) {
            inFullscreen = false;
            smallscreen();
        } else {
            fullscreen();
        }
    });

    function playSound(soundName) {
        if (document.getElementById("mod_quizgame_sound_on").checked) {
            var soundElement = document.getElementById("mod_quizgame_sound_" + soundName);
            soundElement.currentTime = 0;
            soundElement.play();
        }
    }

    function smallscreen() {
        inFullscreen = false;
        stage.removeAttribute("width");
        stage.removeAttribute("height");
        stage.removeAttribute("style");

        stage.classList.remove("floating-game-canvas");
        $("#button_container").removeClass("floating-button-container fixed-bottom");

        displayRect.width = stage.clientWidth;
        displayRect.height = stage.clientHeight;
        stage.style.width = displayRect.width;
        stage.style.height = displayRect.height;

        sizeScreen(stage);
    }

    function fschange() {
        if (inFullscreen) {
            smallscreen();
        }
    }

    function fullscreen() {
        var landscape = window.matchMedia("(orientation: landscape)").matches;

        if (stage.requestFullscreen) {
              stage.requestFullscreen();
        } else if (stage.msRequestFullscreen) {
              stage.msRequestFullscreen();
        } else if (stage.mozRequestFullScreen) {
              stage.mozRequestFullScreen();
        }
        // The stage.webkitRequestFullscreen() method was removed, due to very easily exiting of full screen in iOS,
        // along with browser messages asking if you are typing in fullscreen.

        inFullscreen = true;
        var buttonContainer = $("#button_container");

        var width = window.innerWidth;

        // The window.innerHeight returns an offset value on iOS devices in safari only
        // while in portrait mode for some reason.
        var height = $(window).height();

        // Switch width and height
        if (landscape && width < height) {
            height = [width, width = height][0];
        }

        // Gets the actual button container height, then adds 16px; 8px on the
        // top and 8px on the bottom for the page margin.
        height -= buttonContainer.height() + 16;

        displayRect.width = width;
        displayRect.height = height;

        stage.style.width = width + "px";
        stage.style.height = height + "px";

        // Makes the canvas float.
        stage.classList.add("floating-game-canvas");

        // This makes the button container float below the game canvas.
        buttonContainer.addClass("floating-button-container fixed-bottom");

        $("#mod_quizgame_fullscreen_button").blur(); // The button pressed was still focused, so a blur is necessary.

        sizeScreen(stage);
    }

    function sizeScreen(stage) {

        stage.width = displayRect.width;
        stage.height = displayRect.height;
        context.imageSmoothingEnabled = false;
    }

    function orientationChange() {
        if (inFullscreen) {
            fullscreen();
        } else {
            smallscreen();
        }
    }

    function clearEvents() {
        document.onkeydown = null;
        document.onkeyup = null;
        document.onmousedown = null;
        document.onmouseup = null;
        document.onmousemove = null;
        document.ontouchstart = null;
        document.ontouchend = null;
        document.ontouchmove = null;
        window.onresize = null;
    }

    function menuEvents() {
        clearEvents();
        document.onkeydown = menukeydown;
        document.onmouseup = menumousedown;
        document.ontouchend = menutouchend;
        window.onresize = orientationChange;
    }

    function showMenu() {

        context.clearRect(0, 0, displayRect.width, displayRect.height);

        context.fillStyle = '#FFFFFF';
        context.font = "18px Audiowide";
        context.textAlign = 'center';

        if (questions !== null && questions.length > 0) {
            context.fillText(M.util.get_string('spacetostart', 'mod_quizgame'), displayRect.width / 2, displayRect.height / 2);
            menuEvents();
        } else {
            context.fillText(M.util.get_string('emptyquiz', 'mod_quizgame'), displayRect.width / 2, displayRect.height / 2);
        }
    }

    function loadGame() {

        shuffle(questions);

        if (!loaded) {
            images.forEach(function(src) {
                var image = new Image();
                image.src = src;
                image.onload = function() {
                    imagesLoaded++;
                    if (imagesLoaded >= images.length) {
                        gameLoaded();
                    }
                };
            });
            loaded = true;
        } else {
            startGame();
        }
    }

    function endGame() {
        ajax.call([{
            methodname: 'mod_quizgame_update_score',
            args: {quizgameid: quizgame, score: Math.trunc(score)},
            fail: notification.exception
        }]);
        menuEvents();
    }

    function gameLoaded() {

        clearInterval(interval);

        interval = setInterval(function() {
                draw(context, displayRect, gameObjects, particles, question);
                update(displayRect, gameObjects, particles);
        }, 40);

        startGame();
    }

    function startGame() {

        score = 0;
        gameObjects = [];
        particles = [];
        level = -1;
        enemySpeed = 0.5;
        touchDown = false;
        mouseDown = false;

        // Queue & trigger the game_started event.
        ajax.call([{
            methodname: 'mod_quizgame_start_game',
            args: {quizgameid: quizgame},
            fail: notification.exception
        }]);

        player = new Player("pix/ship.png", 0, 0);
        player.x = displayRect.width / 2;
        player.y = displayRect.height / 2;
        gameObjects.push(player);

        planet = new Planet("pix/planet.png", 0, 0);
        planet.image.width = displayRect.width;
        planet.image.height = displayRect.height;
        planet.direction.y = 1;
        planet.movespeed.y = 0.7;
        particles.push(planet);

        nextLevel();

        document.onkeyup = keyup;
        document.onkeydown = keydown;
        document.onmouseup = mouseup;
        document.onmousedown = mousedown;
        document.onmousemove = mousemove;
        document.ontouchstart = touchstart;
        document.ontouchend = touchend;
        document.ontouchmove = touchmove;
        window.onresize = orientationChange;

        document.addEventListener("gesturestart", cancelled, false);
        document.addEventListener("gesturechange", cancelled, false);
        document.addEventListener("gestureend", cancelled, false);
    }

    function nextLevel() {
        level++;
        if (level >= questions.length) {
            level = 0;
            enemySpeed *= 1.3;
        }
        question = runLevel(questions, level, displayRect);
    }
    function runLevel(questions, level, bounds) {
        currentTeam = [];
        lastShot = 0;
        currentPointsLeft = 0;

        if (questions[level].type == 'truefalse') {
            questions[level].answers.forEach(function(answer) {
                var enemy = new TFEnemy(Math.random() * bounds.width, -Math.random() * bounds.height / 2,
                                           answer.text, answer.fraction);
                currentTeam.push(enemy);
                gameObjects.push(enemy);
            });
            currentPointsLeft = 0; // This is unused by TrueFalse questions.
        } else if (questions[level].type == 'multichoice') {
            questions[level].answers.forEach(function(answer) {
                var enemy = new MultiEnemy(Math.random() * bounds.width, -Math.random() * bounds.height / 2,
                                           answer.text, answer.fraction, questions[level].single);
                if (answer.fraction < 1) {
                    currentTeam.push(enemy);
                    if (answer.fraction > 0) {
                        currentPointsLeft += parseFloat(answer.fraction);
                    }
                }
                gameObjects.push(enemy);
            });
        } else if (questions[level].type == 'match') {
            var i = 0;
            var fraction = 1 / (questions[level].stems.length * 2);
            currentPointsLeft += 1;
            questions[level].stems.forEach(function(stem) {
                i++;
                var question = new MatchEnemy(Math.random() * bounds.width, -Math.random() * bounds.height / 2,
                                              stem.question, fraction, -i, true);
                var answer = new MatchEnemy(Math.random() * bounds.width, -Math.random() * bounds.height / 2,
                                            stem.answer, fraction, i);
                currentTeam.push(question);
                currentTeam.push(answer);
                gameObjects.push(question);
                gameObjects.push(answer);
            });
        }
        return questions[level].question;
    }

    function draw(context, displayRect, objects, particles, question) {
        context.clearRect(0, 0, displayRect.width, displayRect.height);

        for (var i = 0; i < particles.length; i++) {
            particles[i].draw(context);
        }

        for (i = 0; i < objects.length; i++) {
            objects[i].draw(context);
        }

        if (player.alive) {
            context.fillStyle = '#FFFFFF';
            context.font = "18px Audiowide";
            context.textAlign = 'left';
            context.fillText(M.util.get_string('score', 'mod_quizgame',
                                               {
                                                    "score": Math.round(score), "lives": player.lives
                                               }),
                                               5, displayRect.height - 20);
            context.textAlign = 'center';

            wrapText(context, question, false, 20, displayRect.width * 0.9, displayRect.width / 2, 20);
        } else {
            context.fillStyle = '#FFFFFF';
            context.font = "18px Audiowide";
            context.textAlign = 'center';
            context.fillText(M.util.get_string('endofgame', 'mod_quizgame',
                                               Math.round(player.lastScore)),
                                               displayRect.width / 2, displayRect.height / 2);
        }
    }

    function update(bounds, objects, particles) {
        for (var i = 0; i < 3; i++) {
            particles.push(new Star(bounds));
        }
        for (i = 0; i < particles.length; i++) {
            particles[i].update(bounds);
            if (!particles[i].alive) {
                particles.splice(i, 1);
                i--;
            }
        }
        for (i = 0; i < objects.length; i++) {
            objects[i].update(bounds);
            for (var j = i + 1; j < objects.length; j++) {
                collide(objects[i], objects[j]);
            }
            if (!objects[i].alive) {
                objects.splice(i, 1);
                i--;
            }
        }
    }

    function Rectangle(left, top, width, height)
    {
        this.left = left || 0;
        this.top = top || 0;
        this.width = width || 0;
        this.height = height || 0;
    }
    Rectangle.prototype.right = function () {
        return this.left + this.width;
    };
    Rectangle.prototype.bottom = function () {
        return this.top + this.height;
    };
    Rectangle.prototype.Contains = function (point) {
        return point.x > this.left &&
            point.x < this.right() &&
            point.y > this.top &&
            point.y < this.bottom();
    };
    Rectangle.prototype.Intersect = function (rectangle) {
        var retval = !(rectangle.left > this.right() ||
            rectangle.right() < this.left ||
            rectangle.top > this.bottom() ||
            rectangle.bottom() < this.top);
        return retval;
    };

    function GameObject(src, x, y) {
        if (src !== null) {
            this.image = this.loadImage(src);
        }
        this.x = x;
        this.y = y;
        this.velocity = {x: 0, y: 0};
        this.direction = {x: 0, y: 0};
        this.movespeed = {x: 5, y: 3};
        this.alive = true;
        this.decay = 0.7;
    }
    GameObject.prototype.loadImage = function (src) {
        if (!this.image) {
            this.image = new Image();
        }
        this.image.src = src;
        return this.image;
    };
    GameObject.prototype.update = function () {
        this.velocity.x += this.direction.x * this.movespeed.x;
        this.velocity.y += this.direction.y * this.movespeed.y;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y *= this.decay;
        this.velocity.x *= this.decay;
    };
    GameObject.prototype.draw = function (context) {
        context.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
    };
    GameObject.prototype.getRect = function () {
        return new Rectangle(this.x, this.y, this.image.width, this.image.height);
    };
    GameObject.prototype.die = function () {
        this.alive = false;
    };

    function Player(src, x, y) {
        GameObject.call(this, src, x, y);
        this.mouse = {x: 0, y: 0};
        this.movespeed = {x: 6, y: 4};
        this.lives = 3;
        this.lastScore = 0;
    }
    Player.prototype = Object.create(GameObject.prototype);
    Player.prototype.update = function (bounds) {
        if (mouseDown || touchDown) {
            if (this.x < this.mouse.x - (this.image.width)) {
                player.direction.x = 1;
            } else if (this.x > this.mouse.x) {
                player.direction.x = -1;
            } else {
                player.direction.x = 0;
            }
            if (this.y < this.mouse.y - (this.image.height)) {
                player.direction.y = 1;
            } else if (this.y > this.mouse.y) {
                player.direction.y = -1;
            } else {
                player.direction.y = 0;
            }
        }
        GameObject.prototype.update.call(this, bounds);
        if (this.x < bounds.x - this.image.width) {
            this.x = bounds.width;
        } else if (this.x > bounds.width) {
            this.x = bounds.x - this.image.width;
        }
        if (this.y < bounds.y) {
            this.y = bounds.y;
        } else if (this.y > bounds.height - this.image.height) {
            this.y = bounds.height - this.image.height;
        }
    };
    Player.prototype.Shoot = function () {
        playSound("laser");
        gameObjects.unshift(new Laser(player.x, player.y, true, 24));
        canShoot = false;
    };
    Player.prototype.die = function() {
        GameObject.prototype.die.call(this);
        playSound("explosion");
        spray(this.x + this.image.width / 2, this.y + this.image.height / 2, 200, "#FFCC00");
        this.lastScore = score;
        endGame();
    };
    Player.prototype.gotShot = function(shot)
    {
        if (shot.alive) {
            if (this.lives <= 1) {
                this.die();
            } else {
                this.lives--;
                spray(this.x + this.image.width / 2, this.y + this.image.height / 2, 100, "#FFCC00");
            }
        }
    };

    function Planet(src, x, y) {
        GameObject.call(this, src, x, y);
    }
    Planet.prototype = Object.create(GameObject.prototype);
    Planet.prototype.update = function (bounds) {
        planet.image.width = displayRect.width;
        planet.image.height = displayRect.height;
        GameObject.prototype.update.call(this, bounds);
    };

    function Enemy(src, x, y, text, fraction) {
        GameObject.call(this, src, x, y);
        this.xspeed = enemySpeed;
        this.yspeed = enemySpeed * (2 + Math.random()) / 4;
        this.movespeed.x = 0;
        this.movespeed.y = 0;
        this.direction.y = 1;
        this.text = text;
        this.fraction = fraction;
        this.movementClock = 0;
        this.shotFrequency = 80;
        this.shotClock = (1 + Math.random()) * this.shotFrequency;
        this.level = level;
    }
    Enemy.prototype = Object.create(GameObject.prototype);
    Enemy.prototype.update = function (bounds) {

        if (this.y < bounds.height / 10 || this.y > bounds.height * 9 / 10) {
            this.movespeed.x = this.xspeed * 1;
            this.movespeed.y = this.yspeed * 5;
        } else {
            this.movespeed.x = this.xspeed;
            this.movespeed.y = this.yspeed;
        }

        GameObject.prototype.update.call(this, bounds);

        this.movementClock--;

        if (this.movementClock <= 0) {
            this.direction.x = Math.floor(Math.random() * 3) - 1;
            this.movementClock = (2 + Math.random()) * 30;
        }

        this.shotClock -= enemySpeed;

        if (this.shotClock <= 0) {
            if (this.y < bounds.height * 0.6) {
                playSound("enemylaser");
                var laser = new Laser(this.x, this.y);
                laser.direction.y = 1;
                laser.friendly = false;
                gameObjects.unshift(laser);
                this.shotClock = (1 + Math.random()) * this.shotFrequency;
            }
        }

        if (this.x < bounds.x - this.image.width) {
            this.x = bounds.width;
        } else if (this.x > bounds.width) {
            this.x = bounds.x - this.image.width;
        }
        if (this.y > bounds.height + this.image.height && this.alive) {
            this.alive = false;
            if (this.fraction > 0) {
                currentPointsLeft -= this.fraction;
                score -= 1000 * this.fraction;
            }

            shipReachedEnd.call(this);
        }
    };
    Enemy.prototype.draw = function (context) {
        GameObject.prototype.draw.call(this, context);

        context.fillStyle = '#FFFFFF';
        context.font = "15px Audiowide";
        context.textAlign = 'center';

        wrapText(context, this.text, true, 17, displayRect.width * 0.2, this.x + this.image.width / 2, this.y - 5);
    };
    Enemy.prototype.die = function() {
        GameObject.prototype.die.call(this);
        spray(this.x + this.image.width, this.y + this.image.height, 50 + (this.fraction * 150), "#FF0000");

        // Adjust Score.
        score += this.fraction * 1000;

        // Kill off the ship.
        playSound("explosion");
    };
    Enemy.prototype.gotShot = function(shot) {
        // Default behaviour, to be overridden.
        shot.die();
        this.die();
    };

    function killAllAlive() {
        currentTeam.forEach(function (enemy) {
            if (enemy.alive) {
                // Make the fraction 0 so it won't count as anything and make a new level.
                enemy.fraction = 0;
                enemy.die();
            }
        });
        currentTeam = [];
    }

    function TFEnemy(x, y, text, fraction) {
        Enemy.call(this, "pix/enemy.png", x, y, text, fraction);
    }
    TFEnemy.prototype = Object.create(Enemy.prototype);
    TFEnemy.prototype.die = function() {
        // TrueFalse questions are very simple, if either of the ships die, Enemy.prototype.die will handle
        // the score adding of 1000 or 0, and then this will kill the other remaining ship.
        Enemy.prototype.die.call(this);
        killAllAlive();
        // Only goes to the next level if the result is "true", as no matter what enemy dies first, the opposite will
        // die immediately after.
        if (this.fraction > 0) {
            nextLevel();
        }
    };
    TFEnemy.prototype.gotShot = function(shot) {
        if (this.fraction > 0) {
            shot.die();
            this.die();
        } else {
            score += (this.fraction - 0.5) * 600;
            shot.deflect();
        }
    };

    function MultiEnemy(x, y, text, fraction, single) {
        Enemy.call(this, "pix/enemy.png", x, y, text, fraction);
        this.single = single;
    }
    MultiEnemy.prototype = Object.create(Enemy.prototype);
    MultiEnemy.prototype.die = function() {
        Enemy.prototype.die.call(this);
        if (this.fraction > 0) {
            currentPointsLeft -= this.fraction;
        }
        if ((this.single && this.fraction === 1) && this.fraction >= 1 || (this.fraction > 0 && currentPointsLeft <= 0)) {
            killAllAlive();
            nextLevel();
        }
    };
    MultiEnemy.prototype.gotShot = function(shot) {
        if (this.fraction >= 1 || (this.fraction > 0 && !this.single)) {
            shot.die();
            this.die();
        } else {
            score += (this.fraction - 0.5) * 600;
            shot.deflect();
        }
    };

    function MatchEnemy(x, y, text, fraction, pairid, stem) {
        this.stem = stem ? true : false;
        if (this.stem) {
            Enemy.call(this, "pix/enemystem.png", x, y, text, fraction);
        } else {
            Enemy.call(this, "pix/enemychoice.png", x, y, text, fraction);
        }
        this.pairid = pairid;
        this.shotFrequency = 160;
        this.hightlighted = false;
    }
    MatchEnemy.prototype = Object.create(Enemy.prototype);
    MatchEnemy.prototype.die = function() {
        currentPointsLeft -= this.fraction;
        // Sets the fraction as 0 to stop it adding to the score in #die()
        this.fraction = 0;
        Enemy.prototype.die.call(this);
    };
    MatchEnemy.prototype.gotShot = function(shot) {
        if (shot.alive && this.alive) {
            if (lastShot == -this.pairid) {

                // Increasing the score here instead of in #die(), due to rounding issues being a few numbers off.
                // This must be done before because when #die is invoked, as it sets the fraction as 0.
                score += this.fraction * 1000 * 2;

                shot.die();
                this.die();
                var alives = 0;
                currentTeam.forEach(function(match) {
                    if (match.pairid == lastShot) {
                        match.die();
                    }
                    if (match.alive) {
                        alives++;
                    }
                });

                if (alives <= 0) {
                    nextLevel();
                }
            } else {
                if (lastShot == this.pairid) {
                    shot.deflect();
                } else {
                    shot.die();
                    this.hightlight();
                    lastShot = this.pairid;
                }
            }
        }
    };
    MatchEnemy.prototype.hightlight = function() {
        currentTeam.forEach(function(match) {
            match.unhightlight();
        });
        if (this.stem) {
            this.loadImage("pix/enemystemselected.png");
        } else {
            this.loadImage("pix/enemychoiceselected.png");
        }
        this.hightlighted = true;
    };
    MatchEnemy.prototype.unhightlight = function() {
        if (this.hightlighted) {
            if (this.stem) {
                this.loadImage("pix/enemystem.png");
            } else {
                this.loadImage("pix/enemychoice.png");
            }
        }
        this.hightlighted = false;
    };

    function Laser(x, y, friendly, laserSpeed) {
        GameObject.call(this, friendly ? "pix/laser.png" : "pix/enemylaser.png", x, y);
        this.direction.y = -1;
        this.friendly = friendly ? 1 : 0;
        this.laserSpeed = laserSpeed || 12;
    }
    Laser.prototype = Object.create(GameObject.prototype);
    Laser.prototype.update = function (bounds) {
        GameObject.prototype.update.call(this, bounds);
        if (this.x < bounds.x - this.image.width ||
            this.x > bounds.width ||
            this.y < bounds.y - this.image.height ||
            this.y > bounds.height) {
            this.alive = false;
        }
        this.velocity.y = this.laserSpeed * this.direction.y;
    };
    Laser.prototype.deflect = function () {
        this.image = this.loadImage("pix/enemylaser.png");
        this.direction.y *= -1;
        this.friendly = !this.friendly;
        playSound("deflect");
    };

    function Particle(x, y, velocity, colour) {
        GameObject.call(this, null, x, y);
        this.width = 2;
        this.height = 2;
        this.velocity.x = velocity.x;
        this.velocity.y = velocity.y;
        this.aliveTime = 0;
        this.colour = colour;
        this.decay = 1;
    }
    Particle.prototype = Object.create(GameObject.prototype);
    Particle.prototype.update = function (bounds) {
        GameObject.prototype.update.call(this, bounds);
        if (this.x < bounds.x - this.width ||
            this.x > bounds.width ||
            this.y < bounds.y - this.height ||
            this.y > bounds.height) {
            this.alive = false;
        }
        this.aliveTime++;
        if (this.aliveTime > (Math.random() * 15) + 5) {
            this.alive = false;
        }
    };
    Particle.prototype.getRect = function () {
        return new Rectangle(this.x, this.y, this.width, this.height);
    };
    Particle.prototype.draw = function (context) {
        context.fillStyle = this.colour;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.stroke();
    };

    function Star(bounds) {
        GameObject.call(this, null, Math.random() * bounds.width, 0);
        this.width = 2;
        this.height = 2;
        this.direction.y = 1;
        this.movespeed.y = 0.2 + (Math.random() / 2);
        this.aliveTime = 0;
    }
    Star.prototype = Object.create(GameObject.prototype);
    Star.prototype.update = function (bounds) {
        GameObject.prototype.update.call(this, bounds);
        if (this.y > bounds.height) {
            this.alive = false;
        }
    };
    Star.prototype.draw = function (context) {
        context.fillStyle = '#9999AA';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.stroke();
    };

    function collide(object1, object2) {
        return object1.alive && object2.alive && (collide_ordered(object1, object2) || collide_ordered(object2, object1));
    }

    function collide_ordered(object1, object2) {
        if (object1 instanceof Laser && object2 instanceof Player) {
            if (!object1.friendly && objectsIntersect(object1, object2)) {
                object2.gotShot(object1);
                object1.die();
                return true;
            }
        }
        if (object1 instanceof Laser && object2 instanceof Enemy) {
            if (object1.friendly && objectsIntersect(object1, object2)) {
                object2.gotShot(object1);
                return true;
            }
        }
        if (object1 instanceof Player && object2 instanceof Enemy) {
            if (objectsIntersect(object1, object2)) {
                object1.die();
                return true;
            }
        }
    }

    function objectsIntersect(object1, object2) {
        var rect1 = object1.getRect();
        var rect2 = object2.getRect();
        return rect1.Intersect(rect2);
    }

    function spray(x, y, num, colour) {
        for (var i = 0; i < num; i++) {
            particles.push(new Particle(x, y, {x: (Math.random() - 0.5) * 16, y: ((Math.random() - 0.5) * 16) + 3}, colour));
        }
    }

    function wrapText(context, input, wrapUpwards, textHeight, maxLineWidth, x, y) {
        var drawLines = [];
        var originalY = y;
        var words = input.split(' ');
        var line = '';

        // Loops through the words, and preprocesses each line with the correct string value and y location.
        words.forEach(function(word) {
            var tempLine = line + ' ' + word;
            var metrics = context.measureText(tempLine);
            var testWidth = metrics.width;

            // If the line with the new word is too long, then push the current line without the new word to drawLines.
            if (testWidth > maxLineWidth) {
                drawLines.push({
                    text: line,
                    y: y += textHeight
                });

                line = word;
            } else {
                // If it's shorted than the limit, just add the word to the line and move on.
                line = tempLine;
            }
        });

        // Push the last line, if it exists.
        drawLines.push({
            text: line,
            y: y += textHeight
        });

        // The offset the text was created.
        var yOffset = y - originalY;

        drawLines.forEach(function(drawLine) {
            // If it is suppose to wrap upwards (i.e. for enemy ships) it shifts all questions upwards the amount the
            // questions go down.
            var modifier = wrapUpwards ? -yOffset : 0;

            context.fillText(drawLine.text, x, drawLine.y + modifier);
        });
    }

    function shipReachedEnd() {
        var amountLeft = currentTeam.filter(function (enemy) { return enemy.alive; }).length;

        if (amountLeft === 0 && (currentPointsLeft < this.fraction || currentPointsLeft <= 0)
            && this.level === level && player.alive) {
            nextLevel();
        }
    }

    // Input.

    var canShoot = true;

    function menukeydown(e) {
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) !== -1) {
            e.preventDefault();
            if (e.keyCode === 32) {
                loadGame();
            }
        }
    }

    function menumousedown(e) {
        if (e.target === stage) {
            loadGame();
        }
    }

    function menutouchend(e) {
        if (e.target === stage) {
            loadGame();
        }
    }

    function keydown(e) {
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) !== -1) {
            e.preventDefault();
            if (e.keyCode === 32 && player.alive && canShoot) {
                player.Shoot();
            } else if (e.keyCode === 37) {
                player.direction.x = -1;
            } else if (e.keyCode === 38) {
                player.direction.y = -1;
            } else if (e.keyCode === 39) {
                player.direction.x = 1;
            } else if (e.keyCode === 40) {
                player.direction.y = 1;
            }
        }
    }

    function keyup(e) {
        if (e.keyCode === 32) {
            canShoot = true;
        } else if ([37, 39].indexOf(e.keyCode) !== -1) {
            player.direction.x = 0;
        } else if ([38, 40].indexOf(e.keyCode) !== -1) {
            player.direction.y = 0;
        }
    }

    function mousedown(e) {
        if (e.target === stage) {
            var playerWasClicked = player.getRect().Contains({x: e.offsetX, y: e.offsetY});
            if (playerWasClicked && player.alive) {
                player.Shoot();
            }
            if (!mouseDown) {
                player.mouse.x = e.offsetX;
                player.mouse.y = e.offsetY;
                mouseDown = true;
            }
        }
    }

    function mouseup() {
        player.direction.x = 0;
        player.direction.y = 0;
        mouseDown = false;
    }

    function mousemove(e) {
        player.mouse.x = e.offsetX;
        player.mouse.y = e.offsetY;
    }

    function cancelled(event) {
        if (event.target === stage) {
            event.preventDefault();
        }
    }

    function touchstart(e) {
        if (e.target === stage ) {
            if (player.alive && e.touches.length > 1) {
                player.Shoot();
            } else {
                touchDown = true;
                touchmove(e);
            }

            e.preventDefault();
        }
    }

    function touchend(e) {
        if (e.touches.length === 0) {
            touchDown = false;
        }
        player.direction.x = 0;
        player.direction.y = 0;

        if (e.target === stage) {
            e.preventDefault();
        }
    }


    function touchmove(e) {
        var rect = e.target.getBoundingClientRect();
        // Required for getting the stage's relative touch position, due to a previous significant offset
        var x = e.touches[0].pageX - rect.left;
        var y = e.touches[0].clientY - rect.top;

        window.stage = stage;
        player.mouse.x = x;
        player.mouse.y = y;

        if (e.target === stage) {
            e.preventDefault();
        }
    }

    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    function doInitialize(q, qid) {
        questions = q;
        quizgame = qid;
        if (document.addEventListener) {
            document.addEventListener('fullscreenchange', fschange, false);
            document.addEventListener('MSFullscreenChange', fschange, false);
            document.addEventListener('mozfullscreenchange', fschange, false);
            document.addEventListener('webkitfullscreenchange', fschange, false);
        }
        stage = document.getElementById("mod_quizgame_game");
        context = stage.getContext("2d");
        smallscreen();
        interval = setInterval(function() {
            showMenu();
        }, 500);
    }

    return {
        init: doInitialize,
    };
});
