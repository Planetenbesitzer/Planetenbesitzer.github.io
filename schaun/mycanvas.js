var {clientWidth:width, clientHeight:height} = document.getElementById("body1")

var canvas = document.getElementById("coord");
var context = canvas.getContext("2d");
canvas.width = width
canvas.height = 70
var width = canvas.offsetWidth;
var height = canvas.clientHeight;

var cutpoint=12;
// the y coord of line
var y = 0.85*height;
// height of point
var pointH = 0.6*height;
// x range
var beginx = 0.1*width;
var xwidth = 0.8*width;

context.strokeStyle="green";
context.lineWidth="18";
context.lineCap = "round";
context.moveTo(beginx, y);
context.lineTo(beginx+xwidth, y);
for (var i=0; i<=cutpoint; i++){
    context.moveTo(beginx+i*xwidth/cutpoint, y);
    context.lineTo(beginx+i*xwidth/cutpoint, y-pointH);
}
context.stroke();

var sheepBlock = document.getElementById("sheep")
sheepBlock.boxWidth = xwidth/cutpoint
sheepBlock.position = 6



// console.log(canvas.clientWidth)
// console.log(canvas.clientHeight)



