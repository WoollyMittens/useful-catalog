/*
	Source:
	van Creij, Maurice (2012). "useful.gestures.js: A library of useful functions to ease working with touch and gestures.", version 20121126, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	// invoke strict mode
	"use strict";

	// object
	useful.Gestures = function (obj, cfg) {
		// properties
		this.obj = obj;
		this.cfg = cfg;
		this.touchOrigin = null;
		this.touchProgression = null;
		this.gestureOrigin = null;
		this.gestureProgression = null;
		// methods
		this.start = function () {
			// check the configuration properties
			this.checkConfig(this.cfg);
			// set the required events for mouse
			this.obj.addEventListener('mousedown', this.onStartTouch());
			this.obj.addEventListener('mousemove', this.onChangeTouch());
			document.body.addEventListener('mouseup', this.onEndTouch());
			this.obj.addEventListener('mousewheel', this.onChangeWheel());
			if (navigator.userAgent.match(/firefox/gi)) { this.obj.addEventListener('DOMMouseScroll', this.onChangeWheel()); }
			// set the required events for touch
			this.obj.addEventListener('touchstart', this.onStartTouch());
			this.obj.addEventListener('touchmove', this.onChangeTouch());
			document.body.addEventListener('touchend', this.onEndTouch());
			this.obj.addEventListener('mspointerdown', this.onStartTouch());
			this.obj.addEventListener('mspointermove', this.onChangeTouch());
			document.body.addEventListener('mspointerup', this.onEndTouch());
			// set the required events for gestures
			this.obj.addEventListener('gesturestart', this.onStartGesture());
			this.obj.addEventListener('gesturechange', this.onChangeGesture());
			this.obj.addEventListener('gestureend', this.onEndGesture());
			this.obj.addEventListener('msgesturestart', this.onStartGesture());
			this.obj.addEventListener('msgesturechange', this.onChangeGesture());
			this.obj.addEventListener('msgestureend', this.onEndGesture());
			// disable the start function so it can't be started twice
			this.start = function () {};
		};
		this.checkConfig = function (config) {
			// add default values for missing ones
			config.threshold = config.threshold || 50;
			config.increment = config.increment || 0.1;
			// cancel all events by default
			if (config.cancelTouch === undefined || config.cancelTouch === null) { config.cancelTouch = true; }
			if (config.cancelGesture === undefined || config.cancelGesture === null) { config.cancelGesture = true; }
			// add dummy event handlers for missing ones
			config.swipeUp = config.swipeUp || function () {};
			config.swipeLeft = config.swipeLeft || function () {};
			config.swipeRight = config.swipeRight || function () {};
			config.swipeDown = config.swipeDown || function () {};
			config.drag = config.drag || function () {};
			config.pinch = config.pinch || function () {};
			config.twist = config.twist || function () {};
		};
		this.readEvent = function (event) {
			var coords = {}, offsets;
			// try all likely methods of storing coordinates in an event
			if (event.x !== undefined) {
				coords.x = event.x;
				coords.y = event.y;
			} else if (event.touches && event.touches[0]) {
				coords.x = event.touches[0].pageX;
				coords.y = event.touches[0].pageY;
			} else if (event.pageX !== undefined) {
				coords.x = event.pageX;
				coords.y = event.pageY;
			} else {
				offsets = this.correctOffset(event.target || event.srcElement);
				coords.x = event.layerX + offsets.x;
				coords.y = event.layerY + offsets.y;
			}
			return coords;
		};
		this.correctOffset = function (element) {
			var offsetX = 0, offsetY = 0;
			// if there is an offset
			if (element.offsetParent) {
				// follow the offsets back to the right parent element
				while (element !== this.obj) {
					offsetX += element.offsetLeft;
					offsetY += element.offsetTop;
					element = element.offsetParent;
				}
			}
			// return the offsets
			return { 'x' : offsetX, 'y' : offsetY };
		};
		this.cancelTouch = function (event) {
			if (this.cfg.cancelTouch) {
				event = event || window.event;
				event.preventDefault();
			}
		};
		this.startTouch = function (event) {
			// get the coordinates from the event
			var coords = this.readEvent(event);
			// note the start position
			this.touchOrigin = {
				'x' : coords.x,
				'y' : coords.y,
				'target' : event.target || event.srcElement
			};
			this.touchProgression = {
				'x' : this.touchOrigin.x,
				'y' : this.touchOrigin.y
			};
		};
		this.changeTouch = function (event) {
			// if there is an origin
			if (this.touchOrigin) {
				// get the coordinates from the event
				var coords = this.readEvent(event);
				// get the gesture parameters
				this.cfg.drag({
					'x' : this.touchOrigin.x,
					'y' : this.touchOrigin.y,
					'horizontal' : coords.x - this.touchProgression.x,
					'vertical' : coords.y - this.touchProgression.y,
					'event' : event,
					'source' : this.touchOrigin.target
				});
				// update the current position
				this.touchProgression = {
					'x' : coords.x,
					'y' : coords.y
				};
			}
		};
		this.endTouch = function (event) {
			// if the numbers are valid
			if (this.touchOrigin && this.touchProgression) {
				// calculate the motion
				var distance = {
					'x' : this.touchProgression.x - this.touchOrigin.x,
					'y' : this.touchProgression.y - this.touchOrigin.y
				};
				// if the horizontal motion was the largest
				if (Math.abs(distance.x) > Math.abs(distance.y)) {
					// if there was a right swipe
					if (distance.x > this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeRight({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.x, 'event' : event, 'source' : this.touchOrigin.target});
					// else if there was a left swipe
					} else if (distance.x < -this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeLeft({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.x, 'event' : event, 'source' : this.touchOrigin.target});
					}
				// else
				} else {
					// if there was a down swipe
					if (distance.y > this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeDown({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.y, 'event' : event, 'source' : this.touchOrigin.target});
					// else if there was an up swipe
					} else if (distance.y < -this.cfg.threshold) {
						// report the associated swipe
						this.cfg.swipeUp({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.y, 'event' : event, 'source' : this.touchOrigin.target});
					}
				}
			}
			// clear the input
			this.touchProgression = null;
			this.touchOrigin = null;
		};
		this.changeWheel = function (event) {
			// measure the wheel distance
			var scale = 1, distance = ((window.event) ? window.event.wheelDelta / 120 : -event.detail / 3);
			// equate wheeling up / down to zooming in / out
			scale = (distance > 0) ? +this.cfg.increment : scale = -this.cfg.increment;
			// report the zoom
			this.cfg.pinch({
				'x' : 0,
				'y' : 0,
				'scale' : scale,
				'event' : event,
				'source' : event.target || event.srcElement
			});
		};
		this.cancelGesture = function (event) {
			if (this.cfg.cancelGesture) {
				event = event || window.event;
				event.preventDefault();
			}
		};
		this.startGesture = function (event) {
			// note the start position
			this.gestureOrigin = {
				'scale' : event.scale,
				'rotation' : event.rotation,
				'target' : event.target || event.srcElement
			};
			this.gestureProgression = {
				'scale' : this.gestureOrigin.scale,
				'rotation' : this.gestureOrigin.rotation
			};
		};
		this.changeGesture = function (event) {
			// if there is an origin
			if (this.gestureOrigin) {
				// get the distances from the event
				var scale = event.scale,
					rotation = event.rotation;
				// get the coordinates from the event
				var coords = this.readEvent(event);
				// get the gesture parameters
				this.cfg.pinch({
					'x' : coords.x,
					'y' : coords.y,
					'scale' : scale - this.gestureProgression.scale,
					'event' : event,
					'target' : this.gestureOrigin.target
				});
				this.cfg.twist({
					'x' : coords.x,
					'y' : coords.y,
					'rotation' : rotation - this.gestureProgression.rotation,
					'event' : event,
					'target' : this.gestureOrigin.target
				});
				// update the current position
				this.gestureProgression = {
					'scale' : event.scale,
					'rotation' : event.rotation
				};
			}
		};
		this.endGesture = function () {
			// note the start position
			this.gestureOrigin = null;
		};
		// touch events
		this.onStartTouch = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// handle the event
				context.startTouch(event);
				context.changeTouch(event);
			};
		};
		this.onChangeTouch = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// optionally cancel the default behaviour
				context.cancelTouch(event);
				// handle the event
				context.changeTouch(event);
			};
		};
		this.onEndTouch = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// handle the event
				context.endTouch(event);
			};
		};
		// mouse wheel events
		this.onChangeWheel = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.changeWheel(event);
			};
		};
		// gesture events
		this.onStartGesture = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.startGesture(event);
				context.changeGesture(event);
			};
		};
		this.onChangeGesture = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// optionally cancel the default behaviour
				context.cancelGesture(event);
				// handle the event
				context.changeGesture(event);
			};
		};
		this.onEndGesture = function () {
			// store the context
			var context = this;
			// return and event handler
			return function (event) {
				// get event object
				event = event || window.event;
				// handle the event
				context.endGesture(event);
			};
		};
		// external API
		this.enableDefaultTouch = function () {
			this.cfg.cancelTouch = false;
		};
		this.disableDefaultTouch = function () {
			this.cfg.cancelTouch = true;
		};
		this.enableDefaultGesture = function () {
			this.cfg.cancelGesture = false;
		};
		this.disableDefaultGesture = function () {
			this.cfg.cancelGesture = true;
		};
		// go
		this.start();
	};

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2012). "useful.polyfills.js: A library of useful polyfills to ease working with HTML5 in legacy environments.", version 20121126, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	// Invoke strict mode
	"use strict";

	// private functions
	var polyfills = polyfills || {};

	// enabled the use of HTML5 elements in Internet Explorer
	polyfills.html5 = function () {
		var a, b, elementsList;
		elementsList = ['section', 'nav', 'article', 'aside', 'hgroup', 'header', 'footer', 'dialog', 'mark', 'dfn', 'time', 'progress', 'meter', 'ruby', 'rt', 'rp', 'ins', 'del', 'figure', 'figcaption', 'video', 'audio', 'source', 'canvas', 'datalist', 'keygen', 'output', 'details', 'datagrid', 'command', 'bb', 'menu', 'legend'];
		if (navigator.userAgent.match(/msie/gi)) {
			for (a = 0 , b = elementsList.length; a < b; a += 1) {
				document.createElement(elementsList[a]);
			}
		}
	};

	// allow array.indexOf in older browsers
	polyfills.arrayIndexOf = function () {
		if (!Array.prototype.indexOf) {
			Array.prototype.indexOf = function (obj, start) {
				for (var i = (start || 0), j = this.length; i < j; i += 1) {
					if (this[i] === obj) { return i; }
				}
				return -1;
			};
		}
	};

	// allow document.querySelectorAll (https://gist.github.com/connrs/2724353)
	polyfills.querySelectorAll = function () {
		if (!document.querySelectorAll) {
			document.querySelectorAll = function (a) {
				var b = document, c = b.documentElement.firstChild, d = b.createElement("STYLE");
				return c.appendChild(d), b.__qsaels = [], d.styleSheet.cssText = a + "{x:expression(document.__qsaels.push(this))}", window.scrollBy(0, 0), b.__qsaels;
			};
		}
	};

	// allow addEventListener (https://gist.github.com/jonathantneal/3748027)
	polyfills.addEventListener = function () {
		!window.addEventListener && (function (WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
			WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function (type, listener) {
				var target = this;
				registry.unshift([target, type, listener, function (event) {
					event.currentTarget = target;
					event.preventDefault = function () { event.returnValue = false; };
					event.stopPropagation = function () { event.cancelBubble = true; };
					event.target = event.srcElement || target;
					listener.call(target, event);
				}]);
				this.attachEvent("on" + type, registry[0][3]);
			};
			WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function (type, listener) {
				for (var index = 0, register; register = registry[index]; ++index) {
					if (register[0] == this && register[1] == type && register[2] == listener) {
						return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
					}
				}
			};
			WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function (eventObject) {
				return this.fireEvent("on" + eventObject.type, eventObject);
			};
		})(Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);
	};

	// allow console.log
	polyfills.consoleLog = function () {
		var overrideTest = new RegExp('console-log', 'i');
		if (!window.console || overrideTest.test(document.querySelectorAll('html')[0].className)) {
			window.console = {};
			window.console.log = function () {
				// if the reporting panel doesn't exist
				var a, b, messages = '', reportPanel = document.getElementById('reportPanel');
				if (!reportPanel) {
					// create the panel
					reportPanel = document.createElement('DIV');
					reportPanel.id = 'reportPanel';
					reportPanel.style.background = '#fff none';
					reportPanel.style.border = 'solid 1px #000';
					reportPanel.style.color = '#000';
					reportPanel.style.fontSize = '12px';
					reportPanel.style.padding = '10px';
					reportPanel.style.position = (navigator.userAgent.indexOf('MSIE 6') > -1) ? 'absolute' : 'fixed';
					reportPanel.style.right = '10px';
					reportPanel.style.bottom = '10px';
					reportPanel.style.width = '180px';
					reportPanel.style.height = '320px';
					reportPanel.style.overflow = 'auto';
					reportPanel.style.zIndex = '100000';
					reportPanel.innerHTML = '&nbsp;';
					// store a copy of this node in the move buffer
					document.body.appendChild(reportPanel);
				}
				// truncate the queue
				var reportString = (reportPanel.innerHTML.length < 1000) ? reportPanel.innerHTML : reportPanel.innerHTML.substring(0, 800);
				// process the arguments
				for (a = 0, b = arguments.length; a < b; a += 1) {
					messages += arguments[a] + '<br/>';
				}
				// add a break after the message
				messages += '<hr/>';
				// output the queue to the panel
				reportPanel.innerHTML = messages + reportString;
			};
		}
	};

	// allows Object.create (https://gist.github.com/rxgx/1597825)
	polyfills.objectCreate = function () {
		if (typeof Object.create !== "function") {
			Object.create = function (original) {
				function Clone() {}
				Clone.prototype = original;
				return new Clone();
			};
		}
	};

	// allows String.trim (https://gist.github.com/eliperelman/1035982)
	polyfills.stringTrim = function () {
		if (!String.prototype.trim) {
			String.prototype.trim = function () { return this.replace(/^[\s\uFEFF]+|[\s\uFEFF]+$/g, ''); };
		}
		if (!String.prototype.ltrim) {
			String.prototype.ltrim = function () { return this.replace(/^\s+/, ''); };
		}
		if (!String.prototype.rtrim) {
			String.prototype.rtrim = function () { return this.replace(/\s+$/, ''); };
		}
		if (!String.prototype.fulltrim) {
			String.prototype.fulltrim = function () { return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); };
		}
	};

	// for immediate use
	polyfills.html5();
	polyfills.arrayIndexOf();
	polyfills.querySelectorAll();
	polyfills.addEventListener();
	polyfills.consoleLog();
	polyfills.objectCreate();
	polyfills.stringTrim();

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2012). "useful.transitions.js: A library of useful functions to ease working with CSS3 transitions.", version 20121126, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.

	Fallbacks:
	<!--[if IE]>
		<script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
		<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.9.2/jquery-ui.min.js"></script>
	<![endif]-->
*/

