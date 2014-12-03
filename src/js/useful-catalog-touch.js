/*
	Source:
	van Creij, Maurice (2014). "useful.catalog.js: Scanned Print Media Viewer", version 20141127, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// create the constructor if needed
var useful = useful || {};
useful.Catalog = useful.Catalog || function () {};

// extend the constructor
useful.Catalog.prototype.Touch = function (parent) {
	// properties
	"use strict";
	this.parent = parent;
	this.obj = null;
	// methods
	this.start = function () {
		// start touch controls
		this.gestures = new useful.Gestures().init({
			'element' : this.parent.obj,
			'threshold' : 100,
			'increment' : 0.1,
			'swipeLeft' : this.onSwipeLeft(),
			'swipeRight' : this.onSwipeRight(),
			'drag' : this.onDrag(),
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
			_this.parent.moveBy(metrics.horizontal, metrics.vertical);
		};
	};
	this.onPinch = function () {
		var _this = this;
		return function (metrics) {
			// zoom in or out
			_this.parent.zoomBy(1 + metrics.scale);
		};
	};
};

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = useful.Catalog.Touch;
}
