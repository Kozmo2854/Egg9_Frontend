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
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError(t('auth.emailRequired'));
      return false;
    }
    if (!validateEmail(email.trim())) {
      setEmailError(t('auth.emailInvalid'));
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async () => {
    setRequestError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // The API answers the same way for every email, so the screen does too.
      await apiService.forgotPassword(email.trim());
      setSent(true);
    } catch (error: any) {
      if (error?.statusCode === 422 && error?.data?.errors?.email) {
        setEmailError(t('auth.emailInvalid'));
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
              {sent ? (
                <>
                  <Text style={styles.cardTitle}>{t('auth.checkMailboxTitle')}</Text>
                  <Text style={styles.cardText}>{t('auth.checkMailboxBody')}</Text>

                  <Link href="/modal" asChild>
                    <Button
                      mode="contained"
                      style={styles.submitButton}
                      contentStyle={styles.submitButtonContent}
                      labelStyle={styles.submitButtonLabel}
                    >
                      {t('auth.backToLogin')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>{t('auth.forgotPasswordTitle')}</Text>
                  <Text style={styles.cardText}>{t('auth.forgotPasswordSubtitle')}</Text>

                  <TextInput
                    label={t('auth.email')}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) {
                        setEmailError(null);
                      }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={loading}
                    error={!!emailError}
                    mode="outlined"
                    style={styles.input}
                    outlineColor={theme.colors.outlineVariant}
                    activeOutlineColor={theme.colors.primary}
                    left={<TextInput.Icon icon="email-outline" />}
                    theme={{ roundness: 12 }}
                    onSubmitEditing={handleSubmit}
                  />
                  {emailError && (
                    <Text style={styles.errorText}>{emailError}</Text>
                  )}

                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                    contentStyle={styles.submitButtonContent}
                    labelStyle={styles.submitButtonLabel}
                  >
                    {loading ? t('auth.sending') : t('auth.sendResetLink')}
                  </Button>

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
                </>
              )}
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
