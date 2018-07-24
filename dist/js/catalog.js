/*
	Source:
	van Creij, Maurice (2018). "gestures.js: A library of useful functions to ease working with touch and gestures.", http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// extend the constructor
var Gestures = function (config) {

	// PROPERTIES

	// METHODS

	this.only = function (config) {
		// start an instance of the script
		return new this.Main(config, this);
	};

	this.each = function (config) {
		var _config, _context = this, instances = [];
		// for all element
		for (var a = 0, b = config.elements.length; a < b; a += 1) {
			// clone the configuration
			_config = Object.create(config);
			// insert the current element
			_config.element = config.elements[a];
			// delete the list of elements from the clone
			delete _config.elements;
			// start a new instance of the object
			instances[a] = new this.Main(_config, _context);
		}
		// return the instances
		return instances;
	};

	// START

	return (config.elements) ? this.each(config) : this.only(config);

};

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = Gestures;
}

// extend the class
Gestures.prototype.Main = function (config, context) {

	// PROPERTIES

	this.config = config;
	this.context = context;
	this.element = config.element;
	this.paused = false;

	// METHODS

	this.init = function () {
		// check the configuration properties
		this.config = this.checkConfig(config);
		// add the single touch events
		if (config.allowSingle) { this.single = new this.context.Single(this); }
		// add the multi touch events
		if (config.allowMulti) { this.multi = new this.context.Multi(this); }
	};

	this.checkConfig = function (config) {
		// add default values for missing ones
		config.threshold = config.threshold || 50;
		config.increment = config.increment || 0.1;
		// cancel all events by default
		if (config.cancelTouch === undefined || config.cancelTouch === null) { config.cancelTouch = true; }
		if (config.cancelGesture === undefined || config.cancelGesture === null) { config.cancelGesture = true; }
		// add dummy event handlers for missing ones
		if (config.swipeUp || config.swipeLeft || config.swipeRight || config.swipeDown || config.drag || config.doubleTap) {
			config.allowSingle = true;
			config.swipeUp = config.swipeUp || function () {};
			config.swipeLeft = config.swipeLeft || function () {};
			config.swipeRight = config.swipeRight || function () {};
			config.swipeDown = config.swipeDown || function () {};
			config.drag = config.drag || function () {};
			config.doubleTap = config.doubleTap || function () {};
		}
		// if there's pinch there's also twist
		if (config.pinch || config.twist) {
			config.allowMulti = true;
			config.pinch = config.pinch || function () {};
			config.twist = config.twist || function () {};
		}
		// return the fixed config
		return config;
	};

	this.readEvent = function (event) {
		var coords = {}, offsets;
		// try all likely methods of storing coordinates in an event
		if (event.touches && event.touches[0]) {
			coords.x = event.touches[0].pageX;
			coords.y = event.touches[0].pageY;
		} else if (event.pageX !== undefined) {
			coords.x = event.pageX;
			coords.y = event.pageY;
		} else {
			coords.x = event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
			coords.y = event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
		}
		return coords;
	};

	this.correctOffset = function (element) {
		var offsetX = 0, offsetY = 0;
		// if there is an offset
		if (element.offsetParent) {
			// follow the offsets back to the right parent element
			while (element !== this.element) {
				offsetX += element.offsetLeft;
				offsetY += element.offsetTop;
				element = element.offsetParent;
			}
		}
		// return the offsets
		return { 'x' : offsetX, 'y' : offsetY };
	};

	// EXTERNAL

	this.enableDefaultTouch = function () {
		this.config.cancelTouch = false;
	};

	this.disableDefaultTouch = function () {
		this.config.cancelTouch = true;
	};

	this.enableDefaultGesture = function () {
		this.config.cancelGesture = false;
	};

	this.disableDefaultGesture = function () {
		this.config.cancelGesture = true;
	};

	// EVENTS

	this.init();

};

// extend the class
Gestures.prototype.Multi = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.element = parent.config.element;
	this.gestureOrigin = null;
	this.gestureProgression = null;

	// METHODS

	this.init = function () {
		// set the required events for mouse
		this.element.addEventListener('mousewheel', this.onChangeWheel());
		if (navigator.userAgent.match(/firefox/gi)) { this.element.addEventListener('DOMMouseScroll', this.onChangeWheel()); }
		// set the required events for gestures
		if ('ongesturestart' in window) {
			this.element.addEventListener('gesturestart', this.onStartGesture());
			this.element.addEventListener('gesturechange', this.onChangeGesture());
			this.element.addEventListener('gestureend', this.onEndGesture());
		} else if ('msgesturestart' in window) {
			this.element.addEventListener('msgesturestart', this.onStartGesture());
			this.element.addEventListener('msgesturechange', this.onChangeGesture());
			this.element.addEventListener('msgestureend', this.onEndGesture());
		} else {
			this.element.addEventListener('touchstart', this.onStartFallback());
			this.element.addEventListener('touchmove', this.onChangeFallback());
			this.element.addEventListener('touchend', this.onEndFallback());
		}
	};

	this.cancelGesture = function (event) {
		if (this.config.cancelGesture) {
			event = event || window.event;
			event.preventDefault();
		}
	};

	this.startGesture = function (event) {
		// if the functionality wasn't paused
		if (!this.parent.paused) {
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
		}
	};

	this.changeGesture = function (event) {
		// if there is an origin
		if (this.gestureOrigin) {
			// get the distances from the event
			var scale = event.scale,
				rotation = event.rotation;
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// get the gesture parameters
			this.config.pinch({
				'x' : coords.x,
				'y' : coords.y,
				'scale' : scale - this.gestureProgression.scale,
				'event' : event,
				'target' : this.gestureOrigin.target
			});
			this.config.twist({
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

	// FALLBACK

	this.startFallback = function (event) {
		// if the functionality wasn't paused
		if (!this.parent.paused && event.touches.length === 2) {
			// note the start position
			this.gestureOrigin = {
				'touches' : [
					{ 'pageX' : event.touches[0].pageX, 'pageY' : event.touches[0].pageY },
					{ 'pageX' : event.touches[1].pageX, 'pageY' : event.touches[1].pageY }
				],
				'target' : event.target || event.srcElement
			};
			this.gestureProgression = {
				'touches' : this.gestureOrigin.touches
			};
		}
	};

	this.changeFallback = function (event) {
		// if there is an origin
		if (this.gestureOrigin && event.touches.length === 2) {
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// calculate the scale factor
			var scale = 0, progression = this.gestureProgression;
			scale += (event.touches[0].pageX - event.touches[1].pageX) / (progression.touches[0].pageX - progression.touches[1].pageX);
			scale += (event.touches[0].pageY - event.touches[1].pageY) / (progression.touches[0].pageY - progression.touches[1].pageY);
			scale = scale - 2;
			// get the gesture parameters
			this.config.pinch({
				'x' : coords.x,
				'y' : coords.y,
				'scale' : scale,
				'event' : event,
				'target' : this.gestureOrigin.target
			});
			// update the current position
			this.gestureProgression = {
				'touches' : [
					{ 'pageX' : event.touches[0].pageX, 'pageY' : event.touches[0].pageY },
					{ 'pageX' : event.touches[1].pageX, 'pageY' : event.touches[1].pageY }
				]
			};
		}
	};

	this.endFallback = function () {
		// note the start position
		this.gestureOrigin = null;
	};

	this.changeWheel = function (event) {
		// measure the wheel distance
		var scale = 1, distance = ((window.event) ? window.event.wheelDelta / 120 : -event.detail / 3);
		// get the coordinates from the event
		var coords = this.parent.readEvent(event);
		// equate wheeling up / down to zooming in / out
		scale = (distance > 0) ? +this.config.increment : scale = -this.config.increment;
		// report the zoom
		this.config.pinch({
			'x' : coords.x,
			'y' : coords.y,
			'scale' : scale,
			'event' : event,
			'source' : event.target || event.srcElement
		});
	};

	// GESTURE EVENTS

	this.onStartGesture = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.startGesture(event);
			_this.changeGesture(event);
		};
	};

	this.onChangeGesture = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.changeGesture(event);
		};
	};

	this.onEndGesture = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// handle the event
			_this.endGesture(event);
		};
	};

	// FALLBACK EVENTS

	this.onStartFallback = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			//_this.cancelGesture(event);
			// handle the event
			_this.startFallback(event);
			_this.changeFallback(event);
		};
	};

	this.onChangeFallback = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.changeFallback(event);
		};
	};

	this.onEndFallback = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// handle the event
			_this.endGesture(event);
		};
	};

	// MOUSE EVENTS

	this.onChangeWheel = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// optionally cancel the default behaviour
			_this.cancelGesture(event);
			// handle the event
			_this.changeWheel(event);
		};
	};

	// EVENTS

	this.init();

};

// extend the class
Gestures.prototype.Single = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.element = parent.config.element;
	this.lastTouch = null;
	this.touchOrigin = null;
	this.touchProgression = null;

	// METHODS

	this.init = function () {
		// set the required events for mouse
		this.element.addEventListener('mousedown', this.onStartTouch());
		this.element.addEventListener('mousemove', this.onChangeTouch());
		document.body.addEventListener('mouseup', this.onEndTouch());
		// set the required events for touch
		this.element.addEventListener('touchstart', this.onStartTouch());
		this.element.addEventListener('touchmove', this.onChangeTouch());
		document.body.addEventListener('touchend', this.onEndTouch());
		this.element.addEventListener('mspointerdown', this.onStartTouch());
		this.element.addEventListener('mspointermove', this.onChangeTouch());
		document.body.addEventListener('mspointerup', this.onEndTouch());
	};

	this.cancelTouch = function (event) {
		if (this.config.cancelTouch) {
			event = event || window.event;
			event.preventDefault();
		}
	};

	this.startTouch = function (event) {
		// if the functionality wasn't paused
		if (!this.parent.paused) {
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
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
		}
	};

	this.changeTouch = function (event) {
		// if there is an origin
		if (this.touchOrigin) {
			// get the coordinates from the event
			var coords = this.parent.readEvent(event);
			// get the gesture parameters
			this.config.drag({
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
			// if there was very little movement, but this is the second touch in quick successionif (
			if (
				this.lastTouch &&
				Math.abs(this.touchOrigin.x - this.lastTouch.x) < 10 &&
				Math.abs(this.touchOrigin.y - this.lastTouch.y) < 10 &&
				new Date().getTime() - this.lastTouch.time < 500 &&
				new Date().getTime() - this.lastTouch.time > 100
			) {
				// treat this as a double tap
				this.config.doubleTap({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'event' : event, 'source' : this.touchOrigin.target});
			// if the horizontal motion was the largest
			} else if (Math.abs(distance.x) > Math.abs(distance.y)) {
				// if there was a right swipe
				if (distance.x > this.config.threshold) {
					// report the associated swipe
					this.config.swipeRight({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.x, 'event' : event, 'source' : this.touchOrigin.target});
				// else if there was a left swipe
				} else if (distance.x < -this.config.threshold) {
					// report the associated swipe
					this.config.swipeLeft({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.x, 'event' : event, 'source' : this.touchOrigin.target});
				}
			// else
			} else {
				// if there was a down swipe
				if (distance.y > this.config.threshold) {
					// report the associated swipe
					this.config.swipeDown({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : distance.y, 'event' : event, 'source' : this.touchOrigin.target});
				// else if there was an up swipe
				} else if (distance.y < -this.config.threshold) {
					// report the associated swipe
					this.config.swipeUp({'x' : this.touchOrigin.x, 'y' : this.touchOrigin.y, 'distance' : -distance.y, 'event' : event, 'source' : this.touchOrigin.target});
				}
			}
			// store the history of this touch
			this.lastTouch = {
				'x' : this.touchOrigin.x,
				'y' : this.touchOrigin.y,
				'time' : new Date().getTime()
			};
		}
		// clear the input
		this.touchProgression = null;
		this.touchOrigin = null;
	};

	// TOUCH EVENTS

	this.onStartTouch = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// handle the event
			_this.startTouch(event);
			_this.changeTouch(event);
		};
	};

	this.onChangeTouch = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// optionally cancel the default behaviour
			_this.cancelTouch(event);
			// handle the event
			_this.changeTouch(event);
		};
	};

	this.onEndTouch = function () {
		// store the _this
		var _this = this;
		// return and event handler
		return function (event) {
			// get event elementect
			event = event || window.event;
			// handle the event
			_this.endTouch(event);
		};
	};

	// EVENTS

	this.init();

};

/*
	Source:
	van Creij, Maurice (2018). "catalog.js: Scanned Print Media Viewer", http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// establish the class
var Catalog = function (config) {

	this.only = function (config) {
		// start an instance of the script
		return new this.Main(config, this);
	};

	this.each = function (config) {
		var _config, _context = this, instances = [];
		// for all element
		for (var a = 0, b = config.elements.length; a < b; a += 1) {
			// clone the configuration
			_config = Object.create(config);
			// insert the current element
			_config.element = config.elements[a];
			// start a new instance of the object
			instances[a] = new this.Main(_config, _context);
		}
		// return the instances
		return instances;
	};

	return (config.elements) ? this.each(config) : this.only(config);

};

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = Catalog;
}

// extend the class
Catalog.prototype.Main = function (config, context) {

	// PROPERTIES

	this.config = config;
	this.context = context;
	this.element = config.element;
	this.aspect = null;
	this.timeout = null;

	// OBJECTS

	this.toolbar = null;
	this.touch = null;
	this.spread = null;

	// METHODS

	this.init = function () {
		var reference = this.element.getElementsByTagName('a')[0];
		// add the loading the indicator
		this.element.className += ' cat-busy';
		// adjust to the aspect ratio the first image
		this.aspect = parseInt(reference.getAttribute('data-height'), 10) / parseInt(reference.getAttribute('data-width'), 10) / this.config.split;
		this.element.style.height = (this.element.offsetWidth * this.aspect) + 'px';
		// build the spread elementect
		this.spread = new context.Spread(this);
		this.spread.split = this.config.split;
		this.spread.open = this.config.open;
		this.spread.start();
		// build the toolbar elementect
		this.toolbar = new context.Toolbar(this);
		// start the touch controls
		this.touch = new context.Touch(this);
		// restore the aspect ratio after resizes
		window.addEventListener('resize', this.onResized(), true);
		// apply the custom styling
		window.addEventListener('load', this.onLoaded(), true);
		// return the object
		return this;
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
			sheet.insertRule(".catalog-browser button {background-color : " + this.config.colorPassive + " !important;}", 0);
			sheet.insertRule(".catalog-browser button:hover {background-color : " + this.config.colorHover + " !important;}", 0);
			sheet.insertRule(".catalog-browser button.disabled {background-color : " + this.config.colorDisabled + " !important;}", 0);
		} else {
			sheet.addRule(".catalog-browser button", "background-color : " + this.config.colorPassive + " !important;", 0);
			sheet.addRule(".catalog-browser button:hover", "background-color : " + this.config.colorHover + " !important;", 0);
			sheet.addRule(".catalog-browser button.disabled", "background-color : " + this.config.colorDisabled + " !important;", 0);
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
		horizontal = (horizontal % 1 === 0) ? horizontal / this.spread.element.offsetWidth * this.config.split : horizontal;
		vertical = (vertical % 1 === 0) ? vertical / this.spread.element.offsetHeight : vertical;
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

	// EVENTS

	this.onResized = function () {
		var context = this;
		return function () {
			// limit the redraw frequency
			clearTimeout(context.timeout);
			context.timeout = setTimeout(function () {
				// adjust to the aspect ratio
				context.element.style.height = (context.element.offsetWidth * context.aspect) + 'px';
			}, context.config.delay);
		};
	};

	this.onLoaded = function () {
		var context = this;
		return function () {
			// apply the styling
			context.styling();
			// remove the loading indicator
			context.element.className = context.element.className.replace(/ cat-busy/g, '');
		};
	};

	// PUBLIC

	context.zoomBy = this.zoomBy.bind(this);
	context.zoomTo = this.zoomTo.bind(this);
	context.moveBy = this.moveBy.bind(this);
	context.moveTo = this.moveTo.bind(this);
	context.pageBy = this.pageBy.bind(this);
	context.pageTo = this.pageTo.bind(this);

	// EXECUTE

	this.init();

};

// extend the class
Catalog.prototype.Page = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.element = null;
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

	// OBJECTS

	this.tiles = {};
	this.tilesCount = 0;

	// METHODS

	this.start = function () {
		// build a container for the page
		this.element = document.createElement('div');
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
		// add the preview to the page
		this.preview.className = 'cat-preview';
		this.preview.setAttribute('alt', '');
		this.preview.onmousedown = function () { return false; };
		this.element.appendChild(this.preview);
		// add it to the parent
		this.parent.element.appendChild(this.element);
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
		var horizontal = this.element.offsetWidth,
			vertical = this.element.offsetHeight;
		// calculate amount of tiles in a column and a row
		var rows = Math.round(vertical / this.parent.parent.config.tile),
			cols = Math.round(horizontal / this.parent.parent.config.tile);
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
					this.tiles[name] = new this.context.Tile(this);
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
		var name, min = this.parent.tilesCount - this.parent.parent.config.cache;
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
					this.element.removeChild(this.tiles[name].element);
					delete this.tiles[name];
				}
			}
		}
	};

	this.open = function (direction) {
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-open cat-page-' + direction;
		// update the page
		this.update();
	};

	this.close = function (direction) {
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-close cat-page-' + direction;
	};

	this.stay = function (direction) {
		// allow the elementect to render
		this.element.style.display = 'block';
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-stay cat-page-' + direction;
		// update the page
		this.update();
	};

	this.show = function () {
		// allow the elementect to render
		this.element.style.display = 'block';
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-open';
		// update the page
		this.update();
	};

	this.hide = function () {
		// if the elementect is nowhere near the open page, it's safe to stop it from rendering
		this.element.style.display = (this.index > this.parent.open - 4 && this.index < this.parent.open + 4) ? 'block' : 'none';
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
	};

	// EVENTS

};

// extend the class
Catalog.prototype.Spread = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.element = null;
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

	// OBJECTS

	this.pages = [];

	// METHODS

	this.start = function () {
		// build a container for the pages
		this.element = document.createElement('div');
		this.element.className = 'cat-spread cat-split-' + this.split;
		// build a wrapper for the container
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'cat-wrapper';
		// create all the pages
		var assets = this.parent.element.getElementsByTagName('a');
		for (var a = 0, b = assets.length; a < b; a += 1) {
			this.pages[a] = new this.context.Page(this);
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
		this.parent.element.innerHTML = '';
		// add the container to the parent
		this.wrapper.appendChild(this.element);
		this.parent.element.appendChild(this.wrapper);
		// keep track of scrolling
		this.parent.element.addEventListener('scroll', this.onMove(), true);
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
		//console.log('this.area', this.area);
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
		this.element.style.width = (magnification * 100) + '%';
		this.element.style.height = (magnification * 100) + '%';
//			this.element.style.width = '100%';
//			this.element.style.height = '100%';
//			this.element.style.transform = 'scale(' + magnification + ')';
		// show or hide the scroll bars
		this.element.parentNode.style.overflow = (magnification === 1) ? 'hidden' : 'auto';
		// store the magnification
		this.magnification = magnification;
		// re-adjust the position
		this.move();
	};

	this.move = function (horizontal, vertical) {
		var _this = this;
		// default positions
		horizontal = horizontal || this.horizontal;
		vertical = vertical || this.vertical;
		// set the position of the spread
		this.wrapper.scrollLeft = horizontal * (this.element.offsetWidth - this.parent.element.offsetWidth);
		this.wrapper.scrollTop = vertical * (this.element.offsetHeight - this.parent.element.offsetHeight);
		// store the position
		this.horizontal = horizontal;
		this.vertical = vertical;
		// ask the spread to update
		clearTimeout(this.afterMove);
		this.afterMove = setTimeout(function () {
			_this.parent.update();
		}, _this.parent.config.duration);
	};

	// EVENTS

	this.onMove = function () {
		var _this = this;
		return function () {
			// limit the redraw frequency
			clearTimeout(_this.timeout);
			_this.timeout = setTimeout(function () {
				// note the new position
				var horizontal = _this.wrapper.scrollLeft / (_this.element.offsetWidth - _this.wrapper.offsetWidth),
					vertical = _this.wrapper.scrollTop / (_this.element.offsetHeight - _this.wrapper.offsetHeight);
				// validate and store the new position
				_this.horizontal = (isNaN(horizontal)) ? 0.5 : horizontal;
				_this.vertical = (isNaN(vertical)) ? 0.5 : vertical;
				// ask the spread to update
				_this.update();
			}, _this.parent.config.delay);
		};
	};
};

// extend the class
Catalog.prototype.Tile = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.element = null;
	this.img = null;
	this.left = null;
	this.top = null;
	this.right = null;
	this.bottom = null;
	this.width = null;
	this.height = null;
	this.magnification = null;
	this.index = null;

	// METHODS

	this.start = function () {
		// construct the tile
		this.element = document.createElement('div');
		this.element.className = 'cat-tile';
		this.element.style.left = (this.left * 100) + '%';
		this.element.style.top = (this.top * 100) + '%';
		this.element.style.right = (100 - this.right * 100) + '%';
		this.element.style.bottom = (100 - this.bottom * 100) + '%';
		this.element.style.zIndex = Math.round(this.magnification * 100);
		// add the image
		this.img = document.createElement('img');
		this.img.style.visibility = 'hidden';
		this.img.onload = this.onLoaded();
		this.img.src = this.parent.parent.parent.config.imageslice
			.replace(/{src}/g, this.parent.source)
			.replace(/{width}/g, Math.round(this.width))
			.replace(/{height}/g, Math.round(this.height))
			.replace(/{left}/g, this.left)
			.replace(/{top}/g, this.top)
			.replace(/{right}/g, this.right)
			.replace(/{bottom}/g, this.bottom);
		this.element.onmousedown = function () { return false; };
		this.element.appendChild(this.img);
		// add the tile to the page
		this.parent.element.appendChild(this.element);
	};

	this.update = function () {
		var area = this.parent.parent.area[this.parent.bound],
			magnification = this.parent.parent.magnification;
		// if this tile is at or below the current magnification and inside the visible area
		this.element.style.display = (
			(this.magnification <= magnification) &&
			((this.left >= area.left  && this.left <= area.right) || (this.right >= area.left && this.right <= area.right)) &&
			((this.top >= area.top && this.top <= area.bottom) || (this.bottom >= area.top && this.bottom <= area.bottom))
		) ? 'block': 'none';
	};

	// EVENTS

	this.onLoaded = function () {
		var _this = this;
		return function () { _this.img.style.visibility = 'visible'; };
	};
};

// extend the class
Catalog.prototype.Toolbar = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.menu = null;
	this.elements = {};

	// METHODS

	this.init = function () {
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
		this.parent.element.appendChild(this.menu);
		// return the object
		return this;
	};

	this.update = function () {
		// get the spread elementect
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
		this.elements.pageNumberInput.addEventListener('change', this.onNumberChange.bind(this, this.elements.pageNumberInput));
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
		this.elements.nextButton.addEventListener('mousedown', this.onNextPage.bind(this));
		this.elements.nextButton.addEventListener('touchstart', this.onNextPage.bind(this));
		this.menu.appendChild(this.elements.nextButton);
		// add the "next page" button
		this.elements.prevButton = document.createElement('button');
		this.elements.prevButton.className = 'cat-page-prev';
		this.elements.prevButton.setAttribute('type', 'button');
		this.elements.prevButton.innerHTML = 'Previous page';
		this.elements.prevButton.addEventListener('mousedown', this.onPrevPage.bind(this));
		this.elements.prevButton.addEventListener('touchstart', this.onPrevPage.bind(this));
		this.menu.appendChild(this.elements.prevButton);
	};

	this.addZoomControls = function () {
		// add the "zoom in" button
		this.elements.zoomInButton = document.createElement('button');
		this.elements.zoomInButton.className = 'cat-zoom-in';
		this.elements.zoomInButton.setAttribute('type', 'button');
		this.elements.zoomInButton.innerHTML = 'Zoom in';
		this.elements.zoomInButton.addEventListener('mousedown', this.onZoomIn.bind(this));
		this.elements.zoomInButton.addEventListener('mouseup', this.onZoomInEnd.bind(this));
		this.elements.zoomInButton.addEventListener('touchstart', this.onZoomIn.bind(this));
		this.elements.zoomInButton.addEventListener('touchend', this.onZoomInEnd.bind(this));
		this.menu.appendChild(this.elements.zoomInButton);
		// add the "zoom out" button
		this.elements.zoomOutButton = document.createElement('button');
		this.elements.zoomOutButton.className = 'cat-zoom-out';
		this.elements.zoomOutButton.setAttribute('type', 'button');
		this.elements.zoomOutButton.innerHTML = 'Zoom out';
		this.elements.zoomOutButton.addEventListener('mousedown', this.onZoomOut.bind(this));
		this.elements.zoomOutButton.addEventListener('mouseup', this.onZoomOutEnd.bind(this));
		this.elements.zoomOutButton.addEventListener('touchstart', this.onZoomOut.bind(this));
		this.elements.zoomOutButton.addEventListener('touchend', this.onZoomOutEnd.bind(this));
		this.menu.appendChild(this.elements.zoomOutButton);
	};

	// EVENTS

	this.onNumberChange = function (input) {
		// if the input is a number
		var number = parseInt(input.value, 10);
		if (isNaN(number)) {
			// redraw the elements
			this.update();
		// else
		} else {
			// change the page count
			this.parent.pageTo(number - 1);
		}
	};

	this.onNextPage = function () {
		// increase the page count
		this.parent.pageBy(1);
		// cancel the click
		event.preventDefault();
	};

	this.onPrevPage = function () {
		// increase the page count
		this.parent.pageBy(-1);
		// cancel the click
		event.preventDefault();
	};

	this.onZoomIn = function () {
		var _this = this;
		// repeat the action (faster than the redraw delay)
		this.zoomInRepeat = setInterval(function () {
			// increase the zoom factor
			_this.parent.zoomBy(1.1);
			// redraw the toolbar
			_this.update();
		}, Math.round(_this.parent.config.delay * 0.75));
		// cancel the click
		event.preventDefault();
	};

	this.onZoomInEnd = function () {
		// cancel the repeat
		clearInterval(this.zoomInRepeat);
		// cancel the click
		event.preventDefault();
	};

	this.onZoomOut = function () {
		var _this = this;
		// repeat the action (faster than the redraw delay)
		this.zoomOutRepeat = setInterval(function () {
			// decrease the zoom factor
			_this.parent.zoomBy(0.9);
			// redraw the toolbar
			_this.update();
		}, Math.round(_this.parent.config.delay * 0.75));
		// cancel the click
		event.preventDefault();
	};

	this.onZoomOutEnd = function () {
		// cancel the repeat
		clearInterval(this.zoomOutRepeat);
		// cancel the click
		event.preventDefault();
	};

	// EXECUTE

	this.init();

};

// extend the class
Catalog.prototype.Touch = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.element = null;
	this.hasTouch = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

	// METHODS

	this.init = function () {
		// start touch controls
		this.gestures = new Gestures({
			'element' : this.parent.element,
			'threshold' : 100,
			'increment' : 0.1,
			'swipeLeft' : this.onSwipeLeft(),
			'swipeRight' : this.onSwipeRight(),
			'drag' : this.onDrag(),
			'pinch' : this.onPinch()
		});
		// TODO: double tap for zoom in / out
		// return the object
		return this;
	};

	this.update = function () {
		// nothing to do yet
	};

	// EVENTS

	this.onSwipeLeft = function () {
		var _this = this;
		return function () {
			// if the zoom is 1, turn to the previous page
			if (_this.parent.spread.magnification === 1) {
				_this.parent.pageBy(1);
			}
		};
	};

	this.onSwipeRight = function () {
		var _this = this;
		return function () {
			// if the zoom is 1, turn to the next page
			if (_this.parent.spread.magnification === 1) {
				_this.parent.pageBy(-1);
			}
		};
	};

	this.onDrag = function () {
		var _this = this;
		return function (metrics) {
			// handle click and drag scrolling for mice
			_this.parent.moveBy(
				Math.round(metrics.horizontal),
				Math.round(metrics.vertical)
			);
		};
	};

	this.onPinch = function () {
		var _this = this;
		return function (metrics) {
			// zoom in or out
			_this.parent.zoomBy(1 + metrics.scale);
		};
	};

	// EXECUTE

	this.init();

};
