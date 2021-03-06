/**
 * Checks Wayback Machine API for url snapshot
 */
function wmAvailabilityCheck(url, onsuccess, onfail) {
  var requestUrl = 'https://archive.org/wayback/available';
  var requestParams = 'url=' + encodeURI(url);
  fetch(requestUrl, {
    method:'POST',
    headers: new Headers({
      'Content-Type': 'application/x-www-form-urlencoded',
    }),
    body:requestParams
  })
    .then(response => response.json())
    .then(function(json){
      let wayback_url = getWaybackUrlFromResponse(json);
      let timestamp = getWaybackTimestampFromResponse(json)
      if(wayback_url !== null){
        onsuccess(wayback_url, url, timestamp);
      }else if(onfail){
        onfail();
      }
    })
}


/**
 * Makes sure response is a valid URL to prevent code injection
 * @param url {string}
 * @return {bool}
 */
function isValidUrl(url) {
  return ((typeof url) === "string" &&
    (url.indexOf("http://") === 0 || url.indexOf("https://") === 0));
}

//List of excluded Urls
var excluded_urls = [
  "localhost",
  "0.0.0.0",
  "127.0.0.1",
  "chrome://",
  'chrome://newtab',
  'chrome.google.com/webstore',
  'chrome-extension://',
  'web.archive.org',
  'file://'
];
// Function to check whether it is a valid URL or not
function isNotExcludedUrl(url) {
  for (var i = 0, len = excluded_urls.length; i < len; i++) {
    if (url.startsWith("http://" + excluded_urls[i]) || url.startsWith("https://" + excluded_urls[i]) || url.startsWith(excluded_urls[i])) {
      return false;
    }
  }
  return true;
}

/**
 * @param response {object}
 * @return {string or null}
 */
function getWaybackUrlFromResponse(response) {
  if (response.results &&
    response.results[0] &&
    response.results[0].archived_snapshots &&
    response.results[0].archived_snapshots.closest &&
    response.results[0].archived_snapshots.closest.available &&
    response.results[0].archived_snapshots.closest.available === true &&
    response.results[0].archived_snapshots.closest.status.indexOf("2") === 0 &&
    isValidUrl(response.results[0].archived_snapshots.closest.url)) {
    return response.results[0].archived_snapshots.closest.url.replace(/^http:/, 'https:');
  } else {
    return null;
  }
}

function getWaybackTimestampFromResponse(response) {
  if (response.results &&
    response.results[0] &&
    response.results[0].archived_snapshots &&
    response.results[0].archived_snapshots.closest &&
    response.results[0].archived_snapshots.closest.available &&
    response.results[0].archived_snapshots.closest.available === true &&
    response.results[0].archived_snapshots.closest.status.indexOf("2") === 0 &&
    isValidUrl(response.results[0].archived_snapshots.closest.url)) {
    return response.results[0].archived_snapshots.closest.timestamp;
  } else {
    return null;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Customizes error handling
 * @param status {string}
 * @return {string}
 */
function getErrorMessage(req){
  return "The requested service " + req.url + " failed: " + req.status + ", " + req.statusText
}

function getUrlByParameter (name) {
  const url = new URL(window.location.href)
  return url.searchParams.get(name)
}

function openByWindowSetting(url, op=null, cb) {
  if (op === null) {
    chrome.storage.sync.get(['show_context'], function (event) { opener(url, event.show_context, cb) });
  } else {
    opener(url, op);
  }
}

function opener(url, option, callback) {
  if (option === 'tab' || option === undefined) {
    chrome.tabs.create({ url: url }, function (tab) {
      if (callback) { callback(tab.id); }
    });
  } else {
    chrome.system.display.getInfo(function (displayInfo) {
      let height = displayInfo[0].bounds.height
      let width = displayInfo[0].bounds.width
      chrome.windows.create({ url: url, width: width / 2, height, top: 0, left: width / 2, focused: true }, function (window) {
        if (callback) { callback(window.tabs[0].id); }
      });
    })
  }
}
function notify(message, callback){
  var options = {
    type: "basic",
    title: "WayBack Machine",
    message: message,
    iconUrl:chrome.extension.getURL("images/icon@2x.png")
  }
  chrome.notifications.create(options, callback);
}

function attachTooltip (anchor, tooltip, pos='right', time=200) {
  // Modified code from https://embed.plnkr.co/plunk/HLqrJ6 to get tooltip to stay
  return anchor.attr({
    'data-toggle': 'tooltip',
    'title': tooltip
  })
    .tooltip({
      animated: false,
      placement: `${pos} auto`,
      html: true,
      trigger: 'manual'
    })
  // Handles staying open
    .on('mouseenter', function () {
      $(anchor).tooltip('show')
      $('.popup_box').on('mouseleave', function () {
        setTimeout(function () {
          if (!$(`.${anchor.attr('class')}[href*="${anchor.attr('href')}"]:hover`).length) {
            $(anchor).tooltip('hide')
          }
        }, time)
      })
    })
    .on('mouseleave', function () {
      setTimeout(function () {
        if (!$('.popup_box:hover').length) {
          $(anchor).tooltip('hide')
        }
      }, time)
    })
}



if (typeof module !== 'undefined') {
  module.exports = {
    getUrlByParameter: getUrlByParameter,
    getWaybackUrlFromResponse: getWaybackUrlFromResponse,
    isValidUrl: isValidUrl,
    isNotExcludedUrl: isNotExcludedUrl,
    wmAvailabilityCheck: wmAvailabilityCheck,
    openByWindowSetting: openByWindowSetting,
    attachTooltip: attachTooltip,
  }
}
