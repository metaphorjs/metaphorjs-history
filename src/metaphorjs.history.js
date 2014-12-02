

var addListener = require("metaphorjs/src/func/event/addListener.js"),
    normalizeEvent = require("metaphorjs/src/func/event/normalizeEvent.js"),
    Observable = require("metaphorjs-observable/src/metaphorjs.observable.js"),
    extend = require("metaphorjs/src/func/extend.js"),
    emptyFn = require("metaphorjs/src/func/emptyFn.js"),
    isFunction = require("metaphorjs/src/func/isFunction.js"),
    isString = require("metaphorjs/src/func/isString.js"),
    getRegExp = require("metaphorjs/src/func/getRegExp.js"),
    getAttr = require("metaphorjs/src/func/dom/getAttr.js"),
    async = require("metaphorjs/src/func/async.js"),

    parseLocation = require("./func/parseLocation.js"),
    joinLocation = require("./func/joinLocation.js");

module.exports = function(){

    var win,
        history,
        location,
        observable      = new Observable,
        api             = {},
        params          = {},

        pushState,
        replaceState,

        windowLoaded    = typeof window == "undefined",
        rURL            = /(?:(\w+:))?(?:\/\/(?:[^@]*@)?([^\/:\?#]+)(?::([0-9]+))?)?([^\?#]*)(?:(\?[^#]+)|\?)?(?:(#.*))?/,

        prevLocation    = null,

        pushStateSupported,
        hashChangeSupported,
        useHash;

    observable.createEvent("beforeLocationChange", false);

    var initWindow = function() {
        win                 = window;
        history             = win.history;
        location            = win.location;
        pushStateSupported  = !!history.pushState;
        hashChangeSupported = "onhashchange" in win;
        useHash             = pushStateSupported && (navigator.vendor || "").match(/Opera/);
        prevLocation        = extend({}, location, true, false);
    };


    var hostsDiffer = function(prev, next) {

        if (typeof prev == "string") {
            prev = parseLocation(prev);
        }
        if (typeof next == "string") {
            next = parseLocation(next);
        }

        var canBeEmpty = ["protocol", "host", "port"],
            i, l,
            k;

        for (i = 0, l = canBeEmpty.length; i < l; i++) {
            k = canBeEmpty[i];
            if (prev[k] && next[k] && prev[k] != next[k]) {
                return true;
            }
        }

        return false;
    };

    var pathsDiffer = function(prev, next) {

        if (typeof prev == "string") {
            prev = parseLocation(prev);
        }
        if (typeof next == "string") {
            next = parseLocation(next);
        }

        return hostsDiffer(prev, next) || prev.pathname != next.pathname ||
            prev.search != next.search || prev.hash != next.hash;
    };









    var preparePath = function(url) {

        var loc = parseLocation(url);

        if (!pushStateSupported || useHash) {
            loc.hash = "#!" + encodeURIComponent(loc.path);
            loc.pathname = "/";
            loc.search = "";
        }

        return joinLocation(loc, {onlyPath: true});
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
        var loc,
            tmp;

        if (pushStateSupported) {
            //loc = location.pathname + location.search + location.hash;
            loc = joinLocation(location);
        }
        else {
            loc = location.hash.substr(1);
            tmp = extend({}, location, true, false);

            if (loc) {
                if (loc.substr(0, 1) == "!") {
                    loc = loc.substr(1);
                }
                var p = decodeURIComponent(loc).split("?");
                tmp.pathname = p[0];
                tmp.search = p[1] ? "?" + p[1] : "";
            }

            loc = joinLocation(tmp);
        }

        return loc;
    };

    var getParam = function(name, url){
        var ex = params[name].extractor;
        if (isFunction(ex)) {
            return ex(url, name);
        }
        else {
            var match = url.match(ex);
            return match ? match.pop() : null;
        }
    };

    var checkParamChange = function(url){
        var i,
            prev, val;

        for (i in params) {
            prev    = params[i].value;
            val     = getParam(i, url);
            params[i].value = val;
            if (val != prev) {
                observable.trigger("change-" + i, val, prev, i, url);
            }
        }
    };




    var onLocationPush = function(url) {
        prevLocation = extend({}, location, true, false);
        triggerEvent("locationChange", url);
        checkParamChange(url);
    };

    var onLocationPop = function() {
        if (pathsDiffer(prevLocation, location)) {
            var url = getCurrentUrl();
            prevLocation = extend({}, location, true, false);
            triggerEvent("locationChange", url);
            checkParamChange(url);
        }
    };

    var triggerEvent = function triggerEvent(event, data) {
        var url = data || getCurrentUrl();
        return observable.trigger(event, url);
    };

    var init = function() {

        initWindow();

        // normal pushState
        if (pushStateSupported) {

            //history.origPushState       = history.pushState;
            //history.origReplaceState    = history.replaceState;

            addListener(win, "popstate", onLocationPop);

            pushState = function(url) {
                if (triggerEvent("beforeLocationChange", url) === false) {
                    return false;
                }
                history.pushState(null, null, preparePath(url));
                onLocationPush(url);
            };


            replaceState = function(url) {
                if (triggerEvent("beforeLocationChange", url) === false) {
                    return false;
                }
                history.replaceState(null, null, preparePath(url));
                onLocationPush(url);
            };
        }
        else {

            // onhashchange
            if (hashChangeSupported) {

                replaceState = pushState = function(url) {
                    if (triggerEvent("beforeLocationChange", url) === false) {
                        return false;
                    }
                    async(setHash, null, [preparePath(url)]);
                };

                addListener(win, "hashchange", onLocationPop);
            }
            // iframe
            else {

                var frame   = null,
                    initialUpdate = false;

                var createFrame = function() {
                    frame   = window.document.createElement("iframe");
                    frame.src = 'about:blank';
                    frame.style.display = 'none';
                    window.document.body.appendChild(frame);
                };

                win.onIframeHistoryChange = function(val) {
                    if (!initialUpdate) {
                        async(function(){
                            setHash(val);
                            onLocationPop();
                        });
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


                pushState = function(url) {
                    if (triggerEvent("beforeLocationChange", url) === false) {
                        return false;
                    }
                    pushFrame(preparePath(url));
                };

                replaceState = function(url) {
                    if (triggerEvent("beforeLocationChange", url) === false) {
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
                    addListener(win, "load", initFrame);
                }
            }
        }

        addListener(window.document.documentElement, "click", function(e) {

            e = normalizeEvent(e || win.event);

            var a = e.target,
                href;

            while (a && a.nodeName.toLowerCase() != "a") {
                a = a.parentNode;
            }

            if (a && !e.isDefaultPrevented()) {

                href = getAttr(a, "href");

                if (href == "#") {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }

                if (href && href.substr(0,1) != "#" && !getAttr(a, "target")) {

                    var prev = extend({}, location, true, false),
                        next = parseLocation(href);

                    if (hostsDiffer(prev, next)) {
                        return null;
                    }

                    if (pathsDiffer(prev, next)) {
                        pushState(href);
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }

            return null;
        });

        init = emptyFn;
    };


    addListener(window, "load", function() {
        windowLoaded = true;
    });


    return extend(api, observable.getApi(), {

        push: function(url) {
            init();
            history.pushState(null, null, url);
        },

        replace: function(url) {
            init();
            history.replaceState(null, null, url);
        },

        current: function() {
            init();
            return getCurrentUrl();
        },

        init: function() {
            return init();
        },

        polyfill: function() {
            init();
            window.history.pushState = function(state, title, url) {
                pushState(url);
            };
            window.history.replaceState = function(state, title, url) {
                replaceState(url);
            };
        },

        getParam: function(name){
            return params[name] ? params[name].value : null;
        },

        addParam: function(name, extractor) {
            init();
            if (!params[name]) {
                if (!extractor) {
                    extractor = getRegExp(name + "=([^&]+)")
                }
                else if (!isFunction(extractor)) {
                    extractor = isString(extractor) ? getRegExp(extractor) : extractor;
                }

                params[name] = {
                    name: name,
                    value: null,
                    extractor: extractor
                };
                params[name].value = getParam(name, getCurrentUrl());
            }
        }

    });

}();
