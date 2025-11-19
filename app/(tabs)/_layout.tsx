import React, { useState, useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs, useRouter } from 'expo-router';
import { Pressable, Alert, View, Text } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { apiService } from '@/services/api';
import { useFocusEffect } from '@react-navigation/native';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

function AuthButton() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const checkLoginStatus = async () => {
    const user = await apiService.getCurrentUser();
    setIsLoggedIn(!!user);
    setUserName(user?.name || '');
  };

  // Check login status when component mounts and when tabs change
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
      await apiService.logout();
      setIsLoggedIn(false);
      setUserName('');
      router.replace('/modal');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (!isLoggedIn) {
    return (
      <Link href="/modal" asChild>
        <Pressable>
          {({ pressed }) => (
            <FontAwesome
              name="sign-in"
              size={25}
              color={Colors[colorScheme ?? 'light'].text}
              style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
            />
          )}
        </Pressable>
      </Link>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
      <Text style={{ marginRight: 10, fontSize: 14, color: Colors[colorScheme ?? 'light'].text }}>
        {userName}
      </Text>
      <Pressable onPress={handleLogout}>
        {({ pressed }) => (
          <FontAwesome
            name="sign-out"
            size={25}
            color={Colors[colorScheme ?? 'light'].text}
            style={{ opacity: pressed ? 0.5 : 1 }}
          />
        )}
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
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
    // Admin only sees Admin panel
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: useClientOnlyValue(false, true),
          headerRight: () => <AuthButton />,
        }}>
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin Panel',
            tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
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
    );
  }

  // Regular users see Home, Order, Subscription
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => <AuthButton />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Order',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-basket" color={color} />,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: 'Subscription',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
