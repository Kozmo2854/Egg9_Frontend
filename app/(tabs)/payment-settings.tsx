import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, View as RNView } from 'react-native';
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
import { apiService } from '@/services/api';
import { useRouter } from 'expo-router';

export default function PaymentSettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
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
      Alert.alert('Error', error.message || 'Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate inputs
    if (!bankAccountNumber.trim() || !recipientName.trim() || !paymentPurpose.trim() || !paymentCode.trim()) {
      Alert.alert('Validation Error', 'All fields are required');
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
      Alert.alert('Success', 'Payment settings updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEmoji}>💳</Text>
        <Text style={styles.heroTitle}>Payment Settings</Text>
        <Text style={styles.heroSubtitle}>Configure QR code and bank details</Text>
      </LinearGradient>

      <RNView style={styles.content}>
        {/* Payment Settings Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Bank Account Information
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              These details will be displayed to users in the payment QR code and dialog
            </Text>

            <TextInput
              label="Bank Account Number"
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              mode="outlined"
              style={styles.input}
              placeholder="160-0000012345678-91"
              maxLength={30}
            />

            <TextInput
              label="Recipient Name"
              value={recipientName}
              onChangeText={setRecipientName}
              mode="outlined"
              style={styles.input}
              placeholder="EGG9 DOO"
              maxLength={100}
            />

            <TextInput
              label="Payment Purpose"
              value={paymentPurpose}
              onChangeText={setPaymentPurpose}
              mode="outlined"
              style={styles.input}
              placeholder="Placanje za jaja"
              maxLength={150}
            />

            <TextInput
              label="Payment Code (SF Code)"
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
              Save Payment Settings
            </Button>
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              ℹ️ Information
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>Bank Account Number:</Text> The account where payments will be received (e.g., 160-0000012345678-91).
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>Recipient Name:</Text> The name that will appear on the QR code and payment details.
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>Payment Purpose:</Text> Description that will appear on bank statements (e.g., "Placanje za jaja").
            </Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              <Text style={styles.bold}>Payment Code (SF):</Text> Serbian banking payment code. 289 is for goods and services.
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

