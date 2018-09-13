var that = this;
var whitelist;
var user = $("h1").text()

chrome.storage.local.get("whitelist", function(result) {
	that.whitelist = result["whitelist"];
	if(that.whitelist == undefined){
		that.whitelist = []
	}
	var whitelisted = whitelist.includes(user);
	if(whitelisted){
		var buttonText = "De-whitelist user"
	}else{			
		var buttonText = "Whitelist user"	
	}
	$("h1").after('<div style="padding:10px;"><a class="ui-button ui-widget ui-corner-all" id="whitelist" href="#">'+buttonText+'</a></div>')
	$("#whitelist").button();
	$("#whitelist").click(togglewhitelist);
});


function togglewhitelist(event){
	var user = $("h1").text().substring(12).toUpperCase();
	if(whitelist.includes(user)){
		var index = whitelist.indexOf(user);
		if (index > -1) {
		  whitelist.splice(index, 1);
		}
		var buttonText = "Whitelist user"
	}else{
		whitelist.push(user)
		var buttonText = "De-whitelist user"
	}
	$("#whitelist").text(buttonText)
	chrome.storage.local.set({whitelist: whitelist}, null);
}