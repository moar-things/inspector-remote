'use strict'

const pkg = require('../package.json')
const utils = require('./lib/utils')
const thisPackage = require('..')

const runTest = utils.createTestRunner(__filename)

// Check the package name.
runTest(function testPackageName (t) {
  t.deepEqual(pkg.name, 'inspector-remote', 'package name should be as expected')
  t.deepEqual(pkg.version, thisPackage.version, 'package version should be as expected')
  t.end()
})
