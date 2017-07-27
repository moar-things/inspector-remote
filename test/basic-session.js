'use strict'

exports.runTest = runTest

function runTest (t, session, url) {
  let event1 = null
  let event2 = null

  session.once('inspectorNotification', (message) => {
    event1 = message
  })
  session.once('Debugger.scriptParsed', (message) => {
    event2 = message
  })

  t.equal(session.url, url, 'url should be as expected')

  session.connect(sessionConnected)

  function sessionConnected (err) {
    if (err) {
      t.error(err, `unable to connect to session: ${err}`)
      t.end()
      return
    }

    session.post('Debugger.enable')

    session.post('Schema.getDomains', (err, result) => {
      if (err) {
        t.error(err, `error posting Schema.getDomains: ${err}`)
        t.end()
        return
      }

      t.ok(result.domains, 'should have a domains property')

      t.ok(event1, 'inspectorNotification should have fired')
      t.ok(event2, 'Debugger.scriptParsed should have fired')
      t.deepEqual(event1, event2, 'the two events should be the same')

      session.disconnect((err) => {
        if (err) {
          t.error(err, `error disconnecting: ${err}`)
          t.end()
          return
        }

        t.ok('should have disconnected successfully')
        t.end()
      })
    })
  }
}
