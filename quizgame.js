M.mod_quizgame = (function(){

    var stage;
    var score = 0;
    var particles = [];
    var gameObjects = [];
    var imagesTotal = 0;
    var imagesLoaded = 0;
    var started = 0;
    var player;
    var level = -1;
    var displayRect = {x: 0, y: 0, width: 0, height: 0};
    var question = "";
    var interval;
    var enemySpeed = 0.8;
    var mouseDown = false;

    function playSound(soundName) {
        var soundElement = document.getElementById("mod_quizgame_sound_"+soundName);
        soundElement.currentTime = 0;
        soundElement.play();
    }

    function sizeScreen(stage, width, height) {
        displayRect.width = width || stage.clientWidth;
        displayRect.height = height || stage.clientHeight;

        stage.width = displayRect.width;
        stage.height = displayRect.height;
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
    }

    function menuEvents() {
        clearEvents();
        document.onkeydown = menukeydown;
        document.onmouseup = startGame;
    }

    function showMenu() {

        clearInterval(interval);

        stage = document.getElementById("mod_quizgame_game");
        sizeScreen(stage);

        var context = stage.getContext("2d");

        context.fillStyle = '#FFFFFF';
        context.font = "18px Audiowide";
        context.textAlign = 'center';

        if (questions !== null && questions.length > 0) {
            context.fillText(M.util.get_string('spacetostart', 'mod_quizgame'), displayRect.width/2, displayRect.height/2);
            menuEvents();
        } else {
            context.fillText(M.util.get_string('emptyquiz', 'mod_quizgame'), displayRect.width/2, displayRect.height/2);
        }
    }

    function startGame() {
        if (stage.requestFullscreen) {
              stage.requestFullscreen();
        } else if (stage.msRequestFullscreen) {
              stage.msRequestFullscreen();
        } else if (stage.mozRequestFullScreen) {
              stage.mozRequestFullScreen();
        } else if (stage.webkitRequestFullscreen) {
              stage.webkitRequestFullscreen();
        }
        sizeScreen(stage, window.screen.width, window.screen.height);

        shuffle(questions);

        if (player) {
            player.alive = true;
            player.direction.x = 0;
            player.direction.y = 0;
            score = 0;
            gameObjects = [];
            particles = [];
            level = -1;
            enemySpeed = 0.8;
            gameLoaded();
            clearInterval(interval);
        } else {
            player = new Player("pix/ship.png", 0, 0);
        }
    }

    function endGame() {
        menuEvents();
    }

    function gameLoaded() {

        var context = stage.getContext("2d");

        var planet = new GameObject("pix/planet.png", 0, 0);
        planet.image.width = displayRect.width;
        planet.image.height = displayRect.height;
        planet.direction.y = 1;
        planet.movespeed.y = 0.7;
        particles.push(planet);

        player.x = displayRect.width/2;
        player.y = displayRect.height/2;
        gameObjects.push(player);

        nextLevel();

        document.onkeyup = keyup;
        document.onkeydown = keydown;
        document.onmouseup = mouseup;
        document.onmousedown = mousedown;
        document.onmousemove = mousemove;
        document.ontouchstart = touchstart;
        document.ontouchend = mouseup;
        document.ontouchmove = touchmove;

        interval = setInterval(function() {
                draw(context, displayRect, gameObjects, particles, question);
                update(displayRect, gameObjects, particles);
            }, 40);

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
        var team = [];
        var leader;
        questions[level].answers.forEach(function(answer) {
            var enemy = new Enemy("pix/enemy.png", Math.random()*bounds.width, -Math.random()*bounds.height/2, answer.text, answer.fraction);
            if (answer.fraction < 1) {
                team.push(enemy);
            } else {
                leader = enemy;
            }
            gameObjects.push(enemy);
        });
        leader.team = team;
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
            context.fillText(M.util.get_string('score', 'mod_quizgame', score), 5, 20);
            context.textAlign = 'center';
            context.fillText(question, displayRect.width/2, 20);
        } else {
            context.fillStyle = '#FFFFFF';
            context.font = "18px Audiowide";
            context.textAlign = 'center';
            context.fillText(M.util.get_string('endofgame', 'mod_quizgame', score), displayRect.width/2, displayRect.height/2);
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
            for (var j = i+1; j < objects.length; j++) {
                collide(objects[i], objects[j]);
            }
            if (!objects[i].alive) {
                objects.splice(i, 1);
                i--;
            }
        }
    }

    function GameObject(src, x, y) {
        if (src !== null) {
            this.image = new Image();
            imagesTotal++;
            this.image.onload = function() {
                imagesLoaded++;
                if (imagesLoaded >= imagesTotal && !started) {
                    gameLoaded();
                    started = true;
                }
            };
            this.image.src = src;
        }
        this.x = x;
        this.y = y;
        this.velocity = {x: 0, y: 0};
        this.direction = {x: 0, y: 0};
        this.movespeed = {x: 5, y: 3};
        this.alive = true;
        this.decay = 0.7;
    }
    GameObject.prototype.update = function () {
        this.velocity.x += this.direction.x*this.movespeed.x;
        this.velocity.y += this.direction.y*this.movespeed.y;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y *= this.decay;
        this.velocity.x *= this.decay;
    };
    GameObject.prototype.draw = function (context) {
        context.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
    };

    function Player(src, x, y) {
        GameObject.call(this, src, x, y);
        this.mouse = {x: 0, y: 0};
    }
    Player.prototype.update = function (bounds) {
        if (mouseDown) {
            if (this.x < this.mouse.x) {
                player.direction.x = 1;
            } else if (this.x > this.mouse.x + this.image.width) {
                player.direction.x = -1;
            } else {
                player.direction.x = 0;
            }
            if (this.y < this.mouse.y) {
                player.direction.y = 1;
            } else if (this.y > this.mouse.y + this.image.height) {
                player.direction.y = -1;
            } else {
                player.direction.y = 0;
            }
        }
        GameObject.prototype.update.call(this, bounds);
        if (this.x < bounds.x-this.image.width) {
            this.x = bounds.width;
        } else if (this.x > bounds.width) {
            this.x = bounds.x-this.image.width;
        }
        if (this.y < bounds.y-this.image.height) {
            this.y = bounds.height;
        } else if (this.y > bounds.height) {
            this.y = bounds.y-this.image.height;
        }
    };
    Player.prototype.draw = function (context) {
        GameObject.prototype.draw.call(this, context);
    };
    Player.prototype.Shoot = function () {
        playSound("laser");
        gameObjects.unshift(new Laser("pix/laser.png", player.x, player.y));
        canShoot = false;
    };

    function Enemy(src, x, y, text, fraction) {
        GameObject.call(this, src, x, y);
        this.movespeed.x = enemySpeed*1.3;
        this.movespeed.y = enemySpeed*(2+Math.random())/3;
        this.direction.y = 1;
        this.text = text;
        this.fraction = fraction;
        this.team = [];
        this.movementClock = 0;
        this.shotClock = (1+Math.random())*40;
    }
    Enemy.prototype.update = function (bounds) {
        GameObject.prototype.update.call(this, bounds);

        this.movementClock--;

        if (this.movementClock <= 0) {
            this.direction.x = Math.floor(Math.random()*3)-1;
            this.movementClock = (2+Math.random())*30;
        }

        this.shotClock -= enemySpeed;

        if (this.shotClock <= 0) {
            if (this.y < bounds.height*0.6) {
                playSound("enemylaser");
                var laser = new Laser("pix/laser.png", this.x, this.y);
                laser.direction.y = 1;
                laser.fresh = false;
                gameObjects.unshift(laser);
                this.shotClock = (1+Math.random())*40;
            }
        }
        
        if (this.x < bounds.x-this.image.width) {
            this.x = bounds.width;
        } else if (this.x > bounds.width) {
            this.x = bounds.x-this.image.width;
        }
        if (this.y > bounds.height+this.image.height && this.alive) {
            this.alive = false;
            if (this.fraction >= 1) {
                this.team.forEach(function (enemy) {
                        enemy.movespeed.y *= 4;
                    });
                if (player.alive) {
                    score -= 1000;
                    nextLevel();
                }
            }
        }
    };
    Enemy.prototype.draw = function (context) {
        GameObject.prototype.draw.call(this, context);

        context.fillStyle = '#FFFFFF';
        context.font = "15px Audiowide";
        context.textAlign = 'center';
        context.fillText(this.text, this.x + this.image.width/2, this.y-5);
    };
    Enemy.prototype.die = function(shot) {
        if (this.alive) {
            this.alive = false;
            if (shot) {
                shot.alive = false;
            }

            if (this.fraction >= 1) {
                score += this.fraction * 1000;
                playSound("explosion");
                spray(this.x+this.image.width, this.y+this.image.height, 200, "#FF0000");
                this.team.forEach(function (enemy) {
                            enemy.die();
                    });
                nextLevel();
            } else if (this.fraction > 0.5) {
                score += this.fraction * 1000;
                playSound("explosion");
                spray(this.x+this.image.width, this.y+this.image.height, 50, "#FF0000");
            } else {
                if (shot) {
                    playSound("deflect");
                    this.alive = true;
                    shot.alive = true;
                    shot.direction.y = 1;
                    shot.fresh = false;
                    score += (this.fraction-0.5) * 600;
                } else {
                    spray(this.x+this.image.width, this.y+this.image.height, 50, "#FF0000");
                }
            }
        }
    };

    function Laser(src, x, y) {
        GameObject.call(this, src, x, y);
        this.direction.y = -1;
        this.fresh = true;
    }
    Laser.prototype.update = function (bounds) {
        GameObject.prototype.update.call(this, bounds);
        if (this.x < bounds.x-this.image.width ||
            this.x > bounds.width ||
            this.y < bounds.y-this.image.height ||
            this.y > bounds.height) {
            this.alive = false;
        }
        this.velocity.y = 24 * this.direction.y;
    };
    Laser.prototype.draw = function (context) {
        GameObject.prototype.draw.call(this, context);
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
    Particle.prototype.update = function (bounds) {
        GameObject.prototype.update.call(this, bounds);
        if (this.x < bounds.x-this.width ||
            this.x > bounds.width ||
            this.y < bounds.y-this.height ||
            this.y > bounds.height) {
            this.alive = false;
        }
        this.aliveTime++;
        if (this.aliveTime > (Math.random()*15)+5) {
            this.alive = false;
        }
    };
    Particle.prototype.draw = function (context) {
        context.fillStyle = this.colour;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.stroke();
    };

    function Star(bounds) {
        GameObject.call(this, null, Math.random()*bounds.width, 0);
        this.width = 2;
        this.height = 2;
        this.direction.y = 1;
        this.movespeed.y = 0.2+(Math.random()/2);
        this.aliveTime = 0;
    }
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
        if (collide_ordered(object1, object2)) {
            return true;
        } else {
            return collide_ordered(object2, object1);
        }
    }

    function collide_ordered(object1, object2) {
        if (object1 instanceof Laser && object2 instanceof Player) {
            if (!object1.fresh && intersectRect(
                {left: object1.x,
                right: object1.x+object1.image.width,
                top: object1.y,
                bottom: object1.y+object1.image.height},
                {left: object2.x,
                right: object2.x+object2.image.width,
                top: object2.y,
                bottom: object2.y+object2.image.height})) {
                playSound("explosion");
                spray(object2.x+object2.image.width/2, object2.y+object2.image.height/2, 200, "#FFCC00");
                object1.alive = object2.alive = false;
                endGame();
                return true;
            }
        }
        if (object1 instanceof Laser && object2 instanceof Enemy) {
            if (intersectRect(
                {left: object1.x,
                right: object1.x+object1.image.width,
                top: object1.y,
                bottom: object1.y+object1.image.height},
                {left: object2.x,
                right: object2.x+object2.image.width,
                top: object2.y,
                bottom: object2.y+object2.image.height})) {

                if (object1.alive && object1.fresh) {
                    object2.die(object1);
                }

                return true;
            }
        }
    }

    function intersectRect(r1, r2) {
        return !(r2.left > r1.right || 
            r2.right < r1.left || 
            r2.top > r1.bottom ||
            r2.bottom < r1.top);
    }

    function spray(x, y, num, colour) {
        for (var i = 0; i < num; i++) {
            particles.push(new Particle(x, y, {x: (Math.random()-0.5)*16, y: ((Math.random()-0.5)*16)+3}, colour));
        }
    }

    // input

    var canShoot = true;

    function menukeydown(e) {
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) !== -1) {
            e.preventDefault();
            if (e.keyCode === 32) {
                startGame();
            }
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
        playerWasClicked = 1;
        if (playerWasClicked && player.alive) {
            player.Shoot();
        }
        if (!mouseDown) {
            player.mouse.x = e.offsetX;
            player.mouse.y = e.offsetY;
            mouseDown = true;
        }
    }

    function mouseup(e) {
        player.direction.x = 0;
        player.direction.y = 0;
        mouseDown = false;
    }

    function mousemove(e) {
        player.mouse.x = e.offsetX;
        player.mouse.y = e.offsetY;
    }

    function touchstart(e) {
        mouseDown = true;
        player.mouse.x = e.touches[0].clientX - player.image.width;
        player.mouse.y = e.touches[0].clientY - player.image.height*3;
    }

    function touchmove(e) {
        player.mouse.x = e.touches[0].clientX - player.image.width;
        player.mouse.y = e.touches[0].clientY - player.image.height*3;
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

    function doInitialize() {
        interval = setInterval(showMenu, 500);
    }
    return {
        initialize: doInitialize
    };
})();

M.mod_quizgame.initialize();
