1.2.0 / 2015-09-07
==================
* Removed dependency on jQuery.

1.1.0 / 2015-02-03
==================
* Changed compression method to one that creates valid UTF-16 strings. This corrects a serious regression on IE.
* Changed maximum documents to track from 5000 to unlimited, based on the principle of least surprise.

1.0.0 / 2015-02-02
==================
* Updated to Meteor v1 package system.
* Use browser localStorage directly, instead of the deprecated Amplify package.
* Added option to compress data.
* Added option to set maximum documents to track.
* Added optional storage full callback.