(function (useful) {

	// Invoke strict mode
	"use strict";

	// private functions
	var transitions = transitions || {};

	// applies functionality to node that conform to a given CSS rule, or returns them
	transitions.select = function (input, parent) {
		var a, b, elements;
		// validate the input
		parent = parent || document;
		input = (typeof input === 'string') ? {'rule' : input, 'parent' : parent} : input;
		input.parent = input.parent || document;
		input.data = input.data || {};
		// use querySelectorAll to select elements, or defer to jQuery
		elements = (typeof(document.querySelectorAll) !== 'undefined') ?
			input.parent.querySelectorAll(input.rule) :
			(typeof(jQuery) !== 'undefined') ? jQuery(input.parent).find(input.rule).get() : [];
		// if there was a handler
		if (typeof(input.handler) !== 'undefined') {
			// for each element
			for (a = 0, b = elements.length; a < b; a += 1) {
				// run the handler and pass a unique copy of the data (in case it's a model)
				input.handler(elements[a], input.data.create());
			}
		// else assume the function was called for a list of elements
		} else {
			// return the selected elements
			return elements;
		}
	};

	// checks the compatibility of CSS3 transitions for this browser
	transitions.compatibility = function () {
		var eventName, newDiv, empty;
		// create a test div
		newDiv = document.createElement('div');
		// use various tests for transition support
		if (typeof(newDiv.style.MozTransition) !== 'undefined') { eventName = 'transitionend'; }
		try { document.createEvent('OTransitionEvent'); eventName = 'oTransitionEnd'; } catch (e) { empty = null; }
		try { document.createEvent('WebKitTransitionEvent'); eventName = 'webkitTransitionEnd'; } catch (e) { empty = null; }
		try { document.createEvent('transitionEvent'); eventName = 'transitionend'; } catch (e) { empty = null; }
		// remove the test div
		newDiv = empty;
		// pass back working event name
		return eventName;
	};

	// performs a transition between two classnames
	transitions.byClass = function (element, removedClass, addedClass, endEventHandler, jQueryDuration, jQueryEasing) {
		var replaceThis, replaceWith, endEventName, endEventFunction;
		// validate the input
		endEventHandler = endEventHandler || function () {};
		endEventName = transitions.compatibility();
		// turn the classnames into regular expressions
		replaceThis = new RegExp(removedClass.trim().replace(/ {2,}/g, ' ').split(' ').join('|'), 'g');
		replaceWith = new RegExp(addedClass, 'g');
		// if CSS3 transitions are available
		if (typeof endEventName !== 'undefined') {
			// set the onComplete handler and immediately remove it afterwards
			element.addEventListener(endEventName, endEventFunction = function () {
				endEventHandler();
				element.removeEventListener(endEventName, endEventFunction, true);
			}, true);
			// replace the class name
			element.className = (element.className.replace(replaceThis, '') + ' ' + addedClass).replace(/ {2,}/g, ' ').trim();
		// else if jQuery UI is available
		} else if (typeof jQuery !== 'undefined' && typeof jQuery.ui !== 'undefined') {
			// retrieve any extra information for jQuery
			jQueryDuration = jQueryDuration || 500;
			jQueryEasing = jQueryEasing || 'swing';
			// use switchClass from jQuery UI to approximate CSS3 transitions
			jQuery(element).switchClass(removedClass.replace(replaceWith, ''), addedClass, jQueryDuration, jQueryEasing, endEventHandler);
		// if all else fails
		} else {
			// just replace the class name
			element.className = (element.className.replace(replaceThis, '') + ' ' + addedClass).replace(/ {2,}/g, ' ').trim();
			// and call the onComplete handler
			endEventHandler();
		}
	};

	// adds the relevant browser prefix to a style property
	transitions.prefix = function (property) {
		// pick the prefix that goes with the browser
		return (navigator.userAgent.match(/webkit/gi)) ? 'webkit' + property.substr(0, 1).toUpperCase() + property.substr(1):
			(navigator.userAgent.match(/firefox/gi)) ? 'Moz' + property.substr(0, 1).toUpperCase() + property.substr(1):
			(navigator.userAgent.match(/microsoft/gi)) ? 'ms' + property.substr(0, 1).toUpperCase() + property.substr(1):
			(navigator.userAgent.match(/opera/gi)) ? 'O' + property.substr(0, 1).toUpperCase() + property.substr(1):
			property;
	};

	// applies a list of rules
	transitions.byRules = function (element, rules, endEventHandler) {
		var rule, endEventName, endEventFunction;
		// validate the input
		rules.transitionProperty = rules.transitionProperty || 'all';
		rules.transitionDuration = rules.transitionDuration || '300ms';
		rules.transitionTimingFunction = rules.transitionTimingFunction || 'ease';
		endEventHandler = endEventHandler || function () {};
		endEventName = transitions.compatibility();
		// if CSS3 transitions are available
		if (typeof endEventName !== 'undefined') {
			// set the onComplete handler and immediately remove it afterwards
			element.addEventListener(endEventName, endEventFunction = function () {
				endEventHandler();
				element.removeEventListener(endEventName, endEventFunction, true);
			}, true);
			// for all rules
			for (rule in rules) {
				if (rules.hasOwnProperty(rule)) {
					// implement the prefixed value
					element.style[transitions.compatibility(rule)] = rules[rule];
					// implement the value
					element.style[rule] = rules[rule];
				}
			}
		// else if jQuery is available
		} else if (typeof jQuery !== 'undefined') {
			var jQueryEasing, jQueryDuration;
			// pick the equivalent jQuery animation function
			jQueryEasing = (rules.transitionTimingFunction.match(/ease/gi)) ? 'swing' : 'linear';
			jQueryDuration = parseInt(rules.transitionDuration.replace(/s/g, '000').replace(/ms/g, ''), 10);
			// remove rules that will make Internet Explorer complain
			delete rules.transitionProperty;
			delete rules.transitionDuration;
			delete rules.transitionTimingFunction;
			// use animate from jQuery
			jQuery(element).animate(
				rules,
				jQueryDuration,
				jQueryEasing,
				endEventHandler
			);
		// else
		} else {
			// for all rules
			for (rule in rules) {
				if (rules.hasOwnProperty(rule)) {
					// implement the prefixed value
					element.style[transitions.compatibility(rule)] = rules[rule];
					// implement the value
					element.style[rule] = rules[rule];
				}
			}
			// call the onComplete handler
			endEventHandler();
		}
	};

	// public functions
	useful.transitions = useful.transitions || {};
	useful.transitions.select = transitions.select;
	useful.transitions.byClass = transitions.byClass;
	useful.transitions.byRules = transitions.byRules;

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	// a page is in a position on a stack
	// a page knows how to reveal itself based on it attachment to the spine
	// a page has layers of tiles at various zoom levels
	useful.Catalog_Page = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.width = null;
		this.height = null;
		this.left = null;
		this.top = null;
		this.right = null;
		this.bottom = null;
		this.source = null;
		this.preview = null;
		this.index = null;
		this.bound = null;
		// objects
		this.tiles = {};
		this.tilesCount = 0;
		// methods
		this.start = function () {
			// build a container for the page
			this.obj = document.createElement('div');
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
			// add the preview to the page
			this.preview.className = 'cat-preview';
			this.preview.setAttribute('alt', '');
			this.preview.onmousedown = function () { return false; };
			this.obj.appendChild(this.preview);
			// add it to the parent
			this.parent.obj.appendChild(this.obj);
		};
		this.update = function () {
			// generate new tiles
			this.generate();
			// redraw the existing tiles
			this.redraw();
		};
		this.generate = function () {
			var col, row, left, top, right, bottom, width, height, name;
			// get the visible area
			var area = this.parent.area[this.bound];
			// get the available space
			var horizontal = this.obj.offsetWidth,
				vertical = this.obj.offsetHeight;
			// calculate amount of tiles in a column and a row
			var rows = Math.round(vertical / this.parent.parent.cfg.tile),
				cols = Math.round(horizontal / this.parent.parent.cfg.tile);
			// for every row
			for (row = 0; row < rows; row += 1) {
				// calculate the dimensions of this row
				top = row / rows;
				bottom = (row + 1) / rows;
				height = (bottom - top) * vertical;
				// for every column
				for (col = 0; col < cols; col += 1) {
					// calculate the dimensions of this column
					left = col / cols;
					right = (col + 1) / cols;
					width = (right - left) * horizontal;
					// generate the name for this tile
					name = 'tile-' + col + '-' + row + '-' + this.parent.magnification;
					// if this tile is in view but doesn't exist
					if (
						!this.tiles[name] &&
						((left >= area.left  && left <= area.right) || (right >= area.left && right <= area.right)) &&
						((top >= area.top && top <= area.bottom) || (bottom >= area.top && bottom <= area.bottom))
					) {
						// count the new tile
						this.tilesCount = this.parent.tilesCount + 1;
						// generate a new tile with this name and properties
						this.tiles[name] = new useful.Catalog_Tile(this);
						this.tiles[name].left = left;
						this.tiles[name].top = top;
						this.tiles[name].right = right;
						this.tiles[name].bottom = bottom;
						this.tiles[name].width = width;
						this.tiles[name].height = height;
						this.tiles[name].magnification = this.parent.magnification;
						this.tiles[name].index = this.parent.tilesCount;
						this.tiles[name].start();
					}
				}
			}
		};
		this.redraw = function () {
			var name, min = this.parent.tilesCount - this.parent.parent.cfg.cache;
			// for all existing tiles on this page
			for (name in this.tiles) {
				if (this.tiles.hasOwnProperty(name)) {
					// if the tile is fresh
					if (this.tiles[name].index > min) {
						// ask the tile to update
						this.tiles[name].update();
					// else
					} else {
						// remove the tile
						this.obj.removeChild(this.tiles[name].obj);
						delete this.tiles[name];
					}
				}
			}
		};
		this.open = function (direction) {
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-open cat-page-' + direction;
			// update the page
			this.update();
		};
		this.close = function (direction) {
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-close cat-page-' + direction;
		};
		this.stay = function (direction) {
			// allow the object to render
			this.obj.style.display = 'block';
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-stay cat-page-' + direction;
			// update the page
			this.update();
		};
		this.show = function () {
			// allow the object to render
			this.obj.style.display = 'block';
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-open';
			// update the page
			this.update();
		};
		this.hide = function () {
			// if the object is nowhere near the open page, it's safe to stop it from rendering
			this.obj.style.display = (this.index > this.parent.open - 4 && this.index < this.parent.open + 4) ? 'block' : 'none';
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
		};
		// events
	};

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	// a spread contains a front cover, all pages and a rear cover
	// a spread can grow and shift underneath the overflow of viewport
	useful.Catalog_Spread = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.wrapper = null;
		this.horizontal = 0.5;
		this.vertical = 0.5;
		this.magnification = 1;
		this.max = 1.1;
		this.split = 2;
		this.open = 0;
		this.area = [0, 0, 1, 1];
		this.areaEven = [0, 0, 1, 1];
		this.areaOdd = [0, 0, 1, 1];
		this.timeout = null;
		this.tilesCount = 0;
		this.busy = false;
		// objects
		this.pages = [];
		// methods
		this.start = function () {
			// build a container for the pages
			this.obj = document.createElement('div');
			this.obj.className = 'cat-spread cat-split-' + this.split;
			// build a wrapper for the container
			this.wrapper = document.createElement('div');
			this.wrapper.className = 'cat-wrapper';
			// create all the pages
			var assets = this.parent.obj.getElementsByTagName('a');
			for (var a = 0, b = assets.length; a < b; a += 1) {
				this.pages[a] = new useful.Catalog_Page(this);
				this.pages[a].source = assets[a].getAttribute('href');
				this.pages[a].width = parseInt(assets[a].getAttribute('data-width'), 10);
				this.pages[a].height = parseInt(assets[a].getAttribute('data-height'), 10);
				this.pages[a].left = parseFloat(assets[a].getAttribute('data-left') || 0);
				this.pages[a].top = parseFloat(assets[a].getAttribute('data-top') || 0);
				this.pages[a].right = parseFloat(assets[a].getAttribute('data-right') || 1);
				this.pages[a].bottom = parseFloat(assets[a].getAttribute('data-bottom') || 1);
				this.pages[a].preview = assets[a].removeChild(assets[a].getElementsByTagName('img')[0]);
				this.pages[a].bound = (a % this.split === 0) ? 'even' : 'odd';
				this.pages[a].index = a;
				this.pages[a].start();
			}
			// clear the parent
			this.parent.obj.innerHTML = '';
			// add the container to the parent
			this.wrapper.appendChild(this.obj);
			this.parent.obj.appendChild(this.wrapper);
			// keep track of scrolling
			this.parent.obj.addEventListener('scroll', this.onMove(), true);
			// apply the starting settings
			this.zoom(this.magnification);
		};
		this.update = function () {
			// recalculate the visible area
			this.recalc();
			// redraw the pages
			this.redraw();
		};
		this.recalc = function () {
			var overscan = 1 - 1 / this.magnification;
			this.max = this.pages[0].height / this.wrapper.offsetHeight;
			// define the viewable area
			this.area = {};
			this.area.full = this.area.odd = this.area.even = {
				'left' : overscan * this.horizontal,
				'top' : overscan * this.vertical,
				'right' : 1 - overscan * (1 - this.horizontal),
				'bottom' : 1 - overscan * (1 - this.vertical)
			};
			if (this.split === 2) {
				// define the viewable area for the even and odd side
				this.area.odd = {
					'left' : this.area.full.left * 2,
					'top' : this.area.full.top,
					'right' : this.area.full.right * 2,
					'bottom' : this.area.full.bottom
				};
				this.area.even = {
					'left' : this.area.odd.left - 1,
					'top' : this.area.odd.top,
					'right' : this.area.odd.right - 1,
					'bottom' : this.area.odd.bottom
				};
			}
		};
		this.redraw = function () {
			var even = this.open + this.open % this.split,
				odd = even - 1;
			// for all the pages of this spread
			for (var a = 0, b = this.pages.length; a < b; a += 1) {
				// if the page is open
				if (a === even || a === odd) {
					// show the page
					this.pages[a].show();
				// else
				} else {
					// hide the page
					this.pages[a].hide();
				}
			}
		};
		this.next = function () {
			var oldEven = this.open + this.open % this.split,
				oldOdd = oldEven - 1,
				newEven = oldEven + this.split,
				newOdd = oldOdd + this.split,
				pagesLength = this.pages.length;
			// for all the pages of this spread
			for (var a = 0, b = pagesLength; a < b; a += 1) {
				// if these are not the active pages
				if (a < oldOdd || a > oldEven) {
					// hide the page
					this.pages[a].hide();
				}
			}
			// update the odd pages
			if (oldOdd >= 0 && oldOdd < pagesLength && this.pages[oldOdd].bound === 'odd') { this.pages[oldOdd].stay('increasing'); }
			if (newOdd >= 0 && newOdd < pagesLength && this.pages[newOdd].bound === 'odd') { this.pages[newOdd].open('increasing'); }
			// update the even pages
			if (oldEven >= 0 && oldEven < pagesLength) { this.pages[oldEven].close('increasing'); }
			if (newEven >= 0 && newEven < pagesLength) { this.pages[newEven].stay('increasing'); }
			// store the new page number
			this.open = (newEven < pagesLength) ? newEven : pagesLength;
		};
		this.previous = function () {
			var oldEven = this.open + this.open % this.split,
				oldOdd = oldEven - 1,
				newEven = oldEven - this.split,
				newOdd = oldOdd - this.split,
				pagesLength = this.pages.length;
			// for all the pages of this spread
			for (var a = 0, b = pagesLength; a < b; a += 1) {
				// if these are not the active pages
				if (a < oldOdd || a > oldEven) {
					// hide the page
					this.pages[a].hide();
				}
			}
			// update the odd pages
			if (oldOdd >= 0 && oldOdd < pagesLength && this.pages[oldOdd].bound === 'odd') { this.pages[oldOdd].close('decreasing'); }
			if (newOdd >= 0 && newOdd < pagesLength && this.pages[newOdd].bound === 'odd') { this.pages[newOdd].stay('decreasing'); }
			// update the even pages
			if (oldEven >= 0 && oldEven < pagesLength) { this.pages[oldEven].stay('decreasing'); }
			if (newEven >= 0 && newEven < pagesLength) { this.pages[newEven].open('decreasing'); }
			// store the new page number
			this.open = (newEven >= 0) ? newEven : 0;
		};
		this.zoom = function (magnification) {
			// apply the zoom factor
			this.obj.style.width = (magnification * 100) + '%';
			this.obj.style.height = (magnification * 100) + '%';
			// store the magnification
			this.magnification = magnification;
			// re-adjust the position
			this.move();
		};
		this.move = function (horizontal, vertical) {
			var context = this;
			// default positions
			horizontal = horizontal || this.horizontal;
			vertical = vertical || this.vertical;
			// set the position of the spread
			this.wrapper.scrollLeft = horizontal * (this.obj.offsetWidth - this.parent.obj.offsetWidth);
			this.wrapper.scrollTop = vertical * (this.obj.offsetHeight - this.parent.obj.offsetHeight);
			// store the position
			this.horizontal = horizontal;
			this.vertical = vertical;
			// ask the spread to update
			clearTimeout(this.afterMove);
			this.afterMove = setTimeout(function () {
				context.parent.update();
			}, context.parent.cfg.duration);
		};
		// events
		this.onMove = function () {
			var context = this;
			return function () {
				// limit the redraw frequency
				clearTimeout(context.timeout);
				context.timeout = setTimeout(function () {
					// note the new position
					var horizontal = context.wrapper.scrollLeft / (context.obj.offsetWidth - context.wrapper.offsetWidth),
						vertical = context.wrapper.scrollTop / (context.obj.offsetHeight - context.wrapper.offsetHeight);
					// validate and store the new position
					context.horizontal = (isNaN(horizontal)) ? 0.5 : horizontal;
					context.vertical = (isNaN(vertical)) ? 0.5 : vertical;
					// ask the spread to update
					context.update();
				}, context.parent.cfg.delay);
			};
		};
	};

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	// a tile is part of the page positioned using fractional coordinates that correspond to the cropping
	// only tiles at the current or lower zoom levels are visible
	// only tiles within the viewport are visible
	useful.Catalog_Tile = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.img = null;
		this.left = null;
		this.top = null;
		this.right = null;
		this.bottom = null;
		this.width = null;
		this.height = null;
		this.magnification = null;
		this.index = null;
		// methods
		this.start = function () {
			// construct the tile
			this.obj = document.createElement('div');
			this.obj.className = 'cat-tile';
			this.obj.style.left = (this.left * 100) + '%';
			this.obj.style.top = (this.top * 100) + '%';
			this.obj.style.right = (100 - this.right * 100) + '%';
			this.obj.style.bottom = (100 - this.bottom * 100) + '%';
			this.obj.style.zIndex = Math.round(this.magnification * 100);
			// add the image
			this.img = document.createElement('img');
			this.img.style.visibility = 'hidden';
			this.img.onload = this.onLoaded();
			this.img.src = this.parent.parent.parent.cfg.imageslice
				.replace(/{src}/g, this.parent.source)
				.replace(/{width}/g, Math.round(this.width))
				.replace(/{height}/g, Math.round(this.height))
				.replace(/{left}/g, this.left)
				.replace(/{top}/g, this.top)
				.replace(/{right}/g, this.right)
				.replace(/{bottom}/g, this.bottom);
			this.obj.onmousedown = function () { return false; };
			this.obj.appendChild(this.img);
			// add the tile to the page
			this.parent.obj.appendChild(this.obj);
		};
		this.update = function () {
			var area = this.parent.parent.area[this.parent.bound],
				magnification = this.parent.parent.magnification;
			// if this tile is at or below the current magnification and inside the visible area
			this.obj.style.display = (
				(this.magnification <= magnification) &&
				((this.left >= area.left  && this.left <= area.right) || (this.right >= area.left && this.right <= area.right)) &&
				((this.top >= area.top && this.top <= area.bottom) || (this.bottom >= area.top && this.bottom <= area.bottom))
			) ? 'block': 'none';
		};
		// events
		this.onLoaded = function () {
			var context = this;
			return function () { context.img.style.visibility = 'visible'; };
		};
	};

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	// provides user interface elements
	useful.Catalog_Toolbar = function (parent) {
		// properties
		this.parent = parent;
		this.menu = null;
		this.elements = {};
		// methods
		this.start = function () {
			// build the navigation elements
			this.menu = document.createElement('menu');
			this.menu.className = 'cat-toolbar';
			// add the page number to the toolbar
			this.addPageNumber();
			// add the page controls to the toolbar
			this.addPageControls();
			// add the zoom controls to the toolbar
			this.addZoomControls();
			// add the menu to the parent element
			this.parent.obj.appendChild(this.menu);
		};
		this.update = function () {
			// get the spread object
			var spread = this.parent.spread;
			// update the page number
			this.elements.pageNumberInput.value = (spread.open < spread.pages.length) ? spread.open + 1 : spread.pages.length;
			this.elements.pageNumberTotal.innerHTML = spread.pages.length;
			// update the page controls
			this.elements.nextButton.className = (spread.open < spread.pages.length - 1) ? 'cat-page-next': 'cat-page-next disabled';
			this.elements.prevButton.className = (spread.open > 0) ? 'cat-page-prev': 'cat-page-prev disabled';
			// update the zoom controls
			this.elements.zoomInButton.className = (spread.magnification < spread.max) ? 'cat-zoom-in': 'cat-zoom-in disabled';
			this.elements.zoomOutButton.className = (spread.magnification > 1) ? 'cat-zoom-out': 'cat-zoom-out disabled';
		};
		this.addPageNumber = function () {
			// add a container for the page number controls
			this.elements.pageNumber = document.createElement('div');
			this.elements.pageNumber.className = 'cat-pagenumber';
			// add the page number input field
			this.elements.pageNumberInput = document.createElement('input');
			this.elements.pageNumberInput.className = 'cat-pagenumber-input';
			this.elements.pageNumberInput.setAttribute('type', 'number');
			this.elements.pageNumberInput.setAttribute('name', 'cat-page');
			this.elements.pageNumberInput.addEventListener('change', this.onNumberChange(this.elements.pageNumberInput));
			this.elements.pageNumber.appendChild(this.elements.pageNumberInput);
			// add the total number of pages
			this.elements.pageNumberTotal = document.createElement('span');
			this.elements.pageNumberTotal.className = 'cat-pagenumber-total';
			this.elements.pageNumber.appendChild(this.elements.pageNumberTotal);
			// add the container to the toolbar
			this.menu.appendChild(this.elements.pageNumber);
		};
		this.addPageControls = function () {
			// add the "previous page" button
			this.elements.nextButton = document.createElement('button');
			this.elements.nextButton.className = 'cat-page-next';
			this.elements.nextButton.setAttribute('type', 'button');
			this.elements.nextButton.innerHTML = 'Next page';
			this.elements.nextButton.addEventListener('mousedown', this.onNextPage());
			this.elements.nextButton.addEventListener('touchstart', this.onNextPage());
			this.menu.appendChild(this.elements.nextButton);
			// add the "next page" button
			this.elements.prevButton = document.createElement('button');
			this.elements.prevButton.className = 'cat-page-prev';
			this.elements.prevButton.setAttribute('type', 'button');
			this.elements.prevButton.innerHTML = 'Previous page';
			this.elements.prevButton.addEventListener('mousedown', this.onPrevPage());
			this.elements.prevButton.addEventListener('touchstart', this.onPrevPage());
			this.menu.appendChild(this.elements.prevButton);
		};
		this.addZoomControls = function () {
			// add the "zoom in" button
			this.elements.zoomInButton = document.createElement('button');
			this.elements.zoomInButton.className = 'cat-zoom-in';
			this.elements.zoomInButton.setAttribute('type', 'button');
			this.elements.zoomInButton.innerHTML = 'Zoom in';
			this.elements.zoomInButton.addEventListener('mousedown', this.onZoomIn());
			this.elements.zoomInButton.addEventListener('mouseup', this.onZoomInEnd());
			this.elements.zoomInButton.addEventListener('touchstart', this.onZoomIn());
			this.elements.zoomInButton.addEventListener('touchend', this.onZoomInEnd());
			this.menu.appendChild(this.elements.zoomInButton);
			// add the "zoom out" button
			this.elements.zoomOutButton = document.createElement('button');
			this.elements.zoomOutButton.className = 'cat-zoom-out';
			this.elements.zoomOutButton.setAttribute('type', 'button');
			this.elements.zoomOutButton.innerHTML = 'Zoom out';
			this.elements.zoomOutButton.addEventListener('mousedown', this.onZoomOut());
			this.elements.zoomOutButton.addEventListener('mouseup', this.onZoomOutEnd());
			this.elements.zoomOutButton.addEventListener('touchstart', this.onZoomOut());
			this.elements.zoomOutButton.addEventListener('touchend', this.onZoomOutEnd());
			this.menu.appendChild(this.elements.zoomOutButton);
		};
		// events
		this.onNumberChange = function (input) {
			var context = this;
			return function () {
				// if the input is a number
				var number = parseInt(input.value, 10);
				if (isNaN(number)) {
					// redraw the elements
					context.update();
				// else
				} else {
					// change the page count
					context.parent.pageTo(number - 1);
				}
			};
		};
		this.onNextPage = function () {
			var context = this;
			return function (event) {
				// increase the page count
				context.parent.pageBy(1);
				// cancel the click
				event.preventDefault();
			};
		};
		this.onPrevPage = function () {
			var context = this;
			return function (event) {
				// increase the page count
				context.parent.pageBy(-1);
				// cancel the click
				event.preventDefault();
			};
		};
		this.onZoomIn = function () {
			var context = this;
			return function (event) {
				// repeat the action (faster than the redraw delay)
				context.zoomInRepeat = setInterval(function () {
					// increase the zoom factor
					context.parent.zoomBy(1.1);
				}, Math.round(context.parent.cfg.delay * 0.75));
				// cancel the click
				event.preventDefault();
			};
		};
		this.onZoomInEnd = function () {
			var context = this;
			return function (event) {
				// cancel the repeat
				clearInterval(context.zoomInRepeat);
				// cancel the click
				event.preventDefault();
			};
		};
		this.onZoomOut = function () {
			var context = this;
			return function (event) {
				// repeat the action (faster than the redraw delay)
				context.zoomOutRepeat = setInterval(function () {
					// decrease the zoom factor
					context.parent.zoomBy(0.9);
				}, Math.round(context.parent.cfg.delay * 0.75));
				// cancel the click
				event.preventDefault();
			};
		};
		this.onZoomOutEnd = function () {
			var context = this;
			return function (event) {
				// cancel the repeat
				clearInterval(context.zoomOutRepeat);
				// cancel the click
				event.preventDefault();
			};
		};
	};

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	// provides touch controls
	useful.Catalog_Touch = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.hasTouch = (('ontouchstart' in window) || ('msmaxtouchpoints' in navigator)); //|| ('onmsgesturechange' in window));
		// methods
		this.start = function () {
			// start touch controls
			this.gestures = new useful.Gestures(this.parent.obj, {
				'threshold' : 100,
				'increment' : 0.1,
				'swipeLeft' : this.onSwipeLeft(),
				'swipeRight' : this.onSwipeRight(),
				'drag' : (!this.hasTouch) ? this.onDrag() : function () {},
				'pinch' : this.onPinch()
			});
			// TODO: double tap for zoom in / out
		};
		this.update = function () {
			// if touch is available
			if (this.hasTouch && this.parent.spread.magnification > 1) {
				this.gestures.enableDefaultTouch();
			} else {
				this.gestures.disableDefaultTouch();
			}
		};
		// events
		this.onSwipeLeft = function () {
			var context = this;
			return function () {
				// if the zoom is 1, turn to the previous page
				if (context.parent.spread.magnification === 1) {
					context.parent.pageBy(1);
				}
			};
		};
		this.onSwipeRight = function () {
			var context = this;
			return function () {
				// if the zoom is 1, turn to the next page
				if (context.parent.spread.magnification === 1) {
					context.parent.pageBy(-1);
				}
			};
		};
		this.onDrag = function () {
			var context = this;
			return function (metrics) {
				// handle click and drag scrolling for mice
				context.parent.moveBy(metrics.horizontal, metrics.vertical);
			};
		};
		this.onPinch = function () {
			var context = this;
			return function (metrics) {
				// zoom in or out
				context.parent.zoomBy(1 + metrics.scale);
			};
		};
	};

}(window.useful = window.useful || {}));

