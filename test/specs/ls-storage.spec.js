describe('KvKeeper.StorageLS', function () {
    beforeEach(function () {
        localStorage.clear();
    });

    afterEach(function () {
        KvKeeper._clearInstance('ls');
        localStorage.clear();
    });

    it('should work on supported platform', function (done) {
        KvKeeper.getStorage('ls', function (err, storage) {
            assert.isNull(err);
            assert.instanceOf(storage, KvKeeper.StorageLS);
            done();
        });
    });

    describe('#setItem()', function () {
        it('should set items to LS', function (done) {
            KvKeeper.getStorage('ls', function (err, storage) {
                storage.setItem('foo', 'bar', function (err) {
                    assert.isNull(err);
                    assert.equal(localStorage.getItem('foo'), 'bar');
                    done();
                });
            });
        });
    });

    describe('#getItem()', function () {
        it('should get items from LS', function (done) {
            localStorage.setItem('foo', 'bar');

            KvKeeper.getStorage('ls', function (err, storage) {
                storage.getItem('foo', function (err, val) {
                    assert.isNull(err);
                    assert.equal(val, 'bar');
                    done();
                });
            });
        });
    });

    describe('#hasItem()', function () {
        it('should provide true for existing in LS item', function (done) {
            localStorage.setItem('foo', false);

            KvKeeper.getStorage('ls', function (err, storage) {
                storage.hasItem('foo', function (err, has) {
                    assert.isNull(err);
                    assert.isTrue(has);
                    done();
                });
            });
        });

        it('should provide false for absent item', function (done) {
            KvKeeper.getStorage('ls', function (err, storage) {
                storage.hasItem('foo', function (err, has) {
                    assert.isNull(err);
                    assert.isFalse(has);
                    done();
                });
            });
        });
    });

    describe('#removeItem()', function () {
        it('should remove items from LS', function (done) {
            localStorage.setItem('foo', 'bar');

            KvKeeper.getStorage('ls', function (err, storage) {
                storage.removeItem('foo', function (err) {
                    assert.isNull(err);
                    assert.notOk(localStorage.getItem('foo'));
                    done();
                });
            });
        });
    });

    describe('#getKeys()', function () {
        it('should get items keys from LS', function (done) {
            localStorage.setItem('foo', 'bar');
            localStorage.setItem('baz', 'qux');

            KvKeeper.getStorage('ls', function (err, storage) {
                storage.getKeys(function (err, keys) {
                    assert.isNull(err);
                    assert.sameMembers(['baz', 'foo'], keys);
                    done();
                });
            });
        });
    });

    describe('#getLength()', function () {
        it('should length of LS', function (done) {
            localStorage.setItem('foo', 'bar');
            localStorage.setItem('baz', 'qux');

            KvKeeper.getStorage('ls', function (err, storage) {
                storage.getLength(function (err, length) {
                    assert.isNull(err);
                    assert.equal(length, localStorage.length);
                    done();
                });
            });
        });
    });

    describe('#clear()', function () {
        it('should clear LS', function (done) {
            localStorage.setItem('foo', 'bar');
            localStorage.setItem('baz', 'qux');

            KvKeeper.getStorage('ls', function (err, storage) {
                storage.clear(function (err) {
                    assert.isNull(err);
                    assert.equal(localStorage.length, 0);
                    done();
                });
            });
        });
    });
});
