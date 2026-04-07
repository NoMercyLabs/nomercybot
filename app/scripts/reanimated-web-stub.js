'use strict';
/**
 * reanimated-web-stub.js
 *
 * react-native-reanimated@4.x accesses { FlatList } from 'react-native' during
 * module initialisation (ReanimatedFlatList wrapper). react-native-web@0.21.x
 * no longer ships a FlatList implementation — it defines a getter that returns
 * `_FlatList.default` where `_FlatList` resolves to undefined, crashing the
 * bundle before anything renders.
 *
 * This stub is injected by the Metro resolver (metro.config.js) for the web
 * platform so that any import of 'react-native-reanimated' (or its sub-paths)
 * gets safe no-op implementations instead of the native animation engine.
 *
 * The app has zero direct reanimated imports — all reanimated usage is
 * transitive (expo-router, react-native-screens). On web, expo-router uses
 * CSS transitions and does not require the Reanimated worklet engine.
 */

const React = require('react');
// NOTE: react-native and FlatListStub are required LAZILY (inside functions)
// to avoid creating circular dependencies during react-native-web's module init.
// Top-level require('react-native') here would pull in react-native-web while
// it is still initialising → Metro creates a lazy getter for FlatList → crash.

// ---------------------------------------------------------------------------
// Lazy helpers — only evaluated when a component actually renders/calls
// ---------------------------------------------------------------------------
function getRN() { return require('react-native'); }
function getFlatList() { return require('./FlatListStub.web.js'); }

// ---------------------------------------------------------------------------
// Shared values — simple ref-backed so reads/writes work without native engine
// ---------------------------------------------------------------------------
const useSharedValue = (initial) => {
  const ref = React.useRef(initial);
  // Reanimated's shared value API uses `.value` for get/set
  return ref;
};

// ---------------------------------------------------------------------------
// Style / prop hooks — return plain style objects so components still render
// ---------------------------------------------------------------------------
const useAnimatedStyle = (fn) => {
  try { return fn(); } catch { return {}; }
};

const useAnimatedProps = (fn) => {
  try { return fn(); } catch { return {}; }
};

const useAnimatedRef = () => React.useRef(null);

const useAnimatedScrollHandler = () => ({});
const useAnimatedGestureHandler = () => ({});
const useAnimatedReaction = () => {};

const useDerivedValue = (fn) => {
  const ref = React.useRef(null);
  try { ref.current = fn(); } catch {}
  return ref;
};

// ---------------------------------------------------------------------------
// Animation creators — return the target value unchanged (instant on web)
// ---------------------------------------------------------------------------
const withTiming   = (value) => value;
const withSpring   = (value) => value;
const withDecay    = (value) => value;
const withDelay    = (_delay, animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1];
const withRepeat   = (animation) => animation;
const withClamp    = (_config, animation) => animation;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
const runOnJS  = (fn) => fn;
const runOnUI  = (fn) => fn;
const cancelAnimation = () => {};

const interpolate = (value, inputRange, outputRange) => {
  if (!inputRange || inputRange.length < 2) return outputRange ? outputRange[0] : 0;
  const [i0, i1] = inputRange;
  const [o0, o1] = outputRange;
  const t = (value - i0) / (i1 - i0);
  return o0 + t * (o1 - o0);
};

const interpolateColor = () => 'transparent';

const Easing = {
  linear:  (t) => t,
  ease:    (t) => t,
  quad:    (t) => t,
  cubic:   (t) => t,
  sin:     (t) => t,
  circle:  (t) => t,
  exp:     (t) => t,
  elastic: () => (t) => t,
  back:    () => (t) => t,
  bounce:  (t) => t,
  bezier:  () => (t) => t,
  bezierFn: () => (t) => t,
  in:      (e) => e,
  out:     (e) => e,
  inOut:   (e) => e,
  poly:    () => (t) => t,
  step0:   (n) => (t) => (t === 0 ? 0 : 1),
  step1:   (n) => (t) => (t === 1 ? 1 : 0),
};

const Extrapolation = {
  CLAMP:    'clamp',
  EXTEND:   'extend',
  IDENTITY: 'identity',
};

// ---------------------------------------------------------------------------
// Animated component factory — identity on web (no need to wrap)
// ---------------------------------------------------------------------------
const createAnimatedComponent = (Component) => Component;

// Animated.View etc. are lazy to avoid triggering react-native-web's init cycle
const Animated = {
  get View()       { return getRN().View; },
  get ScrollView() { return getRN().ScrollView; },
  get Text()       { return getRN().Text; },
  get Image()      { return getRN().Image; },
  get FlatList()   { return getFlatList(); },
  createAnimatedComponent,
};

// ---------------------------------------------------------------------------
// Worklet utilities (injected by Babel plugin — must exist but can be no-ops)
// ---------------------------------------------------------------------------
const makeRemote   = (obj) => obj;
const makeShareable = (obj) => obj;

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
const stub = {
  // Hooks
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useDerivedValue,

  // Animation creators
  withTiming,
  withSpring,
  withDecay,
  withDelay,
  withSequence,
  withRepeat,
  withClamp,

  // Utilities
  runOnJS,
  runOnUI,
  cancelAnimation,
  interpolate,
  interpolateColor,
  Easing,
  Extrapolation,

  // Components
  createAnimatedComponent,
  Animated,
  get FlatList() { return getFlatList(); },

  // Worklet internals (Babel plugin may inject imports for these)
  makeRemote,
  makeShareable,

  // Compatibility
  default: null,
};
stub.default = stub;

module.exports = stub;
