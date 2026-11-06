/**
 * Expo CLI (57.0.26) replaces `globalThis.URL` with `fetch-nodeshim`'s URL
 * class, which has no static `URL.canParse`. Metro's bundle-request parser
 * calls `URL.canParse(...)`, so every `/index.bundle` request dies with
 * `500 TypeError: URL.canParse is not a function` as soon as `expo start`
 * loads that module (i.e. once a dev client connects).
 *
 * Restore a WHATWG-compliant `canParse` on whatever class is installed.
 * Idempotent, safe to re-run (npm postinstall).
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const nm = path.join(projectRoot, 'node_modules');
const cliPkg = path.join('@expo', 'cli', 'build', 'src', 'utils', 'fetch.js');

const candidates = [
  path.join(nm, cliPkg),
  path.join(nm, 'expo', 'node_modules', cliPkg),
];

try {
  for (const entry of fs.readdirSync(nm, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    candidates.push(path.join(nm, entry.name, 'node_modules', cliPkg));
    if (entry.name.startsWith('@')) {
      for (const scoped of fs.readdirSync(path.join(nm, entry.name), {
        withFileTypes: true,
      })) {
        if (!scoped.isDirectory()) continue;
        candidates.push(
          path.join(nm, entry.name, scoped.name, 'node_modules', cliPkg),
        );
      }
    }
  }
} catch {
  // node_modules missing — npm postinstall only runs after install anyway
}

const target = candidates.find((c) => fs.existsSync(c)) || null;

const MARK = '/* roda:restore-url-canparse */';

if (target && fs.existsSync(target)) {
  const src = fs.readFileSync(target, 'utf8');
  if (!src.includes(MARK)) {
    const anchor = '});\n\n//# sourceMappingURL=fetch.js.map';
    const patch = `});

${MARK}
if (typeof globalThis.URL.canParse !== 'function') {
  const { URL: NodeURL } = require('node:url');
  globalThis.URL.canParse = (input, base) => {
    try { new NodeURL(input, base); return true; } catch { return false; }
  };
}

//# sourceMappingURL=fetch.js.map`;

    if (src.includes(anchor)) {
      fs.writeFileSync(target, src.replace(anchor, patch));
      console.log('[patch-expo-fetch] patched', target);
    }
  }
}

// Also patch npm package `util` if present so react-dom-server SSR gets TextEncoder/TextDecoder
const utilTarget = path.join(nm, 'util', 'util.js');
if (fs.existsSync(utilTarget)) {
  const utilSrc = fs.readFileSync(utilTarget, 'utf8');
  const UTIL_MARK = '/* roda:restore-text-encoder */';
  if (!utilSrc.includes(UTIL_MARK)) {
    const utilPatch = `
${UTIL_MARK}
try {
  const _nodeUtil = require('node:util');
  exports.TextEncoder = exports.TextEncoder || _nodeUtil.TextEncoder || (typeof TextEncoder !== 'undefined' ? TextEncoder : undefined);
  exports.TextDecoder = exports.TextDecoder || _nodeUtil.TextDecoder || (typeof TextDecoder !== 'undefined' ? TextDecoder : undefined);
} catch {
  if (typeof TextEncoder !== 'undefined') exports.TextEncoder = TextEncoder;
  if (typeof TextDecoder !== 'undefined') exports.TextDecoder = TextDecoder;
}
`;
    fs.appendFileSync(utilTarget, utilPatch);
    console.log('[patch-expo-fetch] patched util/util.js with TextEncoder/TextDecoder');
  }
}

// Patch react-native to prevent InteractionManager removal invariant error in RN 0.86+ DEV mode
const rnTarget = path.join(nm, 'react-native', 'index.js');
if (fs.existsSync(rnTarget)) {
  let rnSrc = fs.readFileSync(rnTarget, 'utf8');
  const RN_MARK = '/* roda:safe-interaction-manager */';
  if (!rnSrc.includes(RN_MARK) && rnSrc.includes("'InteractionManager has been removed from react-native core")) {
    const throwingGetter = /Object\.defineProperty\(module\.exports,\s*'InteractionManager',\s*\{[\s\S]*?invariant\([\s\S]*?'InteractionManager has been removed[\s\S]*?\}\s*\);/;
    const safeDefinition = `${RN_MARK}
  const _imSafe = {
    createInteractionHandle: () => 1,
    clearInteractionHandle: () => {},
    runAfterInteractions: (task) => {
      let timer = setTimeout(() => task && task(), 0);
      return { then: (cb) => Promise.resolve().then(cb), done: () => {}, cancel: () => clearTimeout(timer) };
    },
    setDeadline: () => {},
    addListener: () => ({ remove: () => {} }),
    Events: { interactionStart: 'interactionStart', interactionComplete: 'interactionComplete' },
  };
  Object.defineProperty(module.exports, 'InteractionManager', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: _imSafe,
  });`;

    if (throwingGetter.test(rnSrc)) {
      rnSrc = rnSrc.replace(throwingGetter, safeDefinition);
      fs.writeFileSync(rnTarget, rnSrc);
      console.log('[patch-expo-fetch] patched react-native/index.js with safe InteractionManager');
    }
  }
}

// Patch react-native-modal to safely handle removed InteractionManager
const modalTarget = path.join(nm, 'react-native-modal', 'dist', 'modal.js');
if (fs.existsSync(modalTarget)) {
  let modalSrc = fs.readFileSync(modalTarget, 'utf8');
  const MODAL_MARK = '/* roda:safe-modal-interaction */';
  if (!modalSrc.includes(MODAL_MARK)) {
    modalSrc = modalSrc.replace(
      /InteractionManager\.createInteractionHandle\(\)/g,
      '(InteractionManager.createInteractionHandle ? InteractionManager.createInteractionHandle() : 1)',
    );
    modalSrc = modalSrc.replace(
      /InteractionManager\.clearInteractionHandle\((.*?)\)/g,
      '(InteractionManager.clearInteractionHandle ? InteractionManager.clearInteractionHandle($1) : undefined)',
    );
    modalSrc = `${MODAL_MARK}\n${modalSrc}`;
    fs.writeFileSync(modalTarget, modalSrc);
    console.log('[patch-expo-fetch] patched react-native-modal/dist/modal.js');
  }
}
