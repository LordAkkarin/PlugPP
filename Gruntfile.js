/**
 * Plug++ Grunt Buildfile
 * @author			Johannes Donath <johannesd@evil-co.com>
 * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>
 * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>
 */
module.exports = function (grunt) {
	'use strict';

	// configure project
	grunt.initConfig ({
		// include package.json
		pkg:			grunt.file.readJSON ('package.json'),

		// custom properties
		resourceBaseURL:	grunt.option ('baseURL') || 'http://localhost/Plug++/dist/',
		version:		grunt.option ('version') || null,
		versionSuffix:		grunt.option ('versionSuffix') || '',

		// configure build properties
		banner:			'/**\n' +
					' * Plug++ <%= pkg.version %> (compiled on <%= grunt.template.today("mm/dd/yyyy") %>)\n' +
					' * @copyright			Copyright (C) 2014 Evil-Co <http://www.evil-co.org>\n' +
					' * @license			GNU Lesser General Public License <http://www.gnu.org/licenses/lgpl.txt>\n' +
					' */\n',

		// configure tasks
		clean:			{
			dist:				['dist/']
		},
		concat:			{
			options:			{
				banner:					'<%= banner %>' +
									'define (\'Plug++/ResourceURL\', function () { \'use strict\'; return \'<%= resourceBaseURL %>\'; });\n' +
									'define (\'Plug++/Version\', function () { \'use strict\'; return \'<%= (version || pkg.version) + versionSuffix %>\'; });\n',
				stripBanners:				true
			},
			plugpp:			{
				src:					[
					'script/core.js',
					'script/api.js',
					'script/resource.js',
					'script/bootstrap.js'
				],
				dest:					'dist/script/plug-pp.js'
			},
			obfuscationMap:		{
				options:		{
					banner:						'obfuscationMapping(',
					footer:						');'
				},

				src:					'script/obfuscation.json',
				dest:					'dist/script/obfuscation.json'
			}
		},
		copy:			{
			images:				{
				src:					['image/*.png', 'image/*.jpg', 'image/*.jpeg'],
				dest:					'dist/'
			}
		},
		csslint:		{
			options:			{
				csslintrc:				'less/.csslintrc'
			},
			src:						'dist/style/plug-pp.css'
		},
		jshint:			{
			options:			{
				jshintrc:				'script/.jshintrc'
			},

			// configure file categories
			grunt:				{
				src:					'Gruntfile.js'
			},
			src:				{
				src:					'script/*.js'
			}
		},
		less:			{
			compile:			{
				options:				{
					strictMath:				true,
					sourceMap:				true,
					outputSourceFiles:			true,
					sourceMapURL:				'plug-pp.css.map',
					sourceMapFilename:			'dist/style/plug-pp.css.map'
				},
				files:					{
					'dist/style/plug-pp.css':		'less/plug-pp.less'
				}
			},
			minify:				{
				options:				{
					cleancss:				true,
					report:					'min'
				},
				files:					{
					'dist/style/plug-pp.min.css':		'dist/style/plug-pp.css'
				}
			}
		},
		uglify:			{
			options:			{
				report:					'min'
			},
			plugpp:				{
				options:				{
					banner:					'<%= banner %>',
					sourceMap:				true
				},
				src:					'<%= concat.plugpp.dest %>',
				dest:					'dist/script/plug-pp.min.js'
			}
		},
		wrapFile:		{
			options:		{
				src:					'script/obfuscation.json',
				dest:					'dist/script/obfuscation.json',
				prefix:					'obfuscationMapping(',
				suffix:					');'
			}
		}
	});

	// load tasks
	require('load-grunt-tasks') (grunt, {scope: 'devDependencies'});

	// register internal tasks
	grunt.registerTask ('version', function () {
		grunt.file.write ('dist/script/version.json', grunt.template.process ('version (\'<%= pkg.version %>\');'));
	});

	// default task
	grunt.registerTask ('default', ['clean', 'jshint', 'less', 'concat', 'uglify', 'csslint', 'copy', 'version']);
};