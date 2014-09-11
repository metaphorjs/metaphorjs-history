(function(){
"use strict";

var addListener = function(el, event, func) {
    if (el.attachEvent) {
        el.attachEvent('on' + event, func);
    } else {
        el.addEventListener(event, func, false);
    }
};
var returnFalse = function() {
    return false;
};

var returnTrue = function() {
    return true;
};
var undf = undefined;
var isNull = function(value) {
    return value === null;
};


// from jQuery

var NormalizedEvent = function(src) {

    if (src instanceof NormalizedEvent) {
        return src;
    }

    // Allow instantiation without the 'new' keyword
    if (!(this instanceof NormalizedEvent)) {
        return new NormalizedEvent(src);
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
        eventDoc = self.target ? self.target.ownerDocument || document : document;
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
NormalizedEvent.prototype = {

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
};



var normalizeEvent = function(originalEvent) {
    return new NormalizedEvent(originalEvent);
};


/**
 * @returns {String}
 */
var nextUid = function(){
    var uid = ['0', '0', '0'];

    // from AngularJs
    return function() {
        var index = uid.length;
        var digit;

        while(index) {
            index--;
            digit = uid[index].charCodeAt(0);
            if (digit == 57 /*'9'*/) {
                uid[index] = 'A';
                return uid.join('');
            }
            if (digit == 90  /*'Z'*/) {
                uid[index] = '0';
            } else {
                uid[index] = String.fromCharCode(digit + 1);
                return uid.join('');
            }
        }
        uid.unshift('0');
        return uid.join('');
    };
}();

/**
 * @param {Function} fn
 * @param {*} context
 */
var bind = Function.prototype.bind ?
              function(fn, context){
                  return fn.bind(context);
              } :
              function(fn, context) {
                  return function() {
                      return fn.apply(context, arguments);
                  };
              };



var slice = Array.prototype.slice;
var isFunction = function(value) {
    return typeof value == 'function';
};




/**
 * <p>A javascript event system implementing two patterns - observable and collector.</p>
 *
 * <p>Observable:</p>
 * <pre><code class="language-javascript">
 * var o = new MetaphorJs.lib.Observable;
 * o.on("event", function(x, y, z){ console.log([x, y, z]) });
 * o.trigger("event", 1, 2, 3); // [1, 2, 3]
 * </code></pre>
 *
 * <p>Collector:</p>
 * <pre><code class="language-javascript">
 * var o = new MetaphorJs.lib.Observable;
 * o.createEvent("collectStuff", "all");
 * o.on("collectStuff", function(){ return 1; });
 * o.on("collectStuff", function(){ return 2; });
 * var results = o.trigger("collectStuff"); // [1, 2]
 * </code></pre>
 *
 * <p>Although all methods are public there is getApi() method that allows you
 * extending your own objects without overriding "destroy" (which you probably have)</p>
 * <pre><code class="language-javascript">
 * var o = new MetaphorJs.lib.Observable;
 * $.extend(this, o.getApi());
 * this.on("event", function(){ alert("ok") });
 * this.trigger("event");
 * </code></pre>
 *
 * @namespace MetaphorJs
 * @class MetaphorJs.lib.Observable
 * @version 1.1
 * @author johann kuindji
 * @link https://github.com/kuindji/metaphorjs-observable
 */
var Observable = function() {

    this.events = {};

};


Observable.prototype = {

    /**
    * <p>You don't have to call this function unless you want to pass returnResult param.
    * This function will be automatically called from on() with
    * <code class="language-javascript">returnResult = false</code>,
    * so if you want to receive handler's return values, create event first, then call on().</p>
    *
    * <pre><code class="language-javascript">
    * var observable = new MetaphorJs.lib.Observable;
    * observable.createEvent("collectStuff", "all");
    * observable.on("collectStuff", function(){ return 1; });
    * observable.on("collectStuff", function(){ return 2; });
    * var results = observable.trigger("collectStuff"); // [1, 2]
    * </code></pre>
    *
    * @method
    * @access public
    * @param {string} name {
    *       Event name
    *       @required
    * }
    * @param {bool|string} returnResult {
    *   false -- do not return results except if handler returned "false". This is how
    *   normal observables work.<br>
    *   "all" -- return all results as array<br>
    *   "first" -- return result of the first handler<br>
    *   "last" -- return result of the last handler
    *   @required
    * }
    * @return MetaphorJs.lib.ObservableEvent
    */
    createEvent: function(name, returnResult) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            events[name] = new Event(name, returnResult);
        }
        return events[name];
    },

    /**
    * @method
    * @access public
    * @param {string} name Event name
    * @return MetaphorJs.lib.ObservableEvent|undefined
    */
    getEvent: function(name) {
        name = name.toLowerCase();
        return this.events[name];
    },

    /**
    * Subscribe to an event or register collector function.
    * @method
    * @access public
    * @md-save on
    * @param {string} name {
    *       Event name
    *       @required
    * }
    * @param {function} fn {
    *       Callback function
    *       @required
    * }
    * @param {object} scope "this" object for the callback function
    * @param {object} options {
    *       @type bool first {
    *           True to prepend to the list of handlers
    *           @default false
    *       }
    *       @type number limit {
    *           Call handler this number of times; 0 for unlimited
    *           @default 0
    *       }
    *       @type number start {
    *           Start calling handler after this number of calls. Starts from 1
    *           @default 1
    *       }
     *      @type [] append Append parameters
     *      @type [] prepend Prepend parameters
     *      @type bool allowDupes allow the same handler twice
    * }
    */
    on: function(name, fn, scope, options) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            events[name] = new Event(name);
        }
        return events[name].on(fn, scope, options);
    },

    /**
    * Same as on(), but options.limit is forcefully set to 1.
    * @method
    * @md-apply on
    * @access public
    */
    once: function(name, fn, scope, options) {
        options     = options || {};
        options.limit = 1;
        return this.on(name, fn, scope, options);
    },


    /**
    * Unsubscribe from an event
    * @method
    * @access public
    * @param {string} name Event name
    * @param {function} fn Event handler
    * @param {object} scope If you called on() with scope you must call un() with the same scope
    */
    un: function(name, fn, scope) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].un(fn, scope);
    },

    /**
    * @method hasListener
    * @access public
    * @param {string} name Event name { @required }
    * @return bool
    */

    /**
    * @method
    * @access public
    * @param {string} name Event name { @required }
    * @param {function} fn Callback function { @required }
    * @param {object} scope Function's "this" object
    * @return bool
    */
    hasListener: function(name, fn, scope) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return false;
        }
        return events[name].hasListener(fn, scope);
    },


    /**
    * Remove all listeners from all events
    * @method removeAllListeners
    * @access public
    */

    /**
    * Remove all listeners from specific event
    * @method
    * @access public
    * @param {string} name Event name { @required }
    */
    removeAllListeners: function(name) {
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].removeAllListeners();
    },

    /**
    * Trigger an event -- call all listeners.
    * @method
    * @access public
    * @param {string} name Event name { @required }
    * @param {*} ... As many other params as needed
    * @return mixed
    */
    trigger: function() {

        var name = arguments[0],
            events  = this.events;

        name = name.toLowerCase();

        if (!events[name]) {
            return null;
        }

        var e = events[name];
        return e.trigger.apply(e, slice.call(arguments, 1));
    },

    /**
    * Suspend an event. Suspended event will not call any listeners on trigger().
    * @method
    * @access public
    * @param {string} name Event name
    */
    suspendEvent: function(name) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].suspend();
    },

    /**
    * @method
    * @access public
    */
    suspendAllEvents: function() {
        var events  = this.events;
        for (var name in events) {
            events[name].suspend();
        }
    },

    /**
    * Resume suspended event.
    * @method
    * @access public
    * @param {string} name Event name
    */
    resumeEvent: function(name) {
        name = name.toLowerCase();
        var events  = this.events;
        if (!events[name]) {
            return;
        }
        events[name].resume();
    },

    /**
    * @method
    * @access public
    */
    resumeAllEvents: function() {
        var events  = this.events;
        for (var name in events) {
            events[name].resume();
        }
    },

    /**
     * @method
     * @access public
     * @param {string} name Event name
     */
    destroyEvent: function(name) {
        var events  = this.events;
        if (events[name]) {
            events[name].removeAllListeners();
            events[name].destroy();
            delete events[name];
        }
    },


    /**
    * Destroy specific event
    * @method
    * @md-not-inheritable
    * @access public
    * @param {string} name Event name
    */
    destroy: function(name) {
        var events  = this.events;

        if (name) {
            name = name.toLowerCase();
            if (events[name]) {
                events[name].destroy();
                delete events[name];
            }
        }
        else {
            for (var i in events) {
                events[i].destroy();
            }

            this.events = {};
        }
    },

    /**
    * Get object with all functions except "destroy"
    * @method
    * @md-not-inheritable
    * @returns object
    */
    getApi: function() {

        var self    = this;

        if (!self.api) {

            var methods = [
                    "createEvent", "getEvent", "on", "un", "once", "hasListener", "removeAllListeners",
                    "trigger", "suspendEvent", "suspendAllEvents", "resumeEvent",
                    "resumeAllEvents", "destroyEvent"
                ],
                api = {},
                name;

            for(var i =- 1, l = methods.length;
                    ++i < l;
                    name = methods[i],
                    api[name] = bind(self[name], self)){}

            self.api = api;
        }

        return self.api;
    }
};


