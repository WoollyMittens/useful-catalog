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
