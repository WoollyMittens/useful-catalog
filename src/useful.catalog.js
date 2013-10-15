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
		this.spread = null;
		// methods
		this.start = function () {
			var reference = this.obj.getElementsByTagName('a')[0];
			// adjust to the aspect ratio the first image
			this.aspect = parseInt(reference.getAttribute('data-height'), 10) / parseInt(reference.getAttribute('data-width'), 10) / 2;
			this.obj.style.height = (this.obj.offsetWidth * this.aspect) + 'px';
			// build the spread object
			this.spread = new CatalogSpread(this);
			this.spread.start();
			// TODO: build the toolbar object
			// restore the aspect ratio after resizes
			window.addEventListener('resize', this.onResized(), true);
		};
		this.update = function () {
			// redraw the toolbar
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
		// API calls
		// zoomTo, zoomBy, moveTo, moveBy, pageTo, pageBy
	};

	// a spread contains a front cover, all pages and a rear cover
	// a spread can grow and shift underneath the overflow of viewport
	var CatalogSpread = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.horizontal = 0.5;
		this.vertical = 0.5;
		this.magnification = 1;
		this.open = 0;
		this.area = [0, 0, 1, 1];
		this.areaEven = [0, 0, 1, 1];
		this.areaOdd = [0, 0, 1, 1];
		this.timeout = null;
		this.tilesCount = 0;
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
				this.pages[a] = new CatalogPage(this);
				this.pages[a].source = assets[a].getAttribute('href');
				this.pages[a].width = parseInt(assets[a].getAttribute('data-width'), 10);
				this.pages[a].height = parseInt(assets[a].getAttribute('data-height'), 10);
				this.pages[a].left = parseFloat(assets[a].getAttribute('data-left') || 0);
				this.pages[a].top = parseFloat(assets[a].getAttribute('data-top') || 0);
				this.pages[a].right = parseFloat(assets[a].getAttribute('data-right') || 1);
				this.pages[a].bottom = parseFloat(assets[a].getAttribute('data-bottom') || 1);
				this.pages[a].preview = assets[a].removeChild(assets[a].getElementsByTagName('img')[0]);
				this.pages[a].bound = (a % 2 === 0) ? 'even' : 'odd';
				this.pages[a].index = a;
				this.pages[a].start();
			}
			// clear the parent
			this.parent.obj.innerHTML = '';
			// add the container to the parent
			this.parent.obj.appendChild(this.obj);
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
			// define the viewable area
			this.area = {};
			this.area.full = {
				'left' : overscan * this.horizontal,
				'top' : overscan * this.vertical,
				'right' : 1 - overscan * (1 - this.horizontal),
				'bottom' : 1 - overscan * (1 - this.vertical)
			};
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
		};
		this.redraw = function () {
			var even = this.open - this.open % 2,
				odd = even - 1;
			// for all the pages of this spread
			for (var a = 0, b = this.pages.length; a < b; a += 1) {
				// if the page is visible
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
			var oldEven = this.open - this.open % 2,
				oldOdd = oldEven - 1,
				newEven = oldEven + 2,
				newOdd = oldOdd + 2;
			// for all the pages of this spread
			for (var a = 0, b = this.pages.length; a < b; a += 1) {
				// if these are not the active pages
				if (a !== oldEven && a !== oldOdd && a !== newEven && a !== newOdd) {
					// hide the page
					this.pages[a].hide();
				}
			}
			// set the background pages
			if (oldOdd >= 0) { this.pages[oldOdd].stay('increasing'); }
			if (newEven < this.pages.length) { this.pages[newEven].stay('increasing'); this.open = newEven; }
			// animate the foreground pages
			if (oldEven >= 0) { this.pages[oldEven].close('increasing'); }
			if (newOdd < this.pages.length) { this.pages[newOdd].open('increasing'); }
		};
		this.previous = function () {
			var oldEven = this.open - this.open % 2,
				oldOdd = oldEven - 1,
				newEven = oldEven - 2,
				newOdd = oldOdd - 2;
			// for all the pages of this spread
			for (var a = 0, b = this.pages.length; a < b; a += 1) {
				// if these are not the active pages
				if (a !== oldEven && a !== oldOdd && a !== newEven && a !== newOdd) {
					// hide the page
					this.pages[a].hide();
				}
			}
			// set the background pages
			if (oldEven >= 0) { this.pages[oldEven].stay('decreasing'); }
			if (newOdd >= 0) { this.pages[newOdd].stay('decreasing'); }
			// animate the foreground pages
			if (oldOdd >= 0) { this.pages[oldOdd].close('decreasing'); }
			if (newEven >= 0) { this.pages[newEven].open('decreasing'); this.open = newEven; }
		};
		this.zoom = function (magnification) {
			var context = this;
			// apply the zoom factor
			this.obj.style.width = (magnification * 100) + '%';
			this.obj.style.height = (magnification * 100) + '%';
			// store the magnification
			this.magnification = magnification;
			// re-adjust the position
			setTimeout(function () {
				context.move();
			}, 0);
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
		// events
		this.onMove = function () {
			var context = this;
			return function () {
				// limit the redraw frequency
				clearTimeout(context.timeout);
				context.timeout = setTimeout(function () {
					// note the new position
					var horizontal = context.parent.obj.scrollLeft / (context.obj.offsetWidth - context.parent.obj.offsetWidth),
						vertical = context.parent.obj.scrollTop / (context.obj.offsetHeight - context.parent.obj.offsetHeight);
					// validate and store the new position
					context.horizontal = (isNaN(horizontal)) ? 0.5 : horizontal;
					context.vertical = (isNaN(vertical)) ? 0.5 : vertical;
					// ask the spread to update
					context.update();
				}, context.parent.cfg.delay);
			};
		};
	};

	// a page is in a position on a stack
	// a page knows how to reveal itself based on it attachment to the spine
	// a page has layers of tiles at various zoom levels
	var CatalogPage = function (parent) {
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
						this.tiles[name] = new CatalogTile(this);
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
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-stay cat-page-' + direction;
			// update the page
			this.update();
		};
		this.show = function () {
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-open';
			// update the page
			this.update();
		};
		this.hide = function () {
			// change the class name
			this.obj.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
		};
		// events
	};

	// a tile is part of the page positioned using fractional coordinates that correspond to the cropping
	// only tiles at the current or lower zoom levels are visible
	// only tiles within the viewport are visible
	var CatalogTile = function (parent) {
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
