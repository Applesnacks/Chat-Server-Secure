window.socketId;
window.tcp = chrome.sockets.tcp;
window.socketProperties = {
	"persistent": true,
	"name": "Chatroom"
};


function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

tcp.onReceive.addListener(function(info) {
	console.log(info);
	if (info.socketId != socketId) {
		return;
	}
});

tcp.create(socketProperties, function(newSocketInfo) {
	socketId = newSocketInfo.socketId;
});

function log(contents) {
	var output = document.getElementById("output");
	console.log(contents);
	output.innerHTML = output.innerHTML + "<br>" + contents;
}

function connect() {
	tcp.connect(socketId, "127.0.0.1", 5000, function (result) {
	});
}

function secure() {
	tcp.secure(socketId, {
		"tlsVersion": {
			"min": "tls1",
			"max": "tls1.2"
		}
	}, function(result) {
		console.log(result);
	});
}

function send() {
	var input = document.getElementById("input");
	tcp.send(socketId, str2ab(input.value), function(resultCode, bytesSent) {
		console.log(resultCode);
	});
	input.value = 0;
}

document.getElementById('connect').onclick = connect;
document.getElementById('secure').onclick = secure;
document.getElementById('send').onclick = send;