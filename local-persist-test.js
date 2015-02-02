var data = [
  { firstName: 'Albert', lastName: 'Einstein',   email: 'emc2@princeton.edu'      },
  { firstName: 'Marie',  lastName: 'Curie',      email: 'marie.curie@sorbonne.fr' },
  { firstName: 'Max',    lastName: 'Planck',     email: 'max@mpg.de'              },
  { firstName: 'Werner', lastName: 'Heisenberg', email: 'heisenberg@unm.edu'      }
];

// test adding, retrieving and deleting data. the tests are a bit bogus since we can't
// reload the browser to exercise the persistence. the best we can do is to verify that
// we have stored the correct data.

Tinytest.add('Local Persist (Uncompressed) - Insert Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection');

  data.forEach(function (doc) {
    testCollection.insert(doc);
  });

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  // get the tracking list and verify it has the correct number of keys
  var list = testObserver._getList();
  test.equal(list.length, data.length);
});

Tinytest.add('Local Persist (Uncompressed) - Retrieve Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection');

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  data.forEach(function (doc) {
    m = testCollection.findOne({ lastName: doc.lastName });
    a = testObserver._get(testObserver._makeDataKey(m._id));
    test.equal(a, m);
  });
});

Tinytest.add('Local Persist (Uncompressed) - Remove Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection');

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  testCollection.remove({});

  // right number of removes?
  test.equal(testObserver._getStats().removed, data.length);

  // the tracking list should be gone
  var list = testObserver._get(testObserver._getKey());
  test.equal(!! list, false);
});

// create emulated amplify data to match earlier versions of this package.
// init a collection, which will then auto-migrate. validate that it did.
Tinytest.add('Local Persist (Uncompressed) - Migrate Data', function(test) {
  var dataCollection = new Meteor.Collection(null);
  var keybase = '__amplify__browcol__Test-Collection';
  var list = [];
  var adata = {};

  data.forEach(function (doc) {
    dataCollection.insert(doc);
  });

  var cur = dataCollection.find({});
  cur.forEach(function (doc) {
    list.push(doc._id);
    adata = {};
    adata.data = doc;
    adata.expires = null;
    localStorage.setItem(keybase + '__' + doc._id, EJSON.stringify(adata));
  });

  adata = {};
  adata.data = list;
  adata.expires = null;
  localStorage.setItem(keybase, EJSON.stringify(adata));

  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection', { compress: false, migrate: true });

  cur = testCollection.find({});
  cur.forEach(function (doc) {
    m = testCollection.findOne({ lastName: doc.lastName });
    a = testObserver._get(testObserver._makeDataKey(m._id));
    test.equal(a, m);
  });

  testCollection.remove({});
});

// repeat tests with compression enabled

Tinytest.add('Local Persist (Compressed) - Insert Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection', { compress: true, migrate: false });

  data.forEach(function (doc) {
    testCollection.insert(doc);
  });

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  // get the tracking list and verify it has the correct number of keys
  var list = testObserver._getList();
  test.equal(list.length, data.length);
});

Tinytest.add('Local Persist (Compressed) - Retrieve Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection', { compress: true, migrate: false });

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  data.forEach(function (doc) {
    m = testCollection.findOne({ lastName: doc.lastName });
    a = testObserver._get(testObserver._makeDataKey(m._id));
    test.equal(a, m);
  });
});

Tinytest.add('Local Persist (Compressed) - Remove Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection', { compress: true, migrate: false });

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  testCollection.remove({});

  // right number of removes?
  test.equal(testObserver._getStats().removed, data.length);

  // the tracking list should be gone
  var list = testObserver._get(testObserver._getKey());
  test.equal(!! list, false);
});

// create emulated amplify data to match earlier versions of this package.
// init a collection, which will then auto-migrate. validate that it did.
Tinytest.add('Local Persist (Compressed) - Migrate Data', function(test) {
  var dataCollection = new Meteor.Collection(null);
  var keybase = '__amplify__browcol__Test-Collection';
  var list = [];
  var adata = {};

  data.forEach(function (doc) {
    dataCollection.insert(doc);
  });

  var cur = dataCollection.find({});
  cur.forEach(function (doc) {
    list.push(doc._id);
    adata = {};
    adata.data = doc;
    adata.expires = null;
    localStorage.setItem(keybase + '__' + doc._id, EJSON.stringify(adata));
  });

  adata = {};
  adata.data = list;
  adata.expires = null;
  localStorage.setItem(keybase, EJSON.stringify(adata));

  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection', { compress: true, migrate: true });

  cur = testCollection.find({});
  cur.forEach(function (doc) {
    m = testCollection.findOne({ lastName: doc.lastName });
    a = testObserver._get(testObserver._makeDataKey(m._id));
    test.equal(a, m);
  });

  testCollection.remove({});
});

// repeat tests with both compressed and uncompressed data

Tinytest.add('Local Persist (Compressed and Uncompressed) - Insert Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection');

  var i = 0;
  data.forEach(function (doc) {
    testObserver.compress = i++ % 2 === 0;
    testCollection.insert(doc);
  });

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  // get the tracking list and verify it has the correct number of keys
  var list = testObserver._getList();
  test.equal(list.length, data.length);
});

Tinytest.add('Local Persist (Compressed and Uncompressed) - Retrieve Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection');

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  data.forEach(function (doc) {
    m = testCollection.findOne({ lastName: doc.lastName });
    a = testObserver._get(testObserver._makeDataKey(m._id));
    test.equal(a, m);
  });
});

Tinytest.add('Local Persist (Compressed and Uncompressed) - Remove Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection');

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  testCollection.remove({});

  // right number of removes?
  test.equal(testObserver._getStats().removed, data.length);

  // the tracking list should be gone
  var list = testObserver._get(testObserver._getKey());
  test.equal(!! list, false);
});

Tinytest.add('Local Persist - Storage Limit Exceeded', function(test) {
  var count = 0;
  var testCollection = new Meteor.Collection(null);
  var testObserver = new LocalPersist(testCollection, 'Test-Collection',
    {
      maxDocuments: data.length - 1,
      storageFull: function(col, doc) {
        ++count;
        col.remove({ _id: doc._id });
      }
    });

  data.forEach(function (doc) {
    testCollection.insert(doc);
  });

test.equal(count, 1);
test.equal(testCollection.find({}).count(), data.length - 1);

testCollection.remove({});
});

