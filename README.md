jsaSound
========

jsaSound is an interactive sound library that uses the [Web Audio API](http://www.w3.org/TR/webaudio/) to provide playable sound models.
The code is entirely modular, and allows asynchronous loading of different modules.

Usage
-----

jsaSound is built using the RequireJS JavaScript loader. To use RequireJS, follow the instructions at http://requirejs.org/docs/start.html.
Simply include the path to the "jsaSound" directory in your require config, and you can play with the sounds, as shown in `index.html`

Basic Description
-----------------

jsaSound is organised as a set of **sound models**, that you may use in your application.
When you require a sound model, the module returns a constructor for the sound model.
The sound model created from this constructor may be played, and its parameters may be set using simple calls to the `play`, `release` and `set` methods of the model.
Detailed examples of the usage of these methods may be found in the sliderBox example (see `index.html`) or in [jsaPhoneControl](http://github.com/lonce/jsaPhoneControl).

You can also create your own sound models. For guidance, just look at any of the jsa-prefixed sound models.

The code is distributed under the GNU Lesser General Public License 3.