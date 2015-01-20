(function(){
"use strict";

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
        e.cancelBubble = true;

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


// from jquery.mousewheel plugin



var mousewheelHandler = function(e) {

    function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
    }

    function nullLowestDelta() {
        lowestDelta = null;
    }

    var toBind = ( 'onwheel' in window.document || window.document.documentMode >= 9 ) ?
                 ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        nullLowestDeltaTimeout, lowestDelta;

    var mousewheelHandler = function(fn) {

        return function(e) {

            var event = normalizeEvent(e || window.event),
                args = slice.call(arguments, 1),
                delta = 0,
                deltaX = 0,
                deltaY = 0,
                absDelta = 0,
                offsetX = 0,
                offsetY = 0;


            event.type = 'mousewheel';

            // Old school scrollwheel delta
            if ('detail'      in event) { deltaY = event.detail * -1; }
            if ('wheelDelta'  in event) { deltaY = event.wheelDelta; }
            if ('wheelDeltaY' in event) { deltaY = event.wheelDeltaY; }
            if ('wheelDeltaX' in event) { deltaX = event.wheelDeltaX * -1; }

            // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
            if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
                deltaX = deltaY * -1;
                deltaY = 0;
            }

            // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
            delta = deltaY === 0 ? deltaX : deltaY;

            // New school wheel delta (wheel event)
            if ('deltaY' in event) {
                deltaY = event.deltaY * -1;
                delta = deltaY;
            }
            if ('deltaX' in event) {
                deltaX = event.deltaX;
                if (deltaY === 0) { delta = deltaX * -1; }
            }

            // No change actually happened, no reason to go any further
            if (deltaY === 0 && deltaX === 0) { return; }

            // Store lowest absolute delta to normalize the delta values
            absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

            if (!lowestDelta || absDelta < lowestDelta) {
                lowestDelta = absDelta;

                // Adjust older deltas if necessary
                if (shouldAdjustOldDeltas(event, absDelta)) {
                    lowestDelta /= 40;
                }
            }

            // Adjust older deltas if necessary
            if (shouldAdjustOldDeltas(event, absDelta)) {
                // Divide all the things by 40!
                delta /= 40;
                deltaX /= 40;
                deltaY /= 40;
            }

            // Get a whole, normalized value for the deltas
            delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
            deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
            deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

            // Normalise offsetX and offsetY properties
            if (this.getBoundingClientRect) {
                var boundingRect = this.getBoundingClientRect();
                offsetX = event.clientX - boundingRect.left;
                offsetY = event.clientY - boundingRect.top;
            }

            // Add information to the event object
            event.deltaX = deltaX;
            event.deltaY = deltaY;
            event.deltaFactor = lowestDelta;
            event.offsetX = offsetX;
            event.offsetY = offsetY;
            // Go ahead and set deltaMode to 0 since we converted to pixels
            // Although this is a little odd since we overwrite the deltaX/Y
            // properties with normalized deltas.
            event.deltaMode = 0;

            // Add event and delta to the front of the arguments
            args.unshift(event, delta, deltaX, deltaY);

            // Clearout lowestDelta after sometime to better
            // handle multiple device types that give different
            // a different lowestDelta
            // Ex: trackpad = 3 and mouse wheel = 120
            if (nullLowestDeltaTimeout) { clearTimeout(nullLowestDeltaTimeout); }
            nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);



            return fn.apply(this, args);
        }
    };

    mousewheelHandler.events = function() {
        var doc = window.document;
        return ( 'onwheel' in doc || doc.documentMode >= 9 ) ?
               ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    };

    return mousewheelHandler;

}();



