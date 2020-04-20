var SECRET_KEY = "$2b$10$IVsmO5SflTOEYtIhLabWae9dioa7Ue3lf69hE2X6Of4DV2akGHXOe";
const keywords = [
  { key: "temperature", regex: /Tem[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "humidity", regex: /Humi[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "smoke", regex: /Smoke[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "nox", regex: /NOx[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "co", regex: /CO[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "methane", regex: /Methane[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "co2", regex: /CO2[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "dust", regex: /Dust[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "lat", regex: /Lat[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
  { key: "long", regex: /Long[\W]*:\W?([0-9.]+)+[ \w\/]+[,&]?/im },
];

function showSnackBar(id, msg) {
  var $target = $("#" + id);
  if (!$target) {
    return;
  }
  $target.text(msg).addClass("show");
  setTimeout(function () {
    $target.removeClass("show");
  }, 3000);
}

$(document).ready(function () {
  var $loader = $("#loader");
  var $form = $("#upload-form");
  var $inputField = $("#message");
  $form.submit(function (e) {
    e.preventDefault();
    $("#loader").removeClass("hidden");
    const inputFieldValue = $inputField.val();
    if (!inputFieldValue) {
      $("#loader").addClass("hidden");
      showSnackBar(
        "snackbar_error",
        "Oops! Specify message which you want to store, it can't be blank."
      );
      return;
    }
    var result = {};
    var matches = 0;
    keywords.forEach((keyword) => {
      var match = inputFieldValue.match(keyword.regex);
      if (match !== null && match[1]) {
        matches++;
        result[keyword.key] = Number(match[1]);
      }
    });
    if (matches > 0) {
      $.ajax("https://api.jsonbin.io/b/5e9cb7535fa47104cea38516/latest", {
        method: "GET",
        contentType: "application/json",
        headers: {
          "secret-key": SECRET_KEY,
          versioning: false,
        },
      })
        .done(function (data) {
          result.date_time = new Date().getTime();
          data.records = data.records || [];
          data.records.push(result);
          $.ajax("https://api.jsonbin.io/b/5e9cb7535fa47104cea38516", {
            method: "PUT",
            contentType: "application/json",
            headers: {
              "secret-key": SECRET_KEY,
              versioning: false,
            },
            data: JSON.stringify(data),
          })
            .done(function () {
              $loader.addClass("hidden");
              showSnackBar(
                "snackbar_success",
                "Record successfully processed and saved into database."
              );
              $form[0].reset();
            })
            .fail(function () {
              $loader.addClass("hidden");
              showSnackBar(
                "snackbar_error",
                "Error occured while saving record into database."
              );
            });
        })
        .fail(function () {
          $loader.addClass("hidden");
          showSnackBar(
            "snackbar_error",
            "Error retrieving records from database."
          );
        });
    } else {
      $("#loader").addClass("hidden");
      showSnackBar(
        "snackbar_error",
        "No matching record found in given message to store."
      );
    }
  });
});
