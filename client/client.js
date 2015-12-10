window.socketId;
window.tcp = chrome.sockets.tcp;
window.socketProperties = {
	//"persistent": true,
	//"name": "Chatroom"
};
window.secureOptions = {
	"tlsVersion": {
		"min": "tls1",
		"max": "tls1"
	}
};


function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
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
	var output = document.getElementById("output");
	output.innerHTML = output.innerHTML + "<br>" + contents;
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
}

function send() {
	var input = document.getElementById("input");
	tcp.send(socketId, str2ab(input.value), function(resultCode, bytesSent) {
		console.log(resultCode);
	});
	log(input.value);
	input.value = "";
}

document.getElementById('connect').onclick = connect;
document.getElementById('send').onclick = send;