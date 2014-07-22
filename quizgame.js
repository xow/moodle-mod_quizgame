var questions = [
    {
      question: "Is the sky blue?",
      answers: [
        "Yes", "No"
      ]
    }
];

var score = 0;
var ships = [];
var imagesTotal = 0;
var imagesLoaded = 0;
var started = 0;
var player = new Spaceship("pix/ship.png", 0, 0);

function mod_quizgame_startGame() {

    var stage = document.getElementById("mod_quizgame_game");

    var displayRect = {x: 0, y: 0, width: 0, height: 0};
    displayRect.width = stage.clientWidth;
    displayRect.height = stage.clientHeight;

    stage.width = displayRect.width;
    stage.height = displayRect.height;

    var context = stage.getContext("2d");

    ships.push(player);
    ships.push(new Enemy("pix/enemy.png", displayRect.width/2, 0, "Question Text"));

    player.x = displayRect.width/2;
    player.y = displayRect.height/2;

    setInterval(function() {
            mod_quizgame_draw(context, displayRect, ships);
            mod_quizgame_update(displayRect, ships);
        }, 41);

}

function mod_quizgame_draw(context, displayRect, objects) {
    context.clearRect(0, 0, displayRect.width, displayRect.height);

    // score
    context.fillStyle = '#FFFFFF';
    context.font = "15px Sans";
    context.fillText("Score: " + score, 5, 20);

    for (var i = 0; i < objects.length; i++) {
        objects[i].draw(context);
    }
}
function mod_quizgame_update(bounds, objects) {
    for (var i = 0; i < objects.length; i++) {
        objects[i].update(bounds);
    }
}

function Spaceship(src, x, y) {
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
    this.x = x;
    this.y = y;
    this.velocity = {x: 0, y: 0};
    this.direction = {x: 0, y: 0};
    this.movespeed = {x: 5, y: 3};

    return this;
}
Spaceship.prototype.update = function (bounds) {
    this.velocity.x += this.direction.x*this.movespeed.x;
    this.velocity.y += this.direction.y*this.movespeed.y;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.y *= .7;
    this.velocity.x *= .7;
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
Spaceship.prototype.draw = function (context) {
    context.drawImage(this.image, this.x, this.y, this.image.width, this.image.height);
}

function Enemy(src, x, y, text) {
    Spaceship.call(this, src, x, y);
    this.movespeed.y /= 2;
    this.movespeed.x /= 2;
    this.direction.y = 1;
    this.text = text;
}
//Enemy.prototype = Object.create(Spaceship.prototype);
Enemy.prototype.update = function (displayRect) {
    Spaceship.prototype.update.call(this, displayRect);
}
Enemy.prototype.draw = function (context) {
    context.fillStyle = '#FFFFFF';
    context.font = "15px Sans";
    context.fillText(this.text, this.x, this.y);
    
    Spaceship.prototype.draw.call(this, context);
}

// input

document.onkeydown = mod_quizgame_keydown;
document.onkeyup = mod_quizgame_keyup;

function mod_quizgame_keydown(e) {
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode)!=-1) {
        e.preventDefault();
        if (e.keyCode == 37) {
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
