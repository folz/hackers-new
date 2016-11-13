if (typeof browser === 'undefined') {
  var browser = chrome;
}

// We use the (key, callback) signature here instead of the promise
// signature because Firefox supports both but Chrome only supports
// the former.
browser.storage.local.get('newstories', (store) => {
  // For some reason, Firefox returns a 1-length array containing the
  // store object, while Chrome returns the store object directly.
  if (Array.isArray(store)) {
    store = store[0];
  }

  console.log(store.newstories);
});
