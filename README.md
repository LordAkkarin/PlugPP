Plug++
======
This script extends the service [plug.dj][plugdj] with useful new features.
The script currently includes the following features:

* Auto-Woot
* Auto-Join (for waitlists)
* Advanced Service-Notifications
* Desktop-Notifications (please refer to the [Supported Browsers][]-Section)
* Moderation Utilities
    * History Warnings
    * AFK Warnings

Supported Browsers
------------------
In general all browsers are supported which are capable of running [plug.dj][plugdj] can execute this script while some
features might be disabled automatically due to the fact that your browser does not provide these features.

The use of Firefox or Chrome is recommended.

Building
--------
This software used `grunt`. Please follow these steps to install the build tool:

1. Download & Install [node.js][nodejs]
1. Install the grunt CLI by issuing `npm install -g grunt-cli` from your command line

To build the package you need to follow these steps:

1. Install the dependencies by issuing `npm install` from the command line (in the project directory)
1. Issue `grunt` to start the process.

Additionally the build takes the following arguments:

* `baseURL` - Replaces the default base URL (http://localhost/Plug++/dist/) against a custom one. This is needed for loading graphics and other resources.
* `version` - Replaces the current application version against a custom version (by default it will use the version supplied by the `package.json` file).
* `versionSuffix` - Appends a custom string to the version (for usage in CI systems as example).

Terms of Use
--------------------
Please note that some features of this software might not go along well with the [plug.dj][plugdj] terms of use (tos).
While we always try to remove features which might collide with the terms the use of this software might still violate
the terms of use when used wrong. Please note that you are responsible when using this software. We can not guarantee
that your account won't be banned from the platform by using one or more features of this software (for more information
about warranties and liability please refer to the [license terms](LICENSE).

License
-------
This program is free software: you can redistribute it and/or modify
it under the terms of the [GNU Lesser General Public License][LGPL] as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
[GNU Lesser General Public License][LGPL] for more details.

You should have received a copy of the [GNU Lesser General Public License][LGPL]
along with this program.  If not, see <http://www.gnu.org/licenses/>.

[plugdj]: http://plug.dj
[nodejs]: http://nodejs.org/
[LGPL]: http://www.gnu.org/licenses/lgpl.txt