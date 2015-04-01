$(document).on('ready', function() {
	var windowIsInFocus = true;
	
	setCreds();

	reposition();
	
	window.onfocus = function() {
		windowIsInFocus = true;
	};
	window.onblur = function() {
		windowIsInFocus = false;
	};
	
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
		if(context.event == 'connection') {
			$('#message-list li').remove();
		} else if(context.event == 'typing') {
			$('#typing-status').text(context.username + ' is typing');
			setTimeout(function() {
				$('#typing-status').text('');
			}, 800);
		} else {
			var html = newMessageTemplate(context);
			messageList.append(html);

			messageList.scrollTop(messageList[0].scrollHeight);
			//console.log(html);
			if(!windowIsInFocus) {
				notify(context.username + ':', context.message, context.image);
			}
		}
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
	
	$('#new-message-controls-container .controls .text').on('keypress', function(e) {
		var username = $('#settings .username').val();
		$.post(location.protocol + '//' + window.location.hostname + ':' + window.location.port,{username: username, event: 'typing'})
		.done(function(data) {
			if(data == 'recieved') {
				console.log('Post send');
			} else {
				console.warn('Post not sent correctly');
			}
		});
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
		$.post(location.protocol + '//' + window.location.hostname + ':' + window.location.port,{image: imageUrl, time: date.getHours().toString() + ':' + date.getMinutes().toString(), username: username, message: $('#new-message-controls-container .controls .text').val(), event: 'message'})
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
	
	function notify(notificationTitle, notificationMessage, userImage) {
		Notification.requestPermission();

		var notification = new Notification(notificationTitle, {
			icon: userImage,
			body: notificationMessage,
		});
		$(notification).on('click', function() {
			window.focus();
		});
		setTimeout(function() {notification.close()}, 6000);
	}
});