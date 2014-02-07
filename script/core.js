/**
 * Plug++ Core
 * @author			Johannes Donath <johannesd@evil-co.com>
 * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>
 * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>
 */
define ('Plug++/Core', ['jquery', 'underscore', 'Plug++/Version', 'Plug++/API', 'Plug++/ResourceLoader', 'Plug++/dependency/Class'], function ($, _, Version, ModificationAPI, ResourceLoader, Class) {
	'use strict';

	// constants
	var POLL_RATES = {
		UPDATE_CHECK:	900000
	};

	// cache
	var CACHE = {
		notificationVersion:	null
	};

	/**
	 * Plug++ Core
	 */
	return Class.extend ({

		/**
		 * Stores application options.
		 */
		options:		{
			components:		{
				autoWoot:		false,
				autoJoin:		false,
				moderator:		{
					historyNotification:		true
				},
				notification:		false,
				desktopNotification:	false
			},

			autoWoot:		{
				delay:			0
			}
		},

		/**
		 * Stores the stylesheet element.
		 */
		stylesheet:		null,

		/**
		 * Stores all internal event timers.
		 */
		timers:			{
			updateCheck:		null
		},

		/**
		 * Stores all timeout IDs.
		 */
		timeouts:		{
			autoWoot:		null
		},

		/**
		 * Stores the UI root element.
		 */
		ui:			null,

		/**
		 * Stores the current plug.dj user.
		 */
		user:			null,

		/**
		 * Initializes the core.
		 */
		init:			function () {
			// verify application state
			this.verifyAPI ();

			// load options
			this.options = _.extend (this.options, (JSON.parse (ModificationAPI.getStorage ('options')) || { }));

			// register events and timers
			this.registerTimers ();
			this.registerEvents ();

			this.injectUI ();

			// notify user
			ModificationAPI.notifyChat ('system', 'Loaded Plug++ v' + Version, null);

			// debug log
			this.debug ('Running as user ' + ModificationAPI.getUser ().username);
		},

		/**
		 * Prints a debug message.
		 * @param message
		 */
		debug:			function (message) {
			if (!!console) {
				console.debug (message);
			}
		},

		/**
		 * Injects the UI template.
		 */
		injectUI:		function () {
			// append stylesheets
			this.stylesheet = $('<link rel="stylesheet" type="text/css" href="' + ResourceLoader.get ('style', 'plug-pp.min.css') + '?cache=' + Math.floor (Math.random () * 100) + '" />');

			// append to document
			$('head').append (this.stylesheet);

			// append element to document
			$('body').append (
				'<div id="plugPP">' +
					'<ul id="plugPPNavigation">' +
						'<li class="plug-pp-button"><a id="plugpp-autowoot" class="plug-pp-button-autowoot"></a></li>' +
						'<li class="plug-pp-button"><a id="plugpp-autojoin" class="plug-pp-button-autojoin"></a></li>' +
						'<li class="plug-pp-button"><a id="plugpp-notification" class="plug-pp-button-notification"></a></li>' +
						'<li class="plug-pp-button"><a id="plugpp-desktop-notification" class="plug-pp-button-desktop-notification"></a></li>' +
						'<li class="plug-pp-button"><a id="plugpp-moderator" class="plug-pp-button-moderator"></a></li>' +
					'</ul>' +
				'</div>'
			);

			// get root element
			this.ui = $('#plugPPNavigation');

			// enable/disable options
			if (!ModificationAPI.hasPermission (null, ModificationAPI.getRole ('bouncer'))) {
				$('#plugpp-moderator').addClass ('disabled');

				// disable component
				this.options.components.moderator.historyNotification = false;
			}

			if (!ModificationAPI.isNotificationAvailable ()) {
				$('#plugpp-desktop-notification').addClass ('disabled');

				// disable component
				this.options.components.desktopNotification = false;
			}

			// update based on stored settings
			if (this.options.components.autoWoot) {
				$('#plugpp-autowoot').addClass ('enabled');
			}

			if (this.options.components.autoJoin) {
				$('#plugpp-autojoin').addClass ('enabled');
			}

			if (this.options.components.notification) {
				$('#plugpp-notification').addClass ('enabled');
			}

			if (this.options.components.desktopNotification) {
				$('#plugpp-desktop-notification').addClass ('enabled');
			}

			if (this.options.components.moderator.historyNotification) {
				$('#plugpp-moderator').addClass ('enabled');
			}

			// hook links
			$('#plugpp-autowoot').click ($.proxy (function () {
				if ($('#plugpp-autwoot').hasClass ('disabled')) {
					return;
				}

				this.options.components.autoWoot = !this.options.components.autoWoot;

				if (this.options.components.autoWoot) {
					$('#plugpp-autowoot').addClass ('enabled');

					// woot
					if (ModificationAPI.getUser ().vote === 0) {
						ModificationAPI.votePositive ();
					}
				} else {
					$('#plugpp-autowoot').removeClass ('enabled');
				}

				// update options
				this.saveOptions ();
			}, this));

			$('#plugpp-autojoin').click ($.proxy (function () {
				if ($('#plugpp-autojoin').hasClass ('disabled')) {
					return;
				}

				// negate
				this.options.components.autoJoin = !this.options.components.autoJoin;

				// modify button
				if (this.options.components.autoJoin) {
					$('#plugpp-autojoin').addClass ('enabled');

					// join queue
					ModificationAPI.joinWaitList ();
				} else {
					$('#plugpp-autojoin').removeClass ('enabled');
				}

				// update options
				this.saveOptions ();
			}, this));

			$('#plugpp-notification').click ($.proxy (function () {
				if ($('#plugpp-notification').hasClass ('disabled')) {
					return;
				}

				// negate
				this.options.components.notification = !this.options.components.notification;

				// TODO: Add settings for every notification type

				// modify button
				if (this.options.components.notification) {
					$('#plugpp-notification').addClass ('enabled');
				} else {
					$('#plugpp-notification').removeClass ('enabled');
				}

				// update options
				this.saveOptions ();
			}, this));

			$('#plugpp-desktop-notification').click ($.proxy (function () {
				if ($('#plugpp-desktop-notification').hasClass ('disabled')) {
					return;
				}

				this.options.components.desktopNotification = !this.options.components.desktopNotification;

				// TODO: Add settings for every notification type

				// request permissions
				if (this.options.components.desktopNotification) {
					if (!ModificationAPI.notifyRequestPermissions (function () {
						$('#plugpp-desktop-notification').addClass ('enabled');
					}, function () {
						$('#plugpp-desktop-notification').addClass ('disabled');
					})) {
						$('#plugpp-desktop-notification').addClass ('disabled');
					}
				} else {
					$('#plugpp-desktop-notification').removeClass ('enabled');
				}

				// update options
				this.saveOptions ();
			}, this));

			$('#plugpp-moderator').click ($.proxy (function () {
				if ($('#plugpp-moderator').hasClass ('disabled')) {
					return;
				}

				// negate
				this.options.components.moderator.historyNotification = !this.options.components.moderator.historyNotification;

				// modify button
				if (this.options.components.moderator.historyNotification) {
					$('#plugpp-moderator').addClass ('enabled');
				} else {
					$('#plugpp-moderator').removeClass ('enabled');
				}

				// update options
				this.saveOptions ();
			}, this));
		},

		/**
		 * Handles chat events.
		 * @param data
		 */
		onChat:			function (data) {
			// handle mentions
			if (data.type === 'mention' && this.options.components.desktopNotification) {
				ModificationAPI.notifyImportant ('Mentioned by ' + data.from, data.message, ResourceLoader.get ('image', 'mention.png'));
			}
		},

		/**
		 * Handles DJ Advance events.
		 * @param data
		 */
		onDjAdvance:		function (data) {
			// auto woot
			if (this.options.components.autoWoot && data !== null) {
				// clear previous auto woot
				if (this.timeouts.autoWoot !== null) {
					window.clearTimeout (this.timeouts.autoWoot);
				}

				// queue new autowoot
				if (this.options.autoWoot.delay === 0) {
					// vote
					ModificationAPI.votePositive ();

					// log
					this.debug ('AutoWoot!');
				} else {
					this.timeouts.autoWoot = window.setTimeout ($.proxy (function () {
						// vote
						ModificationAPI.votePositive ();

						// log
						this.debug ('AutoWoot!');

						// reset timeout
						this.timeouts.autoWoot = null;
					}, this), this.options.autoWoot.delay);
				}
			}

			// auto join
			if (this.options.components.autoJoin) {
				ModificationAPI.joinWaitList ();
			}

			// history check
			if (this.options.components.moderator.historyNotification && data !== null) {
				// get history from API
				var history = ModificationAPI.getHistory ();

				$(history).each ($.proxy (function (index, value) {
					// skip first element (e.g. current track)
					if (index === 0) {
						return true;
					}

					// check ID (pretty obvious)
					// TODO: Add verification of the title (90% match)
					if (data.media.id === value.id) {
						ModificationAPI.notifyChat ('system', 'This song is already in the history (' + (index + 1) + ' out of ' + history.length + '). <a href="javascript:window.PlugPP.skipTrack ();">Click here to skip</a>');

						// break out of each ()
						return false;
					}
				}, this));
			}
		},

		/**
		 * Registers all API events.
		 */
		registerEvents:		function () {
			ModificationAPI.registerEvent (API.DJ_ADVANCE, this.onDjAdvance, this);
			ModificationAPI.registerEvent (API.CHAT, this.onChat, this);
		},

		/**
		 * Registers all internal timers.
		 */
		registerTimers:		function () {
			// execute timer functions
			this.updateCheck ();

			// register interval
			this.timers.updateCheck = window.setInterval (this.updateCheck, POLL_RATES.UPDATE_CHECK);
		},

		/**
		 * Saves the options.
		 */
		saveOptions:		function () {
			ModificationAPI.setStorage ('options', JSON.stringify (this.options));
		},

		/**
		 * Shuts down all components.
		 */
		shutdown:		function () {
			// notify user
			ModificationAPI.notifyChat ('system', 'Disabling Plug++ ...', null);

			// store settings
			this.saveOptions ();

			if (!!this.stylesheet) {
				this.stylesheet.remove (this.stylesheet);
			}

			if (!!this.ui) {
				this.ui.remove ();
			}

			// un-register events and timers
			this.unregisterTimers ();
			this.unregisterEvents ();

			// delete definitions
			requirejs.undef ('Plug++/Core');
			requirejs.undef ('Plug++/API');
			requirejs.undef ('Plug++/ResourceLoader');
			requirejs.undef ('Plug++/ResourceURL');

			// undefine global copy
			delete window.PlugPP;
		},

		/**
		 * Un-Registers all API events.
		 */
		unregisterEvents:	function () {
			ModificationAPI.unregisterEvent (API.DJ_ADVANCE, this.onDjAdvance, this);
		},

		/**
		 * Un-Registers all internal timers.
		 */
		unregisterTimers:	function () {
			window.clearInterval (this.timers.updateCheck);
		},

		/**
		 * Checks for application updates
		 */
		updateCheck:		function () {
			$.ajax (ResourceLoader.get ('script', 'version.json'), {
				dataType:	'jsonp',
				jsonpCallback:	'version',
				success:	$.proxy (function (newVersion) {
					if (newVersion !== Version && CACHE.notificationVersion != newVersion) {
						ModificationAPI.notifyChat ('system', 'Plug++ version ' + newVersion + ' has been released.');
						CACHE.notificationVersion = newVersion;
					}
				}, this)
			});
		},

		/**
		 * Verifies the API state.
		 */
		verifyAPI:		function () {
			// verify definition
			if (window.API === undefined) {
				throw 'The plug.dj API is currently not available. Please try again later and verify that you are on the correct website.';
			}

			// verify state
			if (!window.API.enabled) {
				throw 'The plug.dj API is not yet initialized. Please try again later.';
			}

			// log
			if (!!console) {
				console.info ('The plug.dj API seems to be enabled and healthy.');
			}
		}
	});
});