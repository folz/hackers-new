if (typeof browser === 'undefined') {
  var browser = chrome;
}

/* The number of stories on /newest to fetch each update. */
const NEW_STORIES_FETCH_COUNT = 30;

/* How often, in minutes, new stories are fetched. */
const NEW_STORIES_FETCH_INTERVAL = 15.0;

/* How often, in minutes, displayed new stories are changed */
const NEW_STORIES_UPDATE_INTERVAL = 5.0;


/**
 * In-place array shuffle using the Knuth algorithm.
 */
function shuffle(array) {
    for (let i = array.length; i > 0; i--) {
        let j = Math.floor(Math.random() * i);
        [array[i - 1], array[j]] = [array[j], array[i - 1]]
    }
    return array;
}


/**
 * Grabs new HN stories and persists them in the extension's storage.
 *
 * So there are always new stories to include on the homepage, this
 * function gets run once every 15 minutes.
 *
 * TODO: Make the run-every-#-minutes a user preference.
 */
function fetchAndStoreNew() {
  return new Promise((resolve, reject) => {
    fetch("https://hacker-news.firebaseio.com/v0/newstories.json")
      .then((response) => {
        response.json()
          .then((json) => {
            // Story IDs come sorted newest-to-oldest and don't contain flagged
            // or dead submissions.
            // TODO: Make the # of new stories to consider a user preference.
            const storyIds = json.slice(0, NEW_STORIES_FETCH_COUNT);
            browser.storage.local.set({
              'newstories': storyIds
            });

            // Fetch the item json for all story IDs, in parallel.
            Promise.all(storyIds.map((id) => {
              return fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
                       .then((response) => {
                         return response.json();
                       });
            })).then((jsons) => {
              // Once we have all the items, turn them into one big
              // storage object and store it.
              const storyItems = jsons.reduce((acc, story) => {
                acc[story.id] = story;
                return acc;
              }, {});

              browser.storage.local.set(storyItems);
              resolve();
            });
          });
      });
  });
}

function updateDisplayedStories() {
  // We use the (key, callback) signature here instead of the promise
  // signature because Firefox supports both but Chrome only supports
  // the former.
  browser.storage.local.get(['newstories', 'lastUpdate'], (store) => {
    // For some reason, Firefox returns a 1-length array containing the
    // store object, while Chrome returns the store object directly.
    if (Array.isArray(store)) {
      store = store[0];
    }

    // browser.storage requires that keys are already strings. It doesn't
    // implicitly convert integers.
    let storyIdsToDisplay = shuffle(store.newstories).map(String);
    browser.storage.local.set({
      'storyIdsToDisplay': storyIdsToDisplay,
    });
  });
}

browser.alarms.create("fetchAndStoreNew", {
  'delayInMinutes': NEW_STORIES_FETCH_INTERVAL,
  'periodInMinutes': NEW_STORIES_FETCH_INTERVAL
});

browser.alarms.create("updateDisplayedStories", {
  'delayInMinutes': NEW_STORIES_UPDATE_INTERVAL,
  'periodInMinutes': NEW_STORIES_UPDATE_INTERVAL
})

chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "fetchAndStoreNew":
      fetchAndStoreNew();
      break;
    case "updateDisplayedStories":
      updateDisplayedStories();
      break;
  }
});

// Initialize
fetchAndStoreNew()
  .then(updateDisplayedStories);
