var ws = require('nodejs-websocket')
var fs = require('fs');

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

var users = {};
var chost = -1;
currentWord = 'racism';

var currentWordGuesses = 0;
var timeinround = 80;
var wordhint = "";

// Declare Global Scope
var round;

var server = ws.createServer(function(conn) {
    let uid = Math.random() * 1000;
    console.log("connected user: " + uid)
    conn.sendText(JSON.stringify({
        type: "uid",
        uid: uid
    }))
    conn.on("text", function(message) {
        message = JSON.parse(message);
        if (message.type === "name") {
            users[uid] = {
                name: message.name
            };
            users[uid].points = 0;
            pushUsers();
        } else if (message.type == "begin") {
            beginRound();
        } else {
            if (message.type == "chat" && message.message == currentWord && Object.keys(users)[chost] != uid && users[uid].guessed != true) {
                sendMessage(JSON.stringify({
                    type: 'chat',
                    sender: '<em>Server',
                    message: users[uid].name + ' guessed the word!</em>'
                }))
                users[uid].guessed = true;
                users[uid].points += (60 / (currentWordGuesses + 1));
                //setTimeout(function () { currentWordGuesses++ }, 1500);
                currentWordGuesses++;
                pushUsers();
                if (currentWordGuesses >= Object.keys(users).length) {
                    for (var reset = 0; reset < Object.keys(users).length; reset++) {
                        users[Object.keys(users)[reset]].guessed = false;
                    }
                    clearInterval(round);
                    sendMessage(JSON.stringify({
                        type: "roundUpdate",
                        time: "Inf.",
                        wordhint: "Intermission"
                    }))
                    setTimeout(function() {
                        beginRound()
                    }, 7500);
                }
            } else {
                sendMessage(JSON.stringify(message))
            }
        }
    })
	conn.on("close", function(c, r) {
		console.log("lost connection to " + uid);
		delete users[uid];
		pushUsers();
		sendMessage('<i>Server:</i> ' + uid + " bitched out."); 
	})
}).listen(25565)

function pushUsers() {
    sendMessage(JSON.stringify({
        type: "plist",
        host: Object.keys(users)[chost],
        list: users
    }))
}

function sendMessage(message) {
    server.connections.forEach(function(conn) {
        conn.sendText(message);
    })
}

function pickWord() {
    return words[Math.floor(Math.random() * words.length)]
}

var words = ["winner", "marketing", "statement", "meaning", "fact", "association", "database", "cousin", "childhood", "language", "skill", "woman", "housing", "girl", "wedding", "tea", "platform", "client", "psychology", "payment", "writing", "passenger", "employer", "philosophy", "magazine", "assignment", "recording", "bath", "patience", "college", "difficulty", "bonus", "method", "series", "strategy", "photo", "literature", "inflation", "revenue", "communication", "beer", "charity", "sympathy", "wealth", "appearance", "combination", "bathroom", "session", "month", "growth", "opinion", "love", "speaker", "scene", "speech", "youth", "classroom", "dad", "chapter", "championship", "success", "menu", "death", "airport", "driver", "percentage", "bird", "salad", "homework", "nature", "actor", "studio", "preparation", "video", "customer", "moment", "department", "clothes", "lake", "library", "protection", "orange", "preference", "agency", "committee", "failure", "manager", "ratio", "chest", "bread", "expression", "garbage", "ad", "meat", "opportunity", "setting", "instruction", "administration", "energy", "president", "wood", "improvement", "discussion", "employment", "climate", "food", "ladder", "effort", "exam", "pollution", "member", "teaching", "potato", "girlfriend", "drama", "perspective", "poem", "description", "fishing", "delivery", "efficiency", "king", "product", "conclusion", "definition", "historian", "emphasis", "editor", "initiative", "honey", "currency", "tale", "assistance", "oven", "reputation", "competition", "profession", "procedure", "role", "engine", "dinner", "sir", "outcome", "midnight", "affair", "meal", "excitement", "advertising", "user", "investment"];

function pickword() {
    return words[Math.floor(Math.random() * words.length)];
}

function beginRound() {
    chost++;
    if (chost == Object.keys(users).length) {
        chost = 0;
    }
    currentWord = pickWord();
    pushUsers();
    currentWordGuesses = 0;
    timeinround = 80;
    wordhint = currentWord.replace(/./g, "_");

    sendMessage(JSON.stringify({
        type: "clear"
    }));

    round = setInterval(function() {
		if (timeinround == 80) {
			sendMessage(JSON.stringify({
				type: "clear"
			}));
		}
        if (timeinround == 60 || timeinround == 40 || timeinround == 30) {
            let r = Math.floor(Math.random() * currentWord.length);
            wordhint = wordhint.substr(0, r) + currentWord[r] + wordhint.substr(r + 1, wordhint.length - 1);
        }
        if (timeinround == 0) {
            clearInterval(round);
            for (var reset = 0; reset < Object.keys(users).length; reset++) {
                users[Object.keys(users)[reset]].guessed = false;
            }
            sendMessage(JSON.stringify({
                type: "roundUpdate",
                time: "Inf.",
                wordhint: "Intermission"
            }))
            setTimeout(function() {
                beginRound()
            }, 7500);
            sendMessage(JSON.stringify({
                type: 'chat',
                sender: '<em>Server',
                message: 'The word was <b>' + currentWord + '</b></em>'
            }))
        }
        if (currentWordGuesses >= Object.keys(users).length - 1) {
            clearInterval(round);
            for (var reset = 0; reset < Object.keys(users).length; reset++) {
                users[Object.keys(users)[reset]].guessed = false;
            }
	    sendMessage(JSON.stringify({
                type: "roundUpdate",
                time: "Inf.",
                wordhint: "Intermission"
            }))
            setTimeout(function() {
                beginRound()
            }, 7500);
        } else {
            sendMessage(JSON.stringify({
                type: "roundUpdate",
                time: timeinround,
                wordhint: wordhint,
                realword: currentWord
            }))
        }
        timeinround--;
    }, 1000);
}
