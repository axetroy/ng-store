'use strict';

let ngStore = require('./src/store');

let s = angular.module('ngStore', []).provider('ngStore', ngStore);

module.exports = s;

