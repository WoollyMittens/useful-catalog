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
		this.width = null;
		this.height = null;
		this.timeout = null;
		// objects
		this.spread = null;
		// methods
		this.start = function () {
			// build the spread object
			this.spread = new useful.CatalogSpread(this);
			this.spread.start();
			// build the interface
			this.buildInterface();
			// restore the aspect ratio after resizes
			this.restoreAspect();
			window.addEventListener('resize', this.onRestoreAspect(), true);
		};
		this.update = function () {
			// redraw the toolbar
			// redraw the spread
			this.spread.update();
		};
		this.restoreAspect = function () {
			var context = this;
			// limit the redraw frequency
			clearTimeout(this.timeout);
			this.timeout = setTimeout(function () {
				// note the aspect ratio of the container
				context.width = context.obj.offsetWidth;
				context.height = Math.round(context.spread.pages[0].preview.offsetHeight / context.spread.magnification);
				// adjust the height to the aspect ratio
				context.obj.style.height = context.height + 'px';
			}, this.cfg.delay);
		};
		this.buildInterface = function () {
			// TODO: build a toolbar
		};
		// events
		this.onRestoreAspect = function () {
			var context = this;
			return function () {
				context.restoreAspect();
			};
		};
		// API calls
		// zoomTo, zoomBy, moveTo, moveBy, pageTo, pageBy
	};

	// a spread contains a front cover, all pages and a rear cover
	// a spread can grow and shift underneath the overflow of viewport
	useful.CatalogSpread = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.horizontal = 0.5;
		this.vertical = 0.5;
		this.magnification = 1;
		this.open = 0;
		this.area = [0, 0, 1, 1];
		this.timeout = null;
		// objects
		this.pages = [];
		// methods
		this.start = function () {
			// build a container for the pages
			this.obj = document.createElement('div');
			this.obj.className = 'cat-spread';
			// create all the pages
			var assets = this.parent.obj.getElementsByTagName('a');
			for (var a = 0, b = assets.length; a < b; a += 1) {
				this.pages[a] = new useful.CatalogPage(this);
				this.pages[a].source = assets[a].getAttribute('href');
				this.pages[a].width = parseInt(assets[a].getAttribute('data-width'), 10);
				this.pages[a].height = parseInt(assets[a].getAttribute('data-height'), 10);
				this.pages[a].left = parseFloat(assets[a].getAttribute('data-left') || 0);
				this.pages[a].top = parseFloat(assets[a].getAttribute('data-top') || 0);
				this.pages[a].right = parseFloat(assets[a].getAttribute('data-right') || 1);
				this.pages[a].bottom = parseFloat(assets[a].getAttribute('data-bottom') || 1);
				this.pages[a].preview = assets[a].removeChild(assets[a].getElementsByTagName('img')[0]);
				this.pages[a].odd = (a % 2 === 0);
				this.pages[a].even = !this.pages[a].odd;
				this.pages[a].index = a;
				this.pages[a].start();
			}
			// clear the parent
			this.parent.obj.innerHTML = '';
			// add the container to the parent
			this.parent.obj.appendChild(this.obj);
			// keep track of scrolling
			this.parent.obj.addEventListener('scroll', this.onMove(), true);
		};
		this.update = function () {
			var context = this;
			// limit the redraw frequency
			clearTimeout(this.timeout);
			this.timeout = setTimeout(function () {
				// recalculate the visible area
				context.recalc();
				// redraw the pages
				context.redraw();
			}, this.parent.cfg.delay);
		};
		this.recalc = function () {
			var overscan = 1 - 1 / this.magnification;
			// define the viewable area
			this.area = [
				overscan * this.horizontal,
				overscan * this.vertical,
				1 - overscan * (1 - this.horizontal),
				1 - overscan * (1 - this.vertical)
			];
			console.log(this.area);
		};
		this.redraw = function () {
			var left = this.open, right = this.open + 1;
			// for all the pages of this spread
			for (var a = 0, b = this.pages.length; a < b; a += 1) {
				// if the page is visible
				if (a === left || a === right) {
					// show the page
					this.pages[a].show();
				// else
				} else {
					// hide the page
					this.pages[a].hide();
				}
			}
		};
		this.move = function (horizontal, vertical) {
			horizontal = horizontal || this.horizontal;
			vertical = vertical || this.vertical;
			// set the position of the spread
			this.parent.obj.scrollLeft = horizontal * (this.obj.offsetWidth - this.parent.obj.offsetWidth);
			this.parent.obj.scrollTop = vertical * (this.obj.offsetHeight - this.parent.obj.offsetHeight);
			// store the position
			this.horizontal = horizontal;
			this.vertical = vertical;
			// ask the spread to update
			this.update();
		};
		this.zoom = function (magnification) {
			var context = this;
			// apply the zoom factor
			this.obj.style.width = (magnification * 100) + '%';
			// re-adjust the position
			setTimeout(function () { context.move(); }, 0);
			// store the magnification
			this.magnification = magnification;
			// ask the spread to update
			this.update();
		};
		// events
		this.onMove = function () {
			var context = this;
			return function () {
				var horizontal, vertical;
				// note the new position
				horizontal = context.parent.obj.scrollLeft / (context.obj.offsetWidth - context.parent.obj.offsetWidth);
				vertical = context.parent.obj.scrollTop / (context.obj.offsetHeight - context.parent.obj.offsetHeight);
				// validate and store the new position
				context.horizontal = (isNaN(horizontal)) ? 0.5 : horizontal;
				context.vertical = (isNaN(vertical)) ? 0.5 : vertical;
				// ask the spread to update
				context.update();
			};
		};
	};

	// a page is in a position on a stack
	// a page knows how to reveal itself based on it attachment to the spine
	// a page has layers of tiles at various zoom levels
	useful.CatalogPage = function (parent) {
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
		this.odd = null;
		this.even = null;
		// objects
		this.tiles = {};
		this.tilesCount = 0;
		// methods
		this.start = function () {
			// note on what side the
			// build a container for the page
			this.obj = document.createElement('div');
			this.obj.className = 'cat-page';
			this.obj.className += (this.odd) ? ' cat-page-right' : ' cat-page-left';
			this.obj.className += (this.index === 0) ? ' cat-page-visible' : ' cat-page-hidden';
			this.obj.style.zIndex = 1000 - this.index * 10;
			// add the preview to the page
			this.preview.className = 'cat-preview';
			this.preview.setAttribute('alt', '');
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
			// for all the tiles that ought to exist at this zoom level
				// if this is in the visible area and this tile doesn't already exist
					// update the number of cached tiles
					// create a new tile
		};
		this.redraw = function () {
			var name, min = this.tilesCount - this.parent.parent.cfg.cache;
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
		this.show = function () {
			// if the page is not visible yet
				// play the reveal animation
					// afterwards update the page
			// else
				// immediately update the page
		};
		this.hide = function () {
			// if the page is not yet invisible
				// play the un-reveal animation
		};
		// events
	};

	// a tile is part of the page positioned using fractional coordinates that correspond to the cropping
	// only tiles at the current or lower zoom levels are visible
	// only tiles within the viewport are visible
	useful.CatalogTile = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.left = null;
		this.top = null;
		this.right = null;
		this.bottom = null;
		this.magnification = null;
		this.index = null;
		// methods
		this.start = function () {
			// construct the tile
		};
		this.update = function () {
			// if this tile is at or below the current magnification and inside the visible area
				// show the tile
			// else
				// hide the tile
		};
		this.show = function () {};
		this.hide = function () {};
		// events
	};

}(window.useful = window.useful || {}));
