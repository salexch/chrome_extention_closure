// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


function clone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;

    var temp = new obj.constructor();
    for(var key in obj)
        temp[key] = clone(obj[key]);

    return temp;
}

var request_obj = {
	background: true,
	openPopup: false,
	getStatus: false
}

function switchReqProp(prop) {
	var req_obj = clone(request_obj);
	req_obj[prop] = true;
	
	return req_obj;
}

chrome.browserAction.onClicked.addListener(function(tab) {
	sendMessage(tab.id, switchReqProp('openPopup'))
});

var sendMessage = function(tab_id, msg_obj) {
	chrome.tabs.sendMessage(tab_id, msg_obj, function(response) {
		console.log(response);
	});
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (!sender.tab)
		return ;
		
		
});