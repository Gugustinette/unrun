// required for ./tests/fixtures/cjs-interop/index.cjs to work
import { createJiti } from 'jiti'

module.exports = createJiti
module.exports.createJiti = createJiti
