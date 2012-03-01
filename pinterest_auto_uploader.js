pinterest = {};

pinterest.data = false;
pinterest.imageTotal = false;
pinterest.imageCount = false;
pinterest.boardID = false;
pinterest.boardListHREF = 'http://pinterest.com/pin/create/bookmarklet/';
pinterest.boardNewHREF = 'http://pinterest.com/board/create/';
pinterest.boardName = 'Daily Aisle Venues';
pinterest.boardCategory = 'wedding_events';

pinterest.newBoard = function(callback){
	var post_data = {
		'name': pinterest.boardName,
		'category': pinterest.boardCategory
	};
	$.ajax({
		url: pinterest.boardNewHREF,
		type: 'POST',
		data: post_data,
		headers: {
			'X-CSRFToken': $('#CreateBoard').find('input[name="csrfmiddlewaretoken"]').val()
		},
		success: function(data, textStatus, jqXHR){
			pinterest.boardID = data.id;
			if(typeof callback === 'function' && callback()){
				callback();
			}
		},
		error: function(data, textStatus, jqXHR){
			alert('Error creating new board!');
		}
	});
};

pinterest.getBoardsList = function(callback){
	var $boards_select = $('#boards_select');
	$boards_select.html('');
	$.ajax({
		url: pinterest.boardListHREF,
		success: function(data, textStatus, jqXHR){
			var $html = $(jqXHR.responseText);
			var $lis = $html.find('.BoardList li');
			var $select = $('<select></select>');
			var returnedhtml = '';
			$lis.each(function(i){
				var $this = $(this);
				if($this.find('span').html() == pinterest.boardName){
					pinterest.boardID = $this.attr('data');
				}
			});
			if(!pinterest.boardID){
				pinterest.newBoard(callback());
			}
			else{
				if(typeof callback === 'function' && callback()){
					callback();
				}
			}
		},
		error: function(){
			alert('Error getting boards!');
		}
	});
};

pinterest.getImageList = function(){
	var href ='http://www.dailyaisle.com/json/?type=pinterest';
	$.getJSON(href + '&callback=?', function(data){
		$('#num_images').html('(' + data.length + ')');
		pinterest.data = data;
		pinterest.imageTotal = pinterest.data.length;
		pinterest.imageCount = 0;
		$('#pin_images').show();
		$('#loader_gif').hide();
	});
};

pinterest.updateCounter = function(current, total){
	var $counter = $('#counter');
	$counter.html('(' + current + '/' + total + ')');
};

pinterest.pinImages = function(callback){
	pinterest.updateCounter(pinterest.imageCount, pinterest.imageTotal);
	if(pinterest.data && pinterest.boardID){
		var queue = [];
		$.each(pinterest.data, function(index, value){
			var queueobject = function(){
				$.ajax({
					url: pinterest.boardListHREF,
					data: {
						'media': value.url,
						'url': ('http://www.dailyaisle.com/vendor/' + value.slug + '/'),
						'is_video': false,
						'description': (value.vendor + ' - Wedding Venue - www.dailyaisle.com')
					},
					headers: {
						'X-Requested-With': ''
					},
					success: function(data, textStatus, jqXHR){
						$.ajax({
							type: 'POST',
							url: pinterest.boardListHREF,
							headers: {
								'X-Requested-With': ''
							},
							data: {
								'csrfmiddlewaretoken': $(jqXHR.responseText).find('input[name="csrfmiddlewaretoken"]').val(),
								'caption': value.vendor + ' - Wedding Venue - www.dailyaisle.com',
								'board': pinterest.boardID,
								'media_url': value.url,
								'url': 'http://www.dailyaisle.com/vendor/' + value.slug + '/'
							},
							success: function(data, textStatus, jqXHR){
								pinterest.imageCount++;
								pinterest.updateCounter(pinterest.imageCount, pinterest.imageTotal);
								if(queue.length){
									(queue.shift())();
								}
							},
							error: function(){
							}
						});
					},
					error: function(){
					}
				});
			};
			queue.push(queueobject);
		});
		if(typeof callback === 'function' && callback()){
			queue.push(callback);
		}
		for(var i = 0; i < 50; i++){
			(queue.shift())();
		}
	}
	else{
		return false;
	}
};

pinterest.showPanel = function(){
	var html = 
		'<div id="pinterest_panel" style="position:fixed;width:250px;top:50px;right:30px;z-index:10000;background:#67A6A6;border-radius:10px;padding:15px"> \
		<div style="background:#EDF7F9;padding:10px;width:230px;border-radius:8px"> \
		<h1 style="font-size:20px;margin:0;padding:0;color:#67A6A6">Hello!</h1> \
		<p style="font-size:15px;margin:0;padding:0;color:#67A6A6">Pin Daily Aisle Venues <br/>in 2 easy steps: <br/></p> \
		<hr style="border-style:solid;border-color:#67A6A6"> \
		<p style="font-size:15px;margin:0;padding:0;color:#67A6A6">1. Click this: <a href="#" id="pin_images" style="display:block;margin:10px 0;padding:10px;border-radius:8px;background:#E7259D;color:white">Start pinning!</a></p> \
		<p style="font-size:15px;margin:0;padding:0;color:#67A6A6">2. Wait a few minutes for the uploader to work its magic.  Feel great for helping your friends.</p><br/> \
		<p style="font-size:15px;margin:0;padding:0;color:#67A6A6">Warning: If you get (0/545) without movement  or a giant spinner, hit reload and try again. :)</p> \
		<hr style="border-style:solid;border-color:#67A6A6"> \
		<img id="loader_gif" style="display:none" src="http://media.dailyaisle.com/media/img/ajax-loader.gif" width="50" height="50"/> \
		<p style="font-size:50px;margin:0;padding:0;color:#67A6A6">Loading...</p><br/><p id="counter" style:"color:#67A6A6;font-size:50px"></p> \
		</div></div>';
	$('body').append(html);
	var $panel = $('#pinterest_panel');
	$('#pin_images').hide();

	pinterest.getImageList();

	$panel.on('click', 'a', function(event){
		event.preventDefault();
		var $this = $(this);
		var id = $this.attr('id');
		if(id == 'pin_images'){
			$('#pin_images').hide();
			$('#loader_gif').show();
			pinterest.getBoardsList(function(){
				pinterest.pinImages(function(){
					$('#loader_gif').hide();
				});
			});
		}
	});
};

pinterest.init = function(){
	pinterest.showPanel();
};

pinterest.init();