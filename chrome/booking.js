// Author: Lin Hai
// Date: 27/08/2014
// install extension
// Chrome: Tools -> Extension -> Load unpack extension...
// ewallet 197211

var daysInadvance = 15; // booking days in advance allowed
var triggerHour="07"; // booking window hour (to change when test)
var activity="18"; // badminton

// to change the value of below setting and reload in extension manager to take effect
var venue="830"; //north vista secondary school
var c_order = new Array("01", "02", "03", "04");

//var venue="308"; // seng kang sport hall
//var c_order = new Array("07", "09", "08", "04", "12", "10", "11", "06", "05");

//var venue="301"; // hougang sport hall
//var c_order = new Array("01", "04", "12", "05", "11", "10", "08", "06", "09", "02", "03", "07");

//var venue="296"; // clementi sport hall
//var c_order = new Array("16", "15", "14", "13", "12", "11", "10", "09", "08", "07", "06", "05", "04", "03", "02", "01");

var timeslot1="17:00:00;18:00:00";
var timeslot2="18:00:00;19:00:00";

var valueSet = false;
var gotTimeslot1 = false; // booking flag
var gotTimeslot2 = false; // booking flag

$(document).ready(function() {
	myTimer();
});

function myTimer () {
	// if not login, goto login page
	if ($('a[href="https://members.myactivesg.com/auth"]')[0]) {
		$('a[href="https://members.myactivesg.com/auth"]')[0].click();
		return;
	}

	// set court and date
	if (valueSet==false) {
		valueSet=true;
		$("#activity_filter").val(activity);
		$("#venue_filter").val(venue);
		$("#date_filter").val(getBookingDate());
	}

	// add the cart
	if ($("#formFacBooking")[0] && $("input[value='ADD TO CART']")[0]) { // check whether there is an additional item screen
		$("input[value='ADD TO CART']").trigger('click');
		return;
	}

	// book the courts
	if ($('[name="timeslots[]"]')[0]){ // timeslots returned (div of class subvenre-slot exists)
		//var booked = book(); // don't specify the order
		//var booked = bookWithPreference(); // try by order specified
		var booked = bookList();
		if (booked) {
			$("input[value='ADD TO CART']").trigger('click');
		} else {
			alert("Oops, all the courts are gone!!!");
		}
		return;
	}
	
	// trigger the search on triggerHour
	if ($("#system-clock")[0]){
		var clock = $("#system-clock").text();
		if (clock.substr(0,2)==triggerHour) {
			// search
			$("input[value='Search']").trigger('click');
		} else { // just wait
			setTimeout (myTimer, 1000);
		}
		return;
	}
}

function bookList() {
	var courtList = [
		"01", "19:00:00;20:00:00",
		"02", "19:00:00;20:00:00",
		"01", "20:00:00;21:00:00",
		"02", "20:00:00;21:00:00",
		"03", "19:00:00;20:00:00",
		"04", "19:00:00;20:00:00",
		"03", "20:00:00;21:00:00",
		"04", "20:00:00;21:00:00"
	];
	var len = courtList.length / 2;
	
	var totalBooked = 0;
	for (i=0; i<len; i++) {
		var ret = bookCourtByNoAndSlot(courtList[i*2], courtList[i*2+1]);
		totalBooked = totalBooked + ret;
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

function book() {
	bookCourt("");
}

function bookWithPreference() {
	var c_count = c_order.length;
	for (var i = 0; i < c_count; i++) {
		bookCourt(c_order[i]);
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

function getBookingDate() {
	var today = new Date();
	var bookingDate = new Date();
	bookingDate.setDate(today.getDate()+daysInadvance);
	return formatDate(bookingDate);
}

function formatDate(d) {
	// format to "Thu, 11 Sep 2014"
	var m_names = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
	var d_names = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");
	var dateStr = d_names[d.getDay()] + ", " + d.getDate() + " " + m_names[d.getMonth()] + " " + d.getFullYear();
	return dateStr;
}

