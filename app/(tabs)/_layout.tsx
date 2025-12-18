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
import { WeekProvider, useWeekContext } from '@/contexts/WeekContext';
import { unregisterPushNotifications } from '@/utils/pushNotifications';
import { DrawerMenu } from '@/components/DrawerMenu';

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
  const [userEmail, setUserEmail] = useState('');

  const checkLoginStatus = async () => {
    const user = await apiService.getCurrentUser();
    setIsLoggedIn(!!user);
    setUserName(user?.name || '');
    setUserEmail(user?.email || '');
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
      setUserEmail('');
      router.replace('/modal');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return { isLoggedIn, userName, userEmail, handleLogout };
}

// Hamburger menu button for opening drawer
function HamburgerButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={headerStyles.hamburgerButton}>
      {({ pressed }) => (
        <FontAwesome 
          name="bars" 
          size={22} 
          color="#2d3748" 
          style={{ opacity: pressed ? 0.7 : 1 }}
        />
      )}
    </Pressable>
  );
}

// Format date helper
function formatWeekDate(isoDate: string | null) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Left side: Hamburger menu
function HeaderLeft({ onMenuPress }: { onMenuPress: () => void }) {
  const { isLoggedIn } = useAuthState();

  if (!isLoggedIn) return null;

  return (
    <View style={headerStyles.leftContainer}>
      <HamburgerButton onPress={onMenuPress} />
    </View>
  );
}

// Center: Week dates display
function HeaderCenter() {
  const { weekStart, weekEnd } = useWeekContext();
  
  if (!weekStart || !weekEnd) return null;
  
  return (
    <View style={headerStyles.centerContainer}>
      <Text style={headerStyles.weekIcon}>🥚</Text>
      <Text style={headerStyles.weekDates}>
        {formatWeekDate(weekStart)} - {formatWeekDate(weekEnd)}
      </Text>
    </View>
  );
}

// Right side: Login button (only shown when logged out)
function HeaderRight() {
  const { isLoggedIn } = useAuthState();
  const { t } = useTranslation();

  if (isLoggedIn) return null;

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

const headerStyles = StyleSheet.create({
  leftContainer: {
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hamburgerButton: {
    padding: 8,
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    pointerEvents: 'none',
  },
  weekIcon: {
    fontSize: 18,
  },
  weekDates: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
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
});

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { userName, userEmail, handleLogout } = useAuthState();

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

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);
  
  const handleDrawerLogout = async () => {
    closeDrawer();
    await handleLogout();
  };

  if (isAdmin) {
    // Admin sees Admin Panel and User Management
    return (
      <WeekProvider>
        <ScrollProvider>
          <View style={{ flex: 1 }}>
            <Tabs
              screenOptions={{
                tabBarActiveTintColor: Colors.light.tint,
                headerShown: useClientOnlyValue(false, true),
                headerLeft: () => <HeaderLeft onMenuPress={openDrawer} />,
                headerTitle: () => <HeaderCenter />,
                headerRight: () => <HeaderRight />,
                headerTransparent: Platform.OS === 'web',
                headerBackground: () => <HeaderBackground />,
                headerStyle: { backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fef5f1' },
              }}>
            <Tabs.Screen
              name="admin"
              options={{
                title: t('tabs.adminPanel'),
                tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
              }}
            />
            <Tabs.Screen
              name="users"
              options={{
                title: t('tabs.users'),
                tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
              }}
            />
            <Tabs.Screen
              name="payment-settings"
              options={{
                title: t('tabs.payment'),
                tabBarIcon: ({ color }) => <TabBarIcon name="credit-card" color={color} />,
              }}
            />
            <Tabs.Screen
              name="user-details"
              options={{
                href: null, // Hide from tabs
                title: t('admin.userDetails'),
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
            <DrawerMenu
              isOpen={drawerOpen}
              onClose={closeDrawer}
              userName={userName}
              userEmail={userEmail}
              onLogout={handleDrawerLogout}
            />
          </View>
        </ScrollProvider>
      </WeekProvider>
    );
  }

  // Regular users see GalleryTabs (PagerView with custom tab bar)
  return (
    <WeekProvider>
      <ScrollProvider>
        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors.light.tint,
              headerShown: useClientOnlyValue(false, true),
              headerLeft: () => <HeaderLeft onMenuPress={openDrawer} />,
              headerTitle: () => <HeaderCenter />,
              headerRight: () => <HeaderRight />,
              headerTransparent: Platform.OS === 'web',
              headerBackground: () => <HeaderBackground />,
              headerStyle: { backgroundColor: Platform.OS === 'web' ? 'transparent' : '#fef5f1' },
              tabBarStyle: { display: 'none' }, // Hide built-in tab bar - we use custom one in PagerView
            }}>
          <Tabs.Screen
            name="index"
            options={{
              title: t('tabs.home'),
            }}
          />
          <Tabs.Screen
            name="two"
            options={{
              href: null, // Hidden - handled by PagerView
            }}
          />
          <Tabs.Screen
            name="subscription"
            options={{
              href: null, // Hidden - handled by PagerView
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
          <DrawerMenu
            isOpen={drawerOpen}
            onClose={closeDrawer}
            userName={userName}
            userEmail={userEmail}
            onLogout={handleDrawerLogout}
          />
        </View>
      </ScrollProvider>
    </WeekProvider>
  );
}
