'use strict'

const inspectorRemote = require('..')

const utils = require('./lib/utils')

const runTest = utils.createTestRunner(__filename)

const basicSessionTest = require('./basic-session')

runTest(function testBasic (t) {
  if (!inspectorRemote.supportsLocal) {
    t.fail('The inspector package could not be loaded.  Got Node 8?')
    t.end()
    return
  }

  const session = inspectorRemote.createSession()
  basicSessionTest.runTest(t, session, null)
})
