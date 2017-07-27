'use strict'

// code to run a profiler against; see ./profile.js

exports.run = run

function run (ms) {
  const start = Date.now()

  oneRun()

  function oneRun () {
    if (Date.now() - start > ms) return

    console.error(`${new Date().toISOString()} - sampleA(4): ${sampleA(4)}`)
    setTimeout(oneRun, 100)
  }
}

function sampleA (n) {
  console.error(`sampleA(${n})`)
  if (n === 0) return 0
  sleep(100)
  return n + sampleB(n - 1)
}

function sampleB (n) {
  console.error(`sampleB(${n})`)
  if (n === 0) return 0
  sleep(100)
  return n + sampleA(n - 1)
}

function sleep (ms) {
  // const start = Date.now()
  // while (Date.now() - start > ms) {}
}

if (require.main === module) {
  console.error('running some sample code for 30 seconds')
  run(30000)
}
