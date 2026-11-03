/* eslint-disable @typescript-eslint/no-var-requires */
// Runtime polyfills used by near-api-js and React Native.
// MUST be imported before the network client evaluates (see index.js).
//
// IMPORTANT: native packages are loaded with require() (not import) so a missing
// native module (e.g. in Expo Go) can be caught instead of aborting the whole
// module. The pure-JS crypto fallback is installed FIRST so it is always in
// place even if every native package below fails to load.

declare const global: any;
const g: any =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
    ? global
    : {};

// ── 1. Guaranteed pure-JS crypto.getRandomValues (no native deps) ─────────────
function jsGetRandomValues(array: any) {
  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

function ensureGetRandomValues() {
  if (typeof g.crypto !== 'object' || g.crypto === null) {
    try {
      g.crypto = {};
    } catch {
      try {
        Object.defineProperty(g, 'crypto', { value: {}, configurable: true, writable: true });
      } catch {}
    }
  }
  if (typeof g.crypto.getRandomValues !== 'function') {
    try {
      g.crypto.getRandomValues = jsGetRandomValues;
    } catch {
      try {
        Object.defineProperty(g.crypto, 'getRandomValues', {
          value: jsGetRandomValues,
          configurable: true,
          writable: true,
        });
      } catch {}
    }
  }
}

ensureGetRandomValues();

// ── 2. TextEncoder/TextDecoder ───────────────────────────────────────────────
try {
  require('fast-text-encoding');
} catch {}

// ── 3. Native secure RNG (works only in real dev/prod builds) ─────────────────
try {
  require('react-native-get-random-values');
  // Verify it actually works — in Expo Go it may be a stub that throws on call.
  g.crypto.getRandomValues(new Uint8Array(1));
} catch {
  // Native unavailable — restore the JS fallback (the native import may have
  // overwritten getRandomValues with a throwing stub).
  try {
    g.crypto.getRandomValues = jsGetRandomValues;
  } catch {}
}

// ── 4. Buffer + process globals ───────────────────────────────────────────────
try {
  const { Buffer } = require('buffer');
  g.Buffer = g.Buffer || Buffer;
  /**
   * Hermes' TypedArray#subarray ignores Symbol.species, so `buffer`'s
   * Buffer#subarray hands back a bare Uint8Array (on Node it stays a Buffer).
   * Binary RPC payloads rely on these globals, which
   * calls `b.readUIntLE(...)` — a Buffer-only method — and every account fetch
   * dies with "undefined is not a function". Re-wrap as a Buffer.
   */
  const restoreBufferSubarray = (B: any) => {
    if (!B || !B.prototype || typeof B.prototype.subarray !== 'function') return;
    if (B.isBuffer(B.prototype.subarray.call(B.alloc(1), 0))) return;
    const original = B.prototype.subarray;
    B.prototype.subarray = function subarray(start?: number, end?: number) {
      const view = original.call(this, start, end);
      return B.isBuffer(view) ? view : B.from(view.buffer, view.byteOffset, view.byteLength);
    };
  };
  restoreBufferSubarray(Buffer);
  restoreBufferSubarray(g.Buffer);
} catch {}
try {
  g.process = g.process || require('process/browser');
} catch {}

// ── 5. A native import above may have replaced global.crypto — re-ensure ──────
ensureGetRandomValues();
try {
  // Final smoke test; if the current impl throws, force the JS fallback.
  g.crypto.getRandomValues(new Uint8Array(1));
} catch {
  try {
    g.crypto.getRandomValues = jsGetRandomValues;
  } catch {}
}

// ── 6. CustomEvent polyfill (event emitters) ──────────────────────────────────
if (typeof (g as any).CustomEvent === 'undefined') {
  (g as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, options?: { detail?: any }) {
      this.type = type;
      this.detail = options?.detail ?? null;
    }
  };
}

// ── 7. window stubs — some libs call window.addEventListener at import time ───
// React Native aliases window → global but omits browser DOM APIs.
if (typeof window !== 'undefined') {
  if (typeof (window as any).addEventListener !== 'function') {
    (window as any).addEventListener = () => {};
  }
  if (typeof (window as any).removeEventListener !== 'function') {
    (window as any).removeEventListener = () => {};
  }
  if (typeof (window as any).dispatchEvent !== 'function') {
    (window as any).dispatchEvent = () => false;
  }
}
