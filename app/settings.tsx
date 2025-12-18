import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { 
  Text, 
  Surface, 
  Switch, 
  Button, 
  TextInput, 
  Portal, 
  Dialog,
  Divider,
  useTheme,
  ActivityIndicator,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { apiService } from '@/services/api';
import { unregisterPushNotifications } from '@/utils/pushNotifications';

interface UserData {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  
  // Edit dialogs
  const [editNameDialog, setEditNameDialog] = useState(false);
  const [editPhoneDialog, setEditPhoneDialog] = useState(false);
  const [editEmailDialog, setEditEmailDialog] = useState(false);
  const [editPasswordDialog, setEditPasswordDialog] = useState(false);
  const [deleteAccountDialog, setDeleteAccountDialog] = useState(false);
  
  // Form values
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  
  // Validation errors
  const [emailPasswordError, setEmailPasswordError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');

  const loadUser = useCallback(async () => {
    try {
      const userData = await apiService.getCurrentUser();
      if (userData) {
        setUser(userData as UserData);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const showSnackbar = (message: string) => {
    setSnackbar({ visible: true, message });
  };

  const handleUpdateProfile = async (field: 'name' | 'phone') => {
    if (!user) return;
    setSaving(true);
    try {
      const data = field === 'name' 
        ? { name: editName } 
        : { phone_number: editPhone };
      const response = await apiService.updateProfile(data);
      setUser(response.user as UserData);
      setEditNameDialog(false);
      setEditPhoneDialog(false);
      showSnackbar(t('settings.profileUpdated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('settings.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!user) return;
    
    // Validate password
    if (!emailPassword.trim()) {
      setEmailPasswordError(t('settings.passwordRequired'));
      return;
    }
    setEmailPasswordError('');
    
    setSaving(true);
    try {
      const response = await apiService.updateEmail(editEmail, emailPassword);
      setUser(response.user as UserData);
      setEditEmailDialog(false);
      setEmailPassword('');
      showSnackbar(t('settings.emailUpdated'));
    } catch (error: any) {
      // Check for password error in Laravel validation response
      const passwordErrors = error.data?.errors?.password;
      const hasPasswordError = passwordErrors || 
        error.message?.toLowerCase().includes('password') ||
        error.message?.toLowerCase().includes('incorrect');
      
      if (hasPasswordError) {
        setEmailPasswordError(t('settings.incorrectPassword'));
      } else {
        setEmailPasswordError(t('settings.updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Clear previous errors
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    
    // Validate all fields
    let hasError = false;
    
    if (!currentPassword.trim()) {
      setCurrentPasswordError(t('settings.passwordRequired'));
      hasError = true;
    }
    if (!newPassword.trim()) {
      setNewPasswordError(t('settings.passwordRequired'));
      hasError = true;
    } else if (newPassword.length < 6) {
      setNewPasswordError(t('settings.passwordMinLength'));
      hasError = true;
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t('settings.passwordRequired'));
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('settings.passwordMismatch'));
      hasError = true;
    }
    
    if (hasError) return;
    
    setSaving(true);
    try {
      await apiService.updatePassword(currentPassword, newPassword);
      setEditPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showSnackbar(t('settings.passwordUpdated'));
    } catch (error: any) {
      // Check for password error in Laravel validation response
      const hasPasswordError = error.data?.errors?.current_password || 
        error.message?.toLowerCase().includes('password') ||
        error.message?.toLowerCase().includes('incorrect');
      if (hasPasswordError) {
        setCurrentPasswordError(t('settings.incorrectPassword'));
      } else {
        Alert.alert(t('common.error'), t('settings.updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotification = async (type: 'push' | 'email', value: boolean) => {
    if (!user) return;
    try {
      const data = type === 'push' 
        ? { push_notifications_enabled: value }
        : { email_notifications_enabled: value };
      const response = await apiService.updateNotifications(data);
      setUser(response.user as UserData);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('settings.updateFailed'));
    }
  };

  const handleDeleteAccount = async () => {
    // Validate password
    if (!deletePassword.trim()) {
      setDeletePasswordError(t('settings.passwordRequired'));
      return;
    }
    setDeletePasswordError('');
    
    setSaving(true);
    try {
      await unregisterPushNotifications();
      await apiService.deleteAccount(deletePassword);
      setDeleteAccountDialog(false);
      router.replace('/modal');
    } catch (error: any) {
      // Check for password error in Laravel validation response
      const hasPasswordError = error.data?.errors?.password || 
        error.message?.toLowerCase().includes('password') ||
        error.message?.toLowerCase().includes('incorrect');
      if (hasPasswordError) {
        setDeletePasswordError(t('settings.incorrectPassword'));
      } else {
        Alert.alert(t('common.error'), t('settings.deleteFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>{t('common.error')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Button 
            icon={({ size, color }) => <FontAwesome name="arrow-left" size={20} color={color} />}
            onPress={() => router.back()}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
          >
            {t('common.back')}
          </Button>
          <Text style={styles.title}>{t('settings.title')}</Text>
        </View>

        {/* Profile Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('settings.profile')}</Text>
          
          <SettingRow 
            label={t('settings.name')} 
            value={user.name}
            onPress={() => { setEditName(user.name); setEditNameDialog(true); }}
          />
          <Divider />
          <SettingRow 
            label={t('settings.phone')} 
            value={user.phoneNumber}
            onPress={() => { setEditPhone(user.phoneNumber); setEditPhoneDialog(true); }}
          />
          <Divider />
          {/* Email - display only, not editable */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.email')}</Text>
              <Text style={styles.settingValue} numberOfLines={1}>{user.email}</Text>
            </View>
          </View>
          <Divider />
          <SettingRow 
            label={t('settings.password')} 
            value="••••••••"
            onPress={() => setEditPasswordDialog(true)}
          />
        </Surface>

        {/* Notifications Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('settings.pushNotifications')}</Text>
            <Switch
              value={user.pushNotificationsEnabled}
              onValueChange={(val) => handleToggleNotification('push', val)}
              color={theme.colors.primary}
            />
          </View>
          <Divider />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('settings.emailNotifications')}</Text>
            <Switch
              value={user.emailNotificationsEnabled}
              onValueChange={(val) => handleToggleNotification('email', val)}
              color={theme.colors.primary}
            />
          </View>
        </Surface>

        {/* Language Section */}
        <Surface style={styles.section} elevation={1}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.languageRow}>
            <Button
              mode={i18n.language === 'en' ? 'contained' : 'outlined'}
              onPress={() => changeLanguage('en')}
              style={styles.langButton}
            >
              🇬🇧 English
            </Button>
            <Button
              mode={i18n.language === 'sr' ? 'contained' : 'outlined'}
              onPress={() => changeLanguage('sr')}
              style={styles.langButton}
            >
              🇷🇸 Srpski
            </Button>
          </View>
        </Surface>

        {/* Danger Zone */}
        <Surface style={[styles.section, styles.dangerSection]} elevation={1}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>
            {t('settings.dangerZone')}
          </Text>
          <Button
            mode="outlined"
            textColor={theme.colors.error}
            style={styles.deleteButton}
            onPress={() => setDeleteAccountDialog(true)}
          >
            {t('settings.deleteAccount')}
          </Button>
        </Surface>
      </ScrollView>

      {/* Edit Name Dialog */}
      <Portal>
        <Dialog visible={editNameDialog} onDismiss={() => setEditNameDialog(false)} style={styles.dialog}>
          <Dialog.Title>{t('settings.editName')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t('settings.name')}
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditNameDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={() => handleUpdateProfile('name')} loading={saving}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Phone Dialog */}
        <Dialog visible={editPhoneDialog} onDismiss={() => setEditPhoneDialog(false)} style={styles.dialog}>
          <Dialog.Title>{t('settings.editPhone')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t('settings.phone')}
              value={editPhone}
              onChangeText={setEditPhone}
              mode="outlined"
              keyboardType="phone-pad"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditPhoneDialog(false)}>{t('common.cancel')}</Button>
            <Button onPress={() => handleUpdateProfile('phone')} loading={saving}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Email Dialog */}
        <Dialog visible={editEmailDialog} onDismiss={() => { setEditEmailDialog(false); setEmailPasswordError(''); }} style={styles.dialog}>
          <Dialog.Title>{t('settings.editEmail')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t('settings.email')}
              value={editEmail}
              onChangeText={setEditEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.dialogInput}
            />
            <TextInput
              label={t('settings.confirmPassword')}
              value={emailPassword}
              onChangeText={(text) => { setEmailPassword(text); setEmailPasswordError(''); }}
              mode="outlined"
              secureTextEntry
              error={!!emailPasswordError}
              style={emailPasswordError ? styles.inputError : undefined}
            />
            {emailPasswordError ? (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {emailPasswordError}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setEditEmailDialog(false); setEmailPasswordError(''); }}>{t('common.cancel')}</Button>
            <Button onPress={handleUpdateEmail} loading={saving}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Password Dialog */}
        <Dialog visible={editPasswordDialog} onDismiss={() => { 
          setEditPasswordDialog(false); 
          setCurrentPasswordError(''); 
          setNewPasswordError(''); 
          setConfirmPasswordError(''); 
        }} style={styles.dialog}>
          <Dialog.Title>{t('settings.changePassword')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label={t('settings.currentPassword')}
              value={currentPassword}
              onChangeText={(text) => { setCurrentPassword(text); setCurrentPasswordError(''); }}
              mode="outlined"
              secureTextEntry
              error={!!currentPasswordError}
              style={currentPasswordError ? styles.inputError : styles.dialogInput}
            />
            {currentPasswordError ? (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {currentPasswordError}
              </HelperText>
            ) : null}
            
            <TextInput
              label={t('settings.newPassword')}
              value={newPassword}
              onChangeText={(text) => { setNewPassword(text); setNewPasswordError(''); }}
              mode="outlined"
              secureTextEntry
              error={!!newPasswordError}
              style={newPasswordError ? styles.inputError : styles.dialogInput}
            />
            {newPasswordError ? (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {newPasswordError}
              </HelperText>
            ) : null}
            
            <TextInput
              label={t('settings.confirmNewPassword')}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setConfirmPasswordError(''); }}
              mode="outlined"
              secureTextEntry
              error={!!confirmPasswordError}
              style={confirmPasswordError ? styles.inputError : undefined}
            />
            {confirmPasswordError ? (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {confirmPasswordError}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { 
              setEditPasswordDialog(false); 
              setCurrentPasswordError(''); 
              setNewPasswordError(''); 
              setConfirmPasswordError(''); 
            }}>{t('common.cancel')}</Button>
            <Button onPress={handleUpdatePassword} loading={saving}>
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog visible={deleteAccountDialog} onDismiss={() => { setDeleteAccountDialog(false); setDeletePasswordError(''); }} style={styles.dialog}>
          <Dialog.Title>{t('settings.deleteAccount')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text style={styles.deleteWarning}>{t('settings.deleteWarning')}</Text>
            <TextInput
              label={t('settings.confirmPassword')}
              value={deletePassword}
              onChangeText={(text) => { setDeletePassword(text); setDeletePasswordError(''); }}
              mode="outlined"
              secureTextEntry
              error={!!deletePasswordError}
              style={deletePasswordError ? styles.inputError : undefined}
            />
            {deletePasswordError ? (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {deletePasswordError}
              </HelperText>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setDeleteAccountDialog(false); setDeletePasswordError(''); }}>{t('common.cancel')}</Button>
            <Button 
              onPress={handleDeleteAccount} 
              loading={saving}
              textColor={theme.colors.error}
            >
              {t('settings.deleteConfirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

// Helper component for setting rows
function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue} numberOfLines={1}>{value}</Text>
      </View>
      <Button mode="text" onPress={onPress}>
        <FontAwesome name="pencil" size={16} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5f1',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  backButtonLabel: {
    fontSize: 16,
    marginLeft: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 8,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 16,
    color: '#2d3748',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2d3748',
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langButton: {
    flex: 1,
  },
  dangerSection: {
    borderColor: '#ffcccc',
    borderWidth: 1,
  },
  deleteButton: {
    borderColor: '#ff5252',
  },
  dialog: {
    borderRadius: 16,
  },
  dialogContent: {
    paddingBottom: 8,
  },
  dialogInput: {
    marginBottom: 12,
  },
  inputError: {
    marginBottom: 0,
  },
  errorText: {
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  deleteWarning: {
    color: '#666',
    marginBottom: 16,
  },
});

