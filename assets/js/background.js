// The code below is in charge of keeping the background script alive to update the badge and refresh the page on time.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let scrapingInfo = {};
var notificationIds = [];
scrapingInfo.startedChecking = false;
chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
  if (req.cmd == "startScraping") {
    scrapingInfo.interval = req.interval;
    scrapingInfo.isActive = true;
    scrapingInfo.url = "";
    if (req.url) {
      const myArray = req.url.split("|");
      let array = [];
      myArray.forEach((element) => {
        let data = JSON.parse(element);
        if (data.checked) {
          let url = data.url.split('?')[1];
          scrapingInfo.originUrl = data.url;
          scrapingInfo.url = "https://skinbaron.de/api/v2/Browsing/FilterOffers?appId=730&" + url + "&language=en";
          chrome.tabs.update({ url: scrapingInfo.originUrl }, function(tab) {
            scrapingInfo.tabId = tab.id;
          });
        }
      });
    } 
    if(scrapingInfo.url == ""){
      chrome.notifications.create({
        type: "basic",
        iconUrl: "../icons/beasts-32-light.png",
        title: "Warnning!",
        message: "Please activate one of urls",
      });
      sendResponse({result:'false'});
      return;
    }
    scrapingInfo.startedChecking = false;
    scrapingInfo.ListA = [];
    scrapingInfo.item9 = -1;
    startScraping(req.interval);
  }
  if (req.cmd == "stopScraping") {
    stopScraping();
  }else if(req.cmd == "getState"){
    sendResponse({result:scrapingInfo.isActive});
  }
  sendResponse({result:'true'});
});

async function updateUIState() {
  const newState = {};
  if (scrapingInfo.isActive) {
    let timeLeft = Math.ceil((scrapingInfo.nextRefresh - Date.now()) / 1000);
    console.log('timeLeft===>' + timeLeft);
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
  scrapingInfo.nextRefresh = Date.now() + interval;
  if (!scrapingInfo.startedChecking) await MemorizeList();
  while (scrapingInfo.isActive) {
    // await updateUIState();
    if (scrapingInfo.nextRefresh < Date.now()) {
      try {
        if (scrapingInfo.isActive) {
          console.log('isActive');
          await CheckItem();
          if (!scrapingInfo.startedChecking) await MemorizeList();
        }
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

async function MemorizeList() {
  const res = await loadData();
  if (!res) return;
  scrapingInfo.ListA = [];
  scrapingInfo.item9 = [];
  const len = res?.aggregatedMetaOffers?.length > 9 ? 9 : res?.aggregatedMetaOffers?.length;
  for (var i = 0; i < len; i++) {
    if (i > 7) {
      scrapingInfo.item9 = (res.aggregatedMetaOffers[i].id ? res?.aggregatedMetaOffers[i].id : -1);
    } else {
      scrapingInfo.ListA.push(res.aggregatedMetaOffers[i].id ? res?.aggregatedMetaOffers[i].id : -1);
    }
  }
  scrapingInfo.startedChecking = true;
}

async function CheckItem() {
  const res = await loadData();
  if (!res) return;
  let items = [],
    newItems = [],
    finalItems = [];
  let len =res?.aggregatedMetaOffers?.length > 8 ? 8 : res?.aggregatedMetaOffers?.length;
  for (var i = 0; i < len; i++) {
    items.push(res?.aggregatedMetaOffers[i] ? res.aggregatedMetaOffers[i] : null);
  }
  //First compare
  len = items?.length;
  for (var i = 0; i < len; i++) {
    if (!scrapingInfo.ListA.includes(items?.[i]?.id)) {
      newItems.push(items?.[i]);
    }
  }
  if (newItems.length == 0) return;
  //Sencod compare
  

  if (scrapingInfo.item9 != newItems?.[0]?.id) {
    finalItems.push(newItems?.[0]);
  }

  scrapingInfo.ListA = [];
  scrapingInfo.item9 = [];
  const lenth = res?.aggregatedMetaOffers?.length > 9 ? 9 : res?.aggregatedMetaOffers?.length;
  for (var i = 0; i < lenth; i++) {
    if (i > 7) {
      scrapingInfo.item9 = (res.aggregatedMetaOffers[i].id ? res?.aggregatedMetaOffers[i].id : -1);
    } else {
      scrapingInfo.ListA.push(res.aggregatedMetaOffers[i].id ? res?.aggregatedMetaOffers[i].id : -1);
    }
  }

  if (finalItems.length > 0) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "../icons/baron_logo.png",
      title: finalItems.length + " New Items was created!!!",
      message: finalItems[0].extendedProductInformation?.localizedName,
    }, function(notificationId){
      notificationIds.push(notificationId);
    });

    // chrome.tabs.query({ url: scrapingInfo.originUrl }, function(tabs) {
    //   if (tabs.length > 0) {
    //     chrome.tabs.update(scrapingInfo.tabId, { active: true });
    //     chrome.tabs.executeScript({ code: "document.querySelector('#offer-container > div.product-pagination > sb-one-sided-pagination > ul > li.page-item.pagination-page.active > button').click();" });
    //   }
    // });

    chrome.notifications.onClicked.addListener(function(notificationId) {
      if (notificationIds.indexOf(notificationId) === -1) {
        return;
      }
      var index = notificationIds.indexOf(notificationId);
      chrome.tabs.getCurrent(function(tab) {
        console.log(tab);
      });
      chrome.notifications.clear(notificationId);
      notificationIds.splice(notificationIds.indexOf(notificationId), 1);
    });
    // scrapingInfo.startedChecking = false;
  }
}

chrome.runtime.onSuspend.addListener(() => {
  stopScraping();
});

async function loadData() {
  console.log(scrapingInfo.url);
  let response = null;
  try {
    response = await fetch(
      scrapingInfo.url,
      {
        method: "get",
        headers: {
          "X-API-KEY": "213398-29d2f887-2e57-4df3-add9-903e2ed6394c",
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
  response = await response.json();
  } catch (err) {
    console.log(err);
  }
  return response;
}
