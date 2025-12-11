import { useState, useCallback } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Text, 
  useTheme,
  Surface,
  Button,
  Dialog,
  Portal,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as OrderHelpers from '@/utils/orderHelpers';
import { useWeekContext } from '@/contexts/WeekContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;

export default function DashboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setWeekDates } = useWeekContext();
  const router = useRouter();
  
  // Data states
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
  const [currentWeekSubscriptionOrder, setCurrentWeekSubscriptionOrder] = useState<any>(null);
  const [availableEggs, setAvailableEggs] = useState(0);
  const [outstandingOrders, setOutstandingOrders] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<{
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  } | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [paymentOrderContext, setPaymentOrderContext] = useState<{ type: 'current' | 'outstanding', order?: any } | null>(null);

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
      
      const [stockData, subData, currentOrder, currentSubOrder, available, settings, unpaidOrders] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getCurrentWeekSubscriptionOrder(),
        apiService.getAvailableEggsForUser(),
        apiService.getAppSettings(),
        apiService.getUnpaidOrders(),
      ]);
      
      setWeeklyStock(stockData);
      setSubscription(subData);
      setCurrentWeekOrder(currentOrder);
      setCurrentWeekSubscriptionOrder(currentSubOrder);
      setAvailableEggs(available);
      setPaymentSettings(settings.paymentSettings);
      
      if (stockData) {
        setWeekDates(stockData.weekStart, stockData.weekEnd);
      }
      
      const previousWeekUnpaid = unpaidOrders.filter((o: any) => o.weekId !== stockData?.id);
      setOutstandingOrders(previousWeekUnpaid);
    } catch (err) {
      const appError = parseError(err, 'loadData');
      setError(appError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadData(true);
  }, []);

  // Payment helpers
  const showPaymentDialog = (type: 'current' | 'outstanding' = 'current', order?: any) => {
    setPaymentOrderContext({ type, order });
    setPaymentDialogVisible(true);
  };

  const hidePaymentDialog = () => {
    setPaymentDialogVisible(false);
    setPaymentOrderContext(null);
  };

  const getPaymentAmount = () => {
    if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
      return paymentOrderContext.order.total;
    }
    return OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
      ? OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder)
      : OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);
  };

  const getPaymentQuantity = () => {
    if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
      return paymentOrderContext.order.quantity;
    }
    return OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
      ? OrderHelpers.getUnpaidSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder)
      : OrderHelpers.getUnpaidNotSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder);
  };

  const getCurrentUnpaidAmount = () => {
    return OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder) +
           OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);
  };

  const handleMarkPaymentSubmitted = async () => {
    try {
      setMarkingPayment(true);
      
      if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
        await apiService.markOrderPaymentSubmitted(paymentOrderContext.order.id);
        await loadData();
        hidePaymentDialog();
        setSnackbar({ visible: true, message: t('payment.paymentMarked') });
        return;
      }
      
      const orderIds = OrderHelpers.getOrdersNeedingPaymentSubmission(currentWeekOrder, currentWeekSubscriptionOrder);
      if (orderIds.length === 0) {
        setSnackbar({ visible: true, message: t('payment.allOrdersMarked') });
        hidePaymentDialog();
        return;
      }

      await Promise.all(orderIds.map(id => apiService.markOrderPaymentSubmitted(id)));
      await loadData();
      hidePaymentDialog();
      setSnackbar({ visible: true, message: t('payment.paymentMarked') });
    } catch (err: any) {
      const appError = parseError(err, 'markPayment');
      setSnackbar({ visible: true, message: appError.message });
    } finally {
      setMarkingPayment(false);
    }
  };

  const handleConfirmPickup = async () => {
    try {
      setConfirmingPickup(true);
      const orderIds = OrderHelpers.getOrdersNeedingPickupConfirmation(currentWeekOrder, currentWeekSubscriptionOrder);
      await Promise.all(orderIds.map(id => apiService.confirmOrderPickup(id)));
      await loadData();
      setSnackbar({ visible: true, message: t('payment.pickupConfirmed') });
    } catch (err: any) {
      const appError = parseError(err);
      setSnackbar({ visible: true, message: appError.message });
    } finally {
      setConfirmingPickup(false);
    }
  };

  const generateNBSIPSQRCode = (customAmount?: number) => {
    if (!paymentSettings) return '';
    const amount = customAmount ?? getPaymentAmount();
    const amountFormatted = `RSD${amount.toFixed(2).replace('.', ',')}`;
    const bankAccountFormatted = paymentSettings.bankAccountNumber.replace(/-/g, '');
    return `K:PR|V:01|C:1|R:${bankAccountFormatted}|N:${paymentSettings.recipientName}|I:${amountFormatted}|SF:${paymentSettings.paymentCode}|S:${paymentSettings.paymentPurpose}`;
  };

  // Determine current state
  const hasOutstanding = outstandingOrders.length > 0;
  const hasCurrentOrders = currentWeekOrder || currentWeekSubscriptionOrder;
  const isDelivered = ['delivered', 'completed'].includes(currentWeekOrder?.status || '') || 
                      ['delivered', 'completed'].includes(currentWeekSubscriptionOrder?.status || '') ||
                      weeklyStock?.allOrdersDelivered;
  const isPickedUp = OrderHelpers.areAllOrdersPickedUp(currentWeekOrder, currentWeekSubscriptionOrder);
  const isPaid = OrderHelpers.areAllOrdersPaid(currentWeekOrder, currentWeekSubscriptionOrder);
  const isWaitingConfirmation = OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder);
  const isComplete = isPickedUp && isPaid;
  const hasDeliveryScheduled = weeklyStock?.deliveryDate && weeklyStock?.deliveryTime;
  const getTotalEggs = () => (currentWeekOrder?.quantity || 0) + (currentWeekSubscriptionOrder?.quantity || 0);
  const needsPayment = hasCurrentOrders && !isPaid;

  if (loading) {
    return <LoadingView message={t('common.loading')} />;
  }

  if (error || !weeklyStock) {
    return (
      <ErrorView 
        message={error || 'Unable to load data'} 
        onRetry={() => loadData()} 
      />
    );
  }

  // Render payment dialog
  const renderPaymentDialog = () => (
    <Portal>
      <Dialog visible={paymentDialogVisible} onDismiss={hidePaymentDialog} style={styles.paymentDialog}>
        <Dialog.Title style={styles.dialogTitle}>
          {paymentOrderContext?.type === 'outstanding' ? t('home.outstandingPayment') : t('payment.title')}
        </Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          {paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order && (
            <Text style={styles.dialogSubtitle}>
              {t('home.weekOf', { date: new Date(paymentOrderContext.order.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })}
            </Text>
          )}
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={generateNBSIPSQRCode(paymentOrderContext?.type === 'outstanding' ? paymentOrderContext.order?.total : undefined)}
              size={180}
              backgroundColor="white"
            />
          </View>
          <Text style={styles.paymentDialogAmount}>
            {getPaymentQuantity()} {t('common.eggs')} • {getPaymentAmount().toFixed(0)} {t('common.rsd')}
          </Text>
          <View style={styles.bankDetails}>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>{t('payment.account')}</Text>
              <Text style={styles.bankDetailValue}>{paymentSettings?.bankAccountNumber}</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankDetailLabel}>{t('payment.recipient')}</Text>
              <Text style={styles.bankDetailValue}>{paymentSettings?.recipientName}</Text>
            </View>
          </View>
          <Text style={styles.dialogNote}>{t('payment.scanQR')}</Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.dialogActions}>
          {((paymentOrderContext?.type === 'outstanding' && !paymentOrderContext.order?.paymentSubmitted) ||
            (paymentOrderContext?.type === 'current' && !OrderHelpers.areAllOrdersPaymentSubmitted(currentWeekOrder, currentWeekSubscriptionOrder))) && (
            <Button 
              onPress={handleMarkPaymentSubmitted} 
              mode="contained"
              loading={markingPayment}
              disabled={markingPayment}
              buttonColor={theme.colors.tertiary}
              style={{ marginRight: 8 }}
            >
              {t('payment.markPaid')}
            </Button>
          )}
          <Button onPress={hidePaymentDialog} mode="outlined">{t('common.close')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );

  const renderSnackbar = () => (
    <Snackbar
      visible={snackbar.visible}
      onDismiss={() => setSnackbar({ visible: false, message: '' })}
      duration={3000}
      action={{ label: 'OK', onPress: () => setSnackbar({ visible: false, message: '' }) }}
    >
      {snackbar.message}
    </Snackbar>
  );

  // STATE 0: Outstanding Orders Takeover
  if (hasOutstanding) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🐔</Text>
          <Text style={styles.heroTitle}>{t('dashboard.oops')}</Text>
          <Text style={styles.heroSubtitle}>{t('dashboard.unpaidOrders')}</Text>
        </View>
        
        <View style={styles.outstandingList}>
          {outstandingOrders.map((order) => (
            <Surface key={order.id} style={styles.outstandingItem} elevation={2}>
              <Pressable style={styles.outstandingItemContent} onPress={() => showPaymentDialog('outstanding', order)}>
                <View>
                  <Text style={styles.outstandingWeek}>
                    {t('home.weekOf', { date: new Date(order.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })}
                  </Text>
                  <Text style={styles.outstandingDetails}>
                    {order.quantity} {t('common.eggs')} • {order.total.toFixed(0)} {t('common.rsd')}
                  </Text>
                </View>
                {order.paymentSubmitted ? (
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingBadgeText}>⏳</Text>
                  </View>
                ) : (
                  <Button mode="contained" compact buttonColor={theme.colors.primary}>
                    {t('home.pay')}
                  </Button>
                )}
              </Pressable>
            </Surface>
          ))}
        </View>
        
        <Text style={styles.outstandingNote}>{t('dashboard.settleBalance')}</Text>

        {renderPaymentDialog()}
        {renderSnackbar()}
      </ScrollView>
    );
  }

  // Determine which state we're in
  const getState = () => {
    if (!hasCurrentOrders && !subscription) return 'NO_ORDERS';
    if (isComplete) return 'COMPLETE';
    if (isPickedUp && !isPaid) return 'PICKED_UP_NOT_PAID';
    if (isDelivered && !isPickedUp) return 'DELIVERED';
    if (hasDeliveryScheduled) return 'DELIVERY_SCHEDULED';
    if (hasCurrentOrders) return 'ORDER_PLACED';
    return 'NO_ORDERS';
  };

  const state = getState();

  // Hero content based on state
  const getHeroContent = () => {
    switch (state) {
      case 'NO_ORDERS':
        return {
          emoji: '🐣',
          title: t('dashboard.noOrdersYet'),
          subtitle: weeklyStock.isOrderingOpen 
            ? `${availableEggs} ${t('dashboard.eggsAvailable')}`
            : t('dashboard.orderingClosed'),
        };
      case 'ORDER_PLACED':
        return {
          emoji: '🚚',
          title: t('dashboard.thankYouOrder'),
          subtitle: t('dashboard.waitingDeliveryTime'),
        };
      case 'DELIVERY_SCHEDULED':
        const deliveryDate = new Date(weeklyStock.deliveryDate!);
        const dayName = deliveryDate.toLocaleDateString(undefined, { weekday: 'short' });
        const dateStr = deliveryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return {
          icon: 'calendar',
          title: t('dashboard.deliveryScheduled'),
          subtitle: `${dayName} ${dateStr}, ${weeklyStock.deliveryTime}`,
        };
      case 'DELIVERED':
        return {
          emoji: '📦',
          title: t('dashboard.eggsAreHere'),
          subtitle: t('dashboard.dontForgetPickup'),
        };
      case 'PICKED_UP_NOT_PAID':
        return {
          emoji: '💳',
          title: t('dashboard.almostDone'),
          subtitle: t('dashboard.completePayment'),
        };
      case 'COMPLETE':
        return {
          emoji: '✅',
          title: t('dashboard.allDone'),
          subtitle: t('dashboard.seeYouNext'),
        };
      default:
        return { emoji: '🥚', title: '', subtitle: '' };
    }
  };

  const heroContent = getHeroContent();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        {heroContent.icon ? (
          <View style={styles.heroIconContainer}>
            <FontAwesome name={heroContent.icon as any} size={48} color="#ff6b35" />
          </View>
        ) : (
          <Text style={styles.heroEmoji}>{heroContent.emoji}</Text>
        )}
        <Text style={styles.heroTitle}>{heroContent.title}</Text>
        <Text style={styles.heroSubtitle}>{heroContent.subtitle}</Text>
      </View>

      {/* Payment Card - shown when payment needed (except in PICKED_UP_NOT_PAID where it's the only thing) */}
      {needsPayment && state !== 'PICKED_UP_NOT_PAID' && (
        <Pressable onPress={() => showPaymentDialog('current')}>
          <Surface style={styles.paymentCard} elevation={3}>
            <View style={styles.paymentCardContent}>
              <View style={styles.paymentCardLeft}>
                <Text style={styles.paymentCardIcon}>💳</Text>
                <View>
                  <Text style={styles.paymentCardTitle}>
                    {isWaitingConfirmation ? t('dashboard.waitingConfirmation') : t('dashboard.pleasePayOrder')}
                  </Text>
                  <Text style={styles.paymentCardAmount}>{getCurrentUnpaidAmount().toFixed(0)} {t('common.rsd')}</Text>
                </View>
              </View>
              {!isWaitingConfirmation && (
                <View style={styles.paymentCardButtons}>
                  <IconButton icon="qrcode" size={24} onPress={() => showPaymentDialog('current')} style={styles.qrButton} />
                  <Button 
                    mode="contained" 
                    compact 
                    onPress={handleMarkPaymentSubmitted}
                    loading={markingPayment}
                    disabled={markingPayment}
                    buttonColor={theme.colors.tertiary}
                    labelStyle={styles.smallButtonLabel}
                  >
                    {t('dashboard.markPaid')}
                  </Button>
                </View>
              )}
            </View>
          </Surface>
        </Pressable>
      )}

      {/* PICKED_UP_NOT_PAID: Only show payment card */}
      {state === 'PICKED_UP_NOT_PAID' && (
        <Pressable onPress={() => showPaymentDialog('current')}>
          <Surface style={styles.paymentCardLarge} elevation={3}>
            <View style={styles.paymentCardLargeContent}>
              <Text style={styles.paymentCardLargeTitle}>
                {isWaitingConfirmation ? t('dashboard.waitingConfirmation') : t('dashboard.pleasePayOrder')}
              </Text>
              <Text style={styles.paymentCardLargeAmount}>{getCurrentUnpaidAmount().toFixed(0)} {t('common.rsd')}</Text>
              {!isWaitingConfirmation && (
                <View style={styles.paymentCardLargeButtons}>
                  <Button 
                    mode="outlined" 
                    icon="qrcode"
                    onPress={() => showPaymentDialog('current')}
                    style={styles.paymentLargeButton}
                  >
                    {t('dashboard.showQR')}
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleMarkPaymentSubmitted}
                    loading={markingPayment}
                    disabled={markingPayment}
                    buttonColor={theme.colors.tertiary}
                    style={styles.paymentLargeButton}
                  >
                    {t('dashboard.markPaid')}
                  </Button>
                </View>
              )}
            </View>
          </Surface>
        </Pressable>
      )}

      {/* DELIVERED: Single Confirm Pickup button */}
      {state === 'DELIVERED' && !isPickedUp && (
        <Surface style={styles.pickupCard} elevation={2}>
          <Button
            mode="contained"
            icon="package-variant"
            onPress={handleConfirmPickup}
            loading={confirmingPickup}
            disabled={confirmingPickup}
            style={styles.pickupButton}
            contentStyle={styles.pickupButtonContent}
            buttonColor={theme.colors.primary}
          >
            {t('dashboard.confirmPickup')} • {getTotalEggs()} {t('common.eggs')}
          </Button>
        </Surface>
      )}

      {/* Bottom Cards: Order + Subscription (not shown in PICKED_UP_NOT_PAID or DELIVERED states) */}
      {state !== 'PICKED_UP_NOT_PAID' && state !== 'DELIVERED' && (
        <View style={styles.bottomRow}>
          {/* Order Card */}
          <Pressable style={styles.bottomCardWrapper} onPress={() => router.push('/(tabs)/two')}>
            <Surface style={[styles.bottomCard, hasCurrentOrders && currentWeekOrder && styles.bottomCardActive]} elevation={2}>
              <Text style={styles.bottomCardIcon}>🛒</Text>
              {state === 'NO_ORDERS' || !currentWeekOrder ? (
                <>
                  <Text style={styles.bottomCardTitle}>{t('dashboard.orderNow')}</Text>
                </>
              ) : state === 'COMPLETE' ? (
                <>
                  <Text style={styles.bottomCardQuantity}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
                  <Text style={styles.bottomCardCheck}>✓</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bottomCardTitle}>{t('dashboard.seeOrder')}</Text>
                  <Text style={styles.bottomCardQuantity}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
                </>
              )}
            </Surface>
          </Pressable>

          {/* Subscription Card */}
          <Pressable style={styles.bottomCardWrapper} onPress={() => router.push('/(tabs)/subscription')}>
            <Surface style={[styles.bottomCard, subscription && styles.bottomCardActive]} elevation={2}>
              <Text style={styles.bottomCardIcon}>🔄</Text>
              {!subscription ? (
                <>
                  <Text style={styles.bottomCardTitle}>{t('dashboard.subscribe')}</Text>
                </>
              ) : state === 'COMPLETE' ? (
                <>
                  <Text style={styles.bottomCardQuantity}>{subscription.quantity} {t('common.eggs')}</Text>
                  <Text style={styles.bottomCardStatus}>{t('dashboard.active')}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bottomCardTitle}>{t('dashboard.seeSub')}</Text>
                  <Text style={styles.bottomCardQuantity}>{subscription.quantity} {t('common.eggs')}</Text>
                </>
              )}
            </Surface>
          </Pressable>
        </View>
      )}

      {renderPaymentDialog()}
      {renderSnackbar()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5f1',
  },
  scrollContent: {
    flexGrow: 1,
    padding: HORIZONTAL_PADDING,
    paddingTop: 16,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  
  // Payment Card
  paymentCard: {
    backgroundColor: '#fff5f0',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffb088',
  },
  paymentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentCardIcon: {
    fontSize: 28,
  },
  paymentCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  paymentCardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  paymentCardButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrButton: {
    margin: 0,
    backgroundColor: '#fff',
  },
  smallButtonLabel: {
    fontSize: 12,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  
  // Payment Card Large (for PICKED_UP_NOT_PAID state)
  paymentCardLarge: {
    backgroundColor: '#fff5f0',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ff6b35',
  },
  paymentCardLargeContent: {
    alignItems: 'center',
    padding: 24,
  },
  paymentCardLargeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  paymentCardLargeAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 20,
  },
  paymentCardLargeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentLargeButton: {
    flex: 1,
  },
  
  // Pickup Card
  pickupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickupButton: {
    borderRadius: 16,
    margin: 0,
  },
  pickupButtonContent: {
    paddingVertical: 16,
  },
  
  // Bottom Row
  bottomRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  bottomCardWrapper: {
    flex: 1,
  },
  bottomCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  bottomCardActive: {
    backgroundColor: '#fff5f0',
    borderWidth: 1,
    borderColor: '#ffb088',
  },
  bottomCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  bottomCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
  },
  bottomCardQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  bottomCardCheck: {
    fontSize: 18,
    color: '#28a745',
    marginTop: 4,
  },
  bottomCardStatus: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Outstanding Orders
  outstandingList: {
    gap: 12,
    marginBottom: 16,
  },
  outstandingItem: {
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  outstandingItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  outstandingWeek: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
  },
  outstandingDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  waitingBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  waitingBadgeText: {
    fontSize: 16,
  },
  outstandingNote: {
    fontSize: 14,
    color: '#742a2a',
    textAlign: 'center',
    fontStyle: 'italic',
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
  dialogSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  paymentDialogAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  bankDetails: {
    width: '100%',
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bankDetailLabel: {
    fontSize: 13,
    color: '#666',
  },
  bankDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3748',
  },
  dialogNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  dialogActions: {
    justifyContent: 'center',
    paddingBottom: 16,
  },
});
