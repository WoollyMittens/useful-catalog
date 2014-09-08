/*
	Source:
	van Creij, Maurice (2013). "useful.catalog.js: Scanned Print Media Viewer", version 20130814, http://www.woollymittens.nl/.

	License:
	This work is licensed under a Creative Commons Attribution 3.0 Unported License.
*/

// public object
var useful = useful || {};

(function(){

	// invoke strict mode
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

	// return as a require.js module
	if (typeof module !== 'undefined') {
		exports = module.exports = useful.Catalog_Touch;
	}

})();
