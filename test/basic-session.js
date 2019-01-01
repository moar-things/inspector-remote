'use strict'

exports.runTest = runTest

async function runTest (t, session, url) {
  let event1 = null
  let event2 = null
  let connectedEvent = false
  let disconnectedEvent = false

  session.once('inspectorNotification', (message) => {
    event1 = message
  })
  session.once('Debugger.scriptParsed', (message) => {
    event2 = message
  })
  session.once('connected', (arg) => {
    connectedEvent = arg
  })
  session.once('disconnected', (arg) => {
    disconnectedEvent = arg
  })

  t.equal(session.url, url, 'url should be as expected')

  try {
    await session.connect()
  } catch (err) {
    t.error(err, `unable to connect to session: ${err}`)
    t.end()
    return
  }

  t.equals(connectedEvent, session, 'connected event fired as expected')
  t.equals(session.isConnected, true, 'isConnected property should be true')

  try {
    await session.post('Debugger.enable')
  } catch (err) {
    t.error(err, `error posting Debugger.enable: ${err}`)
    t.end()
    return
  }

  let result

  try {
    result = await session.post('Schema.getDomains')
  } catch (err) {
    t.error(err, `error posting Schema.getDomains: ${err}`)
    t.end()
    return
  }

  t.ok(result.domains, 'should have a domains property')

  t.ok(event1, 'inspectorNotification should have fired')
  t.ok(event2, 'Debugger.scriptParsed should have fired')
  t.deepEqual(event1, event2, 'the two events should be the same')

  try {
    await session.disconnect()
  } catch (err) {
    t.error(err, `error disconnecting: ${err}`)
    t.end()
    return
  }

  t.equals(session.isConnected, false, 'isConnected property should be false')
  t.equals(disconnectedEvent, session, 'disconnected event fired as expected')

  t.end()
}
