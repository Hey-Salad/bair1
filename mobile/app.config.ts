import type { ConfigContext, ExpoConfig } from '@expo/config';

type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const nativePlugins: ExpoPlugins =
    process.env.EXPO_PLATFORM === 'native'
      ? [
          ['expo-dev-client', { launchMode: 'most-recent' }],
          'react-native-maps',
          'react-native-auth0',
          'expo-audio',
          'expo-location',
          'expo-notifications',
        ]
      : [];

  return {
    ...config,
    name: 'Bair1',
    slug: 'bair1',
    newArchEnabled: true,
    version: process.env.BILT_APP_VERSION ?? '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    backgroundColor: '#191C18',
    scheme: 'bair1',
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          'Bair1 uses your location to show nearby air quality when no sensor is connected.',
        UIBackgroundModes: ['audio'],
      },
      supportsTablet: true,
      bundleIdentifier: process.env.BILT_IOS_BUNDLE_ID ?? 'com.bilt.bair1',
    },
    android: {
      package: process.env.BILT_ANDROID_PACKAGE ?? 'com.bilt.bair1',
      permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION'],
    },
    extra: {
      appStoreAppId: process.env.BILT_APP_STORE_APP_ID,
    },
    plugins: ['expo-router', 'expo-font', ...nativePlugins],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
