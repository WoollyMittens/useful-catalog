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
