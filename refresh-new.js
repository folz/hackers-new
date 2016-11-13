if (typeof browser === 'undefined') {
  var browser = chrome;
}

function fetchAndStoreNew() {
  fetch("https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty")
    .then((response) => {
      response.json()
        .then((json) => {
          const newstories = json;

          console.log(newstories);
          browser.storage.local.set({
            'newstories': newstories
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

fetchAndStoreNew();
