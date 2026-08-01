import { useState, useCallback } from 'react';
import { StyleSheet, View as RNView, Dimensions } from 'react-native';
import { View } from '@/components/Themed';
import {
  Text,
  Button,
  IconButton,
  Snackbar,
  useTheme,
  Surface,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';
import { useWeekContext } from '@/contexts/WeekContext';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { PaymentDialog, ConfirmPaymentDialog } from '@/components/PaymentDialog';
import * as OrderHelpers from '@/utils/orderHelpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;

export default function OrderScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setWeekDates } = useWeekContext();
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
  const [editingOrder, setEditingOrder] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<OrderHelpers.PaymentSettings | null>(null);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [confirmPaymentVisible, setConfirmPaymentVisible] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);

  // Swipe navigation - must be called before any conditional returns
  const swipeHandlers = useSwipeNavigation();

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

      // Set week dates for header display
      if (stockData) {
        setWeekDates(stockData.weekStart, stockData.weekEnd);
      }

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

  const handlePlaceOrder = async () => {
    if (!weeklyStock) return;

    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (currentWeekOrder) {
        await apiService.updateOrder(currentWeekOrder.id, quantity, weeklyStock.pricePerDozen);
        setSuccessMessage(t('order.orderUpdated', { count: quantity }));
        setEditingOrder(false);
      } else {
        await apiService.createOrder(quantity, weeklyStock.pricePerDozen);
        setSuccessMessage(t('order.orderPlaced', { count: quantity }));
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

  const handleMarkPaymentSubmitted = async () => {
    setConfirmPaymentVisible(false);
    if (!currentWeekOrder || currentWeekOrder.isPaid || currentWeekOrder.paymentSubmitted) return;
    try {
      setMarkingPayment(true);
      await apiService.markOrderPaymentSubmitted(currentWeekOrder.id);
      setPaymentDialogVisible(false);
      setSuccessMessage(t('payment.paymentMarked'));
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark payment');
    } finally {
      setMarkingPayment(false);
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
      if (weeklyStock.isSkipped) {
        return {
          icon: '⏭️',
          message: t('dashboard.weekSkipped'),
          subtitle: subscription ? t('dashboard.weekSkippedDesc') : t('dashboard.weekSkippedDescNoSub'),
        };
      }
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

  const payableOrder = currentWeekOrder && !currentWeekOrder.isPaid && !currentWeekOrder.paymentSubmitted
    ? currentWeekOrder
    : null;
  const awaitingConfirmation = !!currentWeekOrder && !currentWeekOrder.isPaid && currentWeekOrder.paymentSubmitted;
  const paymentAmount = OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, null);
  const paymentQuantity = OrderHelpers.getUnpaidNotSubmittedQuantity(currentWeekOrder, null);

  return (
    <View style={styles.container} {...swipeHandlers}>
      <RNView style={styles.content}>
        {/* Warning Section - Only show when can't order */}
        {warningInfo && (
          <RNView style={styles.warningSection}>
            <Text style={styles.warningIcon}>{warningInfo.icon}</Text>
            <Text style={styles.warningTitle}>{warningInfo.message}</Text>
            <Text style={styles.warningSubtitle}>{warningInfo.subtitle}</Text>
          </RNView>
        )}

        {/* Low Season Notice - only show when no order placed yet */}
        {weeklyStock.isLowSeason && canOrder && !currentWeekOrder && (
          <Surface style={styles.lowSeasonBadge} elevation={1}>
            <Text style={styles.lowSeasonText}>🐔 {t('order.lowSeasonNotice', { cap: weeklyStock.lowSeasonOrderCap })}</Text>
          </Surface>
        )}

        {/* Eggs Available Badge - show when can order and no order yet */}
        {canOrder && !currentWeekOrder && (
          <Surface style={styles.availableBadge} elevation={2}>
            <Text style={styles.availableNumber}>{availableEggs}</Text>
            <Text style={styles.availableLabel}>{t('dashboard.eggsAvailable')}</Text>
          </Surface>
        )}

        {/* Hero Section - Show when order exists */}
        {currentWeekOrder && (
          <RNView style={styles.heroSection}>
            <Text style={styles.heroEmoji}>
              {currentWeekOrder.isPaid ? '✅' : '🛒'}
            </Text>
            <Text style={styles.heroTitle}>
              {currentWeekOrder.isPaid ? t('order.paymentConfirmed') : t('dashboard.thankYouOrder')}
            </Text>
            <Text style={styles.heroSubtitle}>
              {currentWeekOrder.isPaid 
                ? t('dashboard.seeYouNext') 
                : (currentWeekOrder.paymentSubmitted 
                    ? t('dashboard.waitingPaymentConfirmation') 
                    : t('order.payOnDashboard'))}
            </Text>
          </RNView>
        )}

        {/* Order Form - Show if can order and (no order exists OR editing unpaid order) */}
        {canOrder && (!currentWeekOrder || (editingOrder && !currentWeekOrder.isPaid)) && (
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
              onPress={handlePlaceOrder}
              loading={processing}
              disabled={processing || quantity > maxAvailable}
              style={styles.actionButton}
              buttonColor={theme.colors.primary}
              icon={editingOrder ? "check" : "cart-check"}
            >
              {editingOrder ? t('order.updateOrder') : t('order.placeOrder')}
            </Button>

            {/* Cancel Edit Button - only when editing */}
            {editingOrder && (
              <Button
                mode="text"
                onPress={() => {
                  setEditingOrder(false);
                  setQuantity(currentWeekOrder.quantity);
                }}
                disabled={processing}
              >
                {t('subscription.cancelChanges')}
              </Button>
            )}
          </Surface>
        )}

        {/* Active Order Card - Show when order exists and NOT editing */}
        {currentWeekOrder && !editingOrder && (
          <Surface style={styles.orderDetailsCard} elevation={2}>
            <RNView style={styles.cardHeader}>
              <RNView style={styles.cardHeaderIcon}>
                <Text style={styles.cardHeaderIconText}>🛒</Text>
              </RNView>
              <Text style={styles.cardHeaderTitle}>{t('order.activeOrder')}</Text>
            </RNView>
            
            <RNView style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('order.quantity')}</Text>
              <Text style={styles.detailValue}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
            </RNView>
            
            {currentWeekOrder.payment_submitted_at && (
              <RNView style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('order.paidOn')}</Text>
                <Text style={styles.detailValue}>
                  {new Date(currentWeekOrder.payment_submitted_at).toLocaleDateString()}
                </Text>
              </RNView>
            )}
            
            <RNView style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('order.totalPrice')}</Text>
              <Text style={styles.detailValue}>{currentWeekOrder.total.toFixed(0)} {t('common.rsd')}</Text>
            </RNView>

            {/* Pay right here instead of on the dashboard */}
            {payableOrder && (
              <RNView style={styles.paymentRow}>
                <Button
                  mode="contained"
                  onPress={() => setPaymentDialogVisible(true)}
                  icon="qrcode"
                  style={styles.paymentButton}
                  buttonColor={theme.colors.tertiary}
                  compact
                >
                  {t('order.payNow')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setConfirmPaymentVisible(true)}
                  disabled={markingPayment}
                  loading={markingPayment}
                  icon="check"
                  style={styles.paymentButton}
                  compact
                >
                  {t('payment.markPaid')}
                </Button>
              </RNView>
            )}

            {/* Awaiting admin confirmation after marking paid */}
            {awaitingConfirmation && (
              <RNView style={styles.awaitingBadge}>
                <Text style={styles.awaitingText}>{t('order.awaitingConfirmation')}</Text>
              </RNView>
            )}

            {/* Modify/Cancel Buttons - Only show if NOT paid */}
            {!currentWeekOrder.isPaid && (
              <RNView style={styles.actionRow}>
                <Button
                  mode="outlined"
                  onPress={() => setEditingOrder(true)}
                  icon="pencil"
                  style={styles.actionButtonRow}
                  compact
                >
                  {t('common.modify')}
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleCancelOrder}
                  disabled={processing}
                  loading={processing}
                  textColor={theme.colors.error}
                  icon="close-circle-outline"
                  style={styles.actionButtonRow}
                  compact
                >
                  {t('common.cancel')}
                </Button>
              </RNView>
            )}
          </Surface>
        )}
      </RNView>

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

      {/* Payment Dialog (reused from the dashboard) */}
      <PaymentDialog
        visible={paymentDialogVisible}
        onDismiss={() => setPaymentDialogVisible(false)}
        onMarkPaid={() => setConfirmPaymentVisible(true)}
        quantity={paymentQuantity}
        amount={paymentAmount}
        qrCodeValue={OrderHelpers.generateNBSIPSQRCode(paymentSettings, paymentAmount)}
        bankAccountNumber={paymentSettings?.bankAccountNumber}
        recipientName={paymentSettings?.recipientName}
        isPaymentSubmitted={!payableOrder}
        isMarkingPayment={markingPayment}
      />
      <ConfirmPaymentDialog
        visible={confirmPaymentVisible}
        onDismiss={() => setConfirmPaymentVisible(false)}
        onConfirm={handleMarkPaymentSubmitted}
        isLoading={markingPayment}
      />
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
    justifyContent: 'center',
  },
  
  // Hero Section (shown when order is placed)
  heroSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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

  // Order Details Card (like subscription card)
  orderDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffe4d6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderIconText: {
    fontSize: 18,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  cancelButton: {
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButtonRow: {
    flex: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  paymentButton: {
    flex: 1,
  },
  awaitingBadge: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  awaitingText: {
    color: '#e65100',
    fontWeight: '600',
    fontSize: 14,
  },
  // Available Badge
  availableBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  availableNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  availableLabel: {
    fontSize: 14,
    color: '#666',
  },

});
