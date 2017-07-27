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

session.connect(sessionConnected)

function sessionConnected (err) {
  if (err) return console.error(`unable to connect to session: ${err}`)

  session.post('Profiler.enable', profilerEnabled)
}

function profilerEnabled (err) {
  if (err) return console.error(`error enabling profiler: ${err}`)

  session.post('Profiler.start', profilerStarted)
}

function profilerStarted (err) {
  if (err) return console.error(`error starting profiler: ${err}`)

  console.error('profiling for 3 seconds')
  setTimeout(stopProfiler, 3000)

  if (inProcess) {
    const start = Date.now()
    while (Date.now() - start > 1000) {}
  }
}

function stopProfiler () {
  session.post('Profiler.stop', profilerStopped)
}

function profilerStopped (err, profile) {
  if (err) return console.error(`error stopping profiler: ${err}`)
  console.log(JSON.stringify(profile, null, 4))

  session.disconnect()
}
