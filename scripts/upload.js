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
  var $form_2 = $("#verify-form");
  var $inputField = $("#message");
  $form.on("submit", function (e) {
    e.preventDefault();
    const inputFieldValue = $inputField.val();
    if (!inputFieldValue) {
      $("#loader").addClass("hidden");
      showSnackBar(
        "snackbar_error",
        "Oops! Specify message which you want to store, it can't be blank."
      );
      return;
    }
    var $verifyFields = $form_2.find("#verify-fields");
    $verifyFields.empty();
    var result = {
      date_time: new Date(),
    };
    var matches = 0;
    keywords.forEach((keyword) => {
      var match = inputFieldValue.match(keyword.regex);
      if (match !== null && match[1]) {
        matches++;
        result[keyword.key] = Number(match[1]);
      }
    });

    if (matches > 0) {
      $form.addClass("hidden");
      $form_2.removeClass("hidden");
      var str = '<div class="row">';
      Object.keys(result).forEach(function (r) {
        str +=
          "<div class='form-group col-sm-4'><label for='" +
          r +
          "' class='col-sm-2 col-form-label'>" +
          r +
          "</label><div class='col-sm-10'>";
        if (r === "date_time") {
          str +=
            "<div class='form-group'><div class='input-group'>" +
            "<input type='text' id='datetimepicker1' class='form-control' name='date_time' />" +
            "<div class='input-group-append'>" +
            "<div class='input-group-text'>" +
            "<img src='./icons/calendar-flat.png' width='24' height='24' class='calendar-icon' />" +
            "</div></div>" +
            "</div></div>";
        } else {
          str +=
            "<input type='text' class='form-control' name='" +
            r +
            "' value='" +
            result[r] +
            "'/>";
        }
        str += "</div></div>";
      });
      str += "</div>";
      $verifyFields.append(str);
      $("#datetimepicker1").datetimepicker({
        value: result.date_time,
        defaultDate: false,
        defaultTime: false,
      });
    } else {
      $("#loader").addClass("hidden");
      showSnackBar(
        "snackbar_error",
        "No matching record found in given message to store."
      );
    }
  });
  $form_2.on("submit", function (e) {
    e.preventDefault();
    $("#loader").removeClass("hidden");
    var data = $(this).serializeArray();
    var result = {};
    data.forEach(function (d) {
      if (d.name === "date_time") {
        result[d.name] = $("#datetimepicker1")
          .datetimepicker("getValue")
          .getTime();
      } else {
        result[d.name] = d.value;
      }
    });
    $.ajax("https://api.jsonbin.io/b/5e9cb7535fa47104cea38516/latest", {
      method: "GET",
      contentType: "application/json",
      headers: {
        "secret-key": SECRET_KEY,
        versioning: false,
      },
    })
      .done(function (data) {
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
            $form_2.addClass("hidden").find("#verify-fields").empty();
            $form.removeClass("hidden");
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
  });
});
