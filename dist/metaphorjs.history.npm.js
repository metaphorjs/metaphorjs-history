module.exports = function (window) {
"use strict";
var Observable = require('metaphorjs-observable');

function addListener(el, event, func) {
    if (el.attachEvent) {
        el.attachEvent('on' + event, func);
    } else {
        el.addEventListener(event, func, false);
    }
};

function returnFalse() {
    return false;
};


function returnTrue() {
    return true;
};

var undf = undefined;

function isNull(value) {
    return value === null;
};


var slice = Array.prototype.slice;

var toString = Object.prototype.toString;




var varType = function(){

    var types = {
        '[object String]': 0,
        '[object Number]': 1,
        '[object Boolean]': 2,
        '[object Object]': 3,
        '[object Function]': 4,
        '[object Array]': 5,
        '[object RegExp]': 9,
        '[object Date]': 10
    };


    /**
     * 'string': 0,
     * 'number': 1,
     * 'boolean': 2,
     * 'object': 3,
     * 'function': 4,
     * 'array': 5,
     * 'null': 6,
     * 'undefined': 7,
     * 'NaN': 8,
     * 'regexp': 9,
     * 'date': 10,
     * unknown: -1
     * @param {*} value
     * @returns {number}
     */
    return function varType(val) {

        if (!val) {
            if (val === null) {
                return 6;
            }
            if (val === undf) {
                return 7;
            }
        }

        var num = types[toString.call(val)];

        if (num === undf) {
            return -1;
        }

        if (num == 1 && isNaN(val)) {
            return 8;
        }

        return num;
    };

}();



function isPlainObject(value) {
    // IE < 9 returns [object Object] from toString(htmlElement)
    return typeof value == "object" &&
           varType(value) === 3 &&
            !value.nodeType &&
            value.constructor === Object;

};

function isBool(value) {
    return value === true || value === false;
};




var extend = function(){

    /**
     * @param {Object} dst
     * @param {Object} src
     * @param {Object} src2 ... srcN
     * @param {boolean} override = false
     * @param {boolean} deep = false
     * @returns {object}
     */
    var extend = function extend() {


        var override    = false,
            deep        = false,
            args        = slice.call(arguments),
            dst         = args.shift(),
            src,
            k,
            value;

        if (isBool(args[args.length - 1])) {
            override    = args.pop();
        }
        if (isBool(args[args.length - 1])) {
            deep        = override;
            override    = args.pop();
        }

        while (args.length) {
            if (src = args.shift()) {
                for (k in src) {

                    if (src.hasOwnProperty(k) && (value = src[k]) !== undf) {

                        if (deep) {
                            if (dst[k] && isPlainObject(dst[k]) && isPlainObject(value)) {
                                extend(dst[k], value, override, deep);
                            }
                            else {
                                if (override === true || dst[k] == undf) { // == checks for null and undefined
                                    if (isPlainObject(value)) {
                                        dst[k] = {};
                                        extend(dst[k], value, override, true);
                                    }
                                    else {
                                        dst[k] = value;
                                    }
                                }
                            }
                        }
                        else {
                            if (override === true || dst[k] == undf) {
                                dst[k] = value;
                            }
                        }
                    }
                }
            }
        }

        return dst;
    };

    return extend;
}();



// from jQuery

var DomEvent = function(src) {

    if (src instanceof DomEvent) {
        return src;
    }

    // Allow instantiation without the 'new' keyword
    if (!(this instanceof DomEvent)) {
        return new DomEvent(src);
    }


    var self    = this;

    for (var i in src) {
        if (!self[i]) {
            try {
                self[i] = src[i];
            }
            catch (thrownError){}
        }
    }


    // Event object
    self.originalEvent = src;
    self.type = src.type;

    if (!self.target && src.srcElement) {
        self.target = src.srcElement;
    }


    var eventDoc, doc, body,
        button = src.button;

    // Calculate pageX/Y if missing and clientX/Y available
    if (self.pageX === undf && !isNull(src.clientX)) {
        eventDoc = self.target ? self.target.ownerDocument || window.document : window.document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        self.pageX = src.clientX +
                      ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
                      ( doc && doc.clientLeft || body && body.clientLeft || 0 );
        self.pageY = src.clientY +
                      ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) -
                      ( doc && doc.clientTop  || body && body.clientTop  || 0 );
    }

    // Add which for click: 1 === left; 2 === middle; 3 === right
    // Note: button is not normalized, so don't use it
    if ( !self.which && button !== undf ) {
        self.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
    }

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    self.isDefaultPrevented = src.defaultPrevented ||
                              src.defaultPrevented === undf &&
                                  // Support: Android<4.0
                              src.returnValue === false ?
                              returnTrue :
                              returnFalse;


    // Create a timestamp if incoming event doesn't have one
    self.timeStamp = src && src.timeStamp || (new Date).getTime();
};

// Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
extend(DomEvent.prototype, {

    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,

    preventDefault: function() {
        var e = this.originalEvent;

        this.isDefaultPrevented = returnTrue;
        e.returnValue = false;

        if ( e && e.preventDefault ) {
            e.preventDefault();
        }
    },
    stopPropagation: function() {
        var e = this.originalEvent;

        this.isPropagationStopped = returnTrue;

        if ( e && e.stopPropagation ) {
            e.stopPropagation();
        }
    },
    stopImmediatePropagation: function() {
        var e = this.originalEvent;

        this.isImmediatePropagationStopped = returnTrue;

        if ( e && e.stopImmediatePropagation ) {
            e.stopImmediatePropagation();
        }

        this.stopPropagation();
    }
}, true, false);




function normalizeEvent(originalEvent) {
    return new DomEvent(originalEvent);
};



function emptyFn(){};

function isFunction(value) {
    return typeof value == 'function';
};



function isString(value) {
    return typeof value == "string" || value === ""+value;
    //return typeof value == "string" || varType(value) === 0;
};

var getRegExp = function(){

    var cache = {};

    /**
     * @param {String} expr
     * @returns RegExp
     */
    return function getRegExp(expr) {
        return cache[expr] || (cache[expr] = new RegExp(expr));
    };
}();

function getAttr(el, name) {
    return el.getAttribute ? el.getAttribute(name) : null;
};
/**
 * @param {Function} fn
 * @param {Object} context
 * @param {[]} args
 * @param {number} timeout
 */
function async(fn, context, args, timeout) {
    setTimeout(function(){
        fn.apply(context, args || []);
    }, timeout || 0);
};
var mhistory, history;




mhistory = history = function(){

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
    };

    var preparePath = function(url) {

        var base = location.protocol + '//' + location.hostname;
        if (location.port) {
            base += ':' + location.port;
        }

        url = url.replace(base, '');

        if (!pushStateSupported) {
            url = encodeURIComponent(url);
        }

        if (url.substr(0, 1) == "?") {
            url = location.pathname + url;
        }

        if (useHash) {
            url = url.replace("?", "#");
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

        // 0 - full url, 1 - protocol, 2 - host, 3 - port, 4 - path, 5 - search, 6 - hash
        var matches = url.match(rURL),
            path,
            hash;

        if (!pushStateSupported || useHash) {
            hash    = matches[6];
            if (hash.substr(0,1) == "!") {
                path    = hash.substr(1);
            }
        }

        if (!path) {
            path    = matches[4];

            if (matches[5]) {
                path    += matches[5];
            }
        }

        return path;
    };

    var samePathLink = function(url) {
        return getPathFromUrl(url) == getPathFromUrl(location);
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
            loc = location.pathname + location.search + location.hash;
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

    var onLocationChange = function(){
        var url = getCurrentUrl();
        triggerEvent("locationChange", url);
        checkParamChange(url);
    };

    var triggerEvent = function triggerEvent(event, data) {
        var url = data || getCurrentUrl();
        return observable.trigger(event, url);
    };

    var init = function() {

        initWindow();

        // normal pushState
        if (pushStateSupported) {

            history.origPushState       = history.pushState;
            history.origReplaceState    = history.replaceState;

            addListener(win, "popstate", onLocationChange);

            pushState = function(url) {
                if (triggerEvent("beforeLocationChange", url) === false) {
                    return false;
                }
                history.origPushState(null, null, preparePath(url));
                onLocationChange();
            };


            replaceState = function(url) {
                if (triggerEvent("beforeLocationChange", url) === false) {
                    return false;
                }
                history.origReplaceState(null, null, preparePath(url));
                onLocationChange();
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

                addListener(win, "hashchange", onLocationChange);
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
                            onLocationChange();
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

            if (a) {

                href = getAttr(a, "href");

                if (href && href.substr(0,1) != "#" && !getAttr(a, "target") &&
                    sameHostLink(href) && !samePathLink(href)) {

                    history.pushState(null, null, getPathFromUrl(href));

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

return mhistory;

};