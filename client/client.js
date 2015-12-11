window.socketId;
window.tcp = chrome.sockets.tcp;
window.socketProperties = {};
window.secureOptions = {
	"tlsVersion": {
		"min": "tls1",
		"max": "tls1"
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

function onReceive(info) {
	console.log(info);
	if (info.socketId != socketId) {
		return;
	}
	log(ab2str(info.data));
}


function log(contents) {
    if (userName === undefined && contents.indexOf("] joined") != -1) {
        userName = contents.split("] [")[1].split("]")[0];
    }

    else if (contents.indexOf(userName + "] renamed to [") != -1) {
        userName = contents.split("renamed to [")[1].split("]")[0];
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

function send() {
	var input = document.getElementById("input");
	tcp.send(socketId, str2ab(input.value), function(resultCode, bytesSent) {
		console.log(resultCode);
	});
	if (input.value.charAt(0) == "\\") {
	    log(input.value);
	}
	else {
	    log("[" + userName + "] " + input.value);
	}
	input.value = "";
}

document.getElementById('connect').onclick = connect;
document.getElementById('send').onclick = send;