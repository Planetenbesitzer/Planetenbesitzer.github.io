
var width = window.innerWidth;
var height = window.innerHeight;

function init() {
    let t = 0.05;
    document.documentElement.style.setProperty("--size", Math.min(width, height) *  t + "px");
    document.documentElement.style.setProperty("--half-radius", Math.min(width, height) * t * 0.55 + "px");
    bindEvents();
}

function bindEvents() {
    // document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
}

var hearts = [];
var heartsNum = 15;
var possibleColors = ["hotpink", "Crimson", "#c21f30", "#eea2a4", "#f07c82", "#ed5a65", "#ee3f4d", "#c45a65"]
var vAvg = 2;
var vStd = 3;
var theta = 20 /180*Math.PI;

var cvsize = {
    cvx: width * Math.sin(theta) + height * Math.cos(theta),
    cvy: (width * Math.cos(theta) + height * Math.sin(theta))*1.2, 
};
// var cv = document.createElement("canvas");
// cv.width = cvsize.cvx;
// cv.height = cvsize.cvy;

function onWindowResize(e) {
  width = window.innerWidth;
  height = window.innerHeight;
  cvsize.cvx = width * Math.sin(theta) + height * Math.cos(theta);
  cvsize.cvy = (width * Math.cos(theta) + height * Math.sin(theta))*1.2;
}

function addHeart(x, y, color, scale) {
    var heart = new Heart();
    heart.init(x, y, color, scale);
    hearts.push(heart);
}

function updateHearts() {
    while (hearts.length < heartsNum) {
        var x = Math.random() * cvsize.cvx;
        var y = -Math.random() * cvsize.cvy * 0.1;
        var color = possibleColors[Math.floor(Math.random() * possibleColors.length)];
        var scale = Math.random() * 0.5 + 0.5;
        addHeart(x, y, color, scale);
    }
    
    for (var i = 0; i < hearts.length; i++) {
        hearts[i].update();
    }

    for (var i = hearts.length - 1; i >= 0; i--) {
        if (hearts[i].y > cvsize.cvy) {
            hearts[i].die();
            hearts.splice(i, 1);
        }
    }
}

function Heart() {
    console.log("Heart")

    this.init = function(x, y, color, scale){

        let v = scale * Math.max(((1 - 2*Math.random()) * vStd + vAvg), 1);
        this.velocity = {
            // relate to its scale, distribute as a normal distribution centered at scale
            v: v,
            vx: v * Math.cos(theta),
            vy: v * Math.sin(theta), 
        };

        // this.canvas = document.createElement("canvas");
        // this.x = x;
        this.y = y;
        this.scale = scale;
        this.size = 0.1;

        this.element = document.createElement("div");
        this.element.classList.add("heart");

        this.element.style["background-color"] = color;
        this.element.style["transform"] = "rotate(225deg) scale("+scale+")";
        this.setPosition(x, y);

        // document.querySelector(".holder").appendChild(this.element);
        console.log(document.body)
        document.body.appendChild(this.element);
    }

    this.setPosition = function(x, y){
        this.leftpos = x * Math.sin(theta) + width * Math.cos(theta)**2 - y * Math.cos(theta);
        this.toppos = x * Math.cos(theta) + y * Math.sin(theta) - width * Math.sin(theta) * Math.cos(theta);
        this.element.style["left"] = this.leftpos + "px";
        this.element.style["top"] = this.toppos + "px";
    }

    this.update = function() {
        this.size += 0.03;
        if (this.size < 1) {
            this.element.style["transform"] = "rotate(225deg) scale("+this.scale * Math.sin(this.size*Math.PI/2) +")";
        }
        this.leftpos -= this.velocity.vx * this.size**2;
        this.toppos += this.velocity.vy * this.size**2;
        this.y += this.velocity.v * this.size**2;
        this.element.style["left"] = this.leftpos + "px";
        this.element.style["top"] = this.toppos + "px";
    }

    this.die = function() {
        this.element.parentNode.removeChild(this.element);
    }
}


function animate(){
    updateHearts()
    requestAnimationFrame(animate)
}

