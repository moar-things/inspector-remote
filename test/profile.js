'use strict'

const inspectorRemote = require('..')

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

console.error(`
You can redirect the output of this program to a file with an extension of
.cpuprofile, and then load the profile in Chrome's dedicated DevTools for
node, like so:

- in Chrome, go to url chrome://inspect/
- on that page, click the link "Open dedicated DevTools for Node"
- click on the link to the Profiler tab at the top of the window
- click the "Load" button
- select your file with the .cpuprofile extension
- enjoy!
- for more help with using the Profiler tool, see:
  https://developers.google.com/web/tools/chrome-devtools/rendering-tools/js-execution
`)
