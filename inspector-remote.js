'use strict'

const URL = require('url')
const util = require('util')
const inspector = require('inspector')
const EventEmitter = require('events')

const pDefer = require('p-defer')
const WebSocket = require('ws')
const tinyJsonHttp = require('tiny-json-http')

const pkg = require('./package.json')

// the package version
exports.version = pkg.version
exports.createSession = createSession

// if env var LOGLEVEL == debug, log messages
const Log = process.env.LOGLEVEL === 'debug' ? log : function () {}

// create a remote session if url != null, otherwise a local session
function createSession (url) {
  if (url == null) return new LocalSession()

  return new RemoteSession(url)
}

// base session class
class InspectorSession extends EventEmitter {
  get url () { return null }
  get isConnected () { throw new Error('subclass responsibility') }

  async connect () { throw new Error('subclass responsibility') }
  async disconnect () { throw new Error('subclass responsibility') }
  async post (method, params) { throw new Error('subclass responsibility') }
}

// a local session
class LocalSession extends InspectorSession {
  constructor () {
    super()

    Log(`creating a local session`)
    this._isConnected = false
    this._session = new inspector.Session()

    this.addListener('newListener', (event, listener) => {
      if (event === 'connected' || event === 'disconnected') return
      this._session.addListener(event, listener)
    })

    this.addListener('removeListener', (event, listener) => {
      if (event === 'connected' || event === 'disconnected') return
      this._session.removeListener(event, listener)
    })
  }

  get isConnected () {
    return this._isConnected
  }

  async connect () {
    const deferred = pDefer()

    if (this.isConnected) {
      deferred.resolve(null)
      return deferred.promise
    }

    Log(`connecting to local session`)
    try {
      this._session.connect()
    } catch (err) {
      return deferred.reject(err)
    }

    this._isConnected = true
    deferred.resolve(null)
    this.emit('connected', this)

    return deferred.promise
  }

  async disconnect () {
    const deferred = pDefer()

    if (!this.isConnected) {
      deferred.resolve(null)
      return deferred.promise
    }

    Log(`disconnecting from local session`)
    try {
      this._session.disconnect()
    } catch (err) {
      return deferred.reject(err)
    }

    this._isConnected = false
    deferred.resolve(null)
    this.emit('disconnected', this)

    return deferred.promise
  }

  async post (method, params) {
    params = params || {}
    const deferred = pDefer()

    if (!this.isConnected) {
      deferred.reject(new Error('session is not connected'))
      return deferred.promise
    }

    Log(`sending local request: ${method}`)
    this._session.post(method, params, (err, result) => {
      if (err != null) return deferred.reject(err)

      deferred.resolve(result)
    })

    return deferred.promise
  }
}

// a remote session
class RemoteSession extends InspectorSession {
  constructor (url) {
    super()

    // convert url object to a string
    if (typeof url !== 'string') {
      if (typeof url.format !== 'function') {
        throw new Error('url parameter should be a string or url object')
      }
      url = url.format()
    }

    this._ws = null
    this._url = url
    this._messageID = 0
    this._postResultsDeferreds = {}
  }

  get url () {
    return this._url
  }

  get isConnected () {
    return this._ws != null
  }

  // connect
  async connect () {
    const deferred = pDefer()

    if (this.isConnected) {
      deferred.resolve(null)
      return deferred.promise
    }

    Log(`connecting to remote session at ${this._url}`)
    const targetUrl = await getTargetUrl(this._url)

    Log(`target url for remote session: ${targetUrl}`)
    const ws = new WebSocket(targetUrl)

    ws.once('open', () => {
      Log(`connected to websocket`)
      this._ws = ws
      this._setupConnection()
      deferred.resolve(null)
      this.emit('connected', this)
    })

    ws.once('error', (err) => {
      Log(`error from websocket: ${err.message}`)
      deferred.reject(new Error(`error from websocket: ${err.message}`))
    })

    return deferred.promise
  }

  // close the session
  async disconnect () {
    const deferred = pDefer()

    if (!this.isConnected) {
      deferred.resolve(null)
      return deferred.promise
    }

    Log(`disconnecting from remote session`)
    this._ws.once('close', (code, reason) => {
      this._ws = null
      deferred.resolve(null)
      this.emit('disconnected', this)
    })

    this._ws.close()

    return deferred.promise
  }

  // send a request to the inspector
  async post (method, params) {
    params = params || {}
    const deferred = pDefer()

    if (!this.isConnected) {
      deferred.reject(new Error('session is not connected'))
      return deferred.promise
    }

    // build the message
    this._messageID++
    const id = this._messageID

    const message = JSON.stringify({ id, method, params })

    Log(`sending remote request: ${method} (${id})`)
    this._postResultsDeferreds[this._messageID] = { method, deferred }
    this._ws.send(message, (err) => {
      if (err != null) {
        deferred.reject(new Error(`error sending websocket message: ${err.message}`))
      }
    })

    return deferred.promise
  }

  _setupConnection () {
    const ws = this._ws

    ws.on('message', (message) => this._handleWsMessage(message))

    ws.on('close', (code, reason) => {
      Log(`websocket closed: ${code} ${reason}`)
      this._ws = null
      this.emit('disconnected', this)
    })

    ws.on('error', (err) => {
      Log(`websocket error: ${err}`)
    })
  }

  _handleWsMessage (message) {
    Log(`received:`, message)

    if (message == null) return
    message = message.toString()

    try {
      message = JSON.parse(message)
    } catch (err) {
      return
    }

    // event
    if (message.method != null) {
      if (message.method !== 'Debugger.scriptParsed') {
        Log(`received remote event:    ${message.method}`)
      }
      this.emit('inspectorNotification', message)
      this.emit(message.method, message)
      return
    }

    // command response
    if (message.id != null) {
      const deferred = this._postResultsDeferreds[message.id].deferred
      const method = this._postResultsDeferreds[message.id].method
      Log(`received remote response: ${method} (${message.id})`)
      delete this._postResultsDeferreds[message.id]

      if (deferred == null) {
        Log(`response received for id ${message.id}, but not callback registered`)
        return
      }

      deferred.resolve(message.result)
    }

    Log(`received remote message with no id or method: ${JSON.stringify(message)}`)
  }
}

// given an inspector url, get the actual target URL
async function getTargetUrl (url) {
  const urlObject = URL.parse(url)
  if (urlObject.protocol === 'ws:') urlObject.protocol = 'http:'
  if (urlObject.protocol === 'wss:') urlObject.protocol = 'https:'

  urlObject.pathname = 'json'
  url = urlObject.format()

  try {
    var result = await tinyJsonHttp.get({ url: url })
  } catch (err) {
    throw new Error(`error fetching inspector url: ${err.message}`)
  }

  const body = result.body
  if (body == null) throw new Error(`no body from url ${url}`)

  const entry = body[0]
  if (entry == null) throw new Error(`no entries in body from url ${url}`)

  const wsURL = entry.webSocketDebuggerUrl
  if (wsURL == null) throw new Error(`no webSocketDebuggerUrl in entry in body from url ${url}`)

  return wsURL
}

// log a message
function log (...args) {
  const message = util.format(...args)
  console.error(`${pkg.name}: ${message}`)
}
