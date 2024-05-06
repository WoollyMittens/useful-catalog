# catalog.js: Scanned Print Media Viewer

*DEPRICATION WARNING: the functionality in this script has been superceeded / trivialised by updated web standards.*

A viewer for browsing through and zooming in on magazine pages.

## How to include the script

The stylesheet is best included in the header of the document.

```html
<link rel="stylesheet" href="css/catalog.css"/>
```

This include can be added to the header or placed inline before the script is invoked.

```html
<script src="js/gestures.js"></script>
<script src="js/catalog.js"></script>
```

Or use [Require.js](https://requirejs.org/).

```js
requirejs([
	'js/gestures.js',
	'js/catalog.js'
], function(Gestures, Catalog) {
	...
});
```

Or use imported as a component in existing projects.

```js
@import {Gestures} from "js/gestures.js";
@import {Catalog} from "js/catalog.js";
```

## How to start the script

```javascript
var catalog = new Catalog({
	'element' : document.getElementById('catalogExample'),
	'imageslice' : 'php/imageslice.php?src={src}&width={width}&height={height}&left={left}&top={top}&right={right}&bottom={bottom}',
	'cache' : 256,
	'delay' : 100,
	'duration' : 1600,
	'tile' : 128,
	'split' : 2,
	'open' : 0,
	'colorPassive' : '#ff6a00',
	'colorActive' : '#d45800',
	'colorHover' : '#ff9800',
	'colorDisabled' : '#7f7f7f'
});
```

**tileSource : {url}** - A webservice that provides image tiles (PHP example included).

**tileCache : {integer}** - The amount of tiles that can be active at one time. Reduce this to save memory at the expense of bandwidth.

**tileSize : {integer}** - The horizontal and vertical size of each tile in pixels.

**allowRotation : {boolean}** - Enable or disable rotation as well as pan and zoom.

## How to control the script

### zoomTo

```javascript
catalog.zoomTo(factor);
```

Applies a zoom factor to the viewer.

**factor : {integer}** - Zoom factor to apply.

### pageTo

```javascript
catalog.pageTo(page);
```

Open a specific page in the viewer.

**page : {integer}** - Page number to display.

### pageBy

```javascript
catalog.pageBy(increment);
```

Increase or decrease the page number.

**increment : {integer}** - Increment to add to the page number (can be negative).

## License

This work is licensed under a [MIT License](https://opensource.org/licenses/MIT). The latest version of this and other scripts by the same author can be found on [Github](https://github.com/WoollyMittens).
