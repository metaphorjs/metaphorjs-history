

(function(){

    var listeners       = [],
        windowLoaded    = false,
        rURL            = /(?:(\w+\:))?(?:\/\/(?:[^@]*@)?([^\/:\?#]+)(?::([0-9]+))?)?([^\?#]*)(?:(\?[^#]+)|\?)?(?:(#.*))?/;

    var addListener         = function(el, event, func) {
            if (el.attachEvent) {
                el.attachEvent('on' + event, func);
            } else {
                el.addEventListener(event, func, false);
            }
        },
        pushStateSupported  = !!history.pushState,
        hashChangeSupported = "onhashchange" in window;

    var preparePath = function(url) {

        var base = location.protocol + '//' + location.hostname;
        if (location.port) {
            base += ':' + location.port;
        }

        url = url.replace(base, '');

        if (!pushStateSupported) {
            url = encodeURIComponent(url);
        }

        return url;
    };

    var sameHostLink = function(url) {

        var matches = url.match(rURL);

        if (matches[1] && location.protocol != matches[1]) {
            return false;
        }

        if (matches[2] && location.hostname != matches[2]) {
            return false;
        }

        if (!matches[2] && !matches[3]) {
            return true;
        }

        if (location.port != matches[3]) {
            return false;
        }

        return true;
    };

    var setHash = function(hash) {
        if (hash) {
            location.hash = "!" + hash;
        }
        else {
            location.hash = "";
        }
    };

    var getCurrentUrl = function() {
        var loc;

        if (pushStateSupported) {
            loc = location.pathname + location.search;
        }
        else {
            loc = location.hash.substr(1);

            if (loc) {
                if (loc.substr(0, 1) == "!") {
                    loc = loc.substr(1);
                }
                loc = decodeURIComponent(loc);
            }
            else {
                loc = location.pathname + location.search;
            }
        }

        return loc;
    };

    var triggerLocationChange = function triggerLocationChange() {

        var url = getCurrentUrl();

        if (listeners.length) {
            for (var i = -1, l = listeners.length; ++i < l; listeners[i].call(null, url)){}
        }

        if (window.MetaphorJs) {
            MetaphorJs.triggerAsync("locationchange", url);
        }
    };

    var init = function() {

        // normal pushState
        if (pushStateSupported) {

            history.origPushState       = history.pushState;
            history.origReplaceState    = history.replaceState;

            addListener(window, "popstate", triggerLocationChange);

            history.pushState = function(state, title, url) {
                history.origPushState(state, title, preparePath(url));
                triggerLocationChange();
            };

            history.replaceState = function(state, title, url) {
                history.origReplaceState(state, title, preparePath(url));
                triggerLocationChange();
            };
        }
        else {

            // onhashchange
            if (hashChangeSupported) {

                history.replaceState = history.pushState = function(state, title, url) {
                    setHash(preparePath(url));
                };
                addListener(window, "hashchange", triggerLocationChange);
            }
            // iframe
            else {

                var frame   = null,
                    initialUpdate = false;

                var createFrame = function() {
                    frame   = document.createElement("iframe");
                    frame.src = 'about:blank';
                    frame.style.display = 'none';
                    document.body.appendChild(frame);
                };

                window.onIframeHistoryChange = function(val) {
                    if (!initialUpdate) {
                        setHash(val);
                        triggerLocationChange();
                    }
                };

                var pushFrame = function(value) {
                    var frameDoc = frame.contentWindow.document;
                    frameDoc.open();
                    //update iframe content to force new history record.
                    frameDoc.write('<html><head><title>' + document.title +
                                   '</title><script type="text/javascript">' +
                                   'var hashValue = "'+value+'";'+
                                   'window.top.onIframeHistoryChange(hashValue);' +
                                   '</script>' +
                                   '</head><body>&nbsp;</body></html>'
                    );
                    frameDoc.close();
                };

                var replaceFrame = function(value) {
                    frame.contentWindow.hashValue = value;
                };


                history.pushState = function(state, title, url) {
                    pushFrame(preparePath(url));
                };

                history.replaceState = function(state, title, url) {
                    replaceFrame(preparePath(url));
                };

                var initFrame = function(){
                    createFrame();
                    initialUpdate = true;
                    pushFrame(preparePath(location.hash.substr(1)));
                    initialUpdate = false;
                };

                if (windowLoaded) {
                    initFrame();
                }
                else {
                    addListener(window, "load", initFrame);
                }
            }
        }



        addListener(document.documentElement, "click", function(e) {

            e = e || window.event;

            var a = e.target || e.srcElement,
                href;

            while (a && a.nodeName.toLowerCase() != "a") {
                a = a.parentNode;
            }

            if (a) {

                href = a.getAttribute("href");

                if (href && href.substr(0,1) != "#" && sameHostLink(href) && !a.getAttribute("target")) {
                    history.pushState(null, null, a.getAttribute('href'));
                    e.preventDefault && e.preventDefault();
                    e.stopPropagation && e.stopPropagation();
                    return false;
                }
            }
        });

        history.initPushState = function(){};
    };

    addListener(window, "load", function() {
        windowLoaded = true;
    });

    history.initPushState = init;

    if (window.MetaphorJs) {

        MetaphorJs.pushUrl  = function(url) {
            history.pushState(null, null, url);
        };
        MetaphorJs.replaceUrl = function(url) {
            history.replaceState(null, null, url);
        };
        MetaphorJs.currentUrl = function(){
            return getCurrentUrl();
        };
    }
    else {
        history.onchange = function(fn) {
            listeners.push(fn);
        };
    }


}());