(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ngStore = require('./src/store');

var s = angular.module('ngStore', []).provider('ngStore', ngStore);

module.exports = s;

},{"./src/store":3}],2:[function(require,module,exports){
(function (global){
"use strict"
// Module export pattern from
// https://github.com/umdjs/umd/blob/master/returnExports.js
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.store = factory();
  }
}(this, function () {
	
	// Store.js
	var store = {},
		win = (typeof window != 'undefined' ? window : global),
		doc = win.document,
		localStorageName = 'localStorage',
		scriptTag = 'script',
		storage

	store.disabled = false
	store.version = '1.3.20'
	store.set = function(key, value) {}
	store.get = function(key, defaultVal) {}
	store.has = function(key) { return store.get(key) !== undefined }
	store.remove = function(key) {}
	store.clear = function() {}
	store.transact = function(key, defaultVal, transactionFn) {
		if (transactionFn == null) {
			transactionFn = defaultVal
			defaultVal = null
		}
		if (defaultVal == null) {
			defaultVal = {}
		}
		var val = store.get(key, defaultVal)
		transactionFn(val)
		store.set(key, val)
	}
	store.getAll = function() {}
	store.forEach = function() {}

	store.serialize = function(value) {
		return JSON.stringify(value)
	}
	store.deserialize = function(value) {
		if (typeof value != 'string') { return undefined }
		try { return JSON.parse(value) }
		catch(e) { return value || undefined }
	}

	// Functions to encapsulate questionable FireFox 3.6.13 behavior
	// when about.config::dom.storage.enabled === false
	// See https://github.com/marcuswestin/store.js/issues#issue/13
	function isLocalStorageNameSupported() {
		try { return (localStorageName in win && win[localStorageName]) }
		catch(err) { return false }
	}

	if (isLocalStorageNameSupported()) {
		storage = win[localStorageName]
		store.set = function(key, val) {
			if (val === undefined) { return store.remove(key) }
			storage.setItem(key, store.serialize(val))
			return val
		}
		store.get = function(key, defaultVal) {
			var val = store.deserialize(storage.getItem(key))
			return (val === undefined ? defaultVal : val)
		}
		store.remove = function(key) { storage.removeItem(key) }
		store.clear = function() { storage.clear() }
		store.getAll = function() {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = function(callback) {
			for (var i=0; i<storage.length; i++) {
				var key = storage.key(i)
				callback(key, store.get(key))
			}
		}
	} else if (doc && doc.documentElement.addBehavior) {
		var storageOwner,
			storageContainer
		// Since #userData storage applies only to specific paths, we need to
		// somehow link our data to a specific path.  We choose /favicon.ico
		// as a pretty safe option, since all browsers already make a request to
		// this URL anyway and being a 404 will not hurt us here.  We wrap an
		// iframe pointing to the favicon in an ActiveXObject(htmlfile) object
		// (see: http://msdn.microsoft.com/en-us/library/aa752574(v=VS.85).aspx)
		// since the iframe access rules appear to allow direct access and
		// manipulation of the document element, even for a 404 page.  This
		// document can be used instead of the current document (which would
		// have been limited to the current path) to perform #userData storage.
		try {
			storageContainer = new ActiveXObject('htmlfile')
			storageContainer.open()
			storageContainer.write('<'+scriptTag+'>document.w=window</'+scriptTag+'><iframe src="/favicon.ico"></iframe>')
			storageContainer.close()
			storageOwner = storageContainer.w.frames[0].document
			storage = storageOwner.createElement('div')
		} catch(e) {
			// somehow ActiveXObject instantiation failed (perhaps some special
			// security settings or otherwse), fall back to per-path storage
			storage = doc.createElement('div')
			storageOwner = doc.body
		}
		var withIEStorage = function(storeFunction) {
			return function() {
				var args = Array.prototype.slice.call(arguments, 0)
				args.unshift(storage)
				// See http://msdn.microsoft.com/en-us/library/ms531081(v=VS.85).aspx
				// and http://msdn.microsoft.com/en-us/library/ms531424(v=VS.85).aspx
				storageOwner.appendChild(storage)
				storage.addBehavior('#default#userData')
				storage.load(localStorageName)
				var result = storeFunction.apply(store, args)
				storageOwner.removeChild(storage)
				return result
			}
		}

		// In IE7, keys cannot start with a digit or contain certain chars.
		// See https://github.com/marcuswestin/store.js/issues/40
		// See https://github.com/marcuswestin/store.js/issues/83
		var forbiddenCharsRegex = new RegExp("[!\"#$%&'()*+,/\\\\:;<=>?@[\\]^`{|}~]", "g")
		var ieKeyFix = function(key) {
			return key.replace(/^d/, '___$&').replace(forbiddenCharsRegex, '___')
		}
		store.set = withIEStorage(function(storage, key, val) {
			key = ieKeyFix(key)
			if (val === undefined) { return store.remove(key) }
			storage.setAttribute(key, store.serialize(val))
			storage.save(localStorageName)
			return val
		})
		store.get = withIEStorage(function(storage, key, defaultVal) {
			key = ieKeyFix(key)
			var val = store.deserialize(storage.getAttribute(key))
			return (val === undefined ? defaultVal : val)
		})
		store.remove = withIEStorage(function(storage, key) {
			key = ieKeyFix(key)
			storage.removeAttribute(key)
			storage.save(localStorageName)
		})
		store.clear = withIEStorage(function(storage) {
			var attributes = storage.XMLDocument.documentElement.attributes
			storage.load(localStorageName)
			for (var i=attributes.length-1; i>=0; i--) {
				storage.removeAttribute(attributes[i].name)
			}
			storage.save(localStorageName)
		})
		store.getAll = function(storage) {
			var ret = {}
			store.forEach(function(key, val) {
				ret[key] = val
			})
			return ret
		}
		store.forEach = withIEStorage(function(storage, callback) {
			var attributes = storage.XMLDocument.documentElement.attributes
			for (var i=0, attr; attr=attributes[i]; ++i) {
				callback(attr.name, store.deserialize(storage.getAttribute(attr.name)))
			}
		})
	}

	try {
		var testKey = '__storejs__'
		store.set(testKey, testKey)
		if (store.get(testKey) != testKey) { store.disabled = true }
		store.remove(testKey)
	} catch(e) {
		store.disabled = true
	}
	store.enabled = !store.disabled
	
	return store
}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],3:[function(require,module,exports){
/**
 * Created by axetroy on 16-4-14.
 */

'use strict';

var store = require('store');

var ngStore = function ngStore() {
  var config = {
    prefix: 'st',
    exp: 3600 * 24 * 7
  };

  this.prefix = function (prefix) {
    config.prefix = prefix;
    return this;
  };

  this.exp = function (times) {
    config.exp = times;
    return this;
  };

  this.$get = function () {

    var get = function get(key) {
      key = config.prefix + '-' + key;
      var info = store.get(key);

      if (!info || new Date().getTime() - info.time > info.exp) return null;

      return info.val;
    };

    var set = function set(key, val) {
      var exp = arguments.length <= 2 || arguments[2] === undefined ? config.exp : arguments[2];

      key = config.prefix + '-' + key;
      store.set(key, { val: val, exp: exp, time: new Date().getTime() });
    };

    var remove = function remove(key) {
      key = config.prefix + '-' + key;
      return store.remove(key);
    };

    var has = function has(key) {
      key = config.prefix + '-' + key;
      return store.has(key);
    };

    var clear = function clear() {
      var clearList = [];
      store.forEach(function (key) {
        if (new RegExp('^' + config.prefix).test(key)) {
          var val = store.get(key);
          var temp = {};
          store.remove(key);
          temp[key] = val;
          clearList.push(temp);
        }
      });
      return clearList;
    };

    var getAll = store.getAll;

    var forEach = store.forEach;

    var init = function init() {
      var info = undefined;
      var list = [];
      var temp = {};
      store.forEach(function (key) {
        info = store.get(key);
        if (info === null || Object.prototype.toString.call(info) === '[object Null]') {
          temp[key] = info.val;
          list.push(temp);
          store.remove(key);
        }
      });
      return list;
    };

    var _watchList = {};

    var _hasWatch = false;

    var watch = function watch() {
      // watch once
      if (_hasWatch || !store.enabled) return;
      window.addEventListener('storage', function (e) {
        angular.forEach(_watchList, function (watcherList, key) {
          if (e.key + '' !== key + '') return;

          var oldVal = store.deserialize(e.oldValue);
          var newVal = store.deserialize(e.newValue);

          if (oldVal && oldVal.val) oldVal = oldVal.val;
          if (newVal && newVal.val) newVal = newVal.val;

          var equals = !!angular.equals(oldVal, newVal);

          if (equals) return;

          angular.forEach(watcherList, function (watcher) {
            if (angular.isFunction(watcher)) watcher(newVal, oldVal);
          });
        });
      }, false);
      _hasWatch = true;
    };

    var $$uid = 0;

    var $$generateUid = function $$generateUid() {
      return $$uid++;
    };

    var $watch = function $watch(key, watcher, $scope) {
      var _ref = [];
      var $$id = _ref[0];
      var cancelWatch = _ref[1];

      key = config.prefix + '-' + key;
      if (!store.enabled) return;

      watch();

      if (!_watchList[key] || !angular.isObject(_watchList[key])) _watchList[key] = {};

      $$id = $$generateUid();

      _watchList[key][$$id] = watcher;

      cancelWatch = function () {
        angular.forEach(_watchList[key], function (watcher, id) {
          if (id + '' === $$id + '') {
            delete _watchList[key][id];
          }
        });
        if (!Object.keys(_watchList[key]).length) delete _watchList[key];
      };

      if ($scope && $scope.$id && $scope.$parent && angular.isFunction($scope.$on)) {
        $scope.$on('$destroy', function () {
          cancelWatch();
        });
      }

      return cancelWatch;
    };

    init();

    return { get: get, set: set, has: has, remove: remove, getAll: getAll, forEach: forEach, clear: clear, $watch: $watch, init: init };
  };
};

module.exports = ngStore;

},{"store":2}]},{},[1]);
