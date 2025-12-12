// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// For web builds, block react-native-pager-view from being bundled
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block react-native-pager-view on web
  if (platform === 'web' && moduleName === 'react-native-pager-view') {
    return {
      type: 'empty',
    };
  }
  
  // Block our native-specific file on web
  if (platform === 'web' && moduleName.includes('PagerViewWrapper.native')) {
    return {
      type: 'empty',
    };
  }

  // Use default resolution for everything else
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
