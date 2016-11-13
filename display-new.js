if (typeof browser === 'undefined') {
  var browser = chrome;
}

/* The table element containing stories on the front page */
const FRONT_PAGE_ITEMS = document.querySelectorAll('#hnmain table.itemlist')[0];

const RE_WWW_AT_START = /^(www\.)/;


/**
 * Returns the "site" of a string URL.
 *
 * As far as I can tell, HN considers this the hostname minus any
 * leading "www".
 *
 * E.g.,
 * > hostname("https://www.example.com/path?query=data#anchor")
 * "example.com"
 */
function site(url) {
  return new URL(url).hostname.replace(RE_WWW_AT_START,"");
}


/**
 * Builds the item DOM elements to be inserted on the front page.
 */
function createItemDom(item) {
  let htmlString =
    `<tr class="athing" id="${item.id}">
       <td align="right" valign="top" class="title">
         <span class=rank">...</span>
       </td>
       <td valign="top" class="votelinks">
         <center>
           <a id="up_${item.id}" href="vote?id=${item.id}&how=up&goto=news">
             <div class="votearrow" title="upvote"></div>
           </a>
         </center>
       </td>
       <td class="title">
         ${item.url
           ?
           `<a href="${item.url}" class="storylink">${item.title}</a>
            <span class="sitebit comhead">
              (<a href="from?site=${site(item.url)}"><span class="sitestr">${site(item.url)}</span></a>)
            </span>`
           :
           `<a href="item?id=${item.id}" class="storylink">${item.title}</a>`
          }
       </td>
     </tr>
     <tr>
      <td colspan="2"></td>
      <td class="subtext">
        <span class="score" id="score_${item.id}">${item.score} point${(item.score === 1) ? "" : "s"}</span> by <a href="user?id=${item.by}" class="hnuser">${item.by}</a>
        <span class="age">
          <a href="item?id=${item.id}">on /newest</a>
        </span>
        <span id="unv_${item.id}"></span> | <a href="hide?id=${item.id}&goto=news">hide</a> | <a href="item?id=${item.id}">${item.descendants} comment${(item.descendants == 1) ? "" : "s"}</a>
      </td>
     </tr>
     <tr class="spacer" style="height:5px"></tr>`;

  let template = document.createElement('template');
  template.innerHTML = htmlString;
  return template.content.childNodes;
}

// We use the (key, callback) signature here instead of the promise
// signature because Firefox supports both but Chrome only supports
// the former.
browser.storage.local.get('storyIdsToDisplay', (store) => {
  // For some reason, Firefox returns a 1-length array containing the
  // store object, while Chrome returns the store object directly.
  if (Array.isArray(store)) {
    store = store[0];
  }

  // If there aren't any stories to display, default to an empty array
  // so the .forEach doesn't error.
  storyIdsToDisplay = store.storyIdsToDisplay || [];

  browser.storage.local.get(storyIdsToDisplay, (store) => {
    storyIdsToDisplay.forEach((id) => {
      let itemDom = createItemDom(store[id]);

      FRONT_PAGE_ITEMS.appendChild(itemDom[0]);
      FRONT_PAGE_ITEMS.appendChild(itemDom[1]);
      FRONT_PAGE_ITEMS.appendChild(itemDom[2]);
    });
  });
});
