import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, View as RNView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { View } from '@/components/Themed';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  TextInput,
  useTheme 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';
import { useScrollContext } from '@/contexts/ScrollContext';

export default function PaymentSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { setScrollY } = useScrollContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [paymentPurpose, setPaymentPurpose] = useState('');
  const [paymentCode, setPaymentCode] = useState('');

  // Redirect non-admin users
  useEffect(() => {
    const checkAuth = async () => {
      const user = await apiService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        router.replace('/(tabs)/');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    loadPaymentSettings();
  }, []);

  const loadPaymentSettings = async () => {
    try {
      setLoading(true);
      const settings = await apiService.getPaymentSettings();
      setBankAccountNumber(settings.bankAccountNumber);
      setRecipientName(settings.recipientName);
      setPaymentPurpose(settings.paymentPurpose);
      setPaymentCode(settings.paymentCode);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('paymentSettings.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!bankAccountNumber.trim() || !recipientName.trim() || !paymentPurpose.trim() || !paymentCode.trim()) {
      Alert.alert(t('common.error'), t('paymentSettings.allFieldsRequired'));
      return;
    }

    try {
      setSaving(true);
      await apiService.updatePaymentSettings({
        bankAccountNumber: bankAccountNumber.trim(),
        recipientName: recipientName.trim(),
        paymentPurpose: paymentPurpose.trim(),
        paymentCode: paymentCode.trim(),
      });
      Alert.alert(t('common.ok'), t('paymentSettings.settingsUpdated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('paymentSettings.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollY(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEmoji}>💳</Text>
        <Text style={styles.heroTitle}>{t('paymentSettings.title')}</Text>
        <Text style={styles.heroSubtitle}>{t('paymentSettings.subtitle')}</Text>
      </LinearGradient>

      <RNView style={styles.content}>
        {/* Payment Settings Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('paymentSettings.bankAccountInfo')}
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              {t('paymentSettings.detailsDescription')}
            </Text>

            <TextInput
              label={t('paymentSettings.bankAccountNumber')}
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              mode="outlined"
              style={styles.input}
              placeholder="160-0000012345678-91"
              maxLength={30}
            />

            <TextInput
              label={t('paymentSettings.recipientName')}
              value={recipientName}
              onChangeText={setRecipientName}
              mode="outlined"
              style={styles.input}
              placeholder="EGG9 DOO"
              maxLength={100}
            />

            <TextInput
              label={t('paymentSettings.paymentPurpose')}
              value={paymentPurpose}
              onChangeText={setPaymentPurpose}
              mode="outlined"
              style={styles.input}
              placeholder="Placanje za jaja"
              maxLength={150}
            />

            <TextInput
              label={t('paymentSettings.paymentCode')}
              value={paymentCode}
              onChangeText={setPaymentCode}
              mode="outlined"
              style={styles.input}
              placeholder="289"
              maxLength={10}
              keyboardType="numeric"
            />

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
              icon="content-save"
            >
              {t('paymentSettings.saveSettings')}
            </Button>
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              {t('paymentSettings.info')}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>{t('paymentSettings.bankAccountNumber')}:</Text> {t('paymentSettings.bankAccountDesc')}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>{t('paymentSettings.recipientName')}:</Text> {t('paymentSettings.recipientDesc')}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>{t('paymentSettings.paymentPurpose')}:</Text> {t('paymentSettings.purposeDesc')}
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>{t('paymentSettings.paymentCode')}:</Text> {t('paymentSettings.codeDesc')}
            </Text>
          </Card.Content>
        </Card>
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  hero: {
    padding: 32,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    marginBottom: 16,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
});

