// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure platform-specific extensions are properly resolved
config.resolver.sourceExts = [
  ...config.resolver.sourceExts.filter(ext => !ext.includes('web')),
  'web.tsx',
  'web.ts', 
  'web.jsx',
  'web.js',
];

module.exports = config;

