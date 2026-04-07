import { ScrollViewStyleReset } from 'expo-router/html'

// Suppress the React Native for Web shadow* deprecation warnings that NativeWind
// v5 (preview) emits at startup. NativeWind registers Tailwind shadow utilities
// via StyleSheet.create() using the old shadow props before any app code runs.
// RNW's internal warnOnce() captures console.warn at module init time, so the
// only reliable suppression point is a <script> that runs before the bundle.
const suppressShadowWarningScript = `
  (function() {
    var _warn = console.warn.bind(console);
    console.warn = function() {
      if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf('"shadow*" style props are deprecated') !== -1) return;
      _warn.apply(console, arguments);
    };
  })();
`

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <ScrollViewStyleReset />
        {/* Must run before the React bundle so it intercepts console.warn before
            React Native for Web's warnOnce() captures the original reference. */}
        <script dangerouslySetInnerHTML={{ __html: suppressShadowWarningScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