/**
 * This class is private - you can't create an event other than via Observable.
 * See MetaphorJs.lib.Observable reference.
 * @class MetaphorJs.lib.ObservableEvent
 */
var Event = function(name, returnResult) {

    var self    = this;

    self.name           = name;
    self.listeners      = [];
    self.map            = {};
    self.hash           = nextUid();
    self.uni            = '$$' + name + '_' + self.hash;
    self.suspended      = false;
    self.lid            = 0;
    self.returnResult   = returnResult === undf ? null : returnResult; // first|last|all
};


Event.prototype = {

    getName: function() {
        return this.name;
    },

    /**
     * @method
     */
    destroy: function() {
        var self        = this;
        self.listeners  = null;
        self.map        = null;
    },

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     * @param {object} options See Observable's on()
     */
    on: function(fn, scope, options) {

        if (!fn) {
            return null;
        }

        scope       = scope || null;
        options     = options || {};

        var self        = this,
            uni         = self.uni,
            uniScope    = scope || fn;

        if (uniScope[uni] && !options.allowDupes) {
            return null;
        }

        var id      = ++self.lid,
            first   = options.first || false;

        uniScope[uni]  = id;


        var e = {
            fn:         fn,
            scope:      scope,
            uniScope:   uniScope,
            id:         id,
            called:     0, // how many times the function was triggered
            limit:      options.limit || 0, // how many times the function is allowed to trigger
            start:      options.start || 1, // from which attempt it is allowed to trigger the function
            count:      0, // how many attempts to trigger the function was made
            append:     options.append, // append parameters
            prepend:    options.prepend // prepend parameters
        };

        if (first) {
            self.listeners.unshift(e);
        }
        else {
            self.listeners.push(e);
        }

        self.map[id] = e;

        return id;
    },

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     * @param {object} options See Observable's on()
     */
    once: function(fn, scope, options) {

        options = options || {};
        options.once = true;

        return this.on(fn, scope, options);
    },

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     */
    un: function(fn, scope) {

        var self        = this,
            inx         = -1,
            uni         = self.uni,
            listeners   = self.listeners,
            id;

        if (fn == parseInt(fn)) {
            id      = fn;
        }
        else {
            scope   = scope || fn;
            id      = scope[uni];
        }

        if (!id) {
            return false;
        }

        for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].id == id) {
                inx = i;
                delete listeners[i].uniScope[uni];
                break;
            }
        }

        if (inx == -1) {
            return false;
        }

        listeners.splice(inx, 1);
        delete self.map[id];
        return true;
    },

    /**
     * @method hasListener
     * @return bool
     */

    /**
     * @method
     * @param {function} fn Callback function { @required }
     * @param {object} scope Function's "this" object
     * @return bool
     */
    hasListener: function(fn, scope) {

        var self    = this,
            listeners   = self.listeners,
            id;

        if (fn) {

            scope   = scope || fn;

            if (!isFunction(fn)) {
                id  = fn;
            }
            else {
                id  = scope[self.uni];
            }

            if (!id) {
                return false;
            }

            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i].id == id) {
                    return true;
                }
            }

            return false;
        }
        else {
            return listeners.length > 0;
        }
    },


    /**
     * @method
     */
    removeAllListeners: function() {
        var self    = this,
            listeners = self.listeners,
            uni     = self.uni,
            i, len;

        for (i = 0, len = listeners.length; i < len; i++) {
            delete listeners[i].uniScope[uni];
        }
        self.listeners   = [];
        self.map         = {};
    },

    /**
     * @method
     */
    suspend: function() {
        this.suspended = true;
    },

    /**
     * @method
     */
    resume: function() {
        this.suspended = false;
    },


    _prepareArgs: function(l, triggerArgs) {
        var args;

        if (l.append || l.prepend) {
            args    = slice.call(triggerArgs);
            if (l.prepend) {
                args    = l.prepend.concat(args);
            }
            if (l.append) {
                args    = args.concat(l.append);
            }
        }
        else {
            args = triggerArgs;
        }

        return args;
    },

    /**
     * @method
     * @return {*}
     */
    trigger: function() {

        var self            = this,
            listeners       = self.listeners,
            returnResult    = self.returnResult;

        if (self.suspended || listeners.length == 0) {
            return null;
        }

        var ret     = returnResult == "all" ? [] : null,
            q, l,
            res;

        if (returnResult == "first") {
            q = [listeners[0]];
        }
        else {
            // create a snapshot of listeners list
            q = slice.call(listeners);
        }

        // now if during triggering someone unsubscribes
        // we won't skip any listener due to shifted
        // index
        while (l = q.shift()) {

            // listener may already have unsubscribed
            if (!l || !self.map[l.id]) {
                continue;
            }

            l.count++;

            if (l.count < l.start) {
                continue;
            }

            res = l.fn.apply(l.scope, self._prepareArgs(l, arguments));

            l.called++;

            if (l.called == l.limit) {
                self.un(l.id);
            }

            if (returnResult == "all") {
                ret.push(res);
            }

            if (returnResult == "first") {
                return res;
            }

            if (returnResult == "last") {
                ret = res;
            }

            if (returnResult == false && res === false) {
                break;
            }
        }

        if (returnResult) {
            return ret;
        }
    }
};



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
        'string': 0,
        'number': 1,
        'boolean': 2,
        'object': 3,
        'function': 4,
        'array': 5,
        'null': 6,
        'undefined': 7,
        'NaN': 8,
        'regexp': 9,
        'date': 10
    */

    return function(val) {

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


var isPlainObject = function(value) {
    // IE < 9 returns [object Object] from toString(htmlElement)
    return typeof value == "object" && varType(value) === 3 && !value.nodeType;
};


var isBool = function(value) {
    return value === true || value === false;
};


/**
 * @param {Object} dst
 * @param {Object} src
 * @param {Object} src2 ... srcN
 * @param {boolean} override = false
 * @param {boolean} deep = false
 * @returns {*}
 */
var extend = function(){

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

var emptyFn = function(){};


var attr = function(el, name, value) {
    if (!el || !el.getAttribute) {
        return null;
    }
    if (value === undf) {
        return el.getAttribute(name);
    }
    else if (value === null) {
        return el.removeAttribute(name);
    }
    else {
        return el.setAttribute(name, value);
    }
};


var history = function(){

    var win             = window,
        history         = win.history,
        location        = win.location,
        observable      = new Observable,
        exports         = {},

        listeners       = {
            locationChange: [],
            beforeLocationChange: []
        },
        windowLoaded    = false,
        rURL            = /(?:(\w+:))?(?:\/\/(?:[^@]*@)?([^\/:\?#]+)(?::([0-9]+))?)?([^\?#]*)(?:(\?[^#]+)|\?)?(?:(#.*))?/,

        pushStateSupported  = !!history.pushState,
        hashChangeSupported = "onhashchange" in win;

    extend(exports, observable.getApi());

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

        return exports.trigger(event, url);
    };

    var init = function() {

        // normal pushState
        if (pushStateSupported) {

            history.origPushState       = history.pushState;
            history.origReplaceState    = history.replaceState;

            addListener(win, "popstate", function(){
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
                addListener(win, "hashchange", function(){
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

                win.onIframeHistoryChange = function(val) {
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
                    addListener(win, "load", initFrame);
                }
            }
        }



        addListener(document.documentElement, "click", function(e) {

            e = normalizeEvent(e || win.event);

            var a = e.target,
                href;

            while (a && a.nodeName.toLowerCase() != "a") {
                a = a.parentNode;
            }

            if (a) {

                href = attr(a, "href");

                if (href && href.substr(0,1) != "#" && !attr(a, "target") &&
                    sameHostLink(href) && !samePathLink(href)) {

                    history.pushState(null, null, getPathFromUrl(href));

                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }

            return null;
        });

        history.initPushState = emptyFn;
        exports.initPushState = emptyFn;
    };

    addListener(win, "load", function() {
        windowLoaded = true;
    });

    history.initPushState = init;

    history.onBeforeChange = function(fn) {
        listeners.beforeLocationChange.push(fn);
    };
    history.onChange = function(fn) {
        listeners.locationChange.push(fn);
    };

    exports.pushUrl = function(url) {
        history.pushState(null, null, url);
    };
    exports.replaceUrl = function(url) {
        history.replaceState(null, null, url);
    };
    exports.currentUrl = function() {
        return getCurrentUrl();
    };
    exports.initPushState = function() {
        return init();
    };

    return exports;
}();

MetaphorJs['history'] = history;

typeof global != "undefined" ? (global['MetaphorJs'] = MetaphorJs) : (window['MetaphorJs'] = MetaphorJs);

}());