/**
 * Plug++ 1.0.0 (compiled on 03/14/2014)
 * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>
 * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>
 */
define ('Plug++/ResourceURL', function () { 'use strict'; return 'lordakkarin.github.io/PlugPP/dist/'; });
define ('Plug++/Version', function () { 'use strict'; return '1.0.0'; });
define ('Plug++/Core', ['jquery', 'underscore', 'Plug++/Version', 'Plug++/API', 'Plug++/ResourceLoader', 'Plug++/dependency/Class'], function ($, _, Version, ModificationAPI, ResourceLoader, Class) {
	'use strict';

		// constants
	var	POLL_RATES = {
			UPDATE_CHECK:			900000
		},

		// cache
		CACHE = {
			notificationVersion:	null
		},

		// queue notification cache
		QUEUE_NOTIFICATION_CACHE = null;


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
				if (data === null || data.dj === null || (data.dj.id !== ModificationAPI.getUser ().id)) {
					ModificationAPI.joinWaitList ();
				}
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
						// notify via chat
						ModificationAPI.notifyChat ('system', 'This song is already in the history (' + (index + 1) + ' out of ' + history.length + '). <a href="javascript:window.PlugPP.skipHistoryTrack (' + index + 1 + ', ' + history.length + ');">Click here to skip</a>');

						// notify via desktop notification
						if (this.options.components.desktopNotification) {
							ModificationAPI.notifyImportant ('Song in History', data.dj.username + ' is playing a song which has been played recently (' + (index + 1) + ' out of ' + history.length + ').', ResourceLoader.get ('image', 'history.png'));
						}

						// break out of each ()
						return false;
					}
				}, this));
			}
		},

		/**
		 * Handles history updates.
		 * @param history
		 */
		onHistoryUpdate:	function (history) {
			if ((this.options.components.desktopNotification || this.options.components.notification) && (API.getNextMedia () && API.getNextMedia ().inHistory) && QUEUE_NOTIFICATION_CACHE != API.getNextMedia ().media.id) {
				// normal notification
				if (this.options.components.notification) {
					ModificationAPI.notify ('Your queued track (' + API.getNextMedia ().media.title + ') has been played recently.');
				}

				// desktop notification
				if (this.options.components.desktopNotification) {
					ModificationAPI.notifyImportant ('History Notification', 'Your queued track (' + API.getNextMedia ().media.title + ') has been played recently.', ResourceLoader.get ('image', 'history.png'));
				}

				// store in cache
				QUEUE_NOTIFICATION_CACHE = API.getNextMedia ().media.id;
			}
		},

		/**
		 * Registers all API events.
		 */
		registerEvents:		function () {
			ModificationAPI.registerEvent (API.DJ_ADVANCE, this.onDjAdvance, this);
			ModificationAPI.registerEvent (API.CHAT, this.onChat, this);
			ModificationAPI.registerEvent (API.HISTORY_UPDATE, this.onHistoryUpdate, this);
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
		 * Skips a track which has already been played.
		 * @param index
		 * @param length
		 */
		skipHistoryTrack:	function (index, length) {
			var username = API.getDJ ().username;

			// skip track
			ModificationAPI.moderateSkip ();

			// notify user
			ModificationAPI.sendChat ('@' + username + ' song was in history (' + index + ' out of ' + length + ')');
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
define ('Plug++/API', ['jquery', 'Plug++/ResourceLoader', 'Plug++/dependency/Context', 'Plug++/dependency/PopoutView'], function ($, ResourceLoader, Context, PopoutView) {
	'use strict';

	/**
	 * API Wrapper
	 */
	return {
		/**
		 * Cleans up a message content.
		 * @param message
		 * @returns {XML|string|void}
		 */
		cleanMessage:			function (message) {
			// define allowed tags & tag regex
			var	allowedTags = ['span', 'div', 'table', 'tr', 'td', 'br', 'br/', 'strong', 'em', 'a'],
				tagRegex = /<\/?([a-z][a-z0-9]*)\b[\^>]*>/gi;

			// replace tags
			return message.replace (tagRegex, function(a, b) {
				return allowedTags.indexOf (b.toLowerCase()) > -1 ? a : '';
			});
		},

		/**
		 * Clears out the whole chat.
		 */
		clearChat:			function () {
			(PopoutView._window ? $(PopoutView._window.document).find('#chat-messages') : $('#chat-messages')).html ('').scrollTop (0);
			this.notifyChat ('system', 'The chat has been cleared.', null);
		},

		/**
		 * Returns the room history.
		 * @returns {*}
		 */
		getHistory:			function () {
			return API.getHistory ();
		},

		/**
		 * Returns the role.
		 * @param key
		 * @returns {*}
		 */
		getRole:			function (key) {
			return API.ROLE[key.toUpperCase ()];
		},

		/**
		 * Returns an element from the application storage object.
		 * @param key
		 * @returns {*}
		 */
		getStorage:			function (key) {
			if (!this.isStorageAvailable()) {
				return null;
			}

			return window.localStorage.getItem ('pp-' + key);
		},

		/**
		 * Returns the user object for a specific user.
		 * @param userID
		 * @returns {*}
		 */
		getUser:			function (userID) {
			return API.getUser (userID);
		},

		/**
		 * Checks whether a user has at least the supplied permission level.
		 * @param userID
		 * @param role
		 */
		hasPermission:			function (userID, role) {
			return API.hasPermission (userID, role);
		},

		/**
		 * Checks whether the Notification API is available.
		 * @returns {boolean}
		 */
		isNotificationAvailable:	function () {
			// verify API
			return (window.Notification !== undefined && window.Notification !== null);

		},

		/**
		 * Checks whether the storage API is available.
		 * @returns {boolean}
		 */
		isStorageAvailable:		function () {
			try {
				return (window.localStorage !== undefined && window.localStorage !== null);
			} catch (error) {
				return false;
			}
		},

		/**
		 * Tries to join the wait list.
		 */
		joinWaitList:			function () {
			if (this.getUser ().wlIndex !== undefined && this.getUser ().wlIndex > -1) {
				return;
			}

			$('#dj-button').click ();
		},

		/**
		 * Skips the current track.
		 */
		moderateSkip:			function () {
			API.moderateSkip ();
		},

		/**
		 * Notifies a user.
		 * @param message
		 * @param icon
		 */
		notify:				function (message, icon) {
			// set default icon
			if (!icon) {
				icon = 'icon-chat-system';
			}

			// trigger notification
			Context.trigger ('notify', icon, message);
		},

		/**
		 * Notifies a user through the chat.
		 * @param type
		 * @param message
		 * @param color
		 */
		notifyChat:			function (type, message, color) {
			// verify message
			if (!message) {
				return;
			}

			// convert message if needed
			if (typeof message !== 'string') {
				message = message.html();
			}

			// clean up message
			message = this.cleanMessage(message);

			// get chat, new scroll position, correct message and message text
			var	$chat = PopoutView._window ? $(PopoutView._window.document).find('#chat-messages') : $('#chat-messages'),
				scrollPosition = $chat.scrollTop() > $chat[0].scrollHeight - $chat.height() - 20,
				$message = $('<div>').addClass((type || 'update')),
				$text = $('<span>').addClass('text').html(message);

			// add icon and color
			if (type === 'system') {
				$message.append('<i class="icon icon-chat-system"></i>');
			} else {
				$text.css('color', ((color || 'd1d1d1')).toRGB());
			}

			// append message
			$chat.append($message.append($text));

			// update scroll position
			if (scrollPosition) {
				$chat.scrollTop($chat[0].scrollHeight);
			}
		},

		/**
		 * Sends an important notification.
		 * @param title
		 * @param message
		 * @param icon
		 */
		notifyImportant:		function (title, message, icon) {
			// verify API
			if (!this.isNotificationAvailable ()) {
				this.notify (title + '<br />' + message, null);
				return;
			}

			// set default icon
			if (!icon) {
				icon = ResourceLoader.get ('image', 'notification.png');
			}

			// trigger notification
			var notification = new Notification (title, {
				body:		message,
				icon:		icon
			});
		},

		/**
		 * Requests notification API permissions.
		 * @returns {boolean}
		 */
		notifyRequestPermissions:	function (callback, denyCallback) {
			if (!this.isNotificationAvailable ()) {
				return false;
			}

			// check permission
			if (Notification.permission === 'granted') {
				// issue callback
				callback ();

				// yep everything is fine
				return true;
			}

			// check whether we need to reqquest permissions
			if (Notification.permission !== 'denied') {
				// request permission
				Notification.requestPermission (function (permission) {
					// store value (chrome workaround)
					if (Notification.permission === undefined) {
						Notification.permission = permission;
					}

					// issue callback
					if (permission === 'granted' && callback !== undefined && callback !== null) {
						callback ();
					}

					// issue deny callback
					if (permission === 'denied' && denyCallback !== undefined && denyCallback !== null) {
						denyCallback ();
					}
				});
			}

			// yep it is supported!
			return true;
		},

		/**
		 * Registers an event.
		 * @param eventName
		 * @param callback
		 */
		registerEvent:			function (eventName, callback, context) {
			API.on (eventName, callback, context);
		},

		/**
		 * Sends a message.
		 * @param message
		 */
		sendChat:			function (message) {
			API.sendChat (message);
		},

		/**
		 * Updates a storage key.
		 * @param key
		 * @param data
		 */
		setStorage:			function (key, data) {
			window.localStorage.setItem ('pp-' + key, data);
		},

		/**
		 * Un-Registers an event.
		 * @param eventName
		 * @param callback
		 * @param context
		 */
		unregisterEvent:		function (eventName, callback, context) {
			API.off (eventName, callback, context);
		},

		/**
		 * Votes positive (woots).
		 */
		votePositive:			function () {
			$('#woot').click ();
		}
	};
});
define ('Plug++/ResourceLoader', ['Plug++/ResourceURL'], function (BaseURL) {
	'use strict';

	/**
	 * ResourceLoader class.
	 */
	return {
		/**
		 * Returns a resource path.
		 * @param category
		 * @param resource
		 * @returns {string}
		 */
		get:			function (category, resource) {
			return this.getBaseUrl () + category + '/' + resource;
		},

		/**
		 * Returns the correct base URL.
		 * @returns {*}
		 */
		getBaseUrl:		function () {
			return BaseURL;
		}
	};

});
require (['jquery', 'Plug++/ResourceLoader'], function ($, ResourceLoader) {
	'use strict';

	// inject dependencies
	$.ajax (ResourceLoader.get ('script', 'obfuscation.json'), {
		dataType:	'jsonp',
		jsonpCallback:	'obfuscationMapping',
		success:	function (data) {
			// loop through dependencies
			$(data).each (function (index, element) {
				// create alias for dependency
				define ('Plug++/dependency/' + element.name, [element.mapping], function (obj) {
					return obj;
				});
			});

			// bootstrap
			require (['Plug++/Core'], function (PlugPP) {
				// shut down old version
				if (window.PlugPP !== undefined) {
					// log
					if (!!console) {
						console.info ('Unloading old Plug++ instance ...');
					}

					// unload old instance
					window.PlugPP.shutdown ();
				}

				// start a new instance
				window.PlugPP = new PlugPP ();
			});
		},
		error:		function (xhr, errorString, exceptionString) {
			console.error ('Whoops: ' + errorString + '; ' + exceptionString);
		}
	});
});