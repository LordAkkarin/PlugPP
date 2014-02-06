/**
 * Plug++ API
 * @author			Johannes Donath <johannesd@evil-co.com>
 * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>
 * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>
 */
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

			return window.localStorage.getItem (key);
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
		notifyRequestPermissions:	function (callback) {
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
		 * Updates a storage key.
		 * @param key
		 * @param data
		 */
		setStorage:			function (key, data) {
			window.localStorage.setItem (key, data);
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