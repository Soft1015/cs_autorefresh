function activateListeners() {
  $("#btn-start").click(function () {
    if (!started) {
      started = true;
      localStorage.setItem("started", "true");
      $("#btn-start").text("Stop");
      $("btn-start").css("background-color", "red");
      chrome.runtime.sendMessage(
        {
          cmd: "startScraping",
          interval: parseInt(localStorage.getItem("time")) * 3000,
          url: localStorage.getItem("url"),
          listB: localStorage.getItem("block"),
          listA: localStorage.getItem("buy"),
        },
        function (res) {
          loadingDB();
          console.log(res);
        }
      );
    } else {
      started = false;
      $("btn-start").css("background-color", "green");
      localStorage.setItem("started", "false");
      $("#btn-start").text("Start");
      chrome.runtime.sendMessage(
        {
          cmd: "stopScraping",
        },
        function (res) {
          console.log(res);
        }
      );
    }
  });
}
var started = false;
$("#addRowUrl").click(function () {
  var html = "<tr>";
  html += "<td></td>";
  html +=
    "<td class='text-center'><input type='text' class='form-control'></td>";
  html +=
    "<td class='text-center'><div class='checkbox'><input type='checkbox'></div></td>";
  html +=
    "<td class='text-center'><button type='button' class='btn btn-danger btn-sm btn-url-del'>X</button></td></tr>";
  $("#tbody_url").append(html);
});

$(document).on("click", ".btn-url-del", function () {
  $(this).parent().parent().remove();
});

$("#urlSave").click(function () {
  let array = [];
  $("#tbody_url > tr").each(function () {
    let data = {};
    data.url = $(this).find("input[type=text]").val();
    data.checked = $(this).find("input[type=checkbox]")[0].checked;
    array.push(JSON.stringify(data));
  });
  localStorage.setItem("url", array.join("|"));
  loadUrlData();
});

$("#timeSave").click(function () {
  var audio = new Audio("../wav/alertsound.wav");
  audio.play();
  localStorage.setItem("time", $("#time").val());
});

$("#addRowBlock").click(function () {
  var html = "<tr>";
  html += "<td></td>";
  html +=
    "<td class='text-center'><input type='text' class='form-control'></td>";
  html +=
    "<td class='text-center'><input type='text' class='form-control'></td>";
  html +=
    "<td class='text-center'><button type='button' class='btn btn-danger btn-sm btn-block-item-del'>X</button></td></tr>";
  $("#tbody_block").append(html);
});

$("#blockItemSave").click(function () {
  let array = [];
  $("#tbody_block > tr").each(function () {
    let data = {};
    data.name = $(this).find("input[type=text]:first").val();
    data.wear = $(this).find("input[type=text]:eq(1)").val();
    array.push(JSON.stringify(data));
  });
  localStorage.setItem("block", array.join("|"));
  loadBlockItemData();
});

$(document).on("click", ".btn-block-item-del", function () {
  $(this).parent().parent().remove();
});

function loadingDB() {
  loadUrlData();
  loadBlockItemData();
  if(!localStorage.getItem("time")){
    localStorage.setItem("time", "1");
  }
  $("#time").val(localStorage.getItem("time"));
  started = localStorage.getItem("started") == "true" ? true : false;
  if (started) {
    $("#btn-start").text("Stop");
    $("btn-start").css("background-color", "red");
  }
}

function loadUrlData() {
  const text = localStorage.getItem("url");
  if (text) {
    const myArray = text.split("|");
    let i = 1;
    var html = "";
    myArray.forEach((element) => {
      const data = JSON.parse(element);
      const checked = data.checked ? "checked" : "";
      if (data) {
        html += "<tr>";
        html += "<td>" + i + "</td>";
        html +=
          "<td class='text-center'><input type='text' class='form-control' value='" +
          data.url +
          "'></td>";
        html +=
          "<td class='text-center'><div class='checkbox'><input type='checkbox' " +
          checked +
          "></div></td>";
        html +=
          "<td class='text-center'><button type='button' class='btn btn-danger btn-sm btn-url-del'>X</button></td></tr>";
        i++;
      }
    });
    $("#tbody_url").empty();
    $("#tbody_url").append(html);
  }
}

function loadBlockItemData() {
  const text = localStorage.getItem("block");
  if (text) {
    const myArray = text.split("|");
    let i = 1;
    var html = "";
    myArray.forEach((element) => {
      const data = JSON.parse(element);
      if (data) {
        html += "<tr>";
        html += "<td>" + i + "</td>";
        html +=
          "<td class='text-center'><input type='text' class='form-control' value='" +
          data.name +
          "'></td>";
        html +=
          "<td class='text-center'><input type='text' class='form-control' value='" +
          data.wear +
          "'></td>";
        html +=
          "<td class='text-center'><button type='button' class='btn btn-danger btn-sm btn-block-item-del'>X</button></td></tr>";
        i++;
      }
    });
    $("#tbody_block").empty();
    $("#tbody_block").append(html);
  }
}
document.addEventListener(
  "DOMContentLoaded",
  function () {
    activateListeners();
    loadingDB();
  },
  false
);
