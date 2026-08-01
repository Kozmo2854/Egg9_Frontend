import React from 'react';
import { StyleSheet } from 'react-native';
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

  // Uses Paper's standard Dialog sub-components (Title/Content/Actions) so it
  // centers and sizes correctly on BOTH native and web. Avoid web-only hacks
  // (zIndex / fixed maxWidth / manual alignSelf) which mis-render on native.
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Content style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button onPress={onDismiss} mode="outlined" compact style={styles.button}>
            {t('common.no')}
          </Button>
          <Button
            onPress={onConfirm}
            mode="contained"
            compact
            loading={isLoading}
            disabled={isLoading}
            buttonColor={confirmButtonColor || theme.colors.error}
            style={styles.button}
          >
            {t('common.yes')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
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
  },
  actions: {
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    minWidth: 96,
  },
});
