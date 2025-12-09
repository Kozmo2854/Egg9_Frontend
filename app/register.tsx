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
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';

interface FormErrors {
  name?: string;
  phoneNumber?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.trim().length < 8) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

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

    if (!passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setRegisterError(null);
    setRegisterSuccess(null);
    
    if (!validate()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiService.register(name, email, phoneNumber, password);
      setRegisterSuccess(`Welcome ${response.user.name}!`);
      setName('');
      setPhoneNumber('');
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      setRegisterError('Registration failed. Email may already be in use.');
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
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            {/* Register Card */}
            <View style={styles.registerCard}>
              <Text style={styles.cardTitle}>Sign Up</Text>
              
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                autoCapitalize="words"
                autoComplete="name"
                disabled={loading}
                error={!!errors.name}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="account-outline" />}
                theme={{ roundness: 12 }}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}

              <TextInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (errors.phoneNumber) {
                    setErrors({ ...errors, phoneNumber: undefined });
                  }
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                disabled={loading}
                error={!!errors.phoneNumber}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="phone" />}
                theme={{ roundness: 12 }}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}

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
                disabled={loading}
                error={!!errors.password}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? 'eye-off' : 'eye'} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                theme={{ roundness: 12 }}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}

              <TextInput
                label="Confirm Password"
                value={passwordConfirm}
                onChangeText={(text) => {
                  setPasswordConfirm(text);
                  if (errors.passwordConfirm) {
                    setErrors({ ...errors, passwordConfirm: undefined });
                  }
                }}
                secureTextEntry={!showPasswordConfirm}
                disabled={loading}
                error={!!errors.passwordConfirm}
                mode="outlined"
                style={styles.input}
                outlineColor={theme.colors.outlineVariant}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-check-outline" />}
                right={
                  <TextInput.Icon 
                    icon={showPasswordConfirm ? 'eye-off' : 'eye'} 
                    onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  />
                }
                theme={{ roundness: 12 }}
              />
              {errors.passwordConfirm && (
                <Text style={styles.errorText}>{errors.passwordConfirm}</Text>
              )}

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
                contentStyle={styles.registerButtonContent}
                labelStyle={styles.registerButtonLabel}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <Link href="/modal" asChild>
                  <Button
                    mode="text"
                    compact
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    Log In
                  </Button>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Snackbar
        visible={!!registerError}
        onDismiss={() => setRegisterError(null)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {registerError}
      </Snackbar>

      <Snackbar
        visible={!!registerSuccess}
        onDismiss={() => setRegisterSuccess(null)}
        duration={2000}
        style={{ backgroundColor: theme.colors.secondary }}
      >
        {registerSuccess}
      </Snackbar>
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
    alignItems: 'center',
    justifyContent: 'center',
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
  registerCard: {
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
  registerButton: {
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonContent: {
    paddingVertical: 8,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
});

