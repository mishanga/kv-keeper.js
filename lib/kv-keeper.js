'use strict';
var KvKeeper = exports;

var instances = {};

/**
 * @typedef {Object} KvStorage
 */

/**
 * Get key-value storage instance
 * @param {String} [type=auto] Storage type: ls, db, auto
 * @param {Function} callback
 */
KvKeeper.getStorage = function (type, callback) {
    if (typeof type === 'function') {
        callback = type;
        type = null;
    }
    type = type || 'auto';

    var storage = KvKeeper._getInstance(type);
    if (storage) {
        storage.ensureReady(callback);
    } else {
        var message = type === 'auto' ?
            'This platform does not support any storages' :
            'Storage with type "' + type + '" is not supported';
        callback(new Error('[kv-keeper] ' + message));
    }
};

KvKeeper._getInstance = function (type) {
    if (!instances[type]) {
        var Class = getStorageClass(type);
        if (Class) {
            instances[type] = Class.create();
        }
    }
    return instances[type];
};

function getStorageClass(type) {
    switch (type) {
        case 'ls':
            return LS;
        case 'db':
            return DB;
    }
}

/**
 * Driver builder. Chooses IndexedDB if available with fallback to LocalStorage.
 * If non IDB neither LS available it creates null
 */
KvKeeper.StorageAuto = {
    /**
     * Create storage
     * @returns {KvStorage}
     */
    create: function () {
        return DB.create() || LS.create();
    }
};

/**
 * LocalStorage driver
 * @constructor
 */
var LS = KvKeeper.StorageLS = function (storage) {
    this._storage = storage;

    var that = this;

    this.ensureReady = function (callback) {
        callback(null, that);
    };
};

LS.create = function () {
    var storage = window.localStorage;
    return storage ? new LS(storage) : null;
};

/**
 * IndexedDB driver
 * @constructor
 */
var DB = KvKeeper.StorageDB = function (storage) {
    this._storage = storage;

    var that = this;

    this.ensureReady = function (callback) {
        callback(null, that);
    };
};

DB.create = function () {
    var storage = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    return storage ? new DB(storage) : null;
};