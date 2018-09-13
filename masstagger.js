var subs = [];
var minPosts;
var whitelist = [];
var userTags = {}
var waiting = {};
var domCount = 0;
$( function() {
	chrome.storage.local.get("minPosts", function(result) {
		minPosts = 3
		if(result["minPosts"]!=null){
			minPosts = result["minPosts"];
		}
	})
	
	chrome.storage.local.get("whitelist", function(result){
		whitelist = []
		if(result["whitelist"]!=null){
			whitelist = result["whitelist"];
		}
	})

	chrome.storage.local.get("taggedSubs", function(result) {
		subs = result["taggedSubs"];
		if(subs == null){
			GetSubreddits();
		}
		var tagline = $('body')
		setInterval(queryDocument, 1000);
	});
	
	chrome.storage.local.get("debugLog", function(result) {
		log = result["debugLog"];
		if(log == null){
			InitLog();
		}
	});
});

function GetSubreddits(){
	jQuery.ajax({
		url: 'https://masstagger.com/subreddits',
		success: function (result) {
			result.subreddits.forEach(function(e){
				chrome.storage.local.get(e, function(result) {
					subObj = result[e];
					if(result[e]==null){
						sub = {}
						sub.name=e;
						sub.tagging=true;
						sub.color="#FF0000"
						subObj = sub;
						var obj={}
						obj[e]=sub;
						chrome.storage.local.set(obj, null);
					}
					subs.push(e)
				})
			});
			var obj = {};
			obj["taggedSubs"] = result.subreddits;
			chrome.storage.local.set(obj, null);
			subs = result.subreddits;
		},
		error: function (error){
			Log("Error retrieving subreddits: "+JSON.stringify(error))
		}
	})
}

function InitLog(){
	var obj = {};
	obj["debugLog"] = "---Begin Log---";
	chrome.storage.local.set(obj, null);
}

function Log(errorMessage){
	chrome.storage.local.get("debugLog", function(result) {
		result["debugLog"] += "\n" +new Date().toISOString() + " - " + errorMessage;
		chrome.storage.local.set(result, null);
	});
}

function queryDocument(){
	var newCount = $('div').length
	if(newCount != domCount){
		domCount = newCount;
		users = []
		$('.author, .Post__username, .ProfileSidebar__nameTitleLink, [data-click-id="user"], a[href*="user/"]').each( function(i){
				HandleAuthor(this, users)
		}, null);
		if(users.length > 0){
			jQuery.ajax({
				type: 'POST',
				url: 'https://masstagger.com/users/subs?min='+minPosts,
				data: {"users": JSON.stringify(users)},
				success: function(data){data.users.forEach(function(user){processUsers(user)})},
				error: function (error){
					Log("Error on user query: " + JSON.stringify(users) + " " + JSON.stringify(error))
				}
			})
		}
	}
}

function HandleAuthor(obj, users){
	if(!obj.handled){
		title = obj.attributes["title"]
		if( title != null ){
			if(title.value.includes("karma")){
				obj.handled = true;
				return;
			}
		}
		var user = $(obj).text().toUpperCase();
		if(user.startsWith("U/")){
			user = user.substr(2)
		}
		if(!whitelist.includes(user)){
			if(userTags[user] == null){
				if(waiting[user] == null){
					waiting[user] = []
				}
				waiting[user].push(obj)
				if(!users.includes(user)){
					users.push(user);
				}
			}else{
				if(userTags[user].length > 0){
					$(userTags[user]).insertAfter(obj);
				}
			}
		}
		obj.handled = true
	}
}

 function processUsers(user) {
	if(user.subreddits.length > 0){
		subs.some(function(sub){
			if(user.subreddits.includes(sub)){
				chrome.storage.local.get(sub, function(result) {
					var subObj = result[sub]
					var textColor = getTextColor(subObj.color);
					var tag = '<span class="masstagger" style="background-color:'+subObj.color+';border-radius:5px;padding:2px;margin:3px;"><a href="https://masstagger.com/user/'+user.username+'" target="_blank" style="color:'+textColor+'; decoration:none;">/r/'+subObj.name+' user</a></span>';
					userTags[user.username] = tag;
					var waitList = waiting[user.username]
					waitList.forEach(function(obj){
						$(tag).insertAfter(obj);
					});
					waiting[user.username] = null;
				});
				return true;
			}else{
				userTags[user] = "";
			}
		});
	}
}

function getTextColor(color){
	var rgb = hexToRgb(color);
	var o = Math.round(((rgb.r * 299) +
                      (rgb.g * 587) +
                      (rgb.b * 114)) / 1000);
	return (o > 125) ? 'black' : 'white';

}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

