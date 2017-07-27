inspector-remote - connect to a remote inspector that uses the inspector APIs
================================================================================

Node.js version 8.x adds a new built-in package [`inspector`][node 8 inspector],
which provides the capability of managing and using the in-process Node.js
inspector, for debugging.

Another interesting use-case is providing an interface to deal with remote
inspectors - Node.js processes which have the
[inspector option enabled][node 8 inspector cli options] for debugging
out-of-process.

This package provides a set of functions which will return an object
with the a similar interface to the
[Node.js Inspector::session object][inspector.session], which can be used to
debug in-process or out-of-process.

[node 8 inspector]: https://nodejs.org/dist/latest-v8.x/docs/api/inspector.html
[node 8 inspector cli options]: https://nodejs.org/dist/latest-v8.x/docs/api/cli.html#cli_inspect_host_port
[inspector.session]: https://nodejs.org/dist/latest-v8.x/docs/api/inspector.html#inspector_constructor_new_inspector_session


usage
================================================================================



install
================================================================================

    npm install pmuellr/inspector-remote

api
================================================================================

This package exports the following function:

### `createSession (url)`

This function creates either a local or remote session, depending on whether
the `url` parameter is `null` or not.  If `null`, it creates a local session.
If not `null`, creates a remote session.

The `url` parameter can be a [`url`][url] object, or a string which will be
parsed with [`url.parse()`][url.parse].

A local session connects to the debugger available in-process.

A remote session connects to an inspector socket via WebSocket.

Both sessions have the same interface, which is very similar to
[Node.js inspector Session objects][inspector.session], with the following
differences:

* a read-only `url` property is available, which has the value of the `url`
 parameter used to create the session

* the `connect()` and `disconnect()` methods take a callback parameter, and
 will call the callback with an error parameter instead of throwing
 exceptions directly.


[url]: https://nodejs.org/dist/latest-v6.x/docs/api/url.html
[url.parse]: https://nodejs.org/dist/latest-v6.x/docs/api/url.html#url_url_parse_urlstring_parsequerystring_slashesdenotehost


license
================================================================================

This package is licensed under the MIT license.  See the
[LICENSE.md](LICENSE.md) file for more information.


contributing
================================================================================

Awesome!  We're happy that you want to contribute.

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.
