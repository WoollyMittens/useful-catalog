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
