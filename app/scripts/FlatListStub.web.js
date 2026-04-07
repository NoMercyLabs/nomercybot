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
const { ScrollView, View } = require('react-native');

function FlatList({ data = [], renderItem, keyExtractor, ListEmptyComponent, ListHeaderComponent, ListFooterComponent, contentContainerStyle, style, refreshControl }) {
  return React.createElement(
    ScrollView,
    { style, contentContainerStyle, refreshControl },
    ListHeaderComponent || null,
    data.length === 0
      ? (ListEmptyComponent || null)
      : data.map((item, index) => {
          const key = keyExtractor ? keyExtractor(item, index) : String(index);
          return React.createElement(View, { key }, renderItem({ item, index }));
        }),
    ListFooterComponent || null,
  );
}

FlatList.displayName = 'FlatList';

module.exports = FlatList;
module.exports.default = FlatList;
