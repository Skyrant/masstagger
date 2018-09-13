var defaultColor;
function GetSubreddits(){
		chrome.storage.local.get("taggedSubs", function(data) {
			taggedSubs = data["taggedSubs"]
			chrome.storage.local.get("defaultColor", function(data) {
				defaultColor = data["defaultColor"];
				if(defaultColor == undefined){
					defaultColor = "#ff0000";
					var obj = {};
					obj["defaultColor"] = defaultColor;
					chrome.storage.local.set(obj, null)
				}
				$("#default_picker").attr("value", defaultColor);
			});
			var firstpull = (taggedSubs == undefined)
			jQuery.ajax({
				url: 'https://masstagger.com/subreddits',
				success: function (result) {
					if(!firstpull){
						taggedSubs.forEach(function(sub){
							chrome.storage.local.get(sub, function(subObj) {
								appendSub(subObj[sub]);
							})
						})
					}
					if(firstpull){
						
					}
					result.subreddits.forEach(function(e){
						if(firstpull || !taggedSubs.includes(e)){
							chrome.storage.local.get(e, function(result) {
								subObj = result[e];
								if(result[e]==null){
									sub = {}
									sub.name=e;
									sub.tagging=firstpull;
									sub.color=defaultColor;
									subObj = sub;
									var obj={}
									obj[e]=sub;
									chrome.storage.local.set(obj, null);
								}
								appendSub(subObj);
							})
						}
					});
				},
				error: function (error){
					Log("Error retrieving subreddits: "+JSON.stringify(error))
					ShowErrorPopup();
				}
			})
	})
}

