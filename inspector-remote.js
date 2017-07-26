'use strict'

const EventEmitter = require('events')
const pkg = require('./package.json')

// the package version
exports.version = pkg.version
exports.connect = connect

const Logger = process.env.LOGLEVEL === 'debug' ? log : function () {}

// connect to a remote inspector
function connect (url, cb) {
  const session = new Session()
  setImmediate(cb, null, session)
}

// remote inspector session object with interface similar to Node's
// see: https://nodejs.org/dist/latest-v8.x/docs/api/inspector.html#inspector_class_inspector_session

// events:
//   close
//   inspectorNotification
//   <inspector-protocol-method>

class Session extends EventEmitter {
  constructor () {
    super()

    this._connected = true
    Logger('creating new session')
  }

  // no-op
  connect () {
  }

  // send a request to the inspector
  post (method, params, callback) {
    if (!this._connected) return setImmediate(callback, new Error('closed'))
  }

  // close the session
  disconnect () {
    this._connected = false
  }
}

// log a message
function log (message) {
  console.log(`${pkg.name}: ${message}`)
}
