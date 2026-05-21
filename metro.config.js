const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const webAliases = {
      '@clerk/expo/native': path.resolve(__dirname, 'src/shims/clerk-native-shim.js'),
    };

    if (webAliases[moduleName]) {
      return {
        filePath: webAliases[moduleName],
        type: 'sourceFile',
      };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
