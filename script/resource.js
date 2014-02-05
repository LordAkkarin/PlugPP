/**
 * Plug++ API
 * @author			Johannes Donath <johannesd@evil-co.com>
 * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>
 * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>
 */
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