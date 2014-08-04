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
			var versionMismatch = false;
		
			// loop through dependencies
			$(data).each (function (index, element) {
				// verify version
				if (!requirejs.defined (element.mapping)) {
					// log
					if (!!console) console.info ('Could not find dependency ' + element.name + ' (' + element.mapping + ').');
				
					// stop execution
					versionMismatch = true;
					return;
				}
			
				// create alias for dependency
				define ('Plug++/dependency/' + element.name, [element.mapping], function (obj) {
					return obj;
				});
			});
			
			// handle version mismatches
			if (versionMismatch) {
				// log error
				if (!!API)
					API.chatLog ('The Plug++ obfuscation mappings have not been updated yet. Please report this error at https://github.com/LordAkkarin/PlugPP/issues');
				else if (!!console)
					console.info ('The Plug++ obfuscation mappings have not been updated yet. Please report this error at https://github.com/LordAkkarin/PlugPP/issues');
				
				// stop bootstrapping
				return;
			}

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