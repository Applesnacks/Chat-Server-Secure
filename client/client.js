window.socketId;
window.tcp = chrome.sockets.tcp;
window.socketProperties = {};
window.secureOptions = {
	"tlsVersion": {
		"min": "tls1.2",
		"max": "tls1.2"
	}
};
window.userName = undefined;


function ab2str(buf) {
	return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
	var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
	var bufView = new Uint8Array(buf);
	for (var i=0, strLen=str.length; i < strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	}
	console.log(buf);
	return buf;
}

function log(contents) {
    if (contents.indexOf(userName + "] renamed to [") != -1) {
        userName = contents.split("renamed to [")[1].split("]")[0];
    }
	var output = document.getElementById("output");
	output.innerHTML = output.innerHTML + "<br>" + contents.replace("\n", "<br>");
}

function log_others(contents){
   if (userName === undefined && contents.indexOf("] joined") != -1) {
        userName = contents.split("] [")[1].split("]")[0];
    }

	var output = document.getElementById("output");
	output.innerHTML = output.innerHTML + "<br>" + contents.replace("\n", "<br>");
}

tcp.create(socketProperties, function(newSocketInfo) {
	socketId = newSocketInfo.socketId;
});

function connect() {
	tcp.onReceive.addListener(onReceive);
	tcp.setPaused(socketId, true, function() {
		var server = document.getElementById("server").value;
		var port = parseInt(document.getElementById("port").value);
		tcp.connect(socketId, server, port, function () {
			tcp.secure(socketId, secureOptions, function() {
				tcp.setPaused(socketId, false, function() {
				});
			});
		});
	});

	this.innerHTML = "Disconnect";
	this.onclick = disconnect;
}

function disconnect() {
    tcp.disconnect(socketId, function () { });
    this.innerHTML = "Connect";
    this.onclick = connect;
    log('Disconnected from server');
}

function blockInputString(input,length){
	return input.match(new RegExp('.{1,' + length + '}', 'g'));
}

function encrypt(input,pw){
	var splitInput = blockInputString(input,15);		//Because breaks for block size 16 for some reason.

	var ciphertext = [];
	for(i=0;i<splitInput.length;i++){
		ciphertext.push(CryptoJS.AES.encrypt(splitInput[i], pw,{hasher:CryptoJS.SHA256}).toString()+'|');
	}
	ciphertext[ciphertext.length-1] = ciphertext[ciphertext.length-1].slice(0, -1);	//Remove delim on last.
	console.log("PLAINTEXT:" + splitInput.toString());
	
	console.log("CIPHERTEXT:" + ciphertext.toString());

	return ciphertext.join('');
}

function decrypt(input,pw){
	var splitInput = input.match(new RegExp(/[^|]+/g));

	console.log("CIPHERTEXT:" + splitInput.toString());

	var decRaw = [];
	for(i=0;i<splitInput.length;i++){
		decRaw.push(CryptoJS.AES.decrypt(splitInput[i], pw).toString(CryptoJS.enc.Utf8));
	}
	console.log("PLAINTEXT:" + decRaw.toString());

	return decRaw.join('');
}

function send() {
	var input = document.getElementById("input").value;
	var output = checkTextOut(input);
	document.getElementById("input").value = "";

}

//check to see what should and should not be encrypted
function checkTextOut(text) {
	var pw = document.getElementById("pw").value;	
    textLen = text.length;
	var command = 0;

    //check for key words in the first word
    switch (text.split(" ", 1).toString().toLowerCase()) {
        case "\\quit":
            var output = text;
            command = 1;
            break;
        case "\\ping":
            var output = text;
            command = 2;
            break;
        case "\\name":
            var output = text;
            command = 3;
            break;
        case "\\me":
            var output = "\\ME " + encrypt(text.slice(4,textLen),pw);
            command = 4;
            break;
        default:
            var output = encrypt(text,pw);
    }
    console.log("Sending:" + output.toString());

    //send message to server
	tcp.send(socketId, str2ab(output), function(resultCode, bytesSent) {
		console.log(resultCode);
	});
	if (command) 
	    log(text);
	else 
	    log("[" + userName + "] " + text);
}

function onReceive(info) {
	console.log(info);
	checkTextIn(ab2str(info.data));
	
	if (info.socketId != socketId) {
		return;
	}

}

//check what is and isn't encrypted upon reception of message
function checkTextIn(text) {
    textLen = text.length;
	var pw = document.getElementById("pw").value;
	var output = "";
    //Regex expression for non-whitespace characters within brackets
    var re = new RegExp(/\[\S+\] /g);
    
	var users = text.match(re);
	var message = text.replace(re,'');
	if (users) {
	    var length = users.length;
        //welcome message
		if (userName === undefined){
			output = text;
		}
	    else if (length > 0) {
	    	for (i = 0; i < length; i++){
	    		output = output + users[i] + ' ';
	    	}
	    	if (users[0] == "[server] ")
	    		output = output + message;
	    	else
	    		output = output + decrypt(message,pw);
	    }
	}
    else {
        output = text;
    }
    log_others(output);
}

document.getElementById('connect').onclick = connect;
document.getElementById('send').onclick = send;