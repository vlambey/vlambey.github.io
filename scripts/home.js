"use strict";

(function ($) {
  var SECRET_KEY =
    "$2b$10$IVsmO5SflTOEYtIhLabWae9dioa7Ue3lf69hE2X6Of4DV2akGHXOe";
  var keywords = [
    { key: "date_time", unit: "" },
    { key: "temperature", unit: "°C" },
    { key: "humidity", unit: "μg/m³" },
    { key: "smoke", unit: "mg/m³" },
    { key: "nox", unit: "μg/m³" },
    { key: "co", unit: "mg/m³" },
    { key: "methane", unit: "mg/m³" },
    { key: "co2", unit: "g/m³" },
    { key: "dust", unit: "μg/m³" },
    { key: "lat", unit: "" },
    { key: "long", unit: "" },
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

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    var strTime = hours + ":" + minutes + " " + ampm;
    return strTime;
  }

  Date.prototype.toShortFormat = function () {
    var month_names = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    var day = this.getDate();
    var month_index = this.getMonth();
    var year = this.getFullYear();

    return (
      month_names[month_index] +
      " " +
      day +
      ", " +
      year +
      " " +
      formatAMPM(this)
    );
  };

  function prepareDatasetsForChart(records, colorNames) {
    if (!records || !Array.isArray(records)) {
      return;
    }
    var datasets = [];
    var labels = [];
    var labelWiseData = {};
    records.forEach(function (record) {
      labels.push(new Date(record["date_time"]).toShortFormat());
      keywords.forEach(function (keyword) {
        if (
          !(
            keyword.key === "date_time" ||
            keyword.key === "lat" ||
            keyword.key === "long"
          )
        ) {
          const value = record[keyword.key] || "0";
          if (labelWiseData.hasOwnProperty(keyword.key)) {
            labelWiseData[keyword.key].push(value);
          } else {
            labelWiseData[keyword.key] = [value];
          }
        }
      });
    });

    var datasets = [];
    keywords.forEach(function (keyword, i) {
      if (
        !(
          keyword.key === "date_time" ||
          keyword.key === "lat" ||
          keyword.key === "long"
        )
      ) {
        var colorName = colorNames[i - (1 % colorNames.length)];
        datasets.push({
          label: keyword.key + " (in " + keyword.unit + ")",
          backgroundColor: colorName,
          borderColor: colorName,
          data: labelWiseData[keyword.key],
          fill: false,
        });
      }
    });

    return { datasets: datasets, labels: labels };
  }

  $(document).ready(function () {
    var $loader = $("#loader");
    const colorNames = [
      "rgba(255, 99, 132, 0.2)",
      "rgba(54, 162, 235, 0.2)",
      "rgba(255, 206, 86, 0.2)",
      "rgba(75, 192, 192, 0.2)",
      "rgba(153, 102, 255, 0.2)",
      "rgba(255, 159, 64, 0.2)",
      "rgb(0, 0, 0)",
    ];
    const $canvas = $("#pollution_graph");
    const ctx = $canvas[0].getContext("2d");

    $.ajax("https://api.jsonbin.io/b/5e9cb7535fa47104cea38516/latest", {
      method: "GET",
      contentType: "application/json",
      headers: {
        "secret-key": SECRET_KEY,
        versioning: false,
      },
    })
      .done(function (data) {
        $loader.addClass("hidden");
        var result = prepareDatasetsForChart(data.records, colorNames);
        if (result.datasets && result.datasets.length === 0) {
          showSnackBar(
            "snackbar_error",
            "No records found in database ! Use upload page to update the database first."
          );
          return;
        }
        var chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: result.labels,
            datasets: result.datasets,
          },
          options: {
            responsive: true,
            title: {
              display: true,
              text: "Pollution Graph Records",
            },
            tooltips: {
              mode: "index",
              intersect: false,
            },
            hover: {
              mode: "nearest",
              intersect: true,
            },
            scales: {
              xAxes: [
                {
                  display: true,
                  scaleLabel: {
                    display: true,
                    labelString: "Time",
                  },
                },
              ],
              yAxes: [
                {
                  display: true,
                  scaleLabel: {
                    display: true,
                    labelString: "Value",
                  },
                },
              ],
            },
          },
        });
      })
      .fail(function (data) {
        $loader.addClass("hidden");
        showSnackBar(
          "snackbar_error",
          "Some error occrured, Please try again later"
        );
      });
  });
})(jQuery);
