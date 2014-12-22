
var defineClass = require("metaphorjs-class/src/func/defineClass.js"),
    ObservableMixin = require("metaphorjs/src/mixin/ObservableMixin.js"),
    mhistory = require("../metaphorjs.history.js"),
    isString = require("metaphorjs/src/func/isString.js"),
    extend = require("metaphorjs/src/func/extend.js"),
    getRegExp = require("metaphorjs/src/func/getRegExp.js"),
    currentUrl = require("../func/currentUrl.js");

module.exports = (function(){

    var cache = {};

    var UrlParam = defineClass({

        $mixins: [ObservableMixin],

        extractor: null,
        context: null,
        regexp: null,
        valueIndex: 1,
        prev: null,
        value: null,
        enabled: true,

        $init: function(cfg) {

            var self = this;

            extend(self, cfg, true, false);

            if (self.regexp && isString(self.regexp)) {
                self.regexp = getRegExp(self.regexp);
            }

            if (self.name && !self.regexp && !self.extractor) {
                self.regexp = getRegExp(self.name + "=([^&]+)");
            }

            if (!self.regexp && !self.extractor) {
                throw "Invalid UrlParam config, missing regexp or extractor";
            }

            if (self.enabled) {
                self.enabled = false;
                self.enable();
            }
        },

        enable: function() {
            var self = this;
            if (!self.enabled) {
                self.enabled = true;
                mhistory.on("location-change", self.onLocationChange, self);
                self.onLocationChange(currentUrl());
            }
        },

        disable: function() {
            var self = this;
            if (self.enabled) {
                self.enabled = false;
                mhistory.un("location-change", self.onLocationChange, self);
            }
        },

        onLocationChange: function(url) {

            var self = this,
                value = self.extractValue(url);

            if (self.value != value) {
                self.prev = self.value;
                self.value = value;
                self.trigger("change", value, self.prev);
            }
        },

        extractValue: function(url) {
            var self = this;
            if (self.regexp) {
                var match = url.match(self.regexp);
                return match ? match[self.valueIndex] : null;
            }
            else if (self.extractor) {
                return self.extractor.call(self.context, url);
            }
        },

        getValue: function() {
            return this.value;
        },

        getPrev: function() {
            return this.prev;
        },

        destroyIfIdle: function() {

            var self = this;
            if (!self.$$observable.hasListener()) {
                self.$destroy();
            }
        },

        destroy: function() {
            var self = this;
            self.disable();
        }

    }, {

        get: function(cfg) {
            if (cfg.id && cache[cfg.id]) {
                return cache[cfg.id];
            }
            else {
                return new UrlParam(cfg);
            }
        }

    });

    return UrlParam;
}());