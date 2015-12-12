/*
 * GLOBALS
 */

window.tcp = chrome.sockets.tcp;
window.socketProperties = {};
window.secureOptions = {
	"tlsVersion": {
		"min": "tls1.2",
		"max": "tls1.2"
	}
};

window.socketId = undefined;
window.userName = undefined;
window.decryptSplit = new RegExp(/[^|]+/g);
window.encryptSplit = new RegExp(/.{1,15}/g);


/*
 * UTIL
 */

function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
	var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i = 0, strLen=str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	return buf;
}


/*
 * ENCRYPTION
 */

function encrypt(input, pw){
	var splitInput = input.match(encryptSplit);  // Because breaks for block size 16 for some reason.

	var ciphertext = [];
	for (var i = 0; i < splitInput.length; i++){
		ciphertext.push(CryptoJS.AES.encrypt(splitInput[i], pw, {hasher: CryptoJS.SHA256}).toString() + '|');
	}
	ciphertext[ciphertext.length - 1] = ciphertext[ciphertext.length-1].slice(0, -1);	 // Remove delim on last.

	return ciphertext.join('');
}

function decrypt(input,pw){
	var splitInput = input.match(decryptSplit);

	var decRaw = [];
	for (var i = 0; i < splitInput.length; i++){
		decRaw.push(CryptoJS.AES.decrypt(splitInput[i], pw).toString(CryptoJS.enc.Utf8));
	}

	return decRaw.join('');
}


/*
 * MESSAGE LOG
 */
 
function log(contents) {
	if (userName === undefined && contents.indexOf("] joined") >= 0) {  // Only occurs on initial connection.
        userName = contents.split("] [")[1].split("]")[0];
    }
    else if (contents.indexOf(userName + "] renamed to [") >= 0) {
        userName = contents.split("renamed to [")[1].split("]")[0];
    }
	
	if (!contents.endsWith('\r\n')) {
		contents += "\r\n";
	}
	
	var output = document.getElementById("output");
	output.appendChild(document.createTextNode(contents));
	output.scrollTop = output.scrollHeight;
}


function checkTextOut(text) {  //check to see what should and should not be encrypted
	var pw = document.getElementById("pw").value;
	var inputParts = text.split(" ");
	var output;

    switch (inputParts[0].toLowerCase()) {
        case "\\quit":
        case "\\ping":
        case "\\name":
        case "\\active":
		case "\\help":
			output = text;
			break;
		case "\\private":
			inputParts.shift();  // Remove /private
			output = "\\private " + inputParts.shift() + " " + encrypt(inputParts.join(" "), pw);
			break;
        case "\\me":
            output = "\\me " + encrypt(text.slice(4, text.length), pw);
            break;
        default:  // no commands found.
            output = encrypt(text, pw);
    }
	
	return output;
}

function checkTextIn(text) {  //check what is and isn't encrypted upon reception of message
	var pw = document.getElementById("pw").value;
	var output;
	
	if (text[0] == '*') {
		var split = text.split(" ");
		output = decrypt(split.pop().slice(0, -2), pw) + "**";  // Decrypt message portion
		output = "**" + split.join(" ").slice(2) + " " + output;  // re-append username
	}
	else if (text.indexOf("[server]") == 0) {
		output = text;
	}
	else if (text[0] == '[') {
		var split = text.split("] ");
		output = split.shift() + "] ";
		output += decrypt(split.join("] "), pw);  // first portion is username
	}
	else {
		output = text;
	}
	
	log(output);
}


/*
 * SOCKET COMMANDS
 */
 
// Only run this once.
tcp.onReceive.addListener(onReceive);

function connect() {
	var server = document.getElementById("server").value;
	var port = parseInt(document.getElementById("port").value);
	
	tcp.create(socketProperties, function(newSocketInfo) {
		socketId = newSocketInfo.socketId;
		
		tcp.setPaused(socketId, true, function() {  // onReceive must be paused for connection and secure		
			tcp.connect(socketId, server, port, function () {
				tcp.secure(socketId, secureOptions, function() {
					tcp.setPaused(socketId, false, function() {  // re-enable onReceive to open pipe.
						var button = document.getElementById('connect');
						button.innerHTML = "Disconnect";
						button.onclick = disconnect;
					});
				});
			});
		});
	});
}

function disconnect() {
    tcp.disconnect(socketId, function () {
		log('Disconnected from server');
		
		var button = document.getElementById('connect');
		button.innerHTML = "Connect";
		button.onclick = connect;
	});
}

function onReceive(info) {
	if (info.socketId != socketId) {
		return;
	}
	
	checkTextIn(ab2str(info.data));
}

function send() {
	var input = document.getElementById("input");
	if (input.value.length == 0 || socketId === undefined) {
		return;
	}
	
	var output = checkTextOut(input.value);
	
	tcp.send(socketId, str2ab(output), function(resultCode, bytesSent) {
		if (resultCode < 0) {
			log("Error sending.");
		}
		else {
			var msg = input.value;
			if (msg.startsWith("\\me")) {
				log("**" + userName + " " + msg.slice(4) + "**");
			}
			else if (input.value.indexOf("\\") == 0) {
			}
			else {  // Not a command, so log with username in front.
				log("[" + userName + "] " + msg);
			}
		}
		input.value = "";
	});
}

document.getElementById('connect').onclick = connect;
document.getElementById('send').onclick = send;


/*
 * PAGE EVENTS
 */

function onMessageType(event) {
	if (event.keyCode == 13) {
		send();
	}
}

document.getElementById('input').onkeypress = onMessageType;