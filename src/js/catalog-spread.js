// extend the class
Catalog.prototype.Spread = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.element = null;
	this.wrapper = null;
	this.horizontal = 0.5;
	this.vertical = 0.5;
	this.magnification = 1;
	this.max = 1.1;
	this.split = 2;
	this.open = 0;
	this.area = [0, 0, 1, 1];
	this.areaEven = [0, 0, 1, 1];
	this.areaOdd = [0, 0, 1, 1];
	this.timeout = null;
	this.tilesCount = 0;
	this.busy = false;

	// OBJECTS

	this.pages = [];

	// METHODS

	this.start = function () {
		// build a container for the pages
		this.element = document.createElement('div');
		this.element.className = 'cat-spread cat-split-' + this.split;
		// build a wrapper for the container
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'cat-wrapper';
		// create all the pages
		var assets = this.parent.element.getElementsByTagName('a');
		for (var a = 0, b = assets.length; a < b; a += 1) {
			this.pages[a] = new this.context.Page(this);
			this.pages[a].source = assets[a].getAttribute('href');
			this.pages[a].width = parseInt(assets[a].getAttribute('data-width'), 10);
			this.pages[a].height = parseInt(assets[a].getAttribute('data-height'), 10);
			this.pages[a].left = parseFloat(assets[a].getAttribute('data-left') || 0);
			this.pages[a].top = parseFloat(assets[a].getAttribute('data-top') || 0);
			this.pages[a].right = parseFloat(assets[a].getAttribute('data-right') || 1);
			this.pages[a].bottom = parseFloat(assets[a].getAttribute('data-bottom') || 1);
			this.pages[a].preview = assets[a].removeChild(assets[a].getElementsByTagName('img')[0]);
			this.pages[a].bound = (a % this.split === 0) ? 'even' : 'odd';
			this.pages[a].index = a;
			this.pages[a].start();
		}
		// clear the parent
		this.parent.element.innerHTML = '';
		// add the container to the parent
		this.wrapper.appendChild(this.element);
		this.parent.element.appendChild(this.wrapper);
		// keep track of scrolling
		this.parent.element.addEventListener('scroll', this.onMove(), true);
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
		this.max = this.pages[0].height / this.wrapper.offsetHeight;
		// define the viewable area
		this.area = {};
		this.area.full = this.area.odd = this.area.even = {
			'left' : overscan * this.horizontal,
			'top' : overscan * this.vertical,
			'right' : 1 - overscan * (1 - this.horizontal),
			'bottom' : 1 - overscan * (1 - this.vertical)
		};
		if (this.split === 2) {
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
		}
		//console.log('this.area', this.area);
	};

	this.redraw = function () {
		var even = this.open + this.open % this.split,
			odd = even - 1;
		// for all the pages of this spread
		for (var a = 0, b = this.pages.length; a < b; a += 1) {
			// if the page is open
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
		var oldEven = this.open + this.open % this.split,
			oldOdd = oldEven - 1,
			newEven = oldEven + this.split,
			newOdd = oldOdd + this.split,
			pagesLength = this.pages.length;
		// for all the pages of this spread
		for (var a = 0, b = pagesLength; a < b; a += 1) {
			// if these are not the active pages
			if (a < oldOdd || a > oldEven) {
				// hide the page
				this.pages[a].hide();
			}
		}
		// update the odd pages
		if (oldOdd >= 0 && oldOdd < pagesLength && this.pages[oldOdd].bound === 'odd') { this.pages[oldOdd].stay('increasing'); }
		if (newOdd >= 0 && newOdd < pagesLength && this.pages[newOdd].bound === 'odd') { this.pages[newOdd].open('increasing'); }
		// update the even pages
		if (oldEven >= 0 && oldEven < pagesLength) { this.pages[oldEven].close('increasing'); }
		if (newEven >= 0 && newEven < pagesLength) { this.pages[newEven].stay('increasing'); }
		// store the new page number
		this.open = (newEven < pagesLength) ? newEven : pagesLength;
	};

	this.previous = function () {
		var oldEven = this.open + this.open % this.split,
			oldOdd = oldEven - 1,
			newEven = oldEven - this.split,
			newOdd = oldOdd - this.split,
			pagesLength = this.pages.length;
		// for all the pages of this spread
		for (var a = 0, b = pagesLength; a < b; a += 1) {
			// if these are not the active pages
			if (a < oldOdd || a > oldEven) {
				// hide the page
				this.pages[a].hide();
			}
		}
		// update the odd pages
		if (oldOdd >= 0 && oldOdd < pagesLength && this.pages[oldOdd].bound === 'odd') { this.pages[oldOdd].close('decreasing'); }
		if (newOdd >= 0 && newOdd < pagesLength && this.pages[newOdd].bound === 'odd') { this.pages[newOdd].stay('decreasing'); }
		// update the even pages
		if (oldEven >= 0 && oldEven < pagesLength) { this.pages[oldEven].stay('decreasing'); }
		if (newEven >= 0 && newEven < pagesLength) { this.pages[newEven].open('decreasing'); }
		// store the new page number
		this.open = (newEven >= 0) ? newEven : 0;
	};

	this.zoom = function (magnification) {
		// apply the zoom factor
		this.element.style.width = (magnification * 100) + '%';
		this.element.style.height = (magnification * 100) + '%';
//			this.element.style.width = '100%';
//			this.element.style.height = '100%';
//			this.element.style.transform = 'scale(' + magnification + ')';
		// show or hide the scroll bars
		this.element.parentNode.style.overflow = (magnification === 1) ? 'hidden' : 'auto';
		// store the magnification
		this.magnification = magnification;
		// re-adjust the position
		this.move();
	};

	this.move = function (horizontal, vertical) {
		var _this = this;
		// default positions
		horizontal = horizontal || this.horizontal;
		vertical = vertical || this.vertical;
		// set the position of the spread
		this.wrapper.scrollLeft = horizontal * (this.element.offsetWidth - this.parent.element.offsetWidth);
		this.wrapper.scrollTop = vertical * (this.element.offsetHeight - this.parent.element.offsetHeight);
		// store the position
		this.horizontal = horizontal;
		this.vertical = vertical;
		// ask the spread to update
		clearTimeout(this.afterMove);
		this.afterMove = setTimeout(function () {
			_this.parent.update();
		}, _this.parent.config.duration);
	};

	// EVENTS

	this.onMove = function () {
		var _this = this;
		return function () {
			// limit the redraw frequency
			clearTimeout(_this.timeout);
			_this.timeout = setTimeout(function () {
				// note the new position
				var horizontal = _this.wrapper.scrollLeft / (_this.element.offsetWidth - _this.wrapper.offsetWidth),
					vertical = _this.wrapper.scrollTop / (_this.element.offsetHeight - _this.wrapper.offsetHeight);
				// validate and store the new position
				_this.horizontal = (isNaN(horizontal)) ? 0.5 : horizontal;
				_this.vertical = (isNaN(vertical)) ? 0.5 : vertical;
				// ask the spread to update
				_this.update();
			}, _this.parent.config.delay);
		};
	};
};
