import { writeFileSync } from 'node:fs'
import process from 'node:process'

const pidFile = process.env.UNRUN_TEST_CHILD_PID_FILE

if (!pidFile) {
  throw new Error('UNRUN_TEST_CHILD_PID_FILE must be provided')
}

writeFileSync(pidFile, String(process.pid), 'utf8')

setInterval(() => {
  // Keep the process alive until an external signal terminates it
}, 1_000)
