Package.describe({
  summary: 'Persistent Client-side Collections for Meteor'
});

Package.on_use(function (api) {
  api.use('underscore', 'client');
  api.use('amplify', 'client');
  api.add_files('local-persist.js', 'client');
});

Package.on_test(function (api) {
  api.use('underscore', 'client');
  api.use('amplify', 'client');
  api.use('tinytest', 'client');
  api.add_files('local-persist.js', 'client');
  api.add_files('local-persist-test.js', 'client');
});