const Module = require('module')

const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function mockResolveFilename(request, parent, isMain, options) {
  if (request === 'pnpapi') {
    return __filename
  }
  return originalResolveFilename.call(this, request, parent, isMain, options)
}

if (!process.versions.pnp) {
  process.versions.pnp = 'mock'
}

module.exports = {
  VERSION: 'mock-pnp',
}
