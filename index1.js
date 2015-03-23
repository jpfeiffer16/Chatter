var path = require('path');
var fileSystem = require('fs');
var mime = require('mime');
var sse = require('sse');

var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var port = 1337;

var messages = [];

var server = app.listen(port, function(request, response) {
	console.log('------------------------');
	console.log('Yo, sup homi.. Welcome to the server for chatter. Your server\'s at localhost on port %s', port);
});

var serverSentEvents = new sse(server);

app.use(bodyParser());
//Send the html for the one-page app
app.get('/', function(request, response) {
	var page = getPage('404.html', 'chatter.html');
	response.send(page);
	response.send("Hi");
});

app.get('*', function(request, response) {
	var page = getPage('404.html', request.path);
	var extension = path.extname(request.path);
	response.header('Content-Type', getMimeType(request.path));
	var fileExts = '.jpg.jpeg.png.woff';
	if(fileExts.indexOf(extension) != -1) {
		response.sendFile(__dirname + path.normalize(request.path));
	} else {
		response.send(page);
	}
});

app.post('/', function(request, response) {
	var data = request.body;
	var stringData = JSON.stringify(data);
	if(data.message.indexOf('bombardall/') != -1) {
		var pos = data.message.indexOf('bombardall/') + 11;
		var dataToBomb = data.message.substring(pos);
		console.log(dataToBomb);
		var interval = setInterval(function() {
			data.message = dataToBomb;
			sendToClients(JSON.stringify(data));
			console.log('sending');
		}, 200);
		setTimeout(function() {
			clearInterval(interval);
		}, 5000);
	}
	messages.push(data);
	sendToClients(JSON.stringify(data));
	response.send('recieved');
});

var clientList = [];

serverSentEvents.on('connection', function(client) {
	catchup(client);
	clientList.push(client);
});

function sendToClients(message) {
	for(var i = 0; i < clientList.length; i++) {
		clientList[i].send(message);
		//'{\"image\" : \"img/cubes.jpg\", \"username\" : \"Joe Pfeiffer\", \"time\" : \"12:00\", \"message\" : \"Hi There!\"}'
	}
	console.log('sendToClients');
}

function getPage(defaultPage, url) {
	var url = __dirname + path.normalize("/" + url);
	var encoding = 'utf8';
	if(url != '') {
		try {
			var html = fileSystem.readFileSync(url, encoding);
		} catch(error) {
			var fileNotFoundPage;
			//fileNotFoundPage = fileSystem.readFileSync(__dirname + path.normalize('/404.html'));
			return '404';
		}
		return html;
	} else {
		return fileSystem.readFileSync(url + defaultPage, encoding);
	}
}

function catchup(client) {
	for(var i = 0; i < messages.length; i++) {
		client.send(JSON.stringify(messages[i]));
	}
}


function getMimeType(filePath) {
	var extension = path.extname(__dirname + path.normalize(filePath));
	console.log(filePath);
	console.log(extension);
	return mime.lookup(extension);
}