/**
 * Created by axetroy on 16-4-14.
 */

let store = require('store');

let ngStore = function () {
  let config = {
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

    let get = function (key) {
      key = config.prefix + '-' + key;
      let info = store.get(key);

      if (!info || new Date().getTime() - info.time > info.exp) return null;

      return info.val
    };

    let set = function (key, val, exp = config.exp) {
      key = `${config.prefix}-${key}`;
      store.set(key, {val: val, exp: exp, time: new Date().getTime()})
    };

    let remove = function (key) {
      key = `${config.prefix}-${key}`;
      return store.remove(key);
    };

    let has = function (key) {
      key = `${config.prefix}-${key}`;
      return store.has(key);
    };

    let clear = function () {
      let clearList = [];
      store.forEach(function (key) {
        if (new RegExp(`^${config.prefix}`).test(key)) {
          let val = store.get(key);
          let temp = {};
          store.remove(key);
          temp[key] = val;
          clearList.push(temp);
        }
      });
      return clearList;
    };

    let getAll = store.getAll;

    let forEach = store.forEach;

    let init = function () {
      let info;
      let list = [];
      let temp = {};
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

    let _watchList = {};

    let _hasWatch = false;

    let watch = function () {
      // watch once
      if (_hasWatch || !store.enabled) return;
      window.addEventListener('storage', function (e) {
        angular.forEach(_watchList, function (watcherList, key) {
          if (e.key + '' !== key + '') return;

          let oldVal = store.deserialize(e.oldValue);
          let newVal = store.deserialize(e.newValue);

          if (oldVal && oldVal.val) oldVal = oldVal.val;
          if (newVal && newVal.val) newVal = newVal.val;

          let equals = !!angular.equals(oldVal, newVal);

          if (equals) return;

          angular.forEach(watcherList, function (watcher) {
            if (angular.isFunction(watcher)) watcher(newVal, oldVal);
          });

        })
      }, false);
      _hasWatch = true;
    };

    let $$uid = 0;

    let $$generateUid = function () {
      return $$uid++;
    };

    let $watch = function (key, watcher, $scope) {

      let [$$id,cancelWatch] = [];

      key = `${config.prefix}-${key}`;
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
        })
      }

      return cancelWatch;

    };

    init();

    return {get, set, has, remove, getAll, forEach, clear, $watch, init};

  };
};

module.exports = ngStore;