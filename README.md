#MetaphorJs stateless pushState wrapper/polyfill

3kb minified

without MetaphorJs:

`history.initPushState()`
`history.onchange(function(location){})`
`history.pushState(state, title, url)` -- state and title are ignored
`history.replaceState(state, title, url)` -- state and title are ignored

with MetaphorJs:

`history.initPushState()`
`MetaphorJs.on("locationchange", function(location){})`
`MetaphorJs.pushUrl(url)`
`MetaphorJs.replaceUrl(url)`
`MetaphorJs.currentUrl()`

==============

IE6+, Chrome, Firefox, Safari, Opera
If browser does not support pushState, #! will be used.

All links with valid url in href will be subject to pushState handler.
If you want to bypass handler, add target="_self" attribute (or any other target value).