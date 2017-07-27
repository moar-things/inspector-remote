'use strict'

const inspectorRemote = require('..')

const utils = require('./lib/utils')

const runTest = utils.createTestRunner(__filename)

const basicSessionTest = require('./basic-session')

runTest(function testBasic (t) {
  const inspectorPort = process.env.INSPECTOR_PORT

  if (inspectorPort == null) {
    t.fail('Expecting the env var INSPECTOR_PORT to be set to the port of an active inspector on localhost')
    t.end()
    return
  }

  const url = `localhost:${inspectorPort}`
  const session = inspectorRemote.createSession(url)
  basicSessionTest.runTest(t, session, url)
})
