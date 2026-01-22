const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'production';

// App name based on environment
const APP_NAME = {
  development: 'Egg9 Dev',
  staging: 'Egg9 Preview',
  production: 'Egg9',
}[APP_ENV] || 'Egg9';

// Package name based on environment (allows multiple installs on same device)
const PACKAGE_NAME = {
  development: 'com.egg9.app.dev',
  staging: 'com.egg9.app.preview',
  production: 'com.egg9.app',
}[APP_ENV] || 'com.egg9.app';

export default {
  expo: {
    name: APP_NAME,
    slug: 'egg9',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'egg9',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: PACKAGE_NAME,
    },
    android: {
      package: PACKAGE_NAME,
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      googleServicesFile: './google-services.json',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-notifications',
        {
          icon: './assets/images/icon.png',
          color: '#ff6b35',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    updates: {
      url: 'https://u.expo.dev/64ac6896-fa18-425f-87cb-8bdd0770015b',
    },
    runtimeVersion: '1.0.0',
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '64ac6896-fa18-425f-87cb-8bdd0770015b',
      },
    },
  },
};

