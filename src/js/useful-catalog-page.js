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
useful.Catalog.prototype.Page = function (parent) {
	// properties
	"use strict";
	this.root = parent.parent;
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
					this.tiles[name] = new this.root.Tile(this);
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

// return as a require.js module
if (typeof module !== 'undefined') {
	exports = module.exports = useful.Catalog.Page;
}
