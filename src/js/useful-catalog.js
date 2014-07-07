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
