#!/usr/bin/env node

'use strict'

const inspectorRemote = require('..')

async function main (url) {
  if (url == null) {
    console.error('usage: profile.js <url>')
    console.error('generates a 5 second CPU profile on stdout of process debugged at <url>')
    process.exit(1)
  }

  try {
    await generateProfile(url)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

async function generateProfile (url) {
  if (url == null) throw new Error('url parameter required')

  const session = inspectorRemote.createSession(url)

  await session.connect()
  console.error('connected to debugger')

  await session.post('Runtime.runIfWaitingForDebugger')
  await session.post('Profiler.enable')
  await session.post('Profiler.setSamplingInterval', { interval: 100 })
  await session.post('Profiler.start')

  console.error('cpu profile started, 5 seconds')
  await sleep(5)

  const profile = await session.post('Profiler.stop')

  await session.disconnect()
  console.log(JSON.stringify(profile, null, 4))
}

async function sleep (seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

if (require.main === module) main(process.argv[2])
