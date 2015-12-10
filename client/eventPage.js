chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('client.html', {
		'outerBounds': {
			'width': 400,
			'height': 600
		}
    });
});