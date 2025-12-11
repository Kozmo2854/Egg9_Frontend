import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Text, 
  Chip, 
  useTheme,
  Surface,
  Button,
  Dialog,
  Portal,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as OrderHelpers from '@/utils/orderHelpers';
import { useWeekContext } from '@/contexts/WeekContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

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
      
      // Update week context for header
      if (stockData) {
        setWeekDates(stockData.weekStart, stockData.weekEnd);
      }
      
      // Filter outstanding orders (from previous weeks only)
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

  const getPaymentDialogAmount = () => {
    if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
      return paymentOrderContext.order.total;
    }
    return OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
      ? OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder)
      : OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);
  };

  const getPaymentDialogQuantity = () => {
    if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
      return paymentOrderContext.order.quantity;
    }
    return OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
      ? OrderHelpers.getUnpaidSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder)
      : OrderHelpers.getUnpaidNotSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder);
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
    
    const amount = customAmount ?? getPaymentDialogAmount();
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
  const isComplete = OrderHelpers.areAllOrdersComplete(currentWeekOrder, currentWeekSubscriptionOrder);

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

  // STATE 1: Outstanding Orders Takeover
  if (hasOutstanding) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />
        }
      >
        <View style={styles.outstandingContainer}>
          <Text style={styles.outstandingEmoji}>🐔</Text>
          <Text style={styles.outstandingTitle}>{t('dashboard.oops')}</Text>
          <Text style={styles.outstandingSubtitle}>{t('dashboard.unpaidOrders')}</Text>
          
          <View style={styles.outstandingList}>
            {outstandingOrders.map((order) => (
              <Surface key={order.id} style={styles.outstandingItem} elevation={2}>
                <View style={styles.outstandingItemContent}>
                  <View>
                    <Text style={styles.outstandingWeek}>
                      {t('home.weekOf', { date: new Date(order.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) })}
                    </Text>
                    <Text style={styles.outstandingDetails}>
                      {order.quantity} {t('common.eggs')} • {order.total.toFixed(0)} {t('common.rsd')}
                    </Text>
                  </View>
                  {order.paymentSubmitted ? (
                    <Chip icon="clock-outline" mode="flat" style={styles.waitingChip} compact>
                      {t('home.waiting')}
                    </Chip>
                  ) : (
                    <Button 
                      mode="contained" 
                      compact 
                      onPress={() => showPaymentDialog('outstanding', order)}
                      buttonColor={theme.colors.primary}
                    >
                      {t('home.pay')}
                    </Button>
                  )}
                </View>
              </Surface>
            ))}
          </View>
          
          <Text style={styles.outstandingNote}>{t('dashboard.settleBalance')}</Text>
        </View>

        {renderPaymentDialog()}
        {renderSnackbar()}
      </ScrollView>
    );
  }

  // STATE 2: No Orders - Empty State with CTA
  if (!hasCurrentOrders && !subscription) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />
        }
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🐣</Text>
          <Text style={styles.emptyTitle}>{t('dashboard.noOrdersYet')}</Text>
          
          {weeklyStock.isOrderingOpen ? (
            <>
              <View style={styles.availableBadge}>
                <Text style={styles.availableNumber}>{availableEggs}</Text>
                <Text style={styles.availableLabel}>{t('dashboard.eggsAvailable')}</Text>
              </View>
              <Text style={styles.emptySubtitle}>{t('dashboard.beQuick')}</Text>
            </>
          ) : (
            <Text style={styles.emptySubtitle}>{t('dashboard.orderingClosed')}</Text>
          )}
          
          <View style={styles.ctaRow}>
            <Surface style={styles.ctaCard} elevation={3}>
              <Button
                mode="contained"
                icon="shopping"
                onPress={() => router.push('/(tabs)/two')}
                style={styles.ctaButton}
                contentStyle={styles.ctaButtonContent}
                labelStyle={styles.ctaButtonLabel}
                buttonColor={theme.colors.secondary}
              >
                {t('dashboard.orderNow')}
              </Button>
            </Surface>
            <Surface style={styles.ctaCard} elevation={3}>
              <Button
                mode="contained"
                icon="refresh"
                onPress={() => router.push('/(tabs)/subscription')}
                style={styles.ctaButton}
                contentStyle={styles.ctaButtonContent}
                labelStyle={styles.ctaButtonLabel}
                buttonColor={theme.colors.primary}
              >
                {t('dashboard.subscribe')}
              </Button>
            </Surface>
          </View>
        </View>

        {renderSnackbar()}
      </ScrollView>
    );
  }

  // STATE 3: Active Orders - Dashboard Layout
  const getTotalEggs = () => (currentWeekOrder?.quantity || 0) + (currentWeekSubscriptionOrder?.quantity || 0);
  const getTotalAmount = () => (currentWeekOrder?.total || 0) + (currentWeekSubscriptionOrder?.total || 0);

  // Determine payment status
  const isPaid = OrderHelpers.areAllOrdersPaid(currentWeekOrder, currentWeekSubscriptionOrder);
  const isWaitingConfirmation = OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder);
  const unpaidAmount = isWaitingConfirmation 
    ? OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder)
    : OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);

  function renderPaymentDialog() {
    return (
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
              {getPaymentDialogQuantity()} {t('common.eggs')} • {getPaymentDialogAmount().toFixed(0)} {t('common.rsd')}
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
  }

  function renderSnackbar() {
    return (
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar({ visible: false, message: '' }) }}
      >
        {snackbar.message}
      </Snackbar>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />
      }
    >
      {/* Available Eggs Badge */}
      {weeklyStock.isOrderingOpen && !isComplete && (
        <Surface style={styles.availableSurface} elevation={2}>
          <Text style={styles.badgeEmoji}>🥚</Text>
          <Text style={styles.badgeText}>{availableEggs} {t('dashboard.available')}</Text>
        </Surface>
      )}

      {/* Status Row: Delivery + Payment */}
      <View style={styles.statusRow}>
        {/* Delivery Card */}
        <Surface style={[styles.statusCard, styles.deliveryCard]} elevation={2}>
          {isComplete ? (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>✅</Text>
              <Text style={styles.statusTitle}>{t('dashboard.allDone')}</Text>
              <Text style={styles.statusSubtitle}>{t('dashboard.seeYouNext')}</Text>
            </View>
          ) : isDelivered ? (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>📦</Text>
              <Text style={styles.statusTitle}>{t('dashboard.delivered')}</Text>
              <Text style={styles.statusSubtitle}>{getTotalEggs()} {t('common.eggs')}</Text>
              {!OrderHelpers.areAllOrdersPickedUp(currentWeekOrder, currentWeekSubscriptionOrder) && (
                <Button
                  mode="contained"
                  compact
                  onPress={handleConfirmPickup}
                  loading={confirmingPickup}
                  disabled={confirmingPickup}
                  style={styles.pickupButton}
                  buttonColor={theme.colors.tertiary}
                  labelStyle={styles.smallButtonLabel}
                >
                  {t('dashboard.confirmPickup')}
                </Button>
              )}
            </View>
          ) : weeklyStock.deliveryDate && weeklyStock.deliveryTime ? (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>🚚</Text>
              <Text style={styles.statusTitle}>{t('dashboard.delivery')}</Text>
              <Text style={styles.statusSubtitle}>
                {new Date(weeklyStock.deliveryDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <Chip mode="flat" compact style={styles.timeChip}>{weeklyStock.deliveryTime}</Chip>
            </View>
          ) : (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>🚚</Text>
              <Text style={styles.statusTitle}>{t('dashboard.delivery')}</Text>
              <Text style={styles.statusSubtitle}>{t('dashboard.pending')}</Text>
            </View>
          )}
        </Surface>

        {/* Payment Card */}
        <Surface style={[styles.statusCard, styles.paymentCard]} elevation={2}>
          {isPaid ? (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>✅</Text>
              <Text style={styles.statusTitle}>{t('dashboard.paid')}</Text>
              <Text style={styles.statusSubtitle}>{getTotalAmount().toFixed(0)} {t('common.rsd')}</Text>
            </View>
          ) : isWaitingConfirmation ? (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>⏳</Text>
              <Text style={styles.statusTitle}>{t('dashboard.waiting')}</Text>
              <Text style={styles.statusSubtitle}>{unpaidAmount.toFixed(0)} {t('common.rsd')}</Text>
            </View>
          ) : (
            <View style={styles.statusCardContent}>
              <Text style={styles.statusIcon}>💳</Text>
              <Text style={styles.statusTitle}>{t('dashboard.payment')}</Text>
              <Text style={styles.statusAmount}>{unpaidAmount.toFixed(0)} {t('common.rsd')}</Text>
              <View style={styles.paymentActions}>
                <IconButton
                  icon="qrcode"
                  size={20}
                  onPress={() => showPaymentDialog('current')}
                  style={styles.paymentIconButton}
                />
                <Button
                  mode="contained"
                  compact
                  onPress={handleMarkPaymentSubmitted}
                  loading={markingPayment}
                  disabled={markingPayment}
                  style={styles.payButton}
                  buttonColor={theme.colors.tertiary}
                  labelStyle={styles.smallButtonLabel}
                >
                  {t('dashboard.pay')}
                </Button>
              </View>
            </View>
          )}
        </Surface>
      </View>

      {/* Orders Row: Order + Subscription */}
      <View style={styles.ordersRow}>
        {/* One-Time Order Card */}
        <Surface 
          style={[styles.orderCard, currentWeekOrder && styles.orderCardActive]} 
          elevation={2}
          onTouchEnd={() => router.push('/(tabs)/two')}
        >
          <View style={styles.orderCardContent}>
            <Text style={styles.orderIcon}>🛒</Text>
            <Text style={styles.orderTitle}>{t('dashboard.order')}</Text>
            {currentWeekOrder ? (
              <>
                <Chip mode="flat" compact style={styles.activeChip}>{t('dashboard.ordered')}</Chip>
                <Text style={styles.orderQuantity}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
                <Text style={styles.orderPrice}>{currentWeekOrder.total.toFixed(0)} {t('common.rsd')}</Text>
              </>
            ) : (
              <Text style={styles.orderInactive}>{t('dashboard.noOrder')}</Text>
            )}
          </View>
        </Surface>

        {/* Subscription Card */}
        <Surface 
          style={[styles.orderCard, subscription && styles.orderCardActive]} 
          elevation={2}
          onTouchEnd={() => router.push('/(tabs)/subscription')}
        >
          <View style={styles.orderCardContent}>
            <Text style={styles.orderIcon}>🔄</Text>
            <Text style={styles.orderTitle}>{t('dashboard.subscription')}</Text>
            {subscription ? (
              <>
                <Chip mode="flat" compact style={styles.activeChip}>{t('dashboard.active')}</Chip>
                <Text style={styles.orderQuantity}>{subscription.quantity} {t('common.eggs')}</Text>
                <Text style={styles.orderPrice}>{subscription.weeksRemaining} {t('dashboard.weeksLeft')}</Text>
              </>
            ) : (
              <Text style={styles.orderInactive}>{t('dashboard.noSubscription')}</Text>
            )}
          </View>
        </Surface>
      </View>

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
    paddingTop: 8,
  },
  
  // Available Badge
  availableSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  
  // Status Row
  statusRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    marginBottom: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    minHeight: 140,
  },
  deliveryCard: {},
  paymentCard: {},
  statusCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statusAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ff6b35',
    marginBottom: 4,
  },
  timeChip: {
    marginTop: 6,
    height: 24,
  },
  pickupButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  paymentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  paymentIconButton: {
    margin: 0,
    backgroundColor: '#f0f0f0',
  },
  payButton: {
    borderRadius: 8,
  },
  smallButtonLabel: {
    fontSize: 11,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  
  // Orders Row
  ordersRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    flex: 1,
  },
  orderCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    minHeight: 160,
  },
  orderCardActive: {
    backgroundColor: '#fff5f0',
    borderWidth: 1,
    borderColor: '#ffb088',
  },
  orderCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  orderIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 8,
  },
  activeChip: {
    marginBottom: 8,
    backgroundColor: '#d4edda',
  },
  orderQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
  },
  orderPrice: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  orderInactive: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  
  // Outstanding State
  outstandingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  outstandingEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  outstandingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#c53030',
    marginBottom: 8,
  },
  outstandingSubtitle: {
    fontSize: 16,
    color: '#742a2a',
    marginBottom: 24,
    textAlign: 'center',
  },
  outstandingList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
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
  waitingChip: {
    backgroundColor: '#e3f2fd',
  },
  outstandingNote: {
    fontSize: 14,
    color: '#742a2a',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  availableBadge: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  availableLabel: {
    fontSize: 14,
    color: '#666',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: CARD_GAP,
    width: '100%',
  },
  ctaCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  ctaButton: {
    borderRadius: 16,
  },
  ctaButtonContent: {
    paddingVertical: 20,
  },
  ctaButtonLabel: {
    fontSize: 14,
    fontWeight: '700',
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
