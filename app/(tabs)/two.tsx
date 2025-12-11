import { useState, useCallback } from 'react';
import { StyleSheet, View as RNView, RefreshControl, Dimensions } from 'react-native';
import { View } from '@/components/Themed';
import {
  Text,
  Button,
  IconButton,
  Snackbar,
  Chip,
  useTheme,
  Surface,
  Dialog,
  Portal,
} from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;

export default function OrderScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableEggs, setAvailableEggs] = useState(0);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);
  const [confirmPaymentVisible, setConfirmPaymentVisible] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const [stockData, subData, currentOrder, available, settings] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
        apiService.getAppSettings(),
      ]);
      setWeeklyStock(stockData);
      setSubscription(subData);
      const oneTimeOrder = currentOrder && !currentOrder.subscriptionId ? currentOrder : null;
      setCurrentWeekOrder(oneTimeOrder);
      setAvailableEggs(available);
      setPaymentSettings(settings.paymentSettings);
      
      if (oneTimeOrder) {
        setQuantity(oneTimeOrder.quantity);
      } else {
        setQuantity(10);
      }
    } catch (err) {
      const appError = parseError(err, 'loadData');
      setError(appError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBuyNow = async () => {
    if (!weeklyStock) return;

    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (currentWeekOrder) {
        await apiService.updateOrder(currentWeekOrder.id, quantity, weeklyStock.pricePerDozen);
        setSuccessMessage(t('order.orderUpdated'));
      } else {
        await apiService.createOrder(quantity, weeklyStock.pricePerDozen);
        setSuccessMessage(t('order.orderPlaced'));
      }
      
      const [updatedStock, subData, currentOrder, available] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
      ]);
      setWeeklyStock(updatedStock);
      setSubscription(subData);
      const oneTimeOrder = currentOrder && !currentOrder.subscriptionId ? currentOrder : null;
      setCurrentWeekOrder(oneTimeOrder);
      setAvailableEggs(available);
      
      if (oneTimeOrder) {
        setQuantity(oneTimeOrder.quantity);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentWeekOrder) return;

    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiService.cancelOrder(currentWeekOrder.id);
      setSuccessMessage(t('order.orderCancelled'));
      
      const [updatedStock, subData, currentOrder, available] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
      ]);
      setWeeklyStock(updatedStock);
      setSubscription(subData);
      const oneTimeOrder = currentOrder && !currentOrder.subscriptionId ? currentOrder : null;
      setCurrentWeekOrder(oneTimeOrder);
      setAvailableEggs(available);
      
      setQuantity(10);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel order');
    } finally {
      setProcessing(false);
    }
  };

  const incrementQuantity = () => {
    let maxAvailable = availableEggs;
    if (currentWeekOrder) {
      maxAvailable += currentWeekOrder.quantity;
    }
    const lowSeasonCap = weeklyStock?.lowSeasonOrderCap;
    if (lowSeasonCap !== null && lowSeasonCap !== undefined) {
      maxAvailable = Math.min(maxAvailable, lowSeasonCap);
    }
    if (quantity < maxAvailable) {
      setQuantity(quantity + 10);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 10) {
      setQuantity(quantity - 10);
    }
  };

  const calculatePrice = () => {
    if (!weeklyStock) return 0;
    return (quantity / 10) * weeklyStock.pricePerDozen;
  };

  const getMaxAvailable = () => {
    let maxAvailable = availableEggs;
    if (currentWeekOrder) {
      maxAvailable += currentWeekOrder.quantity;
    }
    const lowSeasonCap = weeklyStock?.lowSeasonOrderCap;
    if (lowSeasonCap !== null && lowSeasonCap !== undefined) {
      maxAvailable = Math.min(maxAvailable, lowSeasonCap);
    }
    return maxAvailable;
  };

  const generateNBSIPSQRCode = () => {
    if (!paymentSettings || !currentWeekOrder) return '';
    const amount = currentWeekOrder.total;
    const amountFormatted = `RSD${amount.toFixed(2).replace('.', ',')}`;
    const bankAccountFormatted = paymentSettings.bankAccountNumber.replace(/-/g, '');
    return `K:PR|V:01|C:1|R:${bankAccountFormatted}|N:${paymentSettings.recipientName}|I:${amountFormatted}|SF:${paymentSettings.paymentCode}|S:${paymentSettings.paymentPurpose}`;
  };

  const handleMarkPaymentSubmitted = async () => {
    if (!currentWeekOrder) return;
    
    try {
      setMarkingPayment(true);
      await apiService.markOrderPaymentSubmitted(currentWeekOrder.id);
      await loadData();
      setPaymentDialogVisible(false);
      setConfirmPaymentVisible(false);
      setSuccessMessage(t('payment.paymentMarked'));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark payment');
    } finally {
      setMarkingPayment(false);
    }
  };

  if (loading) {
    return <LoadingView message={t('order.loadingOrder')} />;
  }

  if (error || !weeklyStock) {
    return (
      <ErrorView 
        message={error || 'Unable to load data'} 
        onRetry={() => loadData()} 
      />
    );
  }

  const maxAvailable = getMaxAvailable();
  const canOrder = maxAvailable >= 10 && weeklyStock.isOrderingOpen;
  const stockNotSetup = !weeklyStock.isOrderingOpen && !weeklyStock.allOrdersDelivered;
  const ordersDelivered = weeklyStock.allOrdersDelivered;
  const isLocked = currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted;

  // Determine the state for warning messages only
  const getWarningInfo = () => {
    if (!canOrder) {
      if (stockNotSetup) {
        return { icon: '📦', message: t('order.stockNotSetUp'), subtitle: t('order.stockNotSetUpDesc') };
      }
      if (ordersDelivered) {
        return { icon: '✅', message: t('order.ordersDelivered'), subtitle: t('order.ordersDeliveredDesc') };
      }
      return { icon: '⚠️', message: t('order.notEnoughStock'), subtitle: t('order.notEnoughStockDesc') };
    }
    return null;
  };

  const warningInfo = getWarningInfo();

  return (
    <View style={styles.container}>
      <RNView style={styles.content}>
        {/* Warning Section - Only show when can't order */}
        {warningInfo && (
          <RNView style={styles.warningSection}>
            <Text style={styles.warningIcon}>{warningInfo.icon}</Text>
            <Text style={styles.warningTitle}>{warningInfo.message}</Text>
            <Text style={styles.warningSubtitle}>{warningInfo.subtitle}</Text>
          </RNView>
        )}

        {/* Low Season Notice */}
        {weeklyStock.isLowSeason && canOrder && (
          <Surface style={styles.lowSeasonBadge} elevation={1}>
            <Text style={styles.lowSeasonText}>🐔 {t('order.lowSeasonNotice', { cap: weeklyStock.lowSeasonOrderCap })}</Text>
          </Surface>
        )}

        {/* Order Form - Only show if can order and not locked */}
        {canOrder && !isLocked && (
          <Surface style={styles.orderCard} elevation={2}>
            {/* Quantity Selector */}
            <RNView style={styles.quantityRow}>
              <IconButton
                icon="minus-circle"
                size={40}
                iconColor={quantity <= 10 ? theme.colors.outlineVariant : theme.colors.primary}
                onPress={decrementQuantity}
                disabled={quantity <= 10 || processing}
              />
              <RNView style={styles.quantityDisplay}>
                <Text style={styles.quantityNumber}>{quantity}</Text>
                <Text style={styles.quantityLabel}>{t('common.eggs')}</Text>
              </RNView>
              <IconButton
                icon="plus-circle"
                size={40}
                iconColor={quantity >= maxAvailable ? theme.colors.outlineVariant : theme.colors.primary}
                onPress={incrementQuantity}
                disabled={quantity >= maxAvailable || processing}
              />
            </RNView>

            {/* Price Display */}
            <RNView style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('order.totalPrice')}</Text>
              <Text style={styles.priceAmount}>{calculatePrice().toFixed(0)} {t('common.rsd')}</Text>
            </RNView>

            {/* Action Buttons */}
            <Button
              mode="contained"
              onPress={handleBuyNow}
              loading={processing}
              disabled={processing || quantity > maxAvailable}
              style={styles.actionButton}
              buttonColor={theme.colors.primary}
              icon={currentWeekOrder ? "check" : "cart-check"}
            >
              {currentWeekOrder ? t('order.updateOrder') : t('order.placeOrder')}
            </Button>

            {currentWeekOrder && (
              <Button
                mode="text"
                onPress={handleCancelOrder}
                disabled={processing}
                textColor={theme.colors.error}
                icon="close-circle-outline"
                compact
              >
                {t('order.cancelOrder')}
              </Button>
            )}
          </Surface>
        )}

        {/* Order Summary - Show when order exists */}
        {currentWeekOrder && isLocked && (
          <Surface style={styles.summaryCard} elevation={2}>
            <RNView style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('common.eggs')}</Text>
              <Text style={styles.summaryValue}>{currentWeekOrder.quantity}</Text>
            </RNView>
            <RNView style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('order.totalPrice')}</Text>
              <Text style={styles.summaryValue}>{currentWeekOrder.total.toFixed(0)} {t('common.rsd')}</Text>
            </RNView>
            <Chip 
              icon={currentWeekOrder.isPaid ? "check-circle" : "clock-outline"} 
              style={[styles.statusChip, currentWeekOrder.isPaid ? styles.statusPaid : styles.statusPending]}
            >
              {currentWeekOrder.isPaid ? t('order.paymentConfirmed') : t('order.awaitingConfirmation')}
            </Chip>
          </Surface>
        )}

        {/* Payment Button */}
        {currentWeekOrder && !currentWeekOrder.isPaid && (
          <Button
            mode="contained"
            onPress={() => setPaymentDialogVisible(true)}
            style={styles.paymentButton}
            icon="qrcode"
            buttonColor={theme.colors.tertiary}
          >
            {currentWeekOrder.paymentSubmitted ? t('order.viewPayment') : t('order.payNow')}
          </Button>
        )}

        {/* Info Note */}
        {canOrder && (
          <Surface style={styles.infoCard} elevation={1}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>{t('order.infoNote')}</Text>
          </Surface>
        )}
      </RNView>

      {/* Payment Dialog */}
      <Portal>
        <Dialog visible={paymentDialogVisible} onDismiss={() => setPaymentDialogVisible(false)} style={styles.paymentDialog}>
          <Dialog.Title style={styles.dialogTitle}>{t('payment.title')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            {currentWeekOrder && (
              <>
                <RNView style={styles.qrCodeContainer}>
                  <QRCode value={generateNBSIPSQRCode()} size={180} backgroundColor="white" />
                </RNView>
                <Text style={styles.paymentDialogAmount}>
                  {currentWeekOrder.quantity} {t('common.eggs')} • {currentWeekOrder.total.toFixed(0)} {t('common.rsd')}
                </Text>
                <RNView style={styles.bankDetailsContainer}>
                  <Text style={styles.bankDetailLabel}>{t('payment.account')}</Text>
                  <Text style={styles.bankDetailValue}>{paymentSettings?.bankAccountNumber}</Text>
                </RNView>
                <RNView style={styles.bankDetailsContainer}>
                  <Text style={styles.bankDetailLabel}>{t('payment.recipient')}</Text>
                  <Text style={styles.bankDetailValue}>{paymentSettings?.recipientName}</Text>
                </RNView>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            {!currentWeekOrder?.paymentSubmitted && (
              <Button 
                onPress={() => setConfirmPaymentVisible(true)} 
                mode="contained"
                buttonColor={theme.colors.tertiary}
                style={{ marginRight: 8 }}
              >
                {t('payment.markPaid')}
              </Button>
            )}
            <Button onPress={() => setPaymentDialogVisible(false)} mode="contained">{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Confirm Payment Dialog */}
        <Dialog visible={confirmPaymentVisible} onDismiss={() => setConfirmPaymentVisible(false)} style={styles.confirmDialog}>
          <RNView style={styles.confirmDialogContent}>
            <Text style={styles.confirmDialogTitle}>{t('dashboard.confirmPaymentTitle')}</Text>
            <Text style={styles.confirmDialogText}>{t('dashboard.confirmPaymentMessage')}</Text>
            <RNView style={styles.confirmDialogActions}>
              <Button onPress={() => setConfirmPaymentVisible(false)} mode="outlined" compact style={{ marginRight: 8 }}>{t('common.cancel')}</Button>
              <Button 
                onPress={handleMarkPaymentSubmitted} 
                mode="contained"
                compact
                loading={markingPayment}
                disabled={markingPayment}
                buttonColor={theme.colors.tertiary}
              >
                {t('common.confirm')}
              </Button>
            </RNView>
          </RNView>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage(null)}
        duration={3000}
        style={{ backgroundColor: theme.colors.tertiary }}
      >
        {successMessage}
      </Snackbar>

      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {errorMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5f1',
  },
  content: {
    flex: 1,
    padding: HORIZONTAL_PADDING,
    paddingTop: 16,
  },
  
  // Warning Section (only shown when can't order)
  warningSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff0eb',
    borderRadius: 20,
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Low Season Badge
  lowSeasonBadge: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  lowSeasonText: {
    color: '#e65100',
    fontWeight: '500',
    fontSize: 14,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quantityDisplay: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  quantityNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: -4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f4f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 8,
  },

  // Summary Card (when locked)
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statusChip: {
    alignSelf: 'center',
    marginTop: 8,
  },
  statusPaid: {
    backgroundColor: '#d4f4f1',
  },
  statusPending: {
    backgroundColor: '#e3f2fd',
  },

  // Payment Button
  paymentButton: {
    borderRadius: 12,
    marginBottom: 16,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#fff0eb',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    color: '#524541',
    fontSize: 13,
  },

  // Payment Dialog
  paymentDialog: {
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
  dialogActions: {
    justifyContent: 'center',
    paddingBottom: 16,
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
    marginBottom: 12,
    fontSize: 18,
    color: '#2d3748',
  },
  bankDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bankDetailLabel: {
    fontWeight: '600',
    color: '#666',
    fontSize: 14,
  },
  bankDetailValue: {
    fontWeight: 'bold',
    color: '#2d3748',
    fontSize: 14,
  },

  // Confirm Payment Dialog
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
