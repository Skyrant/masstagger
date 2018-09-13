chrome.browserAction.onClicked.addListener(function() {
   chrome.windows.create({'url': 'options.html', 'type': 'popup'}, function(window) {
   });
});
