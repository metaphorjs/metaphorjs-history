

(function(){

    var listeners       = {
            locationChange: [],
            beforeLocationChange: []
        },
        windowLoaded    = false,
        rURL            = /(?:(\w+:))?(?:\/\/(?:[^@]*@)?([^\/:\?#]+)(?::([0-9]+))?)?([^\?#]*)(?:(\?[^#]+)|\?)?(?:(#.*))?/,

        addListener         = function(el, event, func) {
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

        return location.port == matches[3];
    };

    var getPathFromUrl  = function(url) {

        url = "" + url;

        var matches = url.match(rURL),
            path,
            hash;

        if (!pushStateSupported) {
            hash    = matches[6];
            if (hash.substr(0,1) == "!") {
                path    = hash.substr(1);
            }
        }

        if (!path) {
            path    = matches[4];

            if (matches[5]) {
                path    += "?" + matches[5];
            }
        }

        return path;
    };

    var samePathLink = function(url) {
        return getPathFromUrl(url) == getPathFromUrl(window.location);
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

    var triggerEvent = function triggerEvent(event, breakable, data) {

        var url = data || getCurrentUrl(),
            res;

        for (var i = -1, l = listeners[event].length; ++i < l;){
            res = listeners[event][i].call(null, url);
            if (breakable && res === false) {
                return false;
            }
        }

        if (window.MetaphorJs) {
            if (breakable) {
                return MetaphorJs.trigger(event, url);
            }
            else {
                MetaphorJs.triggerAsync(event, url);
            }
        }

        return null;
    };

    var init = function() {

        // normal pushState
        if (pushStateSupported) {

            history.origPushState       = history.pushState;
            history.origReplaceState    = history.replaceState;

            addListener(window, "popstate", function(){
                triggerEvent("locationChange");
            });

            history.pushState = function(state, title, url) {
                if (triggerEvent("beforeLocationChange", true, url) === false) {
                    return false;
                }
                history.origPushState(state, title, preparePath(url));
                triggerEvent("locationChange");
            };

            history.replaceState = function(state, title, url) {
                if (triggerEvent("beforeLocationChange", true, url) === false) {
                    return false;
                }
                history.origReplaceState(state, title, preparePath(url));
                triggerEvent("locationChange");
            };
        }
        else {

            // onhashchange
            if (hashChangeSupported) {

                history.replaceState = history.pushState = function(state, title, url) {
                    if (triggerEvent("beforeLocationChange", true, url) === false) {
                        return false;
                    }
                    setHash(preparePath(url));
                };
                addListener(window, "hashchange", function(){
                    triggerEvent("locationChange");
                });
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
                        triggerEvent("locationChange");
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
                    if (triggerEvent("beforeLocationChange", true, url) === false) {
                        return false;
                    }
                    pushFrame(preparePath(url));
                };

                history.replaceState = function(state, title, url) {
                    if (triggerEvent("beforeLocationChange", true, url) === false) {
                        return false;
                    }
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


                if (href && href.substr(0,1) != "#" && !a.getAttribute("target") &&
                    sameHostLink(href) && !samePathLink(href)) {

                    history.pushState(null, null, getPathFromUrl(href));
                    e.preventDefault && e.preventDefault();
                    e.stopPropagation && e.stopPropagation();
                    return false;
                }
            }

            return null;
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
        history.onBeforeChange = function(fn) {
            listeners.beforeLocationChange.push(fn);
        };
        history.onChange = function(fn) {
            listeners.locationChange.push(fn);
        };
    }


}());