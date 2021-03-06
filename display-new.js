if (typeof browser === 'undefined') {
  var browser = chrome;
}

/* The IDs of items already on the front page. */
const EXISTING_ITEM_IDS = Array.prototype.map.call(document.querySelectorAll('.athing'), e => e.id)

/* Detect if Hacker News Enhancement Suite is installed. */
const FLAG_HNES_INSTALLED = document.querySelectorAll("tr#content").length === 1;

/* The table element containing stories on the front page. */
const ITEM_CONTAINER = document.querySelectorAll('#hnmain table.itemlist tbody')[0];

/* The number of new stories to display on the front page. */
const NEW_STORIES_DISPLAY_COUNT = 5;

/* Regular expression to match strings that begin with "www." */
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
 * Mozilla's htmlspecialchars but for Javascript.
 * @see https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School/DOM_Building_and_HTML_Insertion#innerHTML_with_HTML_Escaping
 */
 function escapeHTML(str) {
   return String(str).replace(/[&"'<>]/g, (m) => ({ "&": "&amp;", '"': "&quot;", "'": "&#39;", "<": "&lt;", ">": "&gt;" })[m]);
 }

/**
 * Builds the DOM elements for items being inserted on the front page.
 */
function createItemDom(item) {
  let htmlString =
    `<tr class="athing" id="${escapeHTML(item.id)}">
       <td align="right" valign="top" class="title">
         <span class=rank">...</span>
       </td>
       <td valign="top" class="votelinks">
         <center>
           <a id="up_${escapeHTML(item.id)}" href="vote?id=${escapeHTML(item.id)}&how=up&goto=news">
             <div class="votearrow" title="upvote"></div>
           </a>
         </center>
       </td>
       <td class="title">
         ${item.url
           ?
           `<a href="${escapeHTML(item.url)}" class="storylink">${escapeHTML(item.title)}</a>
            <span class="sitebit comhead">
              (<a href="from?site=${escapeHTML(site(item.url))}"><span class="sitestr">${escapeHTML(site(item.url))}</span></a>)
            </span>`
           :
           `<a href="item?id=${escapeHTML(item.id)}" class="storylink">${escapeHTML(item.title)}</a>`
          }
       </td>
     </tr>
     <tr>
      <td colspan="2"></td>
      <td class="subtext">
        <span class="score" id="score_${escapeHTML(item.id)}">${escapeHTML(item.score)} point${(item.score === 1) ? "" : "s"}</span> by <a href="user?id=${escapeHTML(item.by)}" class="hnuser">${escapeHTML(item.by)}</a>
        <span class="age">
          <a href="item?id=${escapeHTML(item.id)}">on /newest</a>
        </span>
        <span id="unv_${escapeHTML(item.id)}"></span> | <a href="hide?id=${escapeHTML(item.id)}&goto=news">hide</a> | <a href="item?id=${escapeHTML(item.id)}">${escapeHTML(item.descendants)} comment${(item.descendants == 1) ? "" : "s"}</a>
      </td>
     </tr>
     <tr class="spacer" style="height:5px"></tr>`;

  let template = document.createElement('template');
  template.innerHTML = htmlString;
  return template.content.childNodes;
}


/**
 * Builds the DOM elements for items being inserted on the front page.
 */
function createHnesDom(item) {
  let htmlString =
    `<tr class="athing" id="${escapeHTML(item.id)}">
       <td>
         <a href="item?id=${escapeHTML(item.id)}" class="comments" title="Comments">${escapeHTML(item.descendants)}</a>
       </td>
       <td>
         <span class="score no-heat" id="score_${escapeHTML(item.id)}" title="Points"></span>
       </td>
       <td valign="top" class="votelinks">
         <center>
           <a id="up_${escapeHTML(item.id)}" href="vote?id=${escapeHTML(item.id)}&how=up&goto=news">
             <div class="votearrow" title="upvote"></div>
           </a>
         </center>
       </td>
       <td class="title">
         ${item.url
           ?
           `<a href="${escapeHTML(item.url)}" class="storylink">${escapeHTML(item.title)}</a>
            <span class="sitebit comhead">
              <span class="paren">(</span>
              <span>${escapeHTML(site(item.url))}</span>
              <span class="paren">)</span>
            </span>`
           :
           `<a href="item?id=${escapeHTML(item.id)}" class="storylink">${escapeHTML(item.title)}</a>`
          }
          <span class="submitter">
            by <a href="user?id=${escapeHTML(item.by)}" class="hnuser" title="View profile">${escapeHTML(item.by)}</a>
          </span>
          <span class="hnes-age">on /newest</span>
       </td>
     </tr>`;

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
  let storyIdsToDisplay = (store.storyIdsToDisplay || [])
    // Exclude any new stories already on the homepage
    .filter(e => EXISTING_ITEM_IDS.indexOf(e) === -1)
    // Limit the number of stories shown.
    .slice(0, NEW_STORIES_DISPLAY_COUNT);

  browser.storage.local.get(storyIdsToDisplay, (store) => {
    storyIdsToDisplay.forEach((storyId, index) => {
      let itemDom, appendAt;
      // Hacker News Enhancement Suite rewrites the page DOM on load,
      // and this extension appends items after the rewrite happens.
      if (FLAG_HNES_INSTALLED) {
        itemDom = createHnesDom(store[storyId]);
        // Unlike the vanilla HN dom, HNES only uses one DOM element
        // per story.
        appendAt = ITEM_CONTAINER.children[index * 6 + 5]

        ITEM_CONTAINER.insertBefore(itemDom[0], appendAt); // Entire story
      } else {
        itemDom = createItemDom(store[storyId]);
        // Each story takes up three DOM elements, and we want to insert
        // a new story each 6th existing story, starting at the 5th story.
        // Aka, after story 5, 10, 15, ....
        appendAt = ITEM_CONTAINER.children[index * 3*6 + 3*5]

        ITEM_CONTAINER.insertBefore(itemDom[0], appendAt); // Story title/url
        ITEM_CONTAINER.insertBefore(itemDom[1], appendAt); // Points/poster
        ITEM_CONTAINER.insertBefore(itemDom[2], appendAt); // "Spacer" elem
      }
    });
  });
});
