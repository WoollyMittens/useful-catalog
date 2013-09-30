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
		// objects
		this.spread = null;
		// methods
		this.start = function () {
			// note the dimensions of the container
			this.width = this.obj.offsetWidth;
			this.height = this.obj.offsetHeight;
			// build the spread object
			this.spread = new useful.CatalogSpread(this);
			this.spread.start();
			// build the interface
			this.buildInterface();
		};
		this.buildInterface = function () {
			// TODO: build a toolbar
		};
	};

	// a spread contains a front cover, all pages and a rear cover
	// a spread can grow and shift underneath the overflow of viewport
	useful.CatalogSpread = function (parent) {
		// properties
		this.parent = parent;
		this.obj = null;
		this.x = null;
		this.y = null;
		this.width = null;
		this.height = null;
		this.magnification = null;
		// objects
		this.pages = [];
		// methods
		this.start = function () {
			// build a container for the pages
			this.obj = document.createElement('div');
			this.obj.className = 'cat-spread';
			// create all the pages
			var page, assets = this.parent.obj.getElementsByTagName('a');
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
				this.pages[a].number = a;
				this.pages[a].start();
			}
			// clear the parent
			this.parent.obj.innerHTML = '';
			// add the container to the parent
			this.parent.obj.appendChild(this.obj);
		};
		this.move = function () {};
		this.zoom = function () {};
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
		this.number = null;
		// objects
		this.tiles = [];
		// methods
		this.start = function () {
			// build a container for the page
			this.obj = document.createElement('div');
			this.obj.className = 'cat-page';
			this.obj.className += (this.number % 2 === 0) ? ' cat-page-right' : ' cat-page-left';
			this.obj.className += (this.number === 0) ? ' cat-page-visible' : ' cat-page-hidden';
			this.obj.style.zIndex = 1000 - this.number * 10;
			// add the preview to the page
			this.preview.className = 'cat-preview';
			this.preview.setAttribute('alt', '');
			this.obj.appendChild(this.preview);
			// add it to the parent
			this.parent.obj.appendChild(this.obj);
		};
		this.show = function () {};
		this.hide = function () {};
	};

	// a tile is part of the page positioned using fractional coordinates that correspond to the cropping
	// only tiles at the current or lower zoom levels are visible
	// only tiles within the viewport are visible
	useful.CatalogTile = function (parent) {
		// properties
		this.parent = parent;
		this.left = null;
		this.top = null;
		this.right = null;
		this.bottom = null;
		this.magnification = null;
		// objects
		this.element = null;
		// methods
		this.show = function () {};
		this.hide = function () {};
	};

}(window.useful = window.useful || {}));
