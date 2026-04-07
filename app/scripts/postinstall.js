#!/usr/bin/env node
/**
 * postinstall.js
 *
 * Creates compatibility shims so @expo/cli@55 (which ships @expo/router-server@55.0.13)
 * can resolve expo-router/internal/* paths that don't exist in expo-router@5.x.
 *
 * Background:
 *   @expo/router-server@55.0.13 requires:
 *     - expo-router/internal/routing  (file-system route building)
 *     - expo-router/internal/testing  (requireContext ponyfill)
 *   expo-router@5.1.x doesn't expose those paths, but the implementations exist
 *   in build/getRoutes.js and build/testing-library/require-context-ponyfill.js.
 */
const fs = require('fs');
const path = require('path');

const expoRouterDir = path.join(__dirname, '..', 'node_modules', 'expo-router');
const internalDir = path.join(expoRouterDir, 'internal');

// Only run if expo-router is installed and doesn't already have internal/routing
if (!fs.existsSync(expoRouterDir)) {
  console.log('[postinstall] expo-router not found, skipping shims');
  process.exit(0);
}

if (!fs.existsSync(internalDir)) {
  fs.mkdirSync(internalDir, { recursive: true });
}

// Shim: expo-router/internal/routing
const routingShim = path.join(internalDir, 'routing.js');
if (!fs.existsSync(routingShim)) {
  fs.writeFileSync(routingShim, `// Shim: expo-router/internal/routing
// Bridges @expo/router-server@55 to expo-router@5.x
'use strict';
const getRoutesModule = require('../build/getRoutes.js');
const getRoutesCore = require('../build/getRoutesCore.js');
const matchers = require('../build/matchers.js');
const getReactNavigationConfigModule = require('../build/getReactNavigationConfig.js');
const sortRoutesModule = require('../build/sortRoutes.js');

module.exports = {
  getRoutes: getRoutesModule.getRoutes,
  getExactRoutes: getRoutesModule.getExactRoutes,
  extrapolateGroups: getRoutesCore.extrapolateGroups,
  generateDynamic: getRoutesCore.generateDynamic,
  ...matchers,
  getReactNavigationConfig: getReactNavigationConfigModule.getReactNavigationConfig || getReactNavigationConfigModule.default || getReactNavigationConfigModule,
  sortRoutes: sortRoutesModule.sortRoutes || sortRoutesModule.default || sortRoutesModule,
  getRoutesCore: getRoutesCore.getRoutes,
};
`);
  console.log('[postinstall] Created expo-router/internal/routing.js shim');
}

// Shim: expo-router/internal/testing
const testingShim = path.join(internalDir, 'testing.js');
if (!fs.existsSync(testingShim)) {
  fs.writeFileSync(testingShim, `// Shim: expo-router/internal/testing
// Bridges @expo/router-server@55 to expo-router@5.x
'use strict';
const mod = require('../build/testing-library/require-context-ponyfill.js');
const requireContext = mod.default || mod;
module.exports = { requireContext };
`);
  console.log('[postinstall] Created expo-router/internal/testing.js shim');
}
