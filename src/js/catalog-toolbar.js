// extend the class
Catalog.prototype.Toolbar = function (parent) {

	// PROPERTIES

	this.parent = parent;
	this.config = parent.config;
	this.context = parent.context;
	this.menu = null;
	this.elements = {};

	// METHODS

	this.init = function () {
		// build the navigation elements
		this.menu = document.createElement('menu');
		this.menu.className = 'cat-toolbar';
		// add the page number to the toolbar
		this.addPageNumber();
		// add the page controls to the toolbar
		this.addPageControls();
		// add the zoom controls to the toolbar
		this.addZoomControls();
		// add the menu to the parent element
		this.parent.element.appendChild(this.menu);
		// return the object
		return this;
	};

	this.update = function () {
		// get the spread elementect
		var spread = this.parent.spread;
		// update the page number
		this.elements.pageNumberInput.value = (spread.open < spread.pages.length) ? spread.open + 1 : spread.pages.length;
		this.elements.pageNumberTotal.innerHTML = spread.pages.length;
		// update the page controls
		this.elements.nextButton.className = (spread.open < spread.pages.length - 1) ? 'cat-page-next': 'cat-page-next disabled';
		this.elements.prevButton.className = (spread.open > 0) ? 'cat-page-prev': 'cat-page-prev disabled';
		// update the zoom controls
		this.elements.zoomInButton.className = (spread.magnification < spread.max) ? 'cat-zoom-in': 'cat-zoom-in disabled';
		this.elements.zoomOutButton.className = (spread.magnification > 1) ? 'cat-zoom-out': 'cat-zoom-out disabled';
	};

	this.addPageNumber = function () {
		// add a container for the page number controls
		this.elements.pageNumber = document.createElement('div');
		this.elements.pageNumber.className = 'cat-pagenumber';
		// add the page number input field
		this.elements.pageNumberInput = document.createElement('input');
		this.elements.pageNumberInput.className = 'cat-pagenumber-input';
		this.elements.pageNumberInput.setAttribute('type', 'number');
		this.elements.pageNumberInput.setAttribute('name', 'cat-page');
		this.elements.pageNumberInput.addEventListener('change', this.onNumberChange.bind(this, this.elements.pageNumberInput));
		this.elements.pageNumber.appendChild(this.elements.pageNumberInput);
		// add the total number of pages
		this.elements.pageNumberTotal = document.createElement('span');
		this.elements.pageNumberTotal.className = 'cat-pagenumber-total';
		this.elements.pageNumber.appendChild(this.elements.pageNumberTotal);
		// add the container to the toolbar
		this.menu.appendChild(this.elements.pageNumber);
	};

	this.addPageControls = function () {
		// add the "previous page" button
		this.elements.nextButton = document.createElement('button');
		this.elements.nextButton.className = 'cat-page-next';
		this.elements.nextButton.setAttribute('type', 'button');
		this.elements.nextButton.innerHTML = 'Next page';
		this.elements.nextButton.addEventListener('mousedown', this.onNextPage.bind(this));
		this.elements.nextButton.addEventListener('touchstart', this.onNextPage.bind(this));
		this.menu.appendChild(this.elements.nextButton);
		// add the "next page" button
		this.elements.prevButton = document.createElement('button');
		this.elements.prevButton.className = 'cat-page-prev';
		this.elements.prevButton.setAttribute('type', 'button');
		this.elements.prevButton.innerHTML = 'Previous page';
		this.elements.prevButton.addEventListener('mousedown', this.onPrevPage.bind(this));
		this.elements.prevButton.addEventListener('touchstart', this.onPrevPage.bind(this));
		this.menu.appendChild(this.elements.prevButton);
	};

	this.addZoomControls = function () {
		// add the "zoom in" button
		this.elements.zoomInButton = document.createElement('button');
		this.elements.zoomInButton.className = 'cat-zoom-in';
		this.elements.zoomInButton.setAttribute('type', 'button');
		this.elements.zoomInButton.innerHTML = 'Zoom in';
		this.elements.zoomInButton.addEventListener('mousedown', this.onZoomIn.bind(this));
		this.elements.zoomInButton.addEventListener('mouseup', this.onZoomInEnd.bind(this));
		this.elements.zoomInButton.addEventListener('touchstart', this.onZoomIn.bind(this));
		this.elements.zoomInButton.addEventListener('touchend', this.onZoomInEnd.bind(this));
		this.menu.appendChild(this.elements.zoomInButton);
		// add the "zoom out" button
		this.elements.zoomOutButton = document.createElement('button');
		this.elements.zoomOutButton.className = 'cat-zoom-out';
		this.elements.zoomOutButton.setAttribute('type', 'button');
		this.elements.zoomOutButton.innerHTML = 'Zoom out';
		this.elements.zoomOutButton.addEventListener('mousedown', this.onZoomOut.bind(this));
		this.elements.zoomOutButton.addEventListener('mouseup', this.onZoomOutEnd.bind(this));
		this.elements.zoomOutButton.addEventListener('touchstart', this.onZoomOut.bind(this));
		this.elements.zoomOutButton.addEventListener('touchend', this.onZoomOutEnd.bind(this));
		this.menu.appendChild(this.elements.zoomOutButton);
	};

	// EVENTS

	this.onNumberChange = function (input) {
		// if the input is a number
		var number = parseInt(input.value, 10);
		if (isNaN(number)) {
			// redraw the elements
			this.update();
		// else
		} else {
			// change the page count
			this.parent.pageTo(number - 1);
		}
	};

	this.onNextPage = function () {
		// increase the page count
		this.parent.pageBy(1);
		// cancel the click
		event.preventDefault();
	};

	this.onPrevPage = function () {
		// increase the page count
		this.parent.pageBy(-1);
		// cancel the click
		event.preventDefault();
	};

	this.onZoomIn = function () {
		var _this = this;
		// repeat the action (faster than the redraw delay)
		this.zoomInRepeat = setInterval(function () {
			// increase the zoom factor
			_this.parent.zoomBy(1.1);
			// redraw the toolbar
			_this.update();
		}, Math.round(_this.parent.config.delay * 0.75));
		// cancel the click
		event.preventDefault();
	};

	this.onZoomInEnd = function () {
		// cancel the repeat
		clearInterval(this.zoomInRepeat);
		// cancel the click
		event.preventDefault();
	};

	this.onZoomOut = function () {
		var _this = this;
		// repeat the action (faster than the redraw delay)
		this.zoomOutRepeat = setInterval(function () {
			// decrease the zoom factor
			_this.parent.zoomBy(0.9);
			// redraw the toolbar
			_this.update();
		}, Math.round(_this.parent.config.delay * 0.75));
		// cancel the click
		event.preventDefault();
	};

	this.onZoomOutEnd = function () {
		// cancel the repeat
		clearInterval(this.zoomOutRepeat);
		// cancel the click
		event.preventDefault();
	};

	// EXECUTE

	this.init();

};
