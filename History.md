1.1.0 / 2015-02-03
==================
* Changed compression method to one that create valid UTF-16 strings. This corrects a serious regression on IE.
* Changed maximum documents to track from 5000 to unlimit, based on the principle of least suprise.

1.0.0 / 2015-02-02
==================
* Updated to Meteor v1 package system.
* Use browser localStorage directly, instead of the deprecated Amplify package.
* Added option to compress data.
* Added option to see maximum documents to track.
* Added optional storage full callback.
