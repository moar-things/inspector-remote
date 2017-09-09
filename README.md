inspector-remote - connect to a remote inspector that uses the inspector APIs
================================================================================

Node.js version 8.x includes a new built-in package [`inspector`][node 8 inspector],
which provides the capability of managing and using the in-process Node.js
inspector, for debugging your own app, while it's running.

Another interesting debugging use-case is providing an interface to deal with
other Node.js processes via the remote inspector - Node.js processes which have
the [inspector option enabled][node 8 inspector cli options] for debugging
out-of-process.

This package provides a function which will return an object with the a similar
interface to the
[Node.js inspector Session object][inspector.session], which can be used to
debug in-process or out-of-process.

That session object can be used to invoke methods, and listen to events,
as described in the [Chrome DevTools Protocol Viewer][cdt-protocol-viewer].

[node 8 inspector]: https://nodejs.org/dist/latest-v8.x/docs/api/inspector.html
[node 8 inspector cli options]: https://nodejs.org/dist/latest-v8.x/docs/api/cli.html#cli_inspect_host_port
[inspector.session]: https://nodejs.org/dist/latest-v8.x/docs/api/inspector.html#inspector_constructor_new_inspector_session
[cdt-protocol-viewer]: https://chromedevtools.github.io/devtools-protocol/v8/


usage
================================================================================

The following script will generate a 3-second CPU profile from either a
remote Node.js program by passing it's inspector URL as the parameter (eg, `http://localhost:9229`), or the program itself by passing nothing:

_(this script is available in the git repo as `test/profile.js`)_

```js
'use strict'

const inspectorRemote = require('inspector-remote')

const url = process.argv[2]
const inProcess = url == null

if (inProcess) {
  console.error('debugging in-process')
} else {
  console.error(`debugging process at inspector port ${url}`)
}

const session = inspectorRemote.createSession(url)

if (inProcess && session == null) {
  console.error('unable to create in-process session - got Node 8?')
  process.exit(1)
}

session.connect(sessionConnected)

function sessionConnected (err) {
  if (err) return console.error(`unable to connect to session: ${err}`)

  session.post('Profiler.enable', profilerEnabled)
}

function profilerEnabled (err, result) {
  if (err) return console.error(`error enabling profiler: ${err}`)
  console.error(`Profiler.enable():`, result)

  session.post('Profiler.setSamplingInterval', { interval: 100 }, samplingIntervalSet)
}

function samplingIntervalSet (err, result) {
  if (err) return console.error(`error setting sampling interval: ${err}`)
  console.error(`Profiler.setSamplingInterval():`, result)

  session.post('Profiler.start', profilerStarted)
}

function profilerStarted (err, result) {
  if (err) return console.error(`error starting profiler: ${err}`)
  console.error(`Profiler.start():`, result)

  console.error('profiling for 3 seconds')
  setTimeout(stopProfiler, 3000)

  // if debugging in-process, run some demo code
  if (inProcess) require('./profile-test-code').run(2000)
}

function stopProfiler () {
  session.post('Profiler.stop', profilerStopped)
}

function profilerStopped (err, profile) {
  if (err) return console.error(`error stopping profiler: ${err}`)

  console.error('profiling complete; writing profile to stdout')
  console.log(JSON.stringify(profile.profile, null, 4))

  session.disconnect()
}
```


install
================================================================================

    npm install moar-things/inspector-remote


api
================================================================================

This package exports the following properties:

* `version` - the version of the package
* `supportsLocal` - a boolean which indicates whether local sessions can be
  created

Local sessions can only be created if the Node.js runtime supports the
`inspector` package.

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
