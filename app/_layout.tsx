import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

// Initialize i18n
import '@/i18n';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';

import { useColorScheme } from '@/components/useColorScheme';

// Font configuration
const fontConfig = {
  displayLarge: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 57,
    fontWeight: '400' as const,
  },
  displayMedium: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 45,
    fontWeight: '400' as const,
  },
  displaySmall: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 36,
    fontWeight: '400' as const,
  },
  headlineLarge: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 32,
    fontWeight: '400' as const,
  },
  headlineMedium: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 28,
    fontWeight: '400' as const,
  },
  headlineSmall: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 24,
    fontWeight: '400' as const,
  },
  titleLarge: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 22,
    fontWeight: '400' as const,
  },
  titleMedium: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 16,
    fontWeight: '500' as const,
  },
  titleSmall: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  bodyLarge: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 14,
    fontWeight: '500' as const,
  },
  labelMedium: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 11,
    fontWeight: '500' as const,
  },
};

// Custom theme for Egg9 app - Fresh, modern design
const lightTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#ff6b35',           // Vibrant coral-orange
    onPrimary: '#2d3748',         // Rich dark instead of white
    primaryContainer: '#ffe5dc',   // Light peachy background
    onPrimaryContainer: '#2d3748',
    
    secondary: '#4ecdc4',          // Turquoise/teal
    onSecondary: '#2d3748',       // Rich dark instead of white
    secondaryContainer: '#d4f4f1',
    onSecondaryContainer: '#2d3748',
    
    tertiary: '#95e1d3',           // Mint green
    onTertiary: '#2d3748',
    tertiaryContainer: '#c8f2ea',
    onTertiaryContainer: '#2d3748',
    
    background: '#fef5f1',         // Warm off-white
    onBackground: '#2d3748',      // Rich dark
    
    surface: '#ffffff',
    onSurface: '#2d3748',         // Rich dark
    surfaceVariant: '#fff0eb',     // Very light coral
    onSurfaceVariant: '#4a5568',  // Medium dark
    
    error: '#ff5252',
    onError: '#2d3748',
    errorContainer: '#ffd9d9',
    onErrorContainer: '#7f1d1d',
    
    outline: '#e0d4d0',
    outlineVariant: '#f5ebe8',
  },
  roundness: 16,
};

const darkTheme = {
  ...MD3DarkTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ff8562',
    onPrimary: '#1a202c',
    primaryContainer: '#5a1a00',
    onPrimaryContainer: '#ffccbc',
    
    secondary: '#5dd9d1',
    onSecondary: '#1a202c',
    secondaryContainer: '#005e5a',
    onSecondaryContainer: '#b2ebea',
    
    tertiary: '#a8e6dd',
    onTertiary: '#1a202c',
    tertiaryContainer: '#00524b',
    onTertiaryContainer: '#c8f2ea',
    
    background: '#1a1514',
    onBackground: '#f0e6e3',
    
    surface: '#241e1c',
    onSurface: '#f0e6e3',
    surfaceVariant: '#3d2f2c',
    onSurfaceVariant: '#d4c4bf',
    
    error: '#ff6b6b',
    onError: '#1a202c',
    
    outline: '#9e8d89',
    outlineVariant: '#524541',
  },
  roundness: 16,
};

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Show login screen first for unauthenticated users
  initialRouteName: 'modal',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.warn('Font loading error:', error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Always hide splash screen after 1 second, regardless of fonts
  useEffect(() => {
    const timeout = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Don't block rendering on fonts - show app immediately
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  // Force light theme always (ignore system dark mode)
  const paperTheme = lightTheme;
  const navTheme = DefaultTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="modal" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ 
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Register'
          }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="order-history" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
