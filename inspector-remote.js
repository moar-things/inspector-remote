'use strict'

const EventEmitter = require('events')
const pkg = require('./package.json')

let inspector

try {
  inspector = require('inspector')
} catch (err) {
  inspector = null
}

// the package version
exports.version = pkg.version
exports.createSession = createSession
exports.supportsLocal = inspector != null

// if env var LOGLEVEL == debug, log messages
const Logger = process.env.LOGLEVEL === 'debug' ? log : function () {}

// create a remote session if url != null, otherwise a local session
function createSession (url) {
  if (url != null) return new RemoteSession(url)

  // if inspector package can't be loaded, return null
  if (!exports.supportsLocal) return null

  // return a remote session
  return new LocalSession()
}

// a remote sessions
class RemoteSession extends EventEmitter {
  constructor (url) {
    super()

    this._url = url
    Logger('created new session')
  }

  get url () {
    return this._url
  }

  // connect
  connect (callback) {
    setImmediate(callback, new Error('TBD'))
  }

  // send a request to the inspector
  post (method, params, callback) {
    setImmediate(callback, new Error('TBD'))
  }

  // close the session
  disconnect (callback) {
    setImmediate(callback, new Error('TBD'))
  }
}

// a local session
class LocalSession extends inspector.Session {
  get url () {
    return null
  }

  connect (callback) {
    callback = onlyCallOnce(callback)

    try {
      super.connect()
      setImmediate(callback)
    } catch (err) {
      setImmediate(callback, err)
    }
  }

  disconnect (callback) {
    callback = onlyCallOnce(callback)

    try {
      super.disconnect()
      setImmediate(callback)
    } catch (err) {
      setImmediate(callback, err)
    }
  }
}

// return a version of the passed in function that will only be invoked once
// if null is passed in, returns a no-op function
function onlyCallOnce (fn) {
  if (fn == null) return function () {}

  let called = false

  return function onlyCalledOnce () {
    if (called) return
    called = true

    return fn.apply(this, [].slice.call(arguments))
  }
}

// log a message
function log (message) {
  console.log(`${pkg.name}: ${message}`)
}
