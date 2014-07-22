var score = 0;
var particles = [];
var gameObjects = [];
var imagesTotal = 0;
var imagesLoaded = 0;
var started = 0;
var player = new Player("pix/ship.png", 0, 0);
var level = -1;
var displayRect = {x: 0, y: 0, width: 0, height: 0};
var question = "";

function mod_quizgame_startGame() {

    var stage = document.getElementById("mod_quizgame_game");

    displayRect.width = stage.clientWidth;
    displayRect.height = stage.clientHeight;

    stage.width = displayRect.width;
    stage.height = displayRect.height;

    var context = stage.getContext("2d");

    gameObjects.push(player);
    player.x = displayRect.width/2;
    player.y = displayRect.height/2;

    nextLevel();

    setInterval(function() {
            mod_quizgame_draw(context, displayRect, gameObjects, particles, question);
            mod_quizgame_update(displayRect, gameObjects, particles);
        }, 40);

}

function nextLevel() {
    level++;
    if (level > questions.length) {
        level = 0;
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

    // score
    context.fillStyle = '#FFFFFF';
    context.font = "18px Sans";
    context.fillText("Score: " + score, 5, 20);
    
    // question
    context.fillStyle = '#FFFFFF';
    context.font = "18px Sans";
    context.fillText(question, displayRect.width/2, 20);
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
                mod_quizgame_startGame();
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
}
GameObject.prototype.update = function (bounds) {
    this.velocity.x += this.direction.x*this.movespeed.x;
    this.velocity.y += this.direction.y*this.movespeed.y;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.y *= .7;
    this.velocity.x *= .7;
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
    this.movespeed.y /= 2;
    this.movespeed.x /= 2;
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
        score -= 100;
    }
}
Enemy.prototype.draw = function (context) {
    GameObject.prototype.draw.call(this, context);

    context.fillStyle = '#FFFFFF';
    context.font = "15px Sans";
    context.fillText(this.text, this.x, this.y);
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
    this.aliveTime = 0;
}
Star.prototype.update = function (bounds) {
    GameObject.prototype.update.call(this, bounds);
    if (this.y > bounds.height) {
        this.alive = false;
    }
    this.velocity.x = 0;
    this.velocity.y = this.direction.y*1;
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
            Spray(object2.x, object2.y, 100, "#FFCC00");
            object1.alive = object2.alive = false;
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
                if (object2.fraction > 0.5) {
                    score += object2.fraction * 1000;
                } else {
                    score += (object2.fraction-1) * 300;
                }
            }

            if (object2.fraction >= 1) {
                object1.alive = object2.alive = false;
                Spray(object1.x, object1.y, 100, "#FF0000");
                object2.team.forEach(function (enemy) {
                    Spray(enemy.x, enemy.y, 25, "#FF0000");
                    enemy.alive = false;
                });
                nextLevel();
            } else {
                object1.direction.y = 1;
                object1.fresh = false;
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
        particles.push(new Particle(x, y, {x: (Math.random()-0.5)*32, y: (Math.random()-0.5)*32}, colour));
    }
}

// input

document.onkeydown = mod_quizgame_keydown;
document.onkeyup = mod_quizgame_keyup;

function mod_quizgame_keydown(e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode)!=-1) {
        e.preventDefault();
        if (e.keyCode == 32 && player.alive) {
            gameObjects.push(new Laser("pix/laser.png", player.x, player.y));
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
