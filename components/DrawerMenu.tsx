import React from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Text, Divider, useTheme, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, color }) => {
  const theme = useTheme();
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <FontAwesome 
        name={icon as any} 
        size={22} 
        color={color || theme.colors.onSurface} 
        style={styles.menuIcon} 
      />
      <Text style={[styles.menuLabel, color ? { color } : null]}>{label}</Text>
      <FontAwesome name="chevron-right" size={14} color="#999" />
    </TouchableOpacity>
  );
};

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  userName,
  userEmail,
  onLogout,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  if (!isOpen && fadeAnim._value === 0) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            styles.backdrop, 
            { opacity: fadeAnim }
          ]} 
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View 
        style={[
          styles.drawer, 
          { 
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }
        ]}
      >
        {/* User Profile Header */}
        <View style={styles.profileSection}>
          <Avatar.Text 
            size={60} 
            label={userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)} 
            style={{ backgroundColor: theme.colors.primary }}
          />
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
        </View>

        <Divider style={styles.divider} />

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <MenuItem 
            icon="cog" 
            label={t('settings.title')} 
            onPress={() => handleNavigation('/settings')} 
          />
          <MenuItem 
            icon="history" 
            label={t('settings.orderHistory')} 
            onPress={() => handleNavigation('/order-history')} 
          />
        </View>

        <Divider style={styles.divider} />

        {/* Logout */}
        <View style={styles.menuSection}>
          <MenuItem 
            icon="sign-out" 
            label={t('auth.logout')} 
            onPress={onLogout}
            color={theme.colors.error}
          />
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Egg9 v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  profileSection: {
    padding: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#2d3748',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuIcon: {
    width: 28,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#2d3748',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
});

export default DrawerMenu;