var addListener = function(){

    var fn = null,
        prefix = null;

    return function addListener(el, event, func) {

        if (fn === null) {
            if (el.addEventListener) {
                fn = "addEventListener";
                prefix = "";
            }
            else {
                fn = "attachEvent";
                prefix = "on";
            }
            //fn = el.attachEvent ? "attachEvent" : "addEventListener";
            //prefix = el.attachEvent ? "on" : "";
        }


        if (event == "mousewheel") {
            func = mousewheelHandler(func);
            var events = mousewheelHandler.events(),
                i, l;
            for (i = 0, l = events.length; i < l; i++) {
                el[fn](prefix + events[i], func, false);
            }
        }
        else {
            el[fn](prefix + event, func, false);
        }

        return func;
    }

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




var nextUid = function(){
    var uid = ['0', '0', '0'];

    // from AngularJs
    /**
     * @returns {String}
     */
    return function nextUid() {
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


function isFunction(value) {
    return typeof value == 'function';
};




var ObservableEvent = (function(){

    /**
     * This class is private - you can't create an event other than via Observable.
     * See Observable reference.
     * @class ObservableEvent
     * @private
     */
    var ObservableEvent = function(name, returnResult, autoTrigger, triggerFilter, filterContext) {

        var self    = this;

        self.name           = name;
        self.listeners      = [];
        self.map            = {};
        self.hash           = nextUid();
        self.uni            = '$$' + name + '_' + self.hash;
        self.suspended      = false;
        self.lid            = 0;

        if (typeof returnResult == "object" && returnResult !== null) {
            extend(self, returnResult, true, false);
        }
        else {
            self.returnResult = returnResult === undf ? null : returnResult; // first|last|all
            self.autoTrigger = autoTrigger;
            self.triggerFilter = triggerFilter;
            self.filterContext = filterContext;
        }
    };


    extend(ObservableEvent.prototype, {

        name: null,
        listeners: null,
        map: null,
        hash: null,
        uni: null,
        suspended: false,
        lid: null,
        returnResult: null,
        autoTrigger: null,
        lastTrigger: null,
        triggerFilter: null,
        filterContext: null,

        /**
         * Get event name
         * @method
         * @returns {string}
         */
        getName: function() {
            return this.name;
        },

        /**
         * @method
         */
        destroy: function() {
            var self        = this,
                k;

            for (k in self) {
                self[k] = null;
            }
        },

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Function's "this" object
         * @param {object} options See Observable's on()
         */
        on: function(fn, context, options) {

            if (!fn) {
                return null;
            }

            context     = context || null;
            options     = options || {};

            var self        = this,
                uni         = self.uni,
                uniContext  = context || fn;

            if (uniContext[uni] && !options.allowDupes) {
                return null;
            }

            var id      = ++self.lid,
                first   = options.first || false;

            uniContext[uni]  = id;


            var e = {
                fn:         fn,
                context:    context,
                uniContext: uniContext,
                id:         id,
                called:     0, // how many times the function was triggered
                limit:      0, // how many times the function is allowed to trigger
                start:      1, // from which attempt it is allowed to trigger the function
                count:      0, // how many attempts to trigger the function was made
                append:     null, // append parameters
                prepend:    null // prepend parameters
            };

            extend(e, options, true, false);

            if (first) {
                self.listeners.unshift(e);
            }
            else {
                self.listeners.push(e);
            }

            self.map[id] = e;

            if (self.autoTrigger && self.lastTrigger && !self.suspended) {
                var prevFilter = self.triggerFilter;
                self.triggerFilter = function(l){
                    if (l.id == id) {
                        return prevFilter ? prevFilter(l) !== false : true;
                    }
                    return false;
                };
                self.trigger.apply(self, self.lastTrigger);
                self.triggerFilter = prevFilter;
            }

            return id;
        },

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Function's "this" object
         * @param {object} options See Observable's on()
         */
        once: function(fn, context, options) {

            options = options || {};
            options.limit = 1;

            return this.on(fn, context, options);
        },

        /**
         * @method
         * @param {function} fn Callback function { @required }
         * @param {object} context Function's "this" object
         */
        un: function(fn, context) {

            var self        = this,
                inx         = -1,
                uni         = self.uni,
                listeners   = self.listeners,
                id;

            if (fn == parseInt(fn)) {
                id      = fn;
            }
            else {
                context = context || fn;
                id      = context[uni];
            }

            if (!id) {
                return false;
            }

            for (var i = 0, len = listeners.length; i < len; i++) {
                if (listeners[i].id == id) {
                    inx = i;
                    delete listeners[i].uniContext[uni];
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
         * @param {object} context Function's "this" object
         * @return bool
         */
        hasListener: function(fn, context) {

            var self    = this,
                listeners   = self.listeners,
                id;

            if (fn) {

                context = context || fn;

                if (!isFunction(fn)) {
                    id  = fn;
                }
                else {
                    id  = context[self.uni];
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
                delete listeners[i].uniContext[uni];
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
                returnResult    = self.returnResult,
                filter          = self.triggerFilter,
                filterContext   = self.filterContext,
                args;

            if (self.suspended) {
                return null;
            }

            if (self.autoTrigger) {
                self.lastTrigger = slice.call(arguments);
            }

            if (listeners.length == 0) {
                return null;
            }

            var ret     = returnResult == "all" || returnResult == "merge" ?
                          [] : null,
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

                args = self._prepareArgs(l, arguments);

                if (filter && filter.call(filterContext, l, args, self) === false) {
                    continue;
                }

                l.count++;

                if (l.count < l.start) {
                    continue;
                }

                res = l.fn.apply(l.context, args);

                l.called++;

                if (l.called == l.limit) {
                    self.un(l.id);
                }

                if (returnResult == "all") {
                    ret.push(res);
                }
                else if (returnResult == "merge" && res) {
                    ret = ret.concat(res);
                }
                else if (returnResult == "first") {
                    return res;
                }
                else if (returnResult == "nonempty" && res) {
                    return res;
                }
                else if (returnResult == "last") {
                    ret = res;
                }
                else if (returnResult == false && res === false) {
                    return false;
                }
            }

            if (returnResult) {
                return ret;
            }
        }
    }, true, false);


    return ObservableEvent;
}());




var Observable = (function(){


    /**
     * @description A javascript event system implementing two patterns - observable and collector.
     * @description Observable:
     * @code examples/observable.js
     *
     * @description Collector:
     * @code examples/collector.js
     *
     * @class Observable
     * @version 1.1
     * @author johann kuindji
     * @link https://github.com/kuindji/metaphorjs-observable
     */
    var Observable = function() {

        this.events = {};

    };


    extend(Observable.prototype, {



        /**
        * You don't have to call this function unless you want to pass params other than event name.
        * Normally, events are created automatically.
        *
        * @method createEvent
        * @access public
        * @param {string} name {
        *       Event name
        *       @required
        * }
        * @param {bool|string} returnResult {
        *   false -- return first 'false' result and stop calling listeners after that<br>
        *   "all" -- return all results as array<br>
        *   "merge" -- merge all results into one array (each result must be array)<br>
        *   "first" -- return result of the first handler (next listener will not be called)<br>
        *   "last" -- return result of the last handler (all listeners will be called)<br>
        * }
        * @param {bool} autoTrigger {
        *   once triggered, all future subscribers will be automatically called
        *   with last trigger params
        *   @code examples/autoTrigger.js
        * }
        * @param {function} triggerFilter {
        *   This function will be called each time event is triggered. Return false to skip listener.
        *   @code examples/triggerFilter.js
        *   @param {object} listener This object contains all information about the listener, including
        *       all data you provided in options while subscribing to the event.
        *   @param {[]} arguments
        *   @return {bool}
        * }
        * @return {ObservableEvent}
        */

        /**
         * @method createEvent
         * @param {string} name
         * @param {object} options {
         *  @type {string} returnResult
         *  @param {bool} autoTrigger
         *  @param {function} triggerFilter
         * }
         * @param {object} filterContext
         * @returns {ObservableEvent}
         */
        createEvent: function(name, returnResult, autoTrigger, triggerFilter, filterContext) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                events[name] = new ObservableEvent(name, returnResult, autoTrigger, triggerFilter, filterContext);
            }
            return events[name];
        },

        /**
        * @method
        * @access public
        * @param {string} name Event name
        * @return {ObservableEvent|undefined}
        */
        getEvent: function(name) {
            name = name.toLowerCase();
            return this.events[name];
        },

        /**
        * Subscribe to an event or register collector function.
        * @method
        * @access public
        * @param {string} name {
        *       Event name
        *       @required
        * }
        * @param {function} fn {
        *       Callback function
        *       @required
        * }
        * @param {object} context "this" object for the callback function
        * @param {object} options {
        *       You can pass any key-value pairs in this object. All of them will be passed to triggerFilter (if
        *       you're using one).
        *       @type {bool} first {
        *           True to prepend to the list of handlers
        *           @default false
        *       }
        *       @type {number} limit {
        *           Call handler this number of times; 0 for unlimited
        *           @default 0
        *       }
        *       @type {number} start {
        *           Start calling handler after this number of calls. Starts from 1
        *           @default 1
        *       }
         *      @type {[]} append Append parameters
         *      @type {[]} prepend Prepend parameters
         *      @type {bool} allowDupes allow the same handler twice
        * }
        */
        on: function(name, fn, context, options) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                events[name] = new ObservableEvent(name);
            }
            return events[name].on(fn, context, options);
        },

        /**
        * Same as {@link Observable.on}, but options.limit is forcefully set to 1.
        * @method
        * @access public
        */
        once: function(name, fn, context, options) {
            options     = options || {};
            options.limit = 1;
            return this.on(name, fn, context, options);
        },


        /**
        * Unsubscribe from an event
        * @method
        * @access public
        * @param {string} name Event name
        * @param {function} fn Event handler
        * @param {object} context If you called on() with context you must call un() with the same context
        */
        un: function(name, fn, context) {
            name = name.toLowerCase();
            var events  = this.events;
            if (!events[name]) {
                return;
            }
            events[name].un(fn, context);
        },

        /**
         * @method hasListener
         * @access public
         * @return bool
         */

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
        * @param {object} context Function's "this" object
        * @return bool
        */
        hasListener: function(name, fn, context) {
            var events = this.events;

            if (name) {
                name = name.toLowerCase();
                if (!events[name]) {
                    return false;
                }
                return events[name].hasListener(fn, context);
            }
            else {
                for (name in events) {
                    if (events[name].hasListener()) {
                        return true;
                    }
                }
                return false;
            }
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
        * Destroy observable
        * @method
        * @md-not-inheritable
        * @access public
        */
        destroy: function() {
            var self    = this,
                events  = self.events;

            for (var i in events) {
                self.destroyEvent(i);
            }

            for (i in self) {
                self[i] = null;
            }
        },

        /**
        * Although all methods are public there is getApi() method that allows you
        * extending your own objects without overriding "destroy" (which you probably have)
        * @code examples/api.js
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
    }, true, false);


    return Observable;
}());


function emptyFn(){};

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
    return setTimeout(function(){
        fn.apply(context, args || []);
    }, timeout || 0);
};

var rParseLocation = /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#]*)))?(\?[^#]+)?)(#.*)?/;




var parseLocation = function(url) {

    var matches = url.match(rParseLocation) || [],
        wl = (typeof window != "undefined" ? window.location : null) || {};

    return {
        protocol: matches[4] || wl.protocol || "http:",
        hostname: matches[11] || wl.hostname || "",
        host: ((matches[11] || "") + (matches[12] ? ":" + matches[12] : "")) || wl.host || "",
        username: matches[8] || wl.username || "",
        password: matches[9] || wl.password || "",
        port: parseInt(matches[12], 10) || wl.port || "",
        href: url,
        path: (matches[13] || "/") + (matches[16] || ""),
        pathname: matches[13] || "/",
        search: matches[16] || "",
        hash: matches[17] && matches[17] != "#" ? matches[17] : ""
    };
};

var joinLocation = function(location, opt) {

    var url = "";
    opt = opt || {};

    if (!opt.onlyPath) {
        url += location.protocol + "//";

        if (location.username && location.password) {
            url += location.username + ":" + location.password + "@";
        }

        url += location.hostname;

        if (location.hostname && location.port) {
            url += ":" + location.port;
        }
    }

    if (!opt.onlyHost) {
        url += (location.pathname || "/");

        if (location.search && location.search != "?") {
            url += location.search;
        }

        if (location.hash && location.hash != "#") {
            url += location.hash;
        }
    }

    return url;
};




var history = function(){

    var win,
        history,
        location,
        observable      = new Observable,
        api             = {},

        pushState,
        replaceState,

        windowLoaded    = typeof window == "undefined",

        prevLocation    = null,

        pushStateSupported,
        hashChangeSupported,
        useHash;

    observable.createEvent("before-location-change", false);

    var initWindow = function() {
        win                 = window;
        history             = win.history;
        location            = win.location;
        pushStateSupported  = !!history.pushState;
        hashChangeSupported = "onhashchange" in win;
        useHash             = false; //pushStateSupported && (navigator.vendor || "").match(/Opera/);
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
            return loc.path;
            //loc.hash = "#!" + encodeURIComponent(loc.path);
            //loc.pathname = "/";
            //loc.search = "";
        }

        return joinLocation(loc, {onlyPath: true});
    };










    var setHash = function(hash) {

        if (hash) {
            if (hash.substr(0,1) != '#') {
                hash = "!" + hash;
            }
            location.hash = hash;
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



    var onLocationPush = function(url) {
        prevLocation = extend({}, location, true, false);
        triggerEvent("location-change", url);
    };

    var onLocationPop = function() {
        if (pathsDiffer(prevLocation, location)) {
            var url = getCurrentUrl();
            prevLocation = extend({}, location, true, false);
            triggerEvent("location-change", url);
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
                if (triggerEvent("before-location-change", url) === false) {
                    return false;
                }
                history.pushState(null, null, preparePath(url));
                onLocationPush(url);
            };


            replaceState = function(url) {
                if (triggerEvent("before-location-change", url) === false) {
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
                    if (triggerEvent("before-location-change", url) === false) {
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
                    if (triggerEvent("before-location-change", url) === false) {
                        return false;
                    }
                    pushFrame(preparePath(url));
                };

                replaceState = function(url) {
                    if (triggerEvent("before-location-change", url) === false) {
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

            var prev = extend({}, location, true, false),
                next = parseLocation(url);

            if (hostsDiffer(prev, next)) {
                return null;
            }

            if (pathsDiffer(prev, next)) {
                pushState(url);
            }

            //history.pushState(null, null, url);
        },

        replace: function(url) {
            init();

            replaceState(url);
            //history.replaceState(null, null, url);
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
        }
    });

}();

var MetaphorJsExports = {};
MetaphorJsExports['history'] = history;
typeof global != "undefined" ? (global['MetaphorJs'] = MetaphorJsExports) : (window['MetaphorJs'] = MetaphorJsExports);

}());