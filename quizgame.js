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
var enemySpeed = 1.5;

interval = setInterval(showMenu, 500);

function showMenu() {

    var stage = document.getElementById("mod_quizgame_game");

    displayRect.width = stage.clientWidth;
    displayRect.height = stage.clientHeight;

    stage.width = displayRect.width;
    stage.height = displayRect.height;

    var context = stage.getContext("2d");

    context.fillStyle = '#FFFFFF';
    context.font = "18px Audiowide";
    context.textAlign = 'center';
    context.fillText("Press space to start", displayRect.width/2, displayRect.height/2);

    clearInterval(interval);

    document.onkeyup = null;
    document.onkeydown = mod_quizgame_menukeydown;
}

function startGame() {
    if (player) {
        player.alive = true;
        player.direction.x = 0;
        player.direction.y = 0;
        score = 0;
        gameObjects = []
        particles = [];
        level = -1;
        gameLoaded();
        clearInterval(interval);
    } else {
        player = new Player("pix/ship.png", 0, 0);
    }
}

function endGame() {
    document.onkeyup = null;
    document.onkeydown = mod_quizgame_menukeydown;
}

function gameLoaded() {

    var stage = document.getElementById("mod_quizgame_game");

    var context = stage.getContext("2d");

    var planet = new GameObject("pix/planet.png", 0, 0);
    planet.image.width = displayRect.width;
    planet.image.height = displayRect.height;
    planet.direction.y = 1;
    planet.movespeed.y = 1;
    particles.push(planet);

    player.x = displayRect.width/2;
    player.y = displayRect.height/2;
    gameObjects.push(player);

    nextLevel();

    document.onkeydown = mod_quizgame_keydown;
    document.onkeyup = mod_quizgame_keyup;

    interval = setInterval(function() {
            mod_quizgame_draw(context, displayRect, gameObjects, particles, question);
            mod_quizgame_update(displayRect, gameObjects, particles);
        }, 40);

}

