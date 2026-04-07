const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativewind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

// ---------------------------------------------------------------------------
// Fix 1: zustand ESM → CJS
//
// Metro sets isESMImport=true for files with `import` statements, picking the
// "import" condition from package exports maps. zustand/middleware resolves to
// esm/middleware.mjs which contains `import.meta.env` — a syntax error in a
// non-module <script>. Force CJS (the "require"/"default" condition) instead.
//
// Fix 2: pretty-format default export
//
// @expo/metro-runtime's HMRClient does `import prettyFormat from 'pretty-format'`
// which Metro's ESM interop compiles to access `.default`. pretty-format v30's
// CJS build sets `exports.default = void 0`, so the HMR client crashes.
// Redirect to a shim that exposes default = format.
// ---------------------------------------------------------------------------
const _defaultResolveRequest = config.resolver.resolveRequest

const ESM_TO_CJS_PACKAGES = ['zustand']
const PRETTY_FORMAT_SHIM = path.resolve(__dirname, 'scripts/pretty-format-shim.js')

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // pretty-format → shim with correct default export
  if (moduleName === 'pretty-format') {
    return { type: 'sourceFile', filePath: PRETTY_FORMAT_SHIM }
  }

  // zustand/* → force CJS build (no import.meta.env)
  const needsCjsRedirect = ESM_TO_CJS_PACKAGES.some(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + '/'),
  )
  if (needsCjsRedirect && context.isESMImport) {
    return (_defaultResolveRequest ?? context.resolveRequest)(
      { ...context, isESMImport: false },
      moduleName,
      platform,
    )
  }

  if (_defaultResolveRequest) {
    return _defaultResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = withNativewind(config, { input: './global.css', inlineVariables: false })
