var describer;
if (window.indexedDB) {
    describer = describe;
} else {
    describer = describe.skip;
    console.log('IndexedDB is not supported on this platform'); // eslint-disable-line no-console
}

function connectToDb(callback) {
    var db;
    var req = indexedDB.open(KvKeeper.DB_NAME, KvKeeper.DB_VERSION);

    req.onsuccess = function (event) {
        db = event.target.result;

        db.onversionchange = function () {
            throw new Error('Version changed');
        };

        callback(db);
    };

    req.onupgradeneeded = function (event) {
        db = event.target.result;

        KvKeeper.StorageDB.setupSchema(db);
    };

    req.onblocked = req.onerror = function (event) {
        throw new Error('Connect error: ' + event.type);
    };
}

testDbOnPositive('clear table', function (callback) {
    connectToDb(function (db) {
        var store = db.transaction([KvKeeper.STORE_NAME], 'readwrite').objectStore(KvKeeper.STORE_NAME);

        store.clear();
        db.close();

        callback();
    });
});

testDbOnPositive('drop database', function (callback) {
    var req = indexedDB.deleteDatabase(KvKeeper.DB_NAME);

    req.onsuccess = function () {
        callback();
    };

    req.onblocked = req.onerror = function (event) {
        throw new Error('Drop DB error! ' + event.type);
    };
});

function testDbOnPositive(label, resetDb) {
    describer('KvKeeper.StorageDB on positive with ' + label, function () {
        var secondDb;

        beforeEach(function (done) {
            resetDb(function () {
                connectToDb(function (db) {
                    secondDb = db;
                    done();
                });
            });
        });

        afterEach(function (done) {
            KvKeeper.getStorage('db', function (err, storage) {
                assert.notOk(err);

                storage.close();
                secondDb.close();

                resetDb(done);
            });
        });

        it('should work on supported platform', function (done) {
            KvKeeper.getStorage('db', function (err, storage) {
                window.__st = storage;

                assert.isNull(err);
                assert.instanceOf(storage, KvKeeper.StorageDB);
                done();
            });
        });

        describe('#setItem()', function () {
            it('should set items to DB', function (done) {
                KvKeeper.getStorage('db', function (err, storage) {
                    storage.setItem('foo', 'bar', function (err) {
                        assert.isNull(err);

                        getStore().get('foo').onsuccess = function (event) {
                            var result = event.target.result;
                            assert.propertyVal(result, 'key', 'foo');
                            assert.propertyVal(result, 'value', 'bar');
                            done();
                        };
                    });
                });
            });
        });

        describe('#getItem()', function () {
            it('should get items from DB', function (done) {
                getStore().add({key: 'foo', value: 'bar'}).onsuccess = function () {
                    KvKeeper.getStorage('db', function (err, storage) {
                        storage.getItem('foo', function (err, val) {
                            assert.isNull(err);
                            assert.equal(val, 'bar');
                            done();
                        });
                    });
                };
            });
        });

        describe('#hasItem()', function () {
            it('should provide true for existing in DB item', function (done) {
                getStore().add({key: 'foo', value: false}).onsuccess = function () {
                    KvKeeper.getStorage('db', function (err, storage) {
                        storage.hasItem('foo', function (err, has) {
                            assert.isNull(err);
                            assert.isTrue(has);
                            done();
                        });
                    });
                };
            });

            it('should provide false for absent item', function (done) {
                KvKeeper.getStorage('db', function (err, storage) {
                    storage.hasItem('foo', function (err, has) {
                        assert.isNull(err);
                        assert.isFalse(has);
                        done();
                    });
                });
            });
        });

        describe('#removeItem()', function () {
            it('should remove items from DB', function (done) {
                getStore().add({key: 'foo', value: 'bar'}).onsuccess = function () {
                    KvKeeper.getStorage('db', function (err, storage) {
                        checkHas();

                        function checkHas() {
                            storage.hasItem('foo', function (err, has) {
                                assert.isNull(err);
                                assert.isTrue(has);

                                remove();
                            });
                        }

                        function remove() {
                            storage.removeItem('foo', function (err) {
                                assert.isNull(err);

                                checkHasNot();
                            });
                        }

                        function checkHasNot() {
                            storage.hasItem('foo', function (err, has) {
                                assert.isNull(err);
                                assert.isFalse(has);
                                done();
                            });
                        }
                    });
                };
            });
        });

        describe('#getKeys()', function () {
            it('should get items keys from DB', function (done) {
                insert(check);

                function insert(callback) {
                    getStore().add({key: 'foo', value: 'baz'}).onsuccess = function () {
                        getStore().add({key: 'bar', value: 'qux'}).onsuccess = callback;
                    };
                }

                function check() {
                    KvKeeper.getStorage('db', function (err, storage) {
                        storage.getKeys(function (err, keys) {
                            assert.isNull(err);
                            assert.sameMembers(['bar', 'foo'], keys);
                            done();
                        });
                    });
                }
            });
        });

        describe('#getLength()', function () {
            it('should count of items in DB', function (done) {
                insert(check);

                function insert(callback) {
                    getStore().add({key: 'foo', value: 'baz'}).onsuccess = function () {
                        getStore().add({key: 'bar', value: 'qux'}).onsuccess = callback;
                    };
                }

                function check() {
                    KvKeeper.getStorage('db', function (err, storage) {
                        storage.getLength(function (err, length) {
                            assert.isNull(err);
                            assert.equal(length, 2);
                            done();
                        });
                    });
                }
            });
        });

        describe('#clear()', function () {
            it('should remove all items from store', function (done) {
                insert(clear.bind(this, check));

                function insert(callback) {
                    getStore().add({key: 'foo', value: 'baz'}).onsuccess = function () {
                        getStore().add({key: 'bar', value: 'qux'}).onsuccess = callback;
                    };
                }

                function clear(callback) {
                    KvKeeper.getStorage('db', function (err, storage) {
                        storage.clear(function (err) {
                            assert.isNull(err);
                            callback();
                        });
                    });
                }

                function check() {
                    KvKeeper.getStorage('db', function (err, storage) {
                        storage.getLength(function (err, length) {
                            assert.isNull(err);
                            assert.equal(length, 0);
                            done();
                        });
                    });
                }
            });
        });

        function getStore() {
            return secondDb.transaction([KvKeeper.STORE_NAME], 'readwrite').objectStore(KvKeeper.STORE_NAME);
        }
    });
}

describer('KvKeeper.StorageDB on negative', function () {
    var sandbox;
    var instance;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        instance = new KvKeeper.StorageDB(indexedDBStub);
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('when init', function () {
        it('should provide error from callback', function (done) {
            var errEvent = new DbEventStub();

            sandbox.stub(IDBOpenDBRequestStub.prototype, 'applyDefault',
                function () { this.onerror(errEvent); });

            instance.init(function (err) {
                assert.instanceOf(err, Error);
                assert.include(err.toString(), '[kv-keeper] DB request error');
                assert.propertyVal(err, 'event', errEvent);

                done();
            });
        });

        it('should provide blocking error', function (done) {
            var errEvent = new DbEventStub();

            sandbox.stub(IDBOpenDBRequestStub.prototype, 'applyDefault',
                function () { this.onblocked(errEvent); });

            instance.init(function (err) {
                assert.instanceOf(err, Error);
                assert.include(err.toString(), '[kv-keeper] DB is blocked');
                assert.propertyVal(err, 'event', errEvent);

                done();
            });
        });
    });
});
