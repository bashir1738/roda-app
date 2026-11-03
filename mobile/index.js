// Custom entry point. Polyfills MUST run before expo-router/entry so that
// globalThis.crypto.getRandomValues exists before any module (notably
// crypto clients capture it at load time.
require('./polyfills');
require('expo-router/entry');
