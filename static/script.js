var setToastMessage = function (message) {
    var toastMessenger = $("#toastMessenger");
    toastMessenger.html(message);
    toastMessenger.css({ "opacity": "1", "bottom": "20px" });
    setTimeout(function () {
        toastMessenger.css({ "opacity": "0", "bottom": "0" });
    }, 2500);
};

//form field refernces
var formFields = [$("#name"), $("#email"), $("#originLatitude"), $("#originLongitude"), $("#destnLatitude"), $("#destnLongitude"), $("#time")];

var validateForm = function () {
    var isFormValid = true;
    for (var i = 0; i < formFields.length; i++) {
        var val = formFields[i].val();
        switch (i) {
            case 1:
                //email
                var atpos = val.indexOf("@");
                var dotpos = val.lastIndexOf(".");
                if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= val.length) {
                    isFormValid = false;
                    formFields[i].addClass("form-invalid");
                }
                else {
                    formFields[i].removeClass("form-invalid");
                }
                break;

            case 6:
                //time
                var t = val.split(":");
                //check for number
                if (t[0] == parseInt(t[0], 10) && t[1] == parseInt(t[1], 10)) {
                    //check for valid hour and minute
                    if (t[0] >= 0 && t[0] < 24 && t[1] >= 0 && t[1] < 60) {
                        formFields[i].removeClass("form-invalid");
                    }
                    else {
                        formFields[i].addClass("form-invalid");
                        isFormValid = false;
                    }
                }
                else {
                    formFields[i].addClass("form-invalid");
                    isFormValid = false;
                }

            default:
                //for all other fields, check for emptiness
                if (val == "") {
                    formFields[i].addClass("form-invalid");
                    isFormValid = false;
                }
                else {
                    formFields[i].removeClass("form-invalid");
                }
                break;
        }
    }
    return isFormValid;
};

var resetFormFields = function () {
    for (var i = 0; i < formFields.length; i++) {
        formFields[i].val("");
    }
};

var GMAPS_API_KEY = "AIzaSyB6ky0s6kmaxH15hsxsNHKuZeI6n_OG2eA",
    UBER_SERVER_TOKEN = "ECWcv5urK26d-pz-OHio9c9ovHpahx4UBbQIzMTi";

var isRequestPending = false; //used to prevent multiple clicking of button
$("#btnRemind").click(function () {
    if (!isRequestPending) {
        isRequestPending = true;
        var isFormValid = validateForm();
        if (isFormValid) {
            //form data
            var name = formFields[0].val(),
                email = formFields[1].val(),
                originLatitude = formFields[2].val().trim(),
                originLongitude = formFields[3].val().trim(),
                destnLatitude = formFields[4].val().trim(),
                destnLongitude = formFields[5].val().trim(),
                time = formFields[6].val(),
                timeAttrs = time.split(":");
            var mapsURL = "https://maps.googleapis.com/maps/api/directions/json?origin=" + originLatitude + "," + originLongitude + "&destination=" + destnLatitude + "," + destnLongitude + "&key=" + GMAPS_API_KEY;
            $.get(mapsURL, function (mapData) {
                //duration value always returns in seconds
                var travelDuration = mapData.routes[0].legs[0].duration.value;
                
                var uberURL = "https://api.uber.com/v1/estimates/time?server_token=" + UBER_SERVER_TOKEN + "&start_latitude=" + originLatitude + "&start_longitude=" + originLongitude;
                $.get(uberURL, function (uberData) {
                    var uberOptions = uberData.times, uberEstimateTime = 600;
                    if (uberOptions.length >= 1) {
                        //finds time for ubergo, if not it takes uberpool
                        //if it doesn't find both of the above, it takes the time of first available option
                        uberEstimateTime = uberOptions[0].estimate;
                        for (var i = 0; i < uberOptions.length; i++) {
                            if (uberOptions[i].display_name == 'uberGO' || uberOptions[i].display_name == 'uberPOOL') {
                                uberEstimateTime = uberOptions[i].estimate;
                                if (uberOptions[i].display_name == 'uberGO') {
                                    break;
                                }
                            }
                        }
                    }
                    var totalOffsetMinutes = Math.ceil(travelDuration / 60) + Math.ceil(uberEstimateTime / 60);
                    //create UTC date
                    var date = new Date();
                    date.setHours(timeAttrs[0]);
                    date.setMinutes(timeAttrs[1]);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                    var postData = { name: name, email: email, origin: originLatitude + "," + originLongitude, destination: destnLatitude + "," + destnLongitude, time: date.toUTCString(), notifyTime: new Date(date.getTime() - (totalOffsetMinutes * 60 * 1000)).toUTCString() };
                    $.post('/api/notify', postData).done(function (data) {
                        console.log(data);
                        setToastMessage("Remainder added at " + notifyTime.toLocalTimeString());
                        resetFormFields();
                        isRequestPending = false;
                    }).fail(function () {
                        isRequestPending = false;
                    });
                }).fail(function () {
                    isRequestPending = false;
                });
            }).fail(function () {
                isRequestPending = false;
            });
        }
        else {
            isRequestPending = false;
            setToastMessage("Form Data Invalid");
        }
    }
});
