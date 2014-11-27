# useful.catalog.js: Scanned Print Media Viewer

Browsing through a long list of irregularly shaped thumbnails using scrolling controls.

Try the <a href="http://www.woollymittens.nl/useful/default.php?url=useful-catalog">demo</a>.

## How to include the script

The stylesheet is best included in the header of the document.

```html
<link rel="stylesheet" href="./css/useful-catalog.css"/>
```

This include can be added to the header or placed inline before the script is invoked.

```html
<script src="./js/useful-catalog.js"></script>
```

To enable the use of HTML5 tags in Internet Explorer 8 and lower, include *html5.js*.

```html
<!--[if lte IE 9]>
	<script src="//html5shiv.googlecode.com/svn/trunk/html5.js"></script>
<![endif]-->
```

## How to start the script

```javascript
var catalog = new useful.Catalog().init({
	'element' : document.getElementById('catalogExample'),
	'imageslice' : 'inc/php/imageslice.php?src=../../{src}&width={width}&height={height}&left={left}&top={top}&right={right}&bottom={bottom}',
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

## How to build the script

This project uses node.js from http://nodejs.org/

This project uses grunt.js from http://gruntjs.com/

The following commands are available for development:
+ `npm install` - Installs the prerequisites.
+ `grunt import` - Re-imports libraries from supporting projects to `./src/libs/` if available under the same folder tree.
+ `grunt dev` - Builds the project for development purposes.
+ `grunt prod` - Builds the project for deployment purposes.
+ `grunt watch` - Continuously recompiles updated files during development sessions.
+ `grunt serve` - Serves the project on a temporary web server at http://localhost:8000/ .

## License

This work is licensed under a Creative Commons Attribution 3.0 Unported License. The latest version of this and other scripts by the same author can be found at http://www.woollymittens.nl/
