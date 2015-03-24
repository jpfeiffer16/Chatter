$(document).on('ready', function() {
	setCreds();

	
	
	reposition();
	
	
	
	function reposition() {
		var messageListHeight = $(window).height() * .815;
		$('#message-list').height(messageListHeight);
	}
	
	var sse = new EventSource('/sse');
	sse.onmessage = function(event) {
		var messageList = $('#message-list');
		//messageList.append('<li>' + JSON.parse(event.data).message + '</li>');
		//console.log(event.data);
		//console.log(JSON.parse(event.data));
		var source = $('#message-template').html();
		var newMessageTemplate = Handlebars.compile(source);
		var context = JSON.parse(event.data);
		var html = newMessageTemplate(context);
		messageList.append(html);
		
		messageList.scrollTop(messageList[0].scrollHeight);
		//console.log(html);
	}
	
	$('#new-message-controls-container .controls .button').on('click', function(e) {
		sendMessage();
	});
	
	$('#new-message-controls-container .controls .text').on('keypress', function(e) {
		if(e.keyCode == 13) {
			e.preventDefault();
			sendMessage();
		}
	});
	
	$(window).on('resize', function() {
		reposition();
	});
	
	$(window).on('orientationchange', function(e) {
		reposition();
	});
	
	function sendMessage() {
		var date = new Date();
		var imageUrl = $('#settings .image').val();
		var username = $('#settings .username').val();
		//"img/cubes.jpg"
		//alert(window.location.hostname + ", " + window.location.port);
		$.post(location.protocol + '//' + window.location.hostname + ':' + window.location.port,{image: imageUrl, time: date.getHours().toString() + ':' + date.getMinutes().toString(), username: username, message: $('#new-message-controls-container .controls .text').val()})
		.done(function(data) {
			if(data == 'recieved') {
				console.log('Post send');
			} else {
				console.warn('Post not sent correctly');
			}
		});
		$('#new-message-controls-container .controls .text').val('');
		storeCreds();
	}
	
	function storeCreds() {
		localStorage.setItem('image', $('#settings .image').val());
		localStorage.setItem('username', $('#settings .username').val());
	}
	
	function setCreds() {
		$('#settings .image').val(localStorage.getItem('image'));
		$('#settings .username').val(localStorage.getItem('username'));
	}
	
});