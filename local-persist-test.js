var data = [
  { firstName: 'Albert', lastName: 'Einstein', email: 'emc2@princeton.edu'      },
  { firstName: 'Marie',  lastName: 'Curie',    email: 'marie.curie@sorbonne.fr' },
  { firstName: 'Max',    lastName: 'Planck',   email: 'max@mpg.de'              }
];

// test adding, retrieving and deleting data. the tests are a bit bogus since we can't
// reload the browser to exercise the persistence. the best we can do is to verify that
// amplify has stored the correct data.

Tinytest.add('Local Persist - Insert Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new BrowserCollection(testCollection, 'Test-Collection');

  data.forEach(function (doc) {
    testCollection.insert(doc);
  });

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  // get the tracking list and verify it has the correct number of keys
  var list = amplify.store(testObserver._getKey());
  test.equal(list.length, data.length);
});

Tinytest.add('Local Persist - Retrieve Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new BrowserCollection(testCollection, 'Test-Collection');

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  data.forEach(function (doc) {
    m = testCollection.findOne({ lastName: doc.lastName });
    a = amplify.store(testObserver._makeDataKey(m._id));
    test.equal(a, m);
  });
});

Tinytest.add('Local Persist - Remove Data', function(test) {
  var testCollection = new Meteor.Collection(null);
  var testObserver = new BrowserCollection(testCollection, 'Test-Collection');

  // right number of adds?
  test.equal(testObserver._getStats().added, data.length);

  testCollection.remove({});

  // right number of removes?
  test.equal(testObserver._getStats().removed, data.length);

  // the tracking list should be gone
  var list = amplify.store(testObserver._getKey());
  test.equal(!! list, false);
});
