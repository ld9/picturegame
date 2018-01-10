/* Variable Definitions */

var port = '32512';
var server = null;

var name = prompt('username');
var server = new WebSocket('ws://10.0.0.9:' + port);

var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
context.lineJoin = "round";
context.lineWidth = 5;

var updatePeriod = 100;
var gameLoop = null;

var mouseDown = 0;
var status = 0;
var color = "#000000"
var size = 5;
var isDrawing = false;

var index = 0;

var players = {};
var uid = null;

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var clickColor = new Array();
var clickSize = new Array();

var chat = document.getElementById('chat-text');

/* Websocket Listener*/
server.onmessage = function (event) {
    var d = JSON.parse(event.data);
    console.log("Recieved: " + d.type);
    if (d.type == 'drawing' && !isDrawing) {
        clickX = clickX.concat(d.clickX);
        clickY = clickY.concat(d.clickY);
        clickDrag = clickDrag.concat(d.clickDrag);
        clickColor = clickColor.concat(d.clickColor);
        clickSize = clickSize.concat(d.clickSize);
        draw();
    } else if (d.type == 'plist') {
        if (d.host == uid) {
            isDrawing = true;
            document.getElementById('tools').className = '';
        } else {
            isDrawing = false;
            document.getElementById('tools').className = 'disabled';
        }
        players = d.list
        renderPlayers();
    } else if (d.type == 'uid') {
        uid = d.uid;
        server.send(JSON.stringify({
            type: "name",
            name: name
        }));
    } else if (d.type == 'chat') {
        chat.innerHTML += "<div>"+ d.sender + ": " + d.message +"</div>";
        chat.scrollTop = chat.scrollHeight;
    } else if (d.type == 'clear' && !isDrawing) {
        clearPage();
    } else if (d.type == 'roundUpdate') {
        document.getElementById('time').innerHTML = d.time;
        if (isDrawing) {
            document.getElementById('word').innerHTML = d.realword;
        } else {
            document.getElementById('word').innerHTML = d.wordhint;
        }

        if (d.time == 0) {
            isDrawing = false;
            clearPage();
        }
    }
}

/*Render Playerlist + Sort by score*/
function renderPlayers() {
    var names = new Array;
    var score = new Array;
    var iht = '';

    for (var i = 0; i < Object.keys(players).length; i++) {
        names.push(players[Object.keys(players)[i]].name);
        score.push(players[Object.keys(players)[i]].points);
    }

    for (var i = 0; i < score.length; i++) {
        for (var k = 0; k < score.length; k++) {
            if (score[k] < score[k+1]) {
                temps = score[k];
                score[k] = score[k+1];
                score[k+1] = temps;

                tempn = names[k];
                names[k] = names[k+1];
                names[k+1] = tempn;
            }
        }
    }
    
    for (var i = 0; i < names.length; i++) {
        iht += "<div><div class='score-name'>" + names[i] + "</div><div class='score-pts'>" + score[i] + "</div></div>";
    }
    plist.innerHTML = iht;
}

/*Send information to the server 10x/s while drawing*/
var callHome = setInterval(function(){
    if (isDrawing) {
        sendData = {
            type: "drawing",
            clickX: clickX.slice(index),
            clickY: clickY.slice(index),
            clickDrag: clickDrag.slice(index),
            clickColor: clickColor.slice(index),
            clickSize: clickSize.slice(index)
        }
        index = clickX.length;
        if (sendData.clickX.length > 0) {
            server.send(JSON.stringify(sendData));
        }
    }
}, 100)

/*Outbound chat component*/
var chatter = document.getElementById('chatter');
chatter.addEventListener('keydown', function (e) {
    if (e.keyCode == 13) {
        server.send(JSON.stringify({
            type:"chat",
            sender:players[uid].name,
            message:chatter.value
        }));
        chatter.value = '';
    }
})

/*Gameplay controls*/
function clearSizeMenu() {
    document.getElementById('size-s').style.fontWeight = "normal";
    document.getElementById('size-n').style.fontWeight = "normal";
    document.getElementById('size-l').style.fontWeight = "normal";
    document.getElementById('size-h').style.fontWeight = "normal";
}

/*Event Listeners*/
document.getElementById('size-h').addEventListener("click", function () {
    size = 40;
    clearSizeMenu()
    document.getElementById('size-h').style.fontWeight = "bold";
})

document.getElementById('size-l').addEventListener("click", function () {
    size = 25;
    clearSizeMenu()
    document.getElementById('size-l').style.fontWeight = "bold";
})

document.getElementById('size-n').addEventListener("click", function () {
    size = 5;
    clearSizeMenu()
    document.getElementById('size-n').style.fontWeight = "bold";
})

document.getElementById('size-s').addEventListener("click", function () {
    size = 2.5;
    clearSizeMenu()
    document.getElementById('size-s').style.fontWeight = "bold";
})

document.getElementById('clear').addEventListener("click", function () {
    if (isDrawing) {
        clearPage();
        server.send(JSON.stringify({type:"clear"}));
    }
})

canvas.addEventListener('mousedown', function (e) {
    if (isDrawing) {
        status = 1;
        addPoint (e, false);
    }
})

canvas.addEventListener('mousemove', function (e) {
    if (status > 0) {
        addPoint(e, true);
    }
})

canvas.addEventListener('mouseup', function () {
    status = 0;
})

canvas.addEventListener('mouseout', function () {
    status = 0;
})

/*Reset the drawing board*/
function clearPage() {
    clickX.length = 0;
    clickY.length = 0;
    clickDrag.length = 0;
    clickColor.length = 0;
    clickSize.length = 0;
    index = 0;
    context.clearRect(0, 0, 640, 640);
}

/*Initialize a game
Can be done by any player in the match.*/
function beginRound () {
    server.send(JSON.stringify({
        type: "begin"
    }))
}

/*Drawing function*/
function addPoint (e, s) {
    addClick(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop, s);
    draw();
}

function addClick (x, y, dragging) {
    clickX.push(x);
    clickY.push(y);
    clickDrag.push(dragging);
    clickColor.push(color);
    clickSize.push(size);
}

function draw () {
    context.clearRect(0, 0, 640, 640);

    context.lineJoin = "round";

    for (var i = 0; i < clickX.length; i++) {		
        context.beginPath ();
        if (clickDrag[i] && i){
            context.moveTo (clickX[i-1], clickY[i-1]);
        }else{
            context.moveTo (clickX[i]-1, clickY[i]);
        }
        context.strokeStyle = clickColor[i];
        context.lineWidth = clickSize[i];
        context.lineTo (clickX[i], clickY[i]);
        context.closePath ();
        context.stroke ();
    }
}
