if (typeof browser === 'undefined') {
  var browser = chrome;
}

/* The number of stories on /newest to fetch each time. */
const NEW_STORIES_FETCH_COUNT = 30;

/* How often, in minutes, new stories are updated */
const NEW_STORIES_UPDATE_INTERVAL = 15.0;

/**
 * Grabs new HN stories and persists them in the extension's storage.
 *
 * So there are always new stories to include on the homepage, this
 * function gets run once every 15 minutes.
 *
 * TODO: Make the run-every-#-minutes a user preference.
 */
function fetchAndStoreNew() {
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
          });
        })
        .catch((err) => {
          console.error(err)
        });
    })
    .catch((err) => {
      console.error(err);
    });
}

browser.alarms.create("newstories", {
  'when': Date.now(),
  'periodInMinutes': NEW_STORIES_UPDATE_INTERVAL
});

chrome.alarms.onAlarm.addListener((alarm) => {
  fetchAndStoreNew();
});
