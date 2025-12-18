import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  message: string;
  confirmButtonColor?: string;
}

export function ConfirmDialog({
  visible,
  onDismiss,
  onConfirm,
  isLoading = false,
  title,
  message,
  confirmButtonColor,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Button onPress={onDismiss} mode="outlined" compact style={{ marginRight: 8 }}>
              {t('common.no')}
            </Button>
            <Button 
              onPress={onConfirm} 
              mode="contained"
              compact
              loading={isLoading}
              disabled={isLoading}
              buttonColor={confirmButtonColor || theme.colors.error}
            >
              {t('common.yes')}
            </Button>
          </View>
        </View>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 280,
    alignSelf: 'center',
    borderRadius: 16,
    zIndex: 9999,
    elevation: 24,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

