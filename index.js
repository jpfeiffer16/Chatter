var path = require('path');
var fileSystem = require('fs');
var mime = require('mime');
var sse = require('sse');
var https = require('https');

var cheerio = require('cheerio');

var bodyParser = require('body-parser');
var express = require('express');
var app = express();

var defaultPort = 1337;


var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

// Connection URL
var url = 'mongodb://admin:admin@ds049219.mongolab.com:49219/personalchatter';
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server");

  db.close();
});

var insertDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insert([
    {a : 1}, {a : 2}, {a : 3}
  ], function(err, result) {
    assert.equal(err, null);
    assert.equal(3, result.result.n);
    assert.equal(3, result.ops.length);
    console.log("Inserted 3 documents into the document collection");
    callback(result);
  });
}


function getChatRooms() {
	return ["test1", "test2", "test3"];
}



app.set('port', (process.env.PORT || defaultPort));

var messages = [];

var server = app.listen(app.get('port'), function(request, response) {
	console.log('------------------------');
	console.log('Yo, sup homi.. Welcome to the server for chatter. Your server\'s at localhost on port %s', app.get('port'));
});

var serverSentEvents = new sse(server);

app.use(bodyParser());
//Send the html for the one-page app
app.get('/', function(request, response) {
	var page = getPage('404.html', 'chatter.html');
//	var listOfChatRooms = getChatRooms();
//	for(var i = 0; i < listOfChatRooms.length; i++) {
//		cheerio('#chatroom-list', page).add('<li>' + listOfChatRooms[i] + '</li>');
//	}
	response.send(page);
});

app.get('*', function(request, response) {
	var page = getPage('404.html', request.path);
	var extension = path.extname(request.path);
	response.header('Content-Type', getMimeType(request.path));
	response.header('Access-Control-Allow-Origin', '*');
	var fileExts = '.jpg.jpeg.png.woff';
	if(fileExts.indexOf(extension) != -1) {
		response.sendFile(__dirname + path.normalize(request.path));
	} else {
		response.send(page);
	}
});

app.post('/', function(request, response) {
	var data = request.body;
	if(data.event == 'typing') {
		console.log('Someone is typing');
		sendToClients('{"username" : "' + data.username + '", "event" : "' + data.event + '"}');
		response.send('recieved');
	} else {
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
		if(data.message.indexOf('clear/') != -1) {
			messages = [];
		}
		messages.push(data);
		sendToClients(JSON.stringify(data));
		response.send('recieved');
	}
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
		var connectionEvent = '{\"event\" : \"connection\"}'
		clientList[i].send(connectionEvent);
		client.send(JSON.stringify(messages[i]));
	}
}


function getMimeType(filePath) {
	var extension = path.extname(__dirname + path.normalize(filePath));
	console.log(filePath);
	console.log(extension);
	return mime.lookup(extension);
}