import React, { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, useRouter } from 'expo-router';
import { Pressable, Alert, View, Text, Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { apiService } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollProvider, useScrollContext } from '@/contexts/ScrollContext';
import { unregisterPushNotifications } from '@/utils/pushNotifications';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

// Custom header background - scroll-based effects
function HeaderBackground() {
  const { scrollY } = useScrollContext();
  const SCROLL_THRESHOLD = 50;
  const progress = Math.min(scrollY / SCROLL_THRESHOLD, 1);
  const isScrolled = scrollY > 0;
  
  // Native: solid background with scroll-based shadow/border
  if (Platform.OS !== 'web') {
    // Background opacity fades from very light to more visible on scroll
    const bgOpacity = 0.3 + (0.7 * progress); // 0.3 at top, 1.0 when scrolled
    
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: `rgba(254, 245, 241, ${bgOpacity})`, // #fef5f1 with opacity
            borderBottomWidth: 1,
            borderBottomColor: `rgba(0, 0, 0, ${0.08 * progress})`,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08 * progress,
            shadowRadius: 4 * progress,
            elevation: isScrolled ? Math.round(3 * progress) : 0,
          },
        ]}
      />
    );
  }
  
  // Web: blur effect with scroll-based intensity
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'transparent',
          // @ts-ignore - backdropFilter is web-only
          backdropFilter: isScrolled ? `blur(${12 * progress}px)` : 'none',
          WebkitBackdropFilter: isScrolled ? `blur(${12 * progress}px)` : 'none',
          borderBottomWidth: isScrolled ? 1 : 0,
          borderBottomColor: `rgba(0, 0, 0, ${0.1 * progress})`,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1 * progress,
          shadowRadius: 4,
        } as any,
      ]}
    />
  );
}

// Shared auth state hook
function useAuthState() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const checkLoginStatus = async () => {
    const user = await apiService.getCurrentUser();
    setIsLoggedIn(!!user);
    setUserName(user?.name || '');
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkLoginStatus();
    }, [])
  );

  const handleLogout = async () => {
    try {
      // Unregister push notifications before logout
      await unregisterPushNotifications();
      await apiService.logout();
      setIsLoggedIn(false);
      setUserName('');
      router.replace('/modal');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return { isLoggedIn, userName, handleLogout };
}

// Language switcher component
function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <View style={headerStyles.languageContainer}>
      <TouchableOpacity 
        onPress={() => changeLanguage('en')}
        style={[headerStyles.flagButton, currentLang === 'en' && headerStyles.flagButtonActive]}
      >
        <Text style={[headerStyles.flagText, currentLang !== 'en' && headerStyles.flagTextInactive]}>🇬🇧</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => changeLanguage('sr')}
        style={[headerStyles.flagButton, currentLang === 'sr' && headerStyles.flagButtonActive]}
      >
        <Text style={[headerStyles.flagText, currentLang !== 'sr' && headerStyles.flagTextInactive]}>🇷🇸</Text>
      </TouchableOpacity>
    </View>
  );
}

// Left side: User name + language switcher
function HeaderLeft() {
  const { isLoggedIn, userName } = useAuthState();

  if (!isLoggedIn) return null;

  return (
    <View style={headerStyles.leftContainer}>
      <Text style={headerStyles.userName}>{userName}</Text>
      <LanguageSwitcher />
    </View>
  );
}

// Right side: Login/Logout button
function HeaderRight() {
  const { isLoggedIn, handleLogout } = useAuthState();
  const { t } = useTranslation();

  if (!isLoggedIn) {
    return (
      <Link href="/modal" asChild>
        <Pressable style={headerStyles.loginButton}>
          {({ pressed }) => (
            <Text style={[headerStyles.loginButtonText, { opacity: pressed ? 0.7 : 1 }]}>
              {t('auth.logIn')}
            </Text>
          )}
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable onPress={handleLogout} style={headerStyles.logoutButton}>
      {({ pressed }) => (
        <Text style={[headerStyles.logoutButtonText, { opacity: pressed ? 0.7 : 1 }]}>
          {t('auth.logout')}
        </Text>
      )}
    </Pressable>
  );
}

const headerStyles = StyleSheet.create({
  leftContainer: {
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flagButton: {
    padding: 4,
    borderRadius: 4,
  },
  flagButtonActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  flagText: {
    fontSize: 18,
  },
  flagTextInactive: {
    opacity: 0.4,
  },
  loginButton: {
    marginRight: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4ecdc4',
    borderRadius: 16,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    marginRight: 15,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
  },
});

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);


  // Check if user is logged in and if they're an admin
  useEffect(() => {
    const checkAuth = async () => {
      const user = await apiService.getCurrentUser();
      if (!user) {
        router.replace('/modal');
      } else {
        const isUserAdmin = user.role === 'admin';
        setIsAdmin(isUserAdmin);
        // Redirect admin to admin panel
        if (isUserAdmin) {
          router.replace('/(tabs)/admin');
        }
      }
    };
    checkAuth();
  }, []);

  if (isAdmin) {
    // Admin sees Admin Panel and User Management
    return (
      <ScrollProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tint,
          headerShown: useClientOnlyValue(false, true),
          headerLeft: () => <HeaderLeft />,
          headerRight: () => <HeaderRight />,
          headerTransparent: Platform.OS === 'web',
          headerBackground: () => <HeaderBackground />,
          headerTitle: '',
          headerStyle: { backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fef5f1' },
        }}>
        <Tabs.Screen
          name="admin"
          options={{
            title: t('tabs.adminPanel'),
            headerTitle: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: t('tabs.users'),
            headerTitle: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
          }}
        />
        <Tabs.Screen
          name="payment-settings"
          options={{
            title: t('tabs.payment'),
            headerTitle: '',
            tabBarIcon: ({ color }) => <TabBarIcon name="credit-card" color={color} />,
          }}
        />
        <Tabs.Screen
          name="user-details"
          options={{
            href: null, // Hide from tabs
            title: t('admin.userDetails'),
            headerTitle: '',
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tabs
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            href: null, // Hide from tabs
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            href: null, // Hide from tabs
          }}
        />
      </Tabs>
      </ScrollProvider>
    );
  }

  // Regular users see Home, Order, Subscription
  return (
    <ScrollProvider>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: useClientOnlyValue(false, true),
        headerLeft: () => <HeaderLeft />,
        headerRight: () => <HeaderRight />,
        headerTransparent: Platform.OS === 'web',
        headerBackground: () => <HeaderBackground />,
        headerTitle: '',
        headerStyle: { backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fef5f1' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerTitle: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: t('tabs.order'),
          headerTitle: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: t('tabs.subscription'),
          headerTitle: '',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="payment-settings"
        options={{
          href: null, // Hide from tabs
        }}
      />
      <Tabs.Screen
        name="user-details"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
    </ScrollProvider>
  );
}
