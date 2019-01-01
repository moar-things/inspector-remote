inspector-remote - local/remote inspector session connector
================================================================================

Node.js version 8.x includes a new built-in package [`inspector`][node inspector],
which provides the capability of managing and using the in-process Node.js
inspector, for debugging your own app, while it's running.

Another interesting debugging use-case is providing an interface to deal with
other Node.js processes via the remote inspector - Node.js processes which have
the [inspector option enabled][node inspector cli options] for debugging
out-of-process.

This package provides a function which will return an object with a similar
interface to the
[Node.js inspector Session object][inspector.session], which can be used to
debug in-process or out-of-process.

That Session object can be used to invoke methods, and listen to events,
as described in the [Chrome DevTools Protocol Viewer][cdt-protocol-viewer].

[node inspector]: https://nodejs.org/dist/latest-v10.x/docs/api/inspector.html
[node inspector cli options]: https://nodejs.org/dist/latest-v10.x/docs/api/cli.html#cli_inspect_host_port
[inspector.session]: https://nodejs.org/dist/latest-v10.x/docs/api/inspector.html#inspector_constructor_new_inspector_session
[cdt-protocol-viewer]: https://chromedevtools.github.io/devtools-protocol/v8/


example usage
================================================================================

The following function will will generate a 5-second CPU profile from a
remote Node.js program by passing it's inspector URL as the parameter (eg, `http://localhost:9229`):

_(a complete script using this function is available in the git repo as `test/profile.js`)_

```js
async function generateProfile (url) {
  if (url == null) throw new Error('url parameter required')

  const session = inspectorRemote.createSession(url)

  await session.connect()

  await session.post('Runtime.runIfWaitingForDebugger')
  await session.post('Profiler.enable')
  await session.post('Profiler.setSamplingInterval', { interval: 100 })
  await session.post('Profiler.start')

  await sleep(5)

  const profile = await session.post('Profiler.stop')

  await session.disconnect()
  console.log(JSON.stringify(profile, null, 4))
}
```


install
================================================================================

    npm install moar-things/inspector-remote


api
================================================================================

This package exports the following properties:

* `version` - the version of the package

This package exports the following function:

### `createSession (url)`

This function creates either a local or remote session, depending on whether
the `url` parameter is `null` or not.  If `null`, it creates a local session.
If not `null`, creates a remote session.

If a local session is requested, but the runtime does not support local sessions,
`null` will be returned.

The `url` parameter can be a [`url`][url] object, or a string.  The
url should use the `http:` protocol, so when running a program locally
with the `--inspect` option, which by default uses port 9229, you would
specify the url as `http://localhost:9229`.

A local session connects to the debugger available in-process.  Local
sessions can only be created for Node.js runtimes that support the built-in
`inspector` package (ie, Node.js versions >= 8.x.x). The `createSession()`
function will return `null` if a local session cannot be created.

A remote session connects to an inspector socket via WebSocket.

Both sessions have the same interface, which is very similar to
[Node.js inspector Session objects][inspector.session], with the following
differences:

* a read-only `url` property is available, which has the value of the `url`
  parameter used to create the session

* a read-only `isConnected` property is available, which is true if the session
  is connected, and false if it isn't

* the `connect()` and `disconnect()` methods return a promise of null which is
  resolved when complete, or rejected if an error occurs

* the events `connected` and `disconnected` are available, whose only arguments
  are the session object

* the `post(method, params)` method returns a promise on the result and does
  not take a callback

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
