// Author: Lin Hai
// Date: 27/08/2014
// install extension
// Chrome: Tools -> Extension -> Load unpack extension...
// ewallet 197211

function getCourts(venue) {
	for (let i = 0; i < venues.length; i++) {
		if (venues[i].venue===venue) {
			console.log("*** courts: "+venues[i].courts);
			return venues[i].courts;
		}
	}
	alert("Error: invalid venue "+venue);
}

function getTimeSlot(startHour) {
	return pad(startHour,2)+":00:00;"+pad(startHour+1,2)+":00:00";
}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function getBookingDate() {
	var today = new Date();
	var bookingDate = new Date();
	bookingDate.setDate(today.getDate()+15); // 15 days advanced booking

	// format to "Thu, 11 Sep 2014"
	var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
	var d_names = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
	var dateStr = d_names[bookingDate.getDay()] + ", " + bookingDate.getDate() + " " + m_names[bookingDate.getMonth()] + " " + bookingDate.getFullYear();
	return dateStr;
}

function sleep(milliseconds) {
	const date = Date.now();
	let currentDate = null;
	do {
		currentDate = Date.now();
	} while (currentDate - date < milliseconds);
}

///////////////////
// Configuration
///////////////////
var triggerHour="07"; // booking window hour (to change when test)
var activity="18"; // badminton
var venues = [
	{"venue":"821", "courts":["04",  "03", "02", "01"],"name":"bendermeer primary school"},
	{"venue":"830", "courts":["04",  "03", "02", "01"],"name":"north vista secondary school"},
	{"venue":"308", "courts":["07", "09", "08", "04", "12", "10", "11", "06", "05"],"name":"seng kang sport hall"},
	{"venue":"301", "courts":["01", "04", "12", "05", "11", "10", "08", "06", "09", "02", "03", "07"],"name":"hougang sport hall"},
	{"venue":"296", "courts":["16", "15", "14", "13", "12", "11", "10", "09", "08", "07", "06", "05", "04", "03", "02", "01"],"name":"clementi sport hall"}
];

// to change the value of below setting and reload in extension manager to take effect
var venue="821"; //bendermeer primary school
var startHour = 15; // 15:00
var duration = 3;

var courts = getCourts(venue);
var valueSet = false;

$(document).ready(function() {
	// if not login, goto login page
	if ($('a[href="https://members.myactivesg.com/auth"]')[0]) {
		console.log("not login, redirect to login");
		$('a[href="https://members.myactivesg.com/auth"]')[0].click();
		return;
	}

	// set court and date
	if ($('#activity_filter')[0] && valueSet==false) {
		console.log("set venue and date");
		valueSet=true;
		$("#activity_filter").val(activity);
		$("#venue_filter").val(venue);
		$("#date_filter").val(getBookingDate());

		$('#activity_filter_chosen').find('span').text($('#activity_filter option[value='+activity+']').text());
		$('#venue_filter_chosen').find('span').text($('#venue_filter option[value='+venue+']').text());
	}

	myTimer();
});

function myTimer () {
	console.log("*** Timer triggered ***");

	// add to cart
	console.log("checking add to cart...");
	if ($("#formFacBooking")[0] && $("input[value='ADD TO CART']")[0]) { // check whether there is an additional item screen
		console.log("add to cart");
		$("input[value='ADD TO CART']").trigger('click');
		return;
	}

	// book the courts
	console.log("checking court availablity...");
	if ($('.timeslot-container')[0]){ // timeslots returned (div of class timeslot-container exists)
		if ($('[name="timeslots[]"]')[0]){ // timeslots returned (div of class subvenre-slot exists)
			console.log("timeslots found");
			//var booked = book(); // don't specify the order
			//var booked = bookWithPreference(); // try by order specified
			console.log("invoke bookList()");
			var booked = bookList();
			if (booked) {
				console.log("add to cart");
				sleep(500);
				$("input[value='ADD TO CART']").trigger('click');
				//setTimeout (myTimer, 500);
				return;
			}
		} else { // no timeslots, in other pages
			console.log("no timeslots in page");
			return;
		}

		console.log("Oops, all the courts are gone!!!");
		alert("Oops, all the courts are gone!!!");
		return;
	}
	
	// trigger the search on triggerHour
	console.log("checking court searching...");
	if ($("#system-clock")[0]){
		var clock = $("#system-clock").text();
		if (clock.substr(0,2)==triggerHour) {
			console.log("trigger search");
			// search
			$("input[value='Search']").trigger('click');
		} else { // just wait
			console.log("check after 0.5 second");
			setTimeout (myTimer, 500);
		}
		return;
	}
}

function bookList() {
	var totalBooked = 0;
	for (i=0; i<duration; i++) {
		var timeslot = getTimeSlot(startHour+i);
		for (c=0; c<courts.length; c++) {
			var ret = bookCourtByNoAndSlot(c, timeslot);
			if (ret==1) { // got the court, move the next timeslot
				totalBooked = totalBooked + ret;
				break;
			}
		}
		if (totalBooked==2) break;
	}
	return (totalBooked > 0);
}

function bookCourtByNoAndSlot(courtNo, timeslot) {
	var result = 0;
	$('[name="timeslots[]"]').each(function() {
		var timeslotVal = $( this ).val();
		if (timeslotVal.indexOf("Court "+courtNo)!=-1 && timeslotVal.indexOf(timeslot)!=-1) {
			if ($(this).prop('disabled')==false) { // avaiable
				// grab it
				//set property also work, but safer way is to trigger click event
				//$(this).prop('checked', true);
				$("label[for='"+$(this).attr("id")+"']").trigger('click');
				
				result = 1;
				return false; // return false to stop the foreach loop
			}
			return false;
		}
	});
	return result;
}

/*
function book() {
	bookCourt("");
}

function bookWithPreference() {
	var c_count = courts.length;
	for (var i = 0; i < c_count; i++) {
		bookCourt(courts[i]);
	}
	
	return gotTimeslot1 || gotTimeslot2; // return true if any court if booked
}

function bookCourt(courtNo) {
	// check if any court from 20:00, 21:00 enabled
	$('[name="timeslots[]"]').each(function() {
		// if got court, stop process next court
		if (gotTimeslot1 && gotTimeslot2) return;
		
		var timeslotVal = $( this ).val();

		// if the court no not match, try next one
		if (courtNo != "") {
			if (timeslotVal.indexOf("Court "+courtNo)==-1) return;
		}
		
		if (!gotTimeslot1) {
			if (timeslotVal.indexOf(timeslot1)!=-1) {
				if ($(this).prop('disabled')==false) { // avaiable
					// grab it
					//set property also work, but safer way is to trigger click event
					//$(this).prop('checked', true);
					$("label[for='"+$(this).attr("id")+"']").trigger('click');
					gotTimeslot1 = true;
				}
				return;
			}
		} 
		
		if (!gotTimeslot2) {
			if (timeslotVal.indexOf(timeslot2)!=-1) {
				if ($(this).prop('disabled')==false) { // avaiable
					// grab it
					//$(this).prop('checked', true);
					$("label[for='"+$(this).attr("id")+"']").trigger('click');
					gotTimeslot2 = true;
				}
				return;
			}
		}
	});
}

function reload() {
	location.reload(true);
}
*/

/*
function formatDate(d) {
	// format to "Thu, 11 Sep 2014"
	var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
	var d_names = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
	var dateStr = d_names[d.getDay()] + ", " + d.getDate() + " " + m_names[d.getMonth()] + " " + d.getFullYear();
	return dateStr;
}
*/

