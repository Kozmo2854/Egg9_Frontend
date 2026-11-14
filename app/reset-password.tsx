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
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';

interface FormErrors {
  password?: string;
  passwordConfirm?: string;
}

// Query params can arrive as string | string[]; take the first value.
const firstParam = (value?: string | string[]): string =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token?: string | string[]; email?: string | string[] }>();
  const token = firstParam(params.token);
  // An unencoded "+" in the email can come back as a space; emails never contain spaces.
  const email = firstParam(params.email).replace(/ /g, '+');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const showInvalidLink = linkInvalid || !token || !email;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordMinLength');
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = t('auth.confirmPasswordRequired');
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = t('auth.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReset = async () => {
    setRequestError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await apiService.resetPassword(token, email, password, passwordConfirm);
      setPassword('');
      setPasswordConfirm('');
      router.replace('/modal?reset=success');
    } catch (error: any) {
      const fieldErrors = error?.statusCode === 422 ? error?.data?.errors : null;
      if (fieldErrors?.token || fieldErrors?.email) {
        setLinkInvalid(true);
      } else if (fieldErrors?.password) {
        setErrors({
          password: password !== passwordConfirm ? t('auth.passwordMismatch') : t('auth.passwordMinLength'),
        });
      } else if (error?.statusCode === 429) {
        setRequestError(t('auth.tooManyAttempts'));
      } else {
        setRequestError(t('auth.genericError'));
      }
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
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('auth.resetPasswordTitle')}</Text>

              {showInvalidLink ? (
                <>
                  <View style={[styles.banner, { backgroundColor: theme.colors.errorContainer }]}>
                    <Text style={styles.bannerText}>{t('auth.resetLinkInvalid')}</Text>
                  </View>

                  <Link href="/forgot-password" asChild>
                    <Button
                      mode="contained"
                      style={styles.submitButton}
                      contentStyle={styles.submitButtonContent}
                      labelStyle={styles.submitButtonLabel}
                    >
                      {t('auth.requestNewLink')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Text style={styles.cardText}>{t('auth.resetPasswordSubtitle')}</Text>

                  <TextInput
                    label={t('auth.newPassword')}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors({ ...errors, password: undefined });
                      }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
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
                    label={t('auth.confirmPassword')}
                    value={passwordConfirm}
                    onChangeText={(text) => {
                      setPasswordConfirm(text);
                      if (errors.passwordConfirm) {
                        setErrors({ ...errors, passwordConfirm: undefined });
                      }
                    }}
                    secureTextEntry={!showPasswordConfirm}
                    autoCapitalize="none"
                    autoComplete="new-password"
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
                    onPress={handleReset}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                  >
                    {loading ? t('auth.resetting') : t('auth.resetPassword')}
                  </Button>
                </>
              )}

              <View style={styles.linkSection}>
                <Link href="/modal" asChild>
                  <Button
                    mode="text"
                    compact
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    {t('auth.backToLogin')}
                  </Button>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Snackbar
        visible={!!requestError}
        onDismiss={() => setRequestError(null)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {requestError}
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
  card: {
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
    marginBottom: 12,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 15,
    color: '#4a5568',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  banner: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  bannerText: {
    fontSize: 15,
    color: '#7f1d1d',
    textAlign: 'center',
    lineHeight: 22,
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
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: 'transparent',
  },
});
