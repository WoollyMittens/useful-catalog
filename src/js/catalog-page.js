// extend the class
Catalog.prototype.Page = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.element = null;
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

	// OBJECTS

	this.tiles = {};
	this.tilesCount = 0;

	// METHODS

	this.start = function () {
		// build a container for the page
		this.element = document.createElement('div');
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
		// add the preview to the page
		this.preview.className = 'cat-preview';
		this.preview.setAttribute('alt', '');
		this.preview.onmousedown = function () { return false; };
		this.element.appendChild(this.preview);
		// add it to the parent
		this.parent.element.appendChild(this.element);
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
		var horizontal = this.element.offsetWidth,
			vertical = this.element.offsetHeight;
		// calculate amount of tiles in a column and a row
		var rows = Math.round(vertical / this.parent.parent.config.tile),
			cols = Math.round(horizontal / this.parent.parent.config.tile);
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
					this.tiles[name] = new this.context.Tile(this);
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
		var name, min = this.parent.tilesCount - this.parent.parent.config.cache;
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
					this.element.removeChild(this.tiles[name].element);
					delete this.tiles[name];
				}
			}
		}
	};

	this.open = function (direction) {
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-open cat-page-' + direction;
		// update the page
		this.update();
	};

	this.close = function (direction) {
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-close cat-page-' + direction;
	};

	this.stay = function (direction) {
		// allow the elementect to render
		this.element.style.display = 'block';
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-stay cat-page-' + direction;
		// update the page
		this.update();
	};

	this.show = function () {
		// allow the elementect to render
		this.element.style.display = 'block';
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-open';
		// update the page
		this.update();
	};

	this.hide = function () {
		// if the elementect is nowhere near the open page, it's safe to stop it from rendering
		this.element.style.display = (this.index > this.parent.open - 4 && this.index < this.parent.open + 4) ? 'block' : 'none';
		// change the class name
		this.element.className = 'cat-page cat-page-' + this.bound + ' cat-page-close';
	};

	// EVENTS

};
