const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const nodeModulesPath = path.resolve(__dirname, "node_modules");
const utilPolyfill = path.join(nodeModulesPath, "util", "util.js");

function resolveNobleCrypto(context, moduleName) {
  if (
    moduleName !== "@noble/hashes/crypto" &&
    moduleName !== "@noble/hashes/crypto.js"
  ) {
    return null;
  }
  let dir = path.dirname(context.originModulePath);
  const root = path.parse(dir).root;
  while (dir !== root) {
    const candidate = path.join(dir, "node_modules", "@noble", "hashes", "crypto.js");
    if (fs.existsSync(candidate)) {
      return { type: "sourceFile", filePath: candidate };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "util") {
    return { type: "sourceFile", filePath: utilPolyfill };
  }
  const nobleCrypto = resolveNobleCrypto(context, moduleName);
  if (nobleCrypto) return nobleCrypto;
  return (defaultResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

module.exports = withNativeWind(config, { input: "./global.css" });
