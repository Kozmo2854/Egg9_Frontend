import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Portal, Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';

interface PaymentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onMarkPaid: () => void;
  quantity: number;
  amount: number;
  bankAccountNumber?: string;
  recipientName?: string;
  qrCodeValue: string;
  isPaymentSubmitted?: boolean;
  isMarkingPayment?: boolean;
  weekLabel?: string; // For outstanding orders
}

export function PaymentDialog({
  visible,
  onDismiss,
  onMarkPaid,
  quantity,
  amount,
  bankAccountNumber,
  recipientName,
  qrCodeValue,
  isPaymentSubmitted = false,
  isMarkingPayment = false,
  weekLabel,
}: PaymentDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.dialogTitle}>
          {weekLabel ? t('home.outstandingPayment') : t('payment.title')}
        </Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          {weekLabel && (
            <Text style={styles.dialogSubtitle}>{weekLabel}</Text>
          )}
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={qrCodeValue}
              size={160}
              backgroundColor="white"
            />
          </View>
          <Text style={styles.paymentDialogAmount}>
            {quantity} {t('common.eggs')} • {amount.toFixed(0)} {t('common.rsd')}
          </Text>
          <View style={styles.bankDetails}>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>{t('payment.account')}</Text>
              <Text style={styles.bankDetailValue}>{bankAccountNumber}</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>{t('payment.recipient')}</Text>
              <Text style={styles.bankDetailValue}>{recipientName}</Text>
            </View>
          </View>
          <Text style={styles.dialogNote}>{t('payment.scanQR')}</Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.dialogActions}>
          {!isPaymentSubmitted && (
            <Button 
              onPress={onMarkPaid} 
              mode="contained"
              disabled={isMarkingPayment}
              loading={isMarkingPayment}
              buttonColor={theme.colors.tertiary}
              style={{ marginRight: 8 }}
            >
              {t('payment.markPaid')}
            </Button>
          )}
          <Button onPress={onDismiss} mode="outlined">{t('common.close')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

interface ConfirmPaymentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmPaymentDialog({
  visible,
  onDismiss,
  onConfirm,
  isLoading = false,
}: ConfirmPaymentDialogProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.confirmDialog}>
        <View style={styles.confirmDialogContent}>
          <Text style={styles.confirmDialogTitle}>{t('dashboard.confirmPaymentTitle')}</Text>
          <Text style={styles.confirmDialogText}>{t('dashboard.confirmPaymentMessage')}</Text>
          <View style={styles.confirmDialogActions}>
            <Button onPress={onDismiss} mode="outlined" compact style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
            <Button 
              onPress={onConfirm} 
              mode="contained"
              compact
              loading={isLoading}
              disabled={isLoading}
              buttonColor={theme.colors.tertiary}
            >
              {t('common.confirm')}
            </Button>
          </View>
        </View>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    maxWidth: 360,
    alignSelf: 'center',
  },
  dialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dialogContent: {
    alignItems: 'center',
  },
  dialogSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  qrCodeContainer: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentDialogAmount: {
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: 18,
    color: '#2d3748',
  },
  bankDetails: {
    width: '100%',
    backgroundColor: '#f8f4f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bankDetailLabel: {
    color: '#666',
    fontSize: 13,
  },
  bankDetailValue: {
    fontWeight: '600',
    color: '#2d3748',
    fontSize: 13,
  },
  dialogNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  dialogActions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
  confirmDialog: {
    maxWidth: 280,
    alignSelf: 'center',
    borderRadius: 16,
  },
  confirmDialogContent: {
    padding: 20,
    alignItems: 'center',
  },
  confirmDialogTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 8,
  },
  confirmDialogText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmDialogActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

