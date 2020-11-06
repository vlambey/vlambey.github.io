"use strict";

(function ($) {
  var SECRET_KEY =
    "$2b$10$IVsmO5SflTOEYtIhLabWae9dioa7Ue3lf69hE2X6Of4DV2akGHXOe";
  var keywords = [
    { key: "date_time", unit: "" },
    { key: "temperature", unit: "°C", limit: 30 },
    { key: "humidity", unit: "μg/m³", limit: 60 },
    { key: "smoke", unit: "mg/m³", limit: 0.4 },
    { key: "nox", unit: "μg/m³", limit: 0.5 },
    { key: "co", unit: "mg/m³", limit: 0.8 },
    { key: "methane", unit: "mg/m³", limit: 0.5 },
    { key: "co2", unit: "g/m³", limit: 0.5 },
    { key: "dust", unit: "μg/m³", limit: 100 },
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

  Date.prototype.toShortFormat = function (withoutComma) {
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
      (withoutComma ? " " : ", ") +
      year +
      " " +
      formatAMPM(this)
    );
  };

  function setSubIndexValue(arr, index, subIndex, value) {
    if (!arr) {
      return;
    }

    if (arr[index]) {
      arr[index][subIndex] = value;
    } else {
      arr[index] = [];
      arr[index][subIndex] = value;
    }
  }

  var $limit = $("#limits");
  function prepareDatasetsForChart(records, colorNames) {
    if (!records || !Array.isArray(records)) {
      return;
    }
    $limit.empty();
    var labels = [];
    var labelWiseData = {};
    var completeKeywordDetails = {};
    records.forEach(function (record) {
      labels.push(new Date(record["date_time"]).toShortFormat());
      keywords.forEach(function (keyword, i) {
        var value = record[keyword.key] || "0";
        if (
          !(
            keyword.key === "date_time" ||
            keyword.key === "lat" ||
            keyword.key === "long"
          )
        ) {
          if (labelWiseData.hasOwnProperty(keyword.key)) {
            labelWiseData[keyword.key].push(value);
          } else {
            labelWiseData[keyword.key] = [value];
          }
        }
        if (keyword.key === "date_time") {
          value = new Date(value).toShortFormat(true);
        }
        if (completeKeywordDetails.hasOwnProperty(keyword.key)) {
          completeKeywordDetails[keyword.key].push(value);
        } else {
          completeKeywordDetails[keyword.key] = [value];
        }
      });
    });

    var csvData = [];
    Object.keys(completeKeywordDetails).forEach(function (label, i) {
      setSubIndexValue(csvData, 0, i, label);
      completeKeywordDetails[label].forEach(function (value, j) {
        setSubIndexValue(csvData, j + 1, i, value);
      });
    });
    csvData.forEach(function (individual, i) {
      csvData[i] = individual.join(",");
    });
    var csvContent = "data:text/csv;charset=utf-8," + csvData.join("\n");
    $("#download_csv").attr("href", encodeURI(csvContent));

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
        $limit.append(
          "<div class='limit-tile'><span class='tile-color' style='background-color:" +
            colorName +
            "'></span><span class='tile-title'>" +
            keyword.key +
            "</span> = <span class='tile-limit'>" +
            keyword.limit +
            "</span></div>"
        );
        datasets.push({
          limit: keyword.limit,
          label: keyword.key + " (in " + keyword.unit + ")",
          backgroundColor: [],
          borderColor: colorName,
          data: labelWiseData[keyword.key],
          fill: false,
          borderWidth: 0.8,
        });
      }
    });

    datasets.forEach(function (dataset) {
      dataset.data.forEach(function (value) {
        var color = dataset.borderColor;
        if (dataset.limit && value > dataset.limit) {
          color = "#ee1111";
        }
        dataset.backgroundColor.push(color);
      });
    });

    return { datasets: datasets, labels: labels };
  }

  $(document).ready(function () {
    var $loader = $("#loader");
    const colorNames = [
      "rgb(237, 184, 121)",
      "rgb(25, 121, 169)",
      "rgb(224, 123, 57)",
      "rgb(105, 189, 210)",
      "#4a00b3",
      "rgb(204, 231, 232)",
      "rgb(4, 47, 102)",
      "rgb(127, 126, 126)",
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
              text: "Pollution Metrics",
            },
            legend: {
              position: "bottom",
            },
            tooltips: {
              mode: "index",
              intersect: false,
            },
            hover: {
              mode: "nearest",
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
  $("#download_jpg").on("click", function (e) {
    e.target.href = document
      .getElementById("pollution_graph")
      .toDataURL("image/jpg");
  });
})(jQuery);
