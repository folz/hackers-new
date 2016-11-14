# Hackers New

![Screenshot of Hackers New](https://addons.cdn.mozilla.net/user-media/previews/full/180/180247.png)

A simple browser extension for Firefox and Chrome that adds items from HN's /newest page to the front page.

These stories are chosen at random from /newest and get re-chosen every fifteen minutes. You can upvote them from the front page just like you would from /newest.

*(The highlight in the screenshot is edited to draw attention to the new story; this extension doesn't change how HN is styled.)*

## Firefox

Get the extension: https://addons.mozilla.org/en-US/firefox/addon/hackers-new/

## Chrome

Get the extension: https://chrome.google.com/webstore/detail/khpjpigbdlgncbapkpbcfnhllafjgkgf

## Contributing

Contributions are very welcome. Please make sure your pull request(s) support both Firefox and Chrome!

Donations: 1KZ23Sm35C7Xjk9kV2VxCM7xscnsU9Huha

## Explanation of permissions

**Host permissions**: hacker-news.firebaseio.com and news.ycombinator.com. The first host is required to access the HN api and fetch new stories. The second host is required to display new stories on the front page.

**alarms**: Required to trigger the periodic fetching of new stories.

**storage**: Required to persist data for new stories after we fetch them, so that displaying them on the front page is snappy.

I take privacy seriously and your data is never shared with anyone. The extension is open-source at https://github.com/folz/hackers-new so that you can verify this claim.
