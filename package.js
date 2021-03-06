Package.describe({
  name: "jeffm:local-persist",
  summary: "Persistent client (browser) collections for Meteor, using localStorage.",
  version: "1.3.0",
  git: "https://github.com/jeffmitchel/meteor-local-persist.git"
});

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.0');
  api.use(['underscore', 'ejson'], 'client');
  api.use('nunohvidal:lz-string@1.3.3', 'client');
  api.addFiles('local-persist.js', 'client');
  api.export('LocalPersist', 'client');
});

Package.onTest(function (api) {
  api.use('jeffm:local-persist', 'client');
  api.use(['tinytest', 'ejson'], 'client');
  api.addFiles('local-persist-test.js', 'client');
});
