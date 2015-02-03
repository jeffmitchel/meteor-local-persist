LocalPersist = function (collection, key, options) {
  var self = this;
  if (! (self instanceof LocalPersist))
      throw new Error('use "new" to construct a LocalPersist');

  self.stats = { added: 0, removed: 0, changed: 0, localStorage: false };
  self.key = 'browcol__' + key;
  self.col = collection;
  self.compress = !! (options && options.compress);
  self.migrate = !! (options && options.migrate);
  self.maxDocuments = !! (options && options.maxDocuments && typeof options.maxDocuments === 'number') ? options.maxDocuments : 5000;
  self.storageFull = !! (options && options.storageFull && typeof options.storageFull === 'function') ? options.storageFull : function (document) {};
  self.cur = [];

  if(localStorage) {
    self.cur = self.col.find({});
    self.stats.localStorage = true;

    persisters.push(self);

    Meteor.startup(function () {
      // load from storage
      self._refresh(true);

      self.cur.observe({
        added: function (doc) {
          if(self.stats.added - self.stats.removed >= self.maxDocuments) {
            self.storageFull(self.col, doc);
          }

          // get or initialize tracking list
          var list = self._getList();

          // store copy of document into local storage, if not already there
          var key = self._makeDataKey(doc._id);
          if(! self._get(key)) {
            if(! self._put(key, doc))
              return;
          }

          // add document id to tracking list and store
          // if unable to store list due to storage being full,
          // remove doc from storage and fire callback
          if (! _.contains(list, doc._id)) {
            list.push(doc._id);
            if(! self._putList(list)) {
              self._remove(key, doc);
              this.storageFull(self.col, doc);
              return;
            }
          }

          ++self.stats.added;
        },

        removed: function (doc) {
          var list = self._getList();

          // if not in list, nothing to do
          if(! _.contains(list, doc._id))
            return;

          // remove from list
          list = _.without(list, doc._id);

          // remove document copy from local storage
          self._remove(self._makeDataKey(doc._id));

          // store updated list
          self._putList(list);

          ++self.stats.removed;
        },

        changed: function (newDoc, oldDoc) {
          // update document in local storage
          self._put(self._makeDataKey(newDoc._id), newDoc);
          ++self.stats.changed;
        }
      });
    });
  }
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
  },
  _put: function (key, doc) {
    var rec = {};
    rec.v = 2;
    rec.c = this.compress ? 1 : 0;
    rec.d = EJSON.stringify(doc);
    rec.d = this.compress ? LZString.compressToUTF16(EJSON.stringify(doc)) : EJSON.stringify(doc);
    try {
      localStorage.setItem(key, EJSON.stringify(rec));
    } catch (e) {
      this.storageFull(this.col, doc);
      return false;
    }
    return true;
  },
  _get: function (key) {
    var val = localStorage.getItem(key);
    if(val === null)
      return null;
    var rec = EJSON.parse(val);
    if(rec.c === 1) {
      if(rec.v === 1)
        val = LZString.decompress(rec.d);
      else
        val = LZString.decompressFromUTF16(rec.d);
    } else {
      val = rec.d;
    }
    return EJSON.parse(val);
  },
  _remove: function (key) {
    localStorage.removeItem(key);
  },
  _putList: function (list) {
    if(list === null || list.length === 0) {
      localStorage.removeItem(this.key);
      return;
    }

    var val = EJSON.stringify(list);
    try {
      localStorage.setItem(this.key, val);
    } catch (e) {
      return false;
    }
    return true;
  },
  _getList: function () {
    var val = localStorage.getItem(this.key);
    return val === null ? [] : EJSON.parse(val);
  },
  _migrate: function (key) {
    // migrate old Amplify.JS based data
    // (attempts to be restartable)
    var self = this;
    var okey = '__amplify__' + key;
    var dkey;
    var olist;
    var nkey;
    var nlist;
    return;

    // get old list
    var val = localStorage.getItem(okey);
    if(val === null)
      return;

    val = EJSON.parse(val);
    if(val && val.data)
      olist = val.data;
    else
      return;

    // get or initialise new list
    nlist = self._getList();

    // for each record in old list, migrate to new format.
    // add to new list, saving list each time
    _.each(olist, function (id) {
      dkey = okey + '__' + id;
      val = localStorage.getItem(dkey);
      if(!! val) {
        val = EJSON.parse(val);
        if(!! val && !! val.data) {
          nkey = key + '__' + id;
          self._put(nkey, val.data);
          nlist.push(id);
          self._putList(nlist);
          localStorage.removeItem(dkey);
        }
      }
    });

    // remove old list
    localStorage.removeItem(okey);
  },
  _refresh: function (init) {
    var self = this;
    
    if(!! init && self.migrate)
      self._migrate(self.key);

    var list = self._getList();
    var dels = [];

    self.stats.added = 0;

    if (!! list) {
      var length = list.length;
      list = _.filter(list, function (id) {
        var doc = self._get(self._makeDataKey(id));
        if(!! doc) {
          var d = self.col.findOne({ _id: doc._id });
          if(d)
            self.col.update({ _id: d._id }, doc);
          else
            self.col.insert(doc);
        }

        return !! doc;
      });

      // if not initializing, check for deletes
      if(! init) {
        self.col.find({}).forEach(function (doc) {
          if(! _.contains(list, doc._id))
            dels.push(doc._id);
        });

        _.each(dels, function (id) {
          self.col.remove({ _id: id });
        });
      }

      // if initializing, save cleaned list (if changed)
      if(init && length != list.length) {
        self._putList(list);
      }
    }
  }
};

var persisters = [];
var lpTimer = null;

Meteor.startup(function () {
  $(window).bind('storage', function (e) {
    Meteor.clearTimeout(lpTimer);
    lpTimer = Meteor.setTimeout(function () {
      _.each(persisters, function (lp) {
        lp._refresh(false);
      });
    }, 250);
  });
});
