'use strict'

const inspectorRemote = require('../inspector-remote')

const utils = require('./lib/utils')

const runTest = utils.createTestRunner(__filename)

const basicSessionTest = require('./basic-session')

runTest(async function testBasic (t) {
  const session = inspectorRemote.createSession()
  await basicSessionTest.runTest(t, session, null)
})
