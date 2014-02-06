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
		USER_POLL:	60000,
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
				moderator:		{
					historyNotification:		true
				}
			},

			autoWoot:		{
				delay:			0
			}
		},

		/**
		 * Stores all internal event timers.
		 */
		timers:			{
			pollUser:		null,
			updateCheck:		null
		},

		timeouts:		{
			autoWoot:		null
		},

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
			if (typeof ModificationAPI.getStorage ('options') == 'object') {
				this.options = _.extend (this.options, (ModificationAPI.getStorage ('options') || { }));
			}

			// register events and timers
			this.registerTimers ();
			this.registerEvents ();

			// notify user
			ModificationAPI.notifyChat ('system', 'Loaded Plug++ v' + Version, null);

			// debug log
			this.debug ('Running as user ' + this.user.username);
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
		 * Handles DJ Advance events.
		 * @param data
		 */
		onDjAdvance:		function (data) {
			// auto woot
			if (this.options.components.autoWoot) {
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

			// history check
			if (this.options.components.moderator.historyNotification) {
				// get history from API
				ModificationAPI.getHistory ();
			}
		},

		/**
		 * Polls the current user instance.
		 */
		pollUser:		function () {
			this.user = API.getUser ();
		},

		/**
		 * Registers all API events.
		 */
		registerEvents:		function () {
			ModificationAPI.registerEvent (API.DJ_ADVANCE, this.onDjAdvance, this);
		},

		/**
		 * Registers all internal timers.
		 */
		registerTimers:		function () {
			// execute timer functions
			this.pollUser ();
			this.updateCheck ();

			// register interval
			this.timers.pollUser = window.setInterval (this.pollUser, POLL_RATES.USER_POLL);
			this.timers.updateCheck = window.setInterval (this.updateCheck, POLL_RATES.UPDATE_CHECK);
		},

		/**
		 * Shuts down all components.
		 */
		shutdown:		function () {
			// notify user
			ModificationAPI.notifyChat ('system', 'Disabling Plug++ ...', null);

			// store settings
			ModificationAPI.setStorage ('options', this.options);

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
			window.clearInterval (this.timers.pollUser);
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