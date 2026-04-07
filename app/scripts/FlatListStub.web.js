/**
 * FlatListStub.web.js
 *
 * react-native-web 0.21.x ships a broken FlatList getter:
 *   get FlatList() { return D.default }
 * where D is undefined, crashing the bundle on web.
 *
 * react-native-reanimated@4.x eagerly accesses FlatList during module
 * initialisation (itemLayoutAnimation → ReanimatedFlatList), which triggers
 * the broken getter before any of our components even mount.
 *
 * This stub is injected by the Metro resolver (metro.config.js) for the web
 * platform so that any import of react-native's FlatList internals returns a
 * safe ScrollView-based shim instead of the broken getter.
 */
'use strict';

const React = require('react');

// NOTE: react-native is required LAZILY inside the function body (not at module
// load time) to avoid a circular dependency.
//
// react-native-web's CJS index requires ./exports/FlatList (redirected here by
// Metro) during its own initialisation. If this stub required react-native at
// the top level, Metro would detect the cycle and wrap exports.FlatList in a
// lazy getter. That getter evaluates _FlatList.default before the sub-module
// finishes loading → undefined → crash. Lazy require breaks the cycle.

function FlatList({ data = [], renderItem, keyExtractor, ListEmptyComponent, ListHeaderComponent, ListFooterComponent, contentContainerStyle, style, refreshControl }) {
  // Lazy require — react-native-web is fully initialised by the time any
  // component actually renders.
  var RN = require('react-native');
  var ScrollView = RN.ScrollView;
  var View = RN.View;
  return React.createElement(
    ScrollView,
    { style: style, contentContainerStyle: contentContainerStyle, refreshControl: refreshControl },
    ListHeaderComponent || null,
    data.length === 0
      ? (ListEmptyComponent || null)
      : data.map(function(item, index) {
          var key = keyExtractor ? keyExtractor(item, index) : String(index);
          return React.createElement(View, { key: key }, renderItem({ item: item, index: index }));
        }),
    ListFooterComponent || null,
  );
}

FlatList.displayName = 'FlatList';

module.exports = FlatList;
module.exports.default = FlatList;
