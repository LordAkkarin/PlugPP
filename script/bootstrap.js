/**
 * Plug++ Core
 * @author			Johannes Donath <johannesd@evil-co.com>
 * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>
 * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>
 */
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