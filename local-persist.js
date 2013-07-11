LocalPersist = function (collection, key) {
  var self = this;
  if (! (self instanceof LocalPersist))
      throw new Error('use "new" to construct a LocalPersist');

  self.key = 'browcol__' + key;
  self.col = collection;
  self.cur = self.col.find({});
  self.handle = null;
  self.stats = { added: 0, removed: 0, changed: 0 };

  Meteor.startup(function () {
    // if tracking list exists, load data into collection. clean invalid ids from list.
    var list = amplify.store(self.key);

    if (!! list) {
      list = _.filter(list, function (id) {
        var doc = amplify.store(self._makeDataKey(id));
        if(!! doc)
          self.col.insert(doc);
        return !! doc;
      });
      // save cleaned list
      amplify.store(self.key, list.length === 0 ? null : list);
    }

    self.cur.observe({
      added: function (doc) {
        // get or initialize tracking list
        var list = amplify.store(self.key);
        if (! list)
          list = [];

        // add document id to tracking list and store
        if (! _.contains(list, doc._id)) {
          list.push(doc._id);
          amplify.store(self.key, list);
        }

        // store copy of document into local storage
        amplify.store(self._makeDataKey(doc._id), doc);

        ++self.stats.added;
      },

      removed: function (doc) {
        // get tracking list and remove document
        var list = _.without(amplify.store(self.key), doc._id);

        // remove document copy from local storage
        amplify.store(self._makeDataKey(doc._id), null);

        // if tracking list is empty, delete; else store updated copy
        amplify.store(self.key, list.length === 0 ? null : list);

        ++self.stats.removed;
      },

      changed: function (newDoc, oldDoc) {
        // update document in local storage
        amplify.store(self._makeDataKey(doc._id), newDoc);
        ++self.stats.changed;
      }
    });
  });
};

LocalPersist.prototype = {
  constructor: LocalPersist,
  _getStats: function () {
    return this.stats;
  },
  _getKey: function () {
    return this.key;
  },
  _makeDataKey: function (id) {
    return this.key + '__' + id;
  }
};
