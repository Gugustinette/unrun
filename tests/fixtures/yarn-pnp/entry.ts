const MARKER = '[pnpe2e]'

const payload = {
  execArgv: process.execArgv,
  hasPnp: Boolean(process.versions.pnp),
}

console.log(`${MARKER}${JSON.stringify(payload)}`)