/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

(function (useful) {

	"use strict";

	useful.Catalog = function (obj, cfg) {
		// properties
		this.obj = obj;
		this.cfg = cfg;
		this.aspect = null;
		this.timeout = null;
		// objects
		this.toolbar = null;
		this.touch = null;
		this.spread = null;
		// methods
		this.start = function () {
			var reference = this.obj.getElementsByTagName('a')[0];
			// add the loading the indicator
			this.obj.className += ' cat-busy';
			// adjust to the aspect ratio the first image
			this.aspect = parseInt(reference.getAttribute('data-height'), 10) / parseInt(reference.getAttribute('data-width'), 10) / this.cfg.split;
			this.obj.style.height = (this.obj.offsetWidth * this.aspect) + 'px';
			// build the spread object
			this.spread = new useful.Catalog_Spread(this);
			this.spread.split = this.cfg.split;
			this.spread.open = this.cfg.open;
			this.spread.start();
			// build the toolbar object
			this.toolbar = new useful.Catalog_Toolbar(this);
			this.toolbar.start();
			// start the touch controls
			this.touch = new useful.Catalog_Touch(this);
			this.touch.start();
			// restore the aspect ratio after resizes
			window.addEventListener('resize', this.onResized(), true);
			// apply the custom styling
			window.addEventListener('load', this.onLoaded(), true);
			// disable the start function so it can't be started twice
			this.start = function () {};
		};
		this.styling = function () {
			// create a custom stylesheet
			var style = document.createElement("style");
			var isWebkit = new RegExp('webkit', 'gi');
			var isMsie8 = new RegExp('msie 8', 'gi');
			if (isWebkit.test(navigator.UserAgent)) { style.appendChild(document.createTextNode("")); }
			document.body.appendChild(style);
			var sheet = style.sheet || style.styleSheet;
			// add the custom styles
			if (sheet.insertRule) {
				sheet.insertRule(".catalog-browser button {background-color : " + this.cfg.colorPassive + " !important;}", 0);
				sheet.insertRule(".catalog-browser button:hover {background-color : " + this.cfg.colorHover + " !important;}", 0);
				sheet.insertRule(".catalog-browser button.disabled {background-color : " + this.cfg.colorDisabled + " !important;}", 0);
			} else {
				sheet.addRule(".catalog-browser button", "background-color : " + this.cfg.colorPassive + " !important;", 0);
				sheet.addRule(".catalog-browser button:hover", "background-color : " + this.cfg.colorHover + " !important;", 0);
				sheet.addRule(".catalog-browser button.disabled", "background-color : " + this.cfg.colorDisabled + " !important;", 0);
				if (isMsie8.test(navigator.userAgent)) {
					sheet.addRule(".catalog-browser .cat-page", "display : none;", 0);
					sheet.addRule(".catalog-browser .cat-page-open", "display : block !important;", 0);
					sheet.addRule(".catalog-browser .cat-page-close", "display : none !important;", 0);
					sheet.addRule(".catalog-browser .cat-page-stay", "display : block !important;", 0);
				}
			}
		};
		this.update = function () {
			// redraw the toolbar
			this.toolbar.update();
			// reset the touch controls
			this.touch.update();
			// redraw the spread
			this.spread.update();
		};
		// events
		this.onResized = function () {
			var context = this;
			return function () {
				// limit the redraw frequency
				clearTimeout(context.timeout);
				context.timeout = setTimeout(function () {
					// adjust to the aspect ratio
					context.obj.style.height = (context.obj.offsetWidth * context.aspect) + 'px';
				}, context.cfg.delay);
			};
		};
		this.onLoaded = function () {
			var context = this;
			return function () {
				// apply the styling
				context.styling();
				// remove the loading indicator
				context.obj.className = context.obj.className.replace(/ cat-busy/g, '');
			};
		};
		// API calls
		this.zoomBy = function (factor) {
			// calculate the new factor
			var newFactor = this.spread.magnification * factor;
			// zoom to the new factor
			this.zoomTo(newFactor);
		};
		this.zoomTo = function (factor) {
			// validate the limits
			if (factor < 1) { factor = 1; }
			if (factor > this.spread.max) { factor = this.spread.max; }
			// zoom the spread
			this.spread.zoom(factor);
		};
		this.moveBy = function (horizontal, vertical) {
			// if we were given pixels convert to fraction first
			horizontal = (horizontal % 1 === 0) ? horizontal / this.spread.obj.offsetWidth * this.cfg.split : horizontal;
			vertical = (vertical % 1 === 0) ? vertical / this.spread.obj.offsetHeight : vertical;
			// apply the movement
			var newHorizontal = this.spread.horizontal - horizontal,
				newVertical = this.spread.vertical - vertical;
			// move to the new position
			this.moveTo(newHorizontal, newVertical);
		};
		this.moveTo = function (horizontal, vertical) {
			// validate the limits
			if (horizontal < 0) { horizontal = 0; }
			if (horizontal > 1) { horizontal = 1; }
			if (vertical < 0) { vertical = 0; }
			if (vertical > 1) { vertical = 1; }
			// move the spread
			this.spread.move(horizontal, vertical);
		};
		this.pageBy = function (increment) {
			// determine how much to increase the page number
			switch (increment) {
			// this is the next page
			case 1 :
				this.spread.next();
				break;
			// this is the previous page
			case -1 :
				this.spread.previous();
				break;
			// jump directly to any page
			default :
				this.pageTo(this.spread.open + increment);
			}
			// update the toolbar
			this.toolbar.update();
		};
		this.pageTo = function (number) {
			// get the highest page number
			var maxNumber = this.spread.pages.length;
			// validate the page number
			if (number < 0) { number = 0; }
			if (number > maxNumber) { number = maxNumber; }
			// display the page
			this.spread.open = number + number % this.spread.split;
			this.spread.zoom(1);
		};
		// go
		this.start();
	};

}(window.useful = window.useful || {}));
