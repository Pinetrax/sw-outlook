//Todo: option to count all unread mail

var request = require("sdk/request").Request;
var tabs = require("sdk/tabs");
var tmr = require('sdk/timers');
var self = require("sdk/self");
var preferences = require("sdk/simple-prefs").prefs;
var notifications = require("sdk/notifications");
var { ActionButton } = require("sdk/ui/button/action");

// Global variables
var oldcount = 0;

var outlookbutton = ActionButton({
    id: "outlookbutton",
    label: "Not logged in",
    icon: {
		"16": "./outlook-16.png",
		"32": "./outlook-32.png",
		"64": "./outlook-64.png"
    },
    onClick: newOutlook,
	badge: "",
	badgeColor: "#FF4444"
});

tmr.setTimeout(function(){ checkOutlook(); }, preferences.checktime * 1000);

function checkOutlook() {
	request({
		url: "https://dub110.mail.live.com/default.aspx",
		content: { var: Date.now() },
		onComplete: function(response) { 
			console.log("Static");
			//Test if logged in:
			if(response.text.indexOf("Login_Core.js") > 0) { 
				//not logged in
				//ich bin mir nicht sicher ob dieser Test funktioniert :D
				outlookbutton.label = "Not logged in";
				outlookbutton.badge = "!";
			} else {
				var count = /title="\w+?&#\d+?;(\d+?)"/.exec(response.text);
				
				if(count !== null && count[1] !== undefined) { //fail test
					//count > 999? -> 999+
					// console.log(count);
					if (!(parseInt(oldcount) >= parseInt(count[1]))) {
						oldcount = count[1];
						if (parseInt(count[1]) >= 1000) { count[1] = "999+"; }
						if (parseInt(count[1]) == 0) {
							count[1] = "";
						} else {
							notifications.notify({
								title: count[1] + " new E-Mail on Outlook",
								text: "Click here to open outlook",
								iconURL: self.data.url("outlook-64.png"),
								onClick: function () { newOutlook(); }
							});
						}
					}
					outlookbutton.label = "Visit outlook.com";
					outlookbutton.badge = count[1];
				} else {
					// console.log('Error!');
					// console.log(response.text);
					outlookbutton.label = "Check login";
					outlookbutton.badge = "@!";
				}
			}
		}
	}).get();
	console.log("check");
	tmr.setTimeout(function(){ checkOutlook(); }, preferences.checktime * 1000);
}

function newOutlook() {
	switch (preferences.newtab) {
		case "N":
			tabs.open("https://mail.live.com/");
			break;
		case "R":
			var reused = false;
			for (let tab of tabs) {
				if (/mail\.live\.com/.test(tab.url)) {
					tab.activate();
					reused = true;
				}
				if ((/about:newtab/.test(tab.url)) && !reused) {
					tab.activate();
					tab.url = "https://mail.live.com/";
					reused = true;
				}
			}
			if (!reused) {
				tabs.open("https://mail.live.com/");
			}
			break;
	}
}