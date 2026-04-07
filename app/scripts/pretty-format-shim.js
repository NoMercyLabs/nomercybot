// Shim for pretty-format v30 compatibility with Metro's HMR client.
//
// @expo/metro-runtime's HMRClient compiles `import prettyFormat from 'pretty-format'`
// (ESM default import) which Metro resolves to pretty-format's `.default` export.
// pretty-format v30 CJS sets `exports.default = void 0`, so the HMR client
// crashes at `typeof prettyFormat.default === 'function'` (it's undefined).
//
// This shim re-exports the real module with default = format so the HMR
// client's default-import interop resolves to a callable function.
//
// Note: uses a relative path so Metro doesn't re-apply the extraNodeModules
// alias and create a circular redirect.
'use strict'
const pf = require('../node_modules/pretty-format')
Object.defineProperty(exports, '__esModule', { value: true })
exports.default = pf.format
exports.format = pf.format
exports.plugins = pf.plugins
exports.DEFAULT_OPTIONS = pf.DEFAULT_OPTIONS
