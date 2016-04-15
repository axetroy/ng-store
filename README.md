# ng-store
AngularJS store service base on store.js

origin [store.js](https://github.com/marcuswestin/store.js)

## How to User it

### bower 

```bash
bower install ng-store --save
```
and insert in HTML

### npm
```bash
npm install ng-store --save
```
and then require it in you project
```javascript
require('ng-store');
```

the mose important is require this module in Angular
```javascript
angular
  .module('angularTApp', [
    'ngStore'
  ])
```

## Provider

provider 2 method to config storage prefix and expiration

```javascript
ngStoreProvider.prefix('test').exp(1000 * 5);
```

#### prefix

> `default`:no prefix

#### exp

> `default`:3600 * 24 * 7

## Document

```javascript
ngStore.set('user', {name: 'marcus', likes: 'javascript'});
ngStore.get('user');
ngStore.remove('user');
ngStore.clear();
...
```

allmost like [store.js](https://github.com/marcuswestin/store.js)'s api

## Referrence 
[store.js](https://github.com/marcuswestin/store.js)

## Additional method

### $watch

watch a store and do some action when the value change lick ``$scope.$watch``

only for communicate between the diffrent page (cros)

listen the onStorage Event that mean not work for store cookie

and there is a bug in ``IE``:

> IE will trigger the target window and it self,and ``chrome`` and ``firefox`` just trigger the target window

``ngStore.$watch(key,watcher,[$scope])``

```javascript
var watcher = ngStore.$watch('user', function (newVal, oldVal) {
  console.log(newVal, oldVal);
}, $scope);
```

#### arguments

- key{string}

> the store key you want to watch

- watcher{function}

> a function,when the store change and run,the first arguments is ``old value``,2nd is ``new value``

- $scope[Optional parameters]

> if afferent this argument,it will automatically canceled when $scope ``$destroy``
> I don't suggest you use this method in controller but in service

#### return{function}

return a function which can cancel this watcher like ``$scope.$watch``

## Build

```bash
grunt build
```
