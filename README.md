# KV-Keeper.js

[![Build Status](https://travis-ci.org/andre487/kv-keeper.js.svg?branch=master)](https://travis-ci.org/andre487/kv-keeper.js)
[![Code Climate](https://codeclimate.com/github/andre487/kv-keeper.js/badges/gpa.svg)](https://codeclimate.com/github/andre487/kv-keeper.js)

This is a key-value storage for the JS that wraps IndexedDB with fallback to LocalStorage

  * Very light: 4.7KiB minified and 1.9KiB in gzip.
  * Can store much data when IndexedDB is available.
  * Simple LS-like interface with Node.js-like callbacks.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Exports and modularity](#exports-and-modularity)
- [Basic usage](#basic-usage)
- [Options](#options)
- [Advanced usage](#advanced-usage)
- [Using with promises](#using-with-promises)
- [Global error handling](#global-error-handling)
- [Well tested browsers](#well-tested-browsers)
  - [Desktop](#desktop)
    - [IndexedDB](#indexeddb)
    - [LocalStorage](#localstorage)
  - [Mobile](#mobile)
    - [IndexedDB](#indexeddb-1)
    - [LocalStorage](#localstorage-1)
- [Dist](#dist)
- [CI and Testing](#ci-and-testing)
  - [CI pipeline](#ci-pipeline)
  - [Testing in PhantomJS](#testing-in-phantomjs)
  - [Tests with database dropping](#tests-with-database-dropping)
  - [Pre-commit hooks](#pre-commit-hooks)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Exports and modularity
If CommonJS module environment is available, Kv Keeper exports to it.
Otherwise exports to global variable `KvKeeper`.

## Basic usage

Using default storage. Trying IndexedDB at first and using LocalStorage if IDB is not supported.

```js
var KvKeeper = require('kv-keeper.js')

KvKeeper.setItem('foo', 'bar', function (err) {
  if (err) return console.error("Can't save the foo item")

  console.error('The foo item is successfully stored!')
})

KvKeeper.getItem('foo', function (err, value) {
  if (err) return console.error('Oh no!')

  console.log('The foo item value:', value)
})

KvKeeper.hasItem('foo', function (err, value) {
  if (err) return console.error('Oh no!')

  console.log('Has item? ', value ? 'Yes' : 'No')
})

KvKeeper.removeItem('foo', function (err) {
  if (err) return console.error('Oh no!')

  console.log('There is no more foo')
})

KvKeeper.getKeys(function (err, keys) {
  if (err) return console.error('Oh no!')

  console.log('We have that items in out storage:', keys)
})

KvKeeper.getLength('foo', function (err, length) {
  if (err) return console.error('Oh no!')

  console.log('Our storage have that count of items:', length)
})

KvKeeper.clear(function (err) {
  if (err) return console.error('Oh no!')

  console.log('Our storage is empty now')
})
```

## Options
You can configure the Kv Keeper with `configure` method:

```js
KvKeeper.configure({
  dbName: 'foo',
  storeName: 'bar',
  defaultType: 'ls'
})
```

The options are:
  * `dbName` - name of database when IndexedDB is used or part of a prefix in LocalStorage
  * `storeName` - name of store in IndexedDB or part of a prefix in LocalStorage
  * `defaultType` - default storage type. Can be `db`, `ls` or `auto`
  (try `db` at first and `ls` if `db` is not supported)

## Advanced usage
You can get storage with needed driver using `KvKeeper.getStorage`. Storage instances's method are similar
to basic methods and have extra `close` method that closes DB and destroys instance

```js
var type = 'db' // Can be auto, db or ls or can absent (not required param)

KvKeeper.getStorage(type, function (err, storage) {
  if (err) return console.error('Error =/')

  storage.getItem('foo', function (err, value) {
    if (err) return console.error('Error =/')

    console.log("Look! It's foo!", value)
  })

  storage.close()

  // You need to get new instance after closing
})
```

## Using with promises
Node.js callbacks style allows to wrap methods in promises with many well known libraries:

```js
var Q = require('q')

Q.ninvoke(KvKeeper, 'getItem', 'foo')
  .then(function (val) {
    console.log("Look! It's foo!", value)
  })
  .catch(function (err) {
    console.error('👎')
  })
```

And you can build promises chain with it:

```js
var Q = require('q')

Q.ninvoke(KvKeeper, 'getStorage')
  .then(function (storage) {
    return Q.ninvoke(storage, 'setItem', 'foo')
  })
  .then(function () {
    console.log('We have set foo!')
  })
  .catch(function (err) {
    // This catch catches errors from all the chain
    console.error('💩')
  })
```

## Global error handling

You can define a global error listeners:

```js
function listener(err) {
  console.error('We have an error', err)
}

KvKeeper.addErrorListener(listener)

KvKeeper.getErrorListeners() // => [listener]

KvKeeper.removeErrorListener(listener)

KvKeeper.removeAllErrorListeners()
```

## Well tested browsers
Store limits measured in [special tests](/test/limits/limits-test.js). In that tests
stored symbols count was tested but we accept hypothesis that 1 symbol == 1 byte of content.

Official notes about limits you can find on the
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria).

### Desktop
#### IndexedDB
In tests of storage size 128MiB was successfully saved in all browsers.

One item limit is between ~9MiB in IE11 and ~128MiB in FireFox 42 and Edge 13.

  * Yandex Browser 1.7+
  * Google Chrome 24+
  * FireFox 40+ (it needs more testing between 30 and 40)
  * InternetExplorer 10+
  * Edge 13+
  * Safari 9+

#### LocalStorage
One item limit is between ~2.5MiB (in Chrome 22 and Safari 5-9) and exactly ~5MiB (in FireFox 42).
So the all storage size.

  * YandexBrowser 1.1+
  * Google Chrome 22+
  * FireFox 10+
  * InternetExplorer 9+
  * Safari 5+
  * PhantomJS 1.9.7+

### Mobile
#### IndexedDB
Safe data chunk is 8MiB. After that some mobile browsers can crash.

Android:
  * YandexBrowser 15.6+
  * Android Browser 5.0.1+
  * Google Chrome 34+
  * FireFox 42+
  * Opera 33+
  * UC Web 10.5+

Safari and WebView (and all browsers) in iOS 8+.

Internet Explorer 10+ (Windows Phone 8).

**Known issues:**
  1. You should not create more then one collection in Kv-Keeper.js database in iOS to avoid
     [this bug](http://www.raymondcamden.com/2014/9/25/IndexedDB-on-iOS-8--Broken-Bad).
  2. Safe to store data chunk is about 8MiB. After that threshold some browsers (like Safari on iOS 8) will crash.
  3. Safari 8 crashes after saving 5 chunks by 5 MiB in a loop.

#### LocalStorage
One item limit is between ~2.5MiB (Android Browser 4.1.2 and Safari 5-9) and exactly ~5MiB
(in FireFox 42 for Android and Internet Explorer 9).
So the all storage size.

 * Android Browser 4.1.2+
 * Internet Explorer 9+ (Windows Phone 7.5)
 * iOS 7+ Safari and WebView

For more information see detailed but dirty [testing notes](https://yadi.sk/i/qGZu_d-FkgC9a)

## Dist
You can generate dist files with `npm run dist` but it's not necessary because this command runs automatically
with pre-commit git hook

## CI and Testing
### CI pipeline
CI pipeline of the project has these steps:
  * Check errors with ESLint
  * Check code style with JSCS using [yandex](https://github.com/ymaps/codestyle) preset
  * Run tests with Mocha and PhantomJS

### Testing in PhantomJS
Unfortunately only LocalStorage can be tested in CI. It's because of poor technologies support in PhantomJS.
Because of it you should look to tests in couple of browsers using this algorithm:
  * Run `npm run web-server`
  * Open `http://localhost:8000/test/specs/test.html` ang look at report
  * Then you can generate dist and look at `http://localhost:8000/test/specs/test-dist.html`

### Tests with database dropping
These tests are very unstable because of unpredictable browsers behaviour. Because of it these tests are
disabled by default. You can enable them by adding `tests=all` to query string of tests page. You can do it like this:
`http://localhost:8000/test/specs/test-dist.html?tests=all`

### Pre-commit hooks
There are some automatic steps usually done before a commit:
  * Check changed files with ESLint and JSCS
  * Run integration tests, can be skipped by setting `SKIP_TESTS=1`
  * Prepare dist files (see [Dist](#dist))
  * Update Table of Contents in README.md

So you don't have to do it by yourself.
