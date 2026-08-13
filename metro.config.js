const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('env');

// react-native-reanimated 3.x has a dead-code `else` branch that requires
// 'react-native/Libraries/Renderer/shims/ReactNative', removed in RN 0.77+.
// React Native's own package.json declares this path in `exports` but the file
// no longer exists — so extraNodeModules is ignored (exports map wins).
// resolveRequest intercepts BEFORE the exports map and redirects to our stub.
const MISSING_SHIM = 'react-native/Libraries/Renderer/shims/ReactNative';
const shimPath = path.resolve(__dirname, 'shims/ReactNative.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === MISSING_SHIM) {
    return { filePath: shimPath, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;