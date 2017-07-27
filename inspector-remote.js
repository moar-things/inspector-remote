'use strict'

const URL = require('url')
const EventEmitter = require('events')

const websocket = require('websocket')
const tinyJsonHttp = require('tiny-json-http')

const pkg = require('./package.json')

const WebSocketClient = websocket.client

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

    Logger(`creating a remote session on ${url}`)

    // convert url object to a string
    if (typeof url !== 'string') {
      if (typeof url.format !== 'function') {
        throw new Error('url parameter should be a string or url object')
      }
      url = url.format()
    }

    this._url = url
    this._messageID = 0
    this._postCallbacks = {}
  }

  get url () {
    return this._url
  }

  // connect
  connect (callback) {
    callback = callback || function () {}

    Logger(`connecting to remote session at ${this._url}`)
    if (this._wsConnection != null) return setImmediate(callback)

    getTargetURL(this._url, gotTargetURL)

    const self = this
    function gotTargetURL (err, targetURL) {
      if (err) return callback(err)

      Logger(`target url for remote session: ${targetURL}`)

      const wsClient = new WebSocketClient()

      wsClient.on('connect', (wsConnection) => {
        Logger(`connected to websocket`)
        self._wsConnection = wsConnection
        self._setupConnection()
        callback()
      })

      wsClient.on('connectFailed', (desc) => {
        Logger(`not connected to websocket: ${desc}`)
        callback(new Error(desc))
      })

      wsClient.connect(targetURL)
    }
  }

  // send a request to the inspector
  post (method, params, callback) {
    if (this._wsConnection == null) {
      const err = new Error('websocket closed')
      return setImmediate(callback, err)
    }

    // fix up params / callback, if params elided
    if (callback == null && typeof params === 'function') {
      callback = params
      params = null
    }

    // provide a default callback
    callback = callback || function () {}

    // build the message
    this._messageID++
    const message = JSON.stringify({
      id: this._messageID,
      method: method,
      params: params || {}
    })

    Logger(`sending websocket message: ${message}`)
    this._postCallbacks[this._messageID] = callback
    this._wsConnection.send(message)
  }

  // close the session
  disconnect (callback) {
    callback = callback || function () {}

    Logger(`disconnecting from remote session`)

    if (this._wsConnection == null) return setImmediate(callback)

    this._wsConnection.on('close', (reasonCode, description) => {
      callback(null)
    })

    this._wsConnection.close()
  }

  _setupConnection () {
    const wsConnection = this._wsConnection

    wsConnection.on('message', (message) => {
      // Logger(`received websocket message ${JSON.stringify(message)}`)
      if (message.type !== 'utf8') return

      try {
        message = JSON.parse(message.utf8Data)
      } catch (err) {
        return
      }

      Logger(`received inspector message ${JSON.stringify(message)}`)

      // event
      if (message.method != null) {
        this.emit('inspectorNotification', message)
        this.emit(message.method, message)
        return
      }

      // command response
      if (message.id != null) {
        const callback = this._postCallbacks[message.id]
        delete this._postCallbacks[message.id]

        if (callback == null) {
          Logger(`response received for id ${message.id}, but not callback registered`)
          return
        }

        callback(null, message.result)
      }
    })

    wsConnection.on('close', (reasonCode, description) => {
      Logger(`websocket closed: ${reasonCode} ${description}`)
      this._wsConnection = null
    })

    wsConnection.on('error', (err) => {
      Logger(`websocket error: ${err}`)
    })
  }
}

// a local session
class LocalSession extends inspector.Session {
  constructor () {
    super()

    Logger(`creating a local session`)
  }

  get url () {
    return null
  }

  connect (callback) {
    callback = onlyCallOnce(callback)

    Logger(`connecting to local session`)
    try {
      super.connect()
      setImmediate(callback)
    } catch (err) {
      setImmediate(callback, err)
    }
  }

  disconnect (callback) {
    callback = onlyCallOnce(callback)

    Logger(`disconnecting from local session`)
    try {
      super.disconnect()
      setImmediate(callback)
    } catch (err) {
      setImmediate(callback, err)
    }
  }
}

// given an inspector url, get the actual target URL
function getTargetURL (url, cb) {
  const urlObject = URL.parse(url)
  if (urlObject.protocol === 'ws:') urlObject.protocol = 'http:'
  if (urlObject.protocol === 'wss:') urlObject.protocol = 'https:'

  urlObject.pathname = 'json'
  url = urlObject.format()

  tinyJsonHttp.get({url: url}, gotJSON)

  function gotJSON (err, result) {
    if (err) return cb(err)

    const body = result.body
    if (body == null) return cb(new Error(`no body from url ${url}`))

    const entry = body[0]
    if (entry == null) return cb(new Error(`no entries in body from url ${url}`))

    const wsURL = entry.webSocketDebuggerUrl
    if (wsURL == null) return cb(new Error(`no webSocketDebuggerUrl in entry in body from url ${url}`))

    cb(null, wsURL)
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