function nextLevel() {
    level++;
    if (level >= questions.length) {
        level = 0;
        enemySpeed *= 1.3;
    }
    question = runLevel(questions, level, displayRect)
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

function mod_quizgame_draw(context, displayRect, objects, particles, question) {
    context.clearRect(0, 0, displayRect.width, displayRect.height);

    for (var i = 0; i < particles.length; i++) {
        particles[i].draw(context);
    }

    for (var i = 0; i < objects.length; i++) {
        objects[i].draw(context);
    }

    if (player.alive) {
        context.fillStyle = '#FFFFFF';
        context.font = "18px Audiowide";
        context.textAlign = 'left';
        context.fillText("Score: " + score, 5, 20);
        context.textAlign = 'center';
        context.fillText(question, displayRect.width/2, 20);
    } else {
        context.fillStyle = '#FFFFFF';
        context.font = "18px Audiowide";
        context.textAlign = 'center';
        context.fillText("Your score was: " + score + ". Press space to restart", displayRect.width/2, displayRect.height/2);
    }
}

function mod_quizgame_update(bounds, objects, particles) {
    for (var i = 0; i < particles.length; i++) {
        particles[i].update(bounds);
        if (!particles[i].alive) {
            particles.splice(i, 1);
            i--;
        }
    }
    for (var i = 0; i < objects.length; i++) {
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
    if (src != null) {
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
    this.decay = .7;
}
GameObject.prototype.update = function (bounds) {
    this.velocity.x += this.direction.x*this.movespeed.x;
    this.velocity.y += this.direction.y*this.movespeed.y;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.y *= this.decay;
    this.velocity.x *= this.decay;
}
GameObject.prototype.draw = function (context) {
    context.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
}

function Player(src, x, y, text) {
    GameObject.call(this, src, x, y);
}
Player.prototype.update = function (bounds) {
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
}
Player.prototype.draw = function (context) {
    GameObject.prototype.draw.call(this, context);
}

function Enemy(src, x, y, text, fraction) {
    GameObject.call(this, src, x, y);
    this.movespeed.x = enemySpeed*1.6;
    this.movespeed.y = enemySpeed;
    this.direction.y = 1;
    this.text = text;
    this.fraction = fraction;
    this.team = [];
}
//Enemy.prototype = Object.create(GameObject.prototype);
Enemy.prototype.update = function (bounds) {
    GameObject.prototype.update.call(this, bounds);
    particles.push(new Star(bounds));
    if (this.x < bounds.x-this.image.width) {
        this.x = bounds.width;
    } else if (this.x > bounds.width) {
        this.x = bounds.x-this.image.width;
    }
    if (this.y > bounds.height) {
        this.x = Math.random()*bounds.width;
        this.y = bounds.y-this.image.height;
        if (player.alive) {
            score -= 100;
        }
    }
}
Enemy.prototype.draw = function (context) {
    GameObject.prototype.draw.call(this, context);

    context.fillStyle = '#FFFFFF';
    context.font = "15px Audiowide";
    context.textAlign = 'center';
    context.fillText(this.text, this.x + this.image.width/2, this.y-5);
}
Enemy.prototype.die = function(shot) {
    this.alive = false;
    if (shot) {
        shot.alive = false;
    }

    if (this.fraction >= 1) {
        score += this.fraction * 1000;
        Spray(this.x+this.image.width, this.y+this.image.height, 100, "#FF0000");
        this.team.forEach(function (enemy) {
                enemy.die();
            });
        nextLevel();
    } else if (this.fraction > 0.5) {
        score += this.fraction * 1000;
        Spray(this.x+this.image.width, this.y+this.image.height, 25, "#FF0000");
    } else {
        if (shot) {
            this.alive = true;
            shot.alive = true;
            shot.direction.y = 1;
            shot.fresh = false;
            score += (this.fraction-0.5) * 600;
        } else {
            Spray(this.x+this.image.width, this.y+this.image.height, 25, "#FF0000");
        }
    }
}

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
}
Laser.prototype.draw = function (context) {
    GameObject.prototype.draw.call(this, context);
}

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
}
Particle.prototype.draw = function (context) {
    context.fillStyle = this.colour;
    context.fillRect(this.x, this.y, this.width, this.height);
    context.stroke();
}

function Star(bounds) {
    GameObject.call(this, null, Math.random()*bounds.width, 0);
    this.width = 2;
    this.height = 2;
    this.direction.y = 1;
    this.movespeed.y = 0.5+(Math.random()/2);
    this.aliveTime = 0;
    this.decay
}
Star.prototype.update = function (bounds) {
    GameObject.prototype.update.call(this, bounds);
    if (this.y > bounds.height) {
        this.alive = false;
    }
}
Star.prototype.draw = function (context) {
    context.fillStyle = "#FFFFFF";
    context.fillRect(this.x, this.y, this.width, this.height);
    context.stroke();
}

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
            Spray(object2.x+object2.image.width/2, object2.y+object2.image.height/2, 100, "#FFCC00");
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

function Spray(x, y, num, colour) {
    for (var i = 0; i < num; i++) {
        particles.push(new Particle(x, y, {x: (Math.random()-0.5)*16, y: ((Math.random()-0.5)*16)+3}, colour));
    }
}

// input

function mod_quizgame_menukeydown(e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode)!=-1) {
        e.preventDefault();
        if (e.keyCode == 32) {
            startGame();
        }
    }
}

function mod_quizgame_keydown(e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode)!=-1) {
        e.preventDefault();
        if (e.keyCode == 32 && player.alive) {
            gameObjects.unshift(new Laser("pix/laser.png", player.x, player.y));
        } else if (e.keyCode == 37) {
            player.direction.x = -1;
        } else if (e.keyCode == 38) {
            player.direction.y = -1;
        } else if (e.keyCode == 39) {
            player.direction.x = 1;
        } else if (e.keyCode == 40) {
            player.direction.y = 1;
        }
    }
}

function mod_quizgame_keyup(e) {
    if ([37, 39].indexOf(e.keyCode)!=-1) {
        player.direction.x = 0;
    } else if ([38, 40].indexOf(e.keyCode)!=-1) {
        player.direction.y = 0;
    }
}