function ShowErrorPopup(){
	$("#errorDialog").dialog("open");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function GetSpinner(){
	chrome.storage.local.get("minPosts", function(result) {
		var minPosts = 3
		if(result["minPosts"]==null){
			var obj={}
			obj["minPosts"]=3;
			chrome.storage.local.set(obj, null);
		}else{
			minPosts = result["minPosts"];
		}
		$('#minPosts').val(minPosts);
	})
}
 
function appendSub(sub){
	subDiv = '<li class="ui-state-default" id="'+sub.name+'"><div class="row"><div class="col-sm-1"><span class="draggable"></span></div><div class="col-sm-9">' + 
				sub.name+'</div><div class="col-sm-2"><input type="color" id="'+sub.name+'_picker" class="picker" value="'+sub.color+'"></div></div></li>';
	if(sub.tagging){
		$('#tagging').append(subDiv)
	}else{
		$('#ntagging').append(subDiv)
	}
}
 
function Save(saveEvent){
	var sortTag = $("#tagging").sortable("toArray");
	var sortNTag = $("#ntagging").sortable("toArray");
	var minPosts = $('#minPosts').val();
	var defaultColor=$("#default_picker").val();
	var obj = {};
	obj["taggedSubs"] = sortTag;
	obj["minPosts"] = minPosts;
	obj["defaultColor"] = defaultColor;
	chrome.storage.local.set(obj, null);
	
	SaveSubreddits(sortTag, true);
	SaveSubreddits(sortNTag, false);
	sleep(100); //Give us time to save everything
	window.close();
}

function SaveSubreddits(subreddits, tagging){
	subreddits.forEach(function(sub){
		chrome.storage.local.get(sub, function(result) {
			var subObj = result[sub];
			subObj.tagging=tagging;
			subObj.color=$("#"+subObj.name+"_picker").val();
			var obj={}
			obj[sub]=subObj;
			chrome.storage.local.set(obj, null);
		});
	});
}

function EditWhitelist(event){
	$("#whitelistUsers").empty();
	chrome.storage.local.get("whitelist", function(result){
		whitelist = []
		if(result["whitelist"]!=null){
			whitelist = result["whitelist"];
		}
		whitelist.forEach(function(user){
			$("#whitelistUsers").append("<div class='row' style='padding:10px;'><div class='col-sm-9'>"+user+"</div><div class='col-sm-3'><button  id='"+user+"'>Remove</button></div></div>");
			$("#"+user).click(function(){
				var user = this.id;
				chrome.storage.local.get("whitelist", function(result){
					whitelist = []
					if(result["whitelist"]!=null){
						whitelist = result["whitelist"];
					}
					var index = whitelist.indexOf(user);
					if (index > -1) {
					  whitelist.splice(index, 1);
					}
					chrome.storage.local.set({whitelist: whitelist}, null);
					$("#"+user).parent().parent().remove();
				})
			});
		})
		$("#whitelistDialog").dialog("open");
	})
}


$('#default_picker').change(function(){
	defaultColor = defaultColor.toUpperCase();
	var newColor = $("#default_picker").val();
	$(".picker").each(function(){
		if($(this).val().toUpperCase() == defaultColor){
			$(this).val(newColor);
		}
	})
	defaultColor = newColor;
});

function AddUserToWhitelist(){
	chrome.storage.local.get("whitelist", function(result){
		whitelist = []
		if(result["whitelist"]!=null){
			whitelist = result["whitelist"];
		}
		var user = $('#whitelistTxtBx').val().toUpperCase()
		if(user.startsWith("U/")){
			user = user.substr(2)
		}
		if(!whitelist.includes(user)){
			whitelist.push(user)
			$('#whitelistTxtBx').val('')
			$("#whitelistUsers").append("<div class='row' style='padding:10px;'><div class='col-sm-9'>"+user+"</div><div class='col-sm-3'><button  id='"+user+"'>Remove</button></div></div>");
			chrome.storage.local.set({whitelist: whitelist}, null);
		}
	})
}

function DebugWindow(){
	minPosts = 0;
	chrome.storage.local.get("debugLog", function(result) {
		log = result["debugLog"]
		if(log == null){
			log = ""
		}
		chrome.storage.local.get("minPosts", function(result) {
			minPosts = result["minPosts"];
			if(result["minPosts"]==null){
				minPosts = 0
			}
			chrome.storage.local.get("taggedSubs", function(result) {
				subs = result["taggedSubs"];
				if(subs == null){
					subs = []
				}
				chrome.storage.local.get("whitelist", function(result){
					whitelist = result["whitelist"];
					if(result["whitelist"] == null){
						whitelist = []
					}
					log = "Min Posts: " + minPosts + "\nTaggedSubs: " + JSON.stringify(taggedSubs) + "\nWhitelist: " + JSON.stringify(whitelist) + "\n"+ log;
					$("#logWindow").html(log);
					$("#debugDialog").dialog("open");
				})
			});
		})
	});
}

function ClearLog(){
	var obj = {};
	obj["debugLog"] = "---Begin Log---";
	chrome.storage.local.set(obj, null);
	$("#logWindow").html(obj["debugLog"]);
}

function Log(errorMessage){
	chrome.storage.local.get("debugLog", function(result) {
		result["debugLog"] += "\n" +new Date().toISOString() + " - " + errorMessage;
		chrome.storage.local.set(result, null);
	});
}



$( function() {
	$("#errorDialog").dialog({
		modal: true,
		autoOpen: false,
		width:400
	});
	$("#whitelistDialog").dialog({
		modal: true,
		autoOpen: false,
		width:400,      
		buttons: {
			"Close": function() {
			  $( this ).dialog( "close" );
			}	
		}
	});
	$("#debugDialog").dialog({
		modal: true,
		autoOpen: false,
		width:550,      
		buttons: {
			"Close": function() {
			  $( this ).dialog( "close" );
			}	
		}
	});
	GetSubreddits();
	GetSpinner();
    $( "#tagging, #ntagging" ).sortable({
		connectWith: ".connectedSortable"
    }).disableSelection();
    $("button").button();
	$("#save").click(Save)
	$("#whitelistButton").button();
	$("#whitelistButton").click(EditWhitelist);
	$("#addUserButton").button();
	$("#addUserButton").click(AddUserToWhitelist);
	$("#debug").button();
	$("#debug").click(DebugWindow);	
	$("#clearLog").button();
	$("#clearLog").click(ClearLog);
});