import { useState } from 'react';
import { 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { View } from '@/components/Themed';
import { 
  TextInput, 
  Button, 
  Text, 
  Snackbar,
  useTheme 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { useRouter, Link } from 'expo-router';
import { registerForPushNotifications } from '@/utils/pushNotifications';
import { isDevMode } from '@/utils/devMode';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setLoginError(null);
    setLoginSuccess(null);
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.login(email, password);
      setLoginSuccess(`Welcome ${response.user.name}!`);
      setEmail('');
      setPassword('');
      
      // Register for push notifications after successful login (customers only)
      if (response.user.role !== 'admin') {
        registerForPushNotifications();
      }
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setErrors({});
    setLoginError(null);
    setLoginSuccess(null);
    setLoading(true);
    
    try {
      const response = await apiService.login(userEmail, userPassword);
      setLoginSuccess(`Welcome ${response.user.name}!`);
      setEmail('');
      setPassword('');
      
      // Register for push notifications after successful login (customers only)
      if (response.user.role !== 'admin') {
        registerForPushNotifications();
      }
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      setLoginError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo/Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.eggEmoji}>🥚</Text>
              </View>
              <Text style={styles.title}>Egg9</Text>
              <Text style={styles.subtitle}>Fresh eggs delivered weekly</Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              <Text style={styles.cardTitle}>Welcome Back</Text>
              
              <TextInput
                label="Email Address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                disabled={loading}
                error={!!errors.email}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="email-outline" />}
                theme={{ roundness: 12 }}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}

              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                disabled={loading}
                error={!!errors.password}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{ roundness: 12 }}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                contentStyle={styles.loginButtonContent}
                labelStyle={styles.loginButtonLabel}
                buttonColor={theme.colors.primary}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              {/* Sign Up Link */}
              <View style={styles.signupSection}>
                <Text style={styles.signupText}>Don't have an account? </Text>
                <Link href="/register" asChild>
                  <Button
                    mode="text"
                    compact
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    Sign Up
                  </Button>
                </Link>
              </View>

              {/* Quick Login Buttons - Dev Only */}
              {isDevMode() && (
                <View style={styles.quickLoginSection}>
                  <Text style={styles.quickLoginLabel}>Quick Login (Dev)</Text>
                  <View style={styles.quickLoginButtons}>
                    <Button
                      mode="contained"
                      onPress={() => quickLogin('user1@egg9.com', 'password123')}
                      disabled={loading}
                      style={styles.quickLoginButton}
                      buttonColor="#4ecdc4"
                      compact
                    >
                      User 1
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => quickLogin('user2@egg9.com', 'password123')}
                      disabled={loading}
                      style={styles.quickLoginButton}
                      buttonColor="#4ecdc4"
                      compact
                    >
                      User 2
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => quickLogin('user3@egg9.com', 'password123')}
                      disabled={loading}
                      style={styles.quickLoginButton}
                      buttonColor="#4ecdc4"
                      compact
                    >
                      User 3
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => quickLogin('admin@egg9.com', 'password123')}
                      disabled={loading}
                      style={styles.quickLoginButton}
                      buttonColor="#ff6b35"
                      compact
                    >
                      Admin
                    </Button>
                  </View>
                </View>
              )}

              {/* Test Credentials - Dev Only */}
              {isDevMode() && (
                <View style={styles.credentialsSection}>
                  <Button
                    mode="text"
                    onPress={() => setShowCredentials(!showCredentials)}
                    icon={showCredentials ? "chevron-up" : "information-outline"}
                    textColor={theme.colors.onSurfaceVariant}
                    compact
                  >
                    {showCredentials ? 'Hide' : 'Show'} Test Credentials
                  </Button>
                  
                  {showCredentials && (
                    <View style={styles.credentialsBox}>
                      <View style={styles.credentialRow}>
                        <Text style={styles.credentialLabel}>Admin:</Text>
                        <Text style={styles.credentialValue}>admin@egg9.com / password123</Text>
                      </View>
                      <View style={styles.credentialRow}>
                        <Text style={styles.credentialLabel}>User 1:</Text>
                        <Text style={styles.credentialValue}>user1@egg9.com / password123</Text>
                      </View>
                      <View style={styles.credentialRow}>
                        <Text style={styles.credentialLabel}>User 2:</Text>
                        <Text style={styles.credentialValue}>user2@egg9.com / password123</Text>
                      </View>
                      <View style={styles.credentialRow}>
                        <Text style={styles.credentialLabel}>User 3:</Text>
                        <Text style={styles.credentialValue}>user3@egg9.com / password123</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Snackbars */}
        <Snackbar
          visible={!!loginError}
          onDismiss={() => setLoginError(null)}
          duration={3000}
          action={{
            label: 'Dismiss',
            textColor: '#fff',
            onPress: () => setLoginError(null),
          }}
          style={{ backgroundColor: theme.colors.error }}
        >
          {loginError}
        </Snackbar>

        <Snackbar
          visible={!!loginSuccess}
          onDismiss={() => setLoginSuccess(null)}
          duration={2000}
          style={{ backgroundColor: theme.colors.tertiary }}
        >
          {loginSuccess}
        </Snackbar>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  eggEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#2d3748',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  loginCard: {
    width: Math.min(width - 48, 450),
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#ff5252',
    fontSize: 13,
    marginLeft: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  signupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  quickLoginSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickLoginLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickLoginButton: {
    flex: 1,
    borderRadius: 8,
  },
  credentialsSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  credentialsBox: {
    backgroundColor: '#fef5f1',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ffe5dc',
  },
  credentialRow: {
    marginBottom: 8,
  },
  credentialLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b2500',
    marginBottom: 2,
  },
  credentialValue: {
    fontSize: 13,
    color: '#524541',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
