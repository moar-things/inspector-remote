inspector-remote - connect to a remote inspector that uses the inspector APIs
================================================================================

Node.js version 8.x adds a new built-in package [`inspector`][node 8 inspector],
which provides the capability of managing and using the in-process Node.js
inspector, for debugging.

Another interesting use-case if providing an interface to deal with remote
inspectors - Node.js processes which have the
[inspector option enabled][node 8 inspector cli options] for debugging
out-of-process.

This package provides a set of functions which will return an object
with the same interface as the
[Node.js Inspector::session object][inspector.session].

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

This package exports the following functions:

### `connect (url, callback)`

This function attempts to connect to the inspector port specified in the url,
and will call the callback on success or error.

The `url` parameter can be a [`url`][url] object, or a string which will be
parsed with [`url.parse()`][url.parse].

The callback will be invoked with arguments (`err`, `session`), where
`session` is a session object described below.


session objects
--------------------------------------------------------------------------------

Session objects are intended to provide the same API as the
[Node.js Inspector::session object][inspector.session].  The differences are
described below.

### event: `close`

_(additional event not in the Node session object)_

This event is emitted when the connection to the remote inspector has been
closed.

### method: `connect()`

_(existing method with different semantics than the Node session object)_

This method is a no-op.

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
