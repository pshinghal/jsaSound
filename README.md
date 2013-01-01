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

Notes
-----------------
Some of the sound models use microphone input. These models only work when run on a proper web web server (thought
one on the localhost will work fine). Also, when the user opens one of these models, the ALLOW/DISALLOW buttons
show up on the main browser window, not the sound model slider box window so it is easy to miss. If the user
doesn't push the ALLOW button, the model will not work properly. 
