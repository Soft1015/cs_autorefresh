// The code below is in charge of keeping the background script alive to update the badge and refresh the page on time.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let scrapingInfo = {};
chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
  if (req.cmd == "startScraping") {
    console.log(chrome.fileSystemProvider);
    scrapingInfo.interval = req.interval;
    scrapingInfo.isActive = true;
    if (req.url) {
      const myArray = req.url.split("|");
      let array = [];
      myArray.forEach((element) => {
        const data = JSON.parse(element);
        if (data.checked) {
          array.push(data.url);
        }
      });
      scrapingInfo.url = array;
    } else {
      scrapingInfo.url = [];
    }
    if (req.listB) {
      const myArray = req.listB.split("|");
      let array = [];
      myArray.forEach((element) => {
        const data = JSON.parse(element);
        array.push(data);
      });
      scrapingInfo.listB = array;
    } else {
      scrapingInfo.listB = [];
    }
    startScraping(req.interval);
  }
  if (req.cmd == "stopScraping") {
    stopScraping();
  }
  sendResponse({});
});

async function updateUIState() {
  const newState = {};
  if (scrapingInfo.isActive) {
    let timeLeft = Math.ceil((scrapingInfo.nextRefresh - Date.now()) / 1000);
    if (scrapingInfo.interval < 1000 && timeLeft == 1)
      timeLeft = scrapingInfo.interval / 1000;
    newState.badgeText = timeLeft.toString();
  } else {
    newState.badgeText = "";
  }
  if (
    scrapingInfo.badgeText != newState.badgeText &&
    scrapingInfo.badgeText != "0"
  ) {
    await chrome.browserAction.setBadgeText({ text: newState.badgeText });
  }
  scrapingInfo.badgeText = newState.badgeText;
}

async function startScraping(interval) {
  await loadData();
  scrapingInfo.nextRefresh = Date.now() + interval;
  while (scrapingInfo.isActive) {
    await updateUIState();
    if (scrapingInfo.nextRefresh < Date.now()) {
      try {
        if (scrapingInfo.isActive) startScraping(interval);
      } catch (e) {
        console.log("ERROR REFRESHING TAB:", e);
      }
      scrapingInfo.nextRefresh = Date.now() + interval;
    }
    await updateUIState();
    await delay(Math.min(interval, 1000));
  }
}

function stopScraping() {
  if (!scrapingInfo) return;
  scrapingInfo.isActive = false;
  updateUIState();
}

async function loadData() {
  var proxy = "https://cors-anywhere.herokuapp.com/";
  const json_url =
    proxy +
    "https://skinbaron.de/api/v2/Browsing/FilterOffers?appId=730&sort=NF&wub=99&qf=2&qf=4&qf=6&qf=8&qf=10&qf=12&language=en";
  let response = null;
  try {
    response = await fetch(json_url, {
      method: "get",
      headers: {
        "X-API-KEY": "apikey",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // not jumping in here.
    // console.log(err);
  }
  //   console.log("ddddddddddd");
  //   var audio = new Audio("../wav/alertsound.wav");
  //   audio.play();

  chrome.notifications.create({
    type: "basic",
    iconUrl: "../icons/beasts-32-light.png",
    title: "New Item",
    message: "This is a notification from my Chrome extension",
  });
  saveDataToFile();
}
function saveDataToFile() {
  var fs = chrome.fileSystem;
  // Request access to the file system
  fs.requestWritableFileSystem(function (fileSystem) {
    // Create a file in the root directory
    fileSystem.root.getFile(
      "mydata.txt",
      { create: true },
      function (fileEntry) {
        // Create a FileWriter object
        fileEntry.createWriter(function (fileWriter) {
          // Write the data to the file
          var data = "Hello, world!";
          var blob = new Blob([data], { type: "text/plain" });
          fileWriter.write(blob);

          // Log a message to the console
          console.log("Data written to file");
        });
      }
    );
  });
}
