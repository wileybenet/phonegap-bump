var WebPullToRefresh = (function () {
	'use strict';

	/**
	 * Hold all of the default parameters for the module
	 * @type {object}
	 */	
	var defaults = {
		// ID of the element holding dragable content area
		contentEl: 'content', 

		// ID of the element holding pull to refresh loading area
		ptrEl: 'ptr', 

		ptrArrow: 'ptr-arrow',

		// Number of pixels of dragging until refresh 
		distanceToRefresh: 50, 

		// Pointer to function that does the loading and returns a promise
		loadingFunction: false 
	};

	/**
	 * Hold all of the merged parameter and default module options
	 * @type {object}
	 */
	var options = {};

	var h;

	/**
	 * Drag event parameters
	 * @type {object}
	 */
	var drag = {
		enabled: false,
		distance: 0,
		startingPositionY: 0
	};
	
	/**
	 * Easy shortener for handling adding and removing body classes.
	 */
	var bodyClass = document.body.classList;
	
	/**
	 * Initialize pull to refresh, hammer, and bind drag events.
	 * 
	 * @param {object=} params - Setup parameters for pull to refresh
	 */
	var init = function( params ) {
		params = params || {};
		options = {
			contentEl: params.contentEl || document.getElementById( defaults.contentEl ),
			ptrEl: params.ptrEl || document.getElementById( defaults.ptrEl ),
			ptrArrow: params.ptrArrow || document.getElementById( defaults.ptrArrow ),
			distanceToRefresh: params.distanceToRefresh || defaults.distanceToRefresh,
			loadingFunction: params.loadingFunction || defaults.loadingFunction
		};

		if ( ! options.contentEl || ! options.ptrEl )
			return false;

		h = new Hammer( options.contentEl );

		h.on( 'dragstart', _dragStart );
		h.on( 'dragdown', _dragDown );
		h.on( 'dragend', _dragEnd );
	};

	/**
	 * Determine whether drag events should apply based on scroll position on dragstart
	 * 
	 * @param {object} e - Event object
	 */
	var _dragStart = function(e) {
		drag.startingPositionY = options.ptrEl.scrollTop;

		if ( drag.startingPositionY === 0 )
			drag.enabled = true;

		console.log('start', drag.startingPositionY);
	};

	/**
	 * Handle element on screen movement when the dragdown event is firing.
	 * 
	 * @param {object} e - Event object
	 */
	var _dragDown = function(e) {
		if ( ! drag.enabled && e.gesture.distance > 0)
			return;

		// e.gesture.preventDefault();
		drag.distance = e.gesture.distance / 2.5; // Provide feeling of resistance

		// Use transforms to smoothly animate elements on desktop and mobile devices
		// options.contentEl.style.transform = options.contentEl.style.webkitTransform = 'translate3d( 0, ' + drag.distance + 'px, 0 )';
		// options.ptrEl.style.transform = options.ptrEl.style.webkitTransform = 'translate3d( 0, ' + ( drag.distance - options.ptrEl.offsetHeight ) + 'px, 0 )';

		if ( drag.distance > 15 ) {
			options.ptrArrow.style.visibility = 'visible';
		} else {
			options.ptrArrow.style.visibility = 'hidden';
		}

		if ( drag.distance > options.distanceToRefresh ) {
			bodyClass.add( 'ptr-refresh' );
		} else {
			bodyClass.remove( 'ptr-refresh' );
		}
	};

	/**
	 * Determine how to animate and position elements when the dragend event fires.
	 * 
	 * @param {object} e - Event object
	 */
	var _dragEnd = function(e) {
		if ( ! drag.enabled )
			return;

		// e.gesture.preventDefault();

		// options.contentEl.style.transform = options.contentEl.style.webkitTransform = '';
		// options.ptrEl.style.transform = options.ptrEl.style.webkitTransform = '';

		// var delta = drag.distance - options.ptrEl.offsetHeight;
		// var count = 0;
		// var step = setInterval(function() {
		// 	var dist = delta - (count / 30 * delta);
		// 	options.contentEl.style.transform = options.contentEl.style.webkitTransform = 'translate3d( 0, ' + dist + 'px, 0 )';
		// 	if (count == 30)
		// 		clearInterval(step);
		// 	count++;
		// }, 10);

		if ( document.body.classList.contains( 'ptr-refresh' ) ) {
			_doLoading();
		} else {
			_doAbort();
		}

		drag.enabled = false;
	};

	/**
	 * Position content and refresh elements to show that loading is taking place.
	 */
	var _doLoading = function() {

		h.off( 'dragstart' );
		h.off( 'dragdown'  );
		h.off( 'dragend' );

		bodyClass.add( 'ptr-loading' );

		// If no valid loading function exists, just reset elements
		if ( ! options.loadingFunction ) {
			return _doReset();
		}

		// The loading function should return a promise
		var loadingPromise = options.loadingFunction();

		// For UX continuity, make sure we show loading for at least one second before resetting
		setTimeout( function() {
			// Once actual loading is complete, reset pull to refresh
			loadingPromise.then( _doReset );
		}, 1000);
	};

	/**
	 * Reset all elements to their starting positions before any dragging took place.
	 */
	var _doReset = function() {
		// var bodyClassRemove = function() {
		// 	bodyClass.remove( 'ptr-reset' );
		// 	bodyClass.remove( 'ptr-loading' );
		// 	bodyClass.remove( 'ptr-collapse' );
		// 	document.body.removeEventListener( 'transitionend', bodyClassRemove, false );
		// };

		// document.body.addEventListener( 'transitionend', bodyClassRemove, false );

		// bodyClass.add( 'ptr-reset' );
		bodyClass.remove( 'ptr-refresh' );
		// bodyClass.add( 'ptr-collapse' );

		h.on( 'dragstart', _dragStart );
		h.on( 'dragdown', _dragDown );
		h.on( 'dragend', _dragEnd );
	};

	var _doAbort = function() {
		// var bodyClassRemove = function() {
		// 	bodyClass.remove( 'ptr-abort' );
		// 	document.body.removeEventListener( 'transitionend', bodyClassRemove, false );
		// };

		// document.body.addEventListener( 'transitionend', bodyClassRemove, false );

		// bodyClass.add( 'ptr-abort' );
	};

	return {
		init: init
	}

})();