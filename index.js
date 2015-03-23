var express = require('express');

var app = express();

var port = 80;

var server = app.listen(port, function(request, response) {
	console.log('------------------------');
	console.log('Yo, sup homi.. Welcome to the server for chatter. Your server\'s at localhost on port %s', port);
});


app.get('/', function(request, response) {
	response.send('Hi');
});