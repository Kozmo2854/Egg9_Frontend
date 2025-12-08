import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View as RNView, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from 'react-native';
import { View } from '@/components/Themed';
import { 
  Card, 
  Text, 
  Chip, 
  useTheme,
  Surface,
  Button,
  Dialog,
  Portal,
  Snackbar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as OrderHelpers from '@/utils/orderHelpers';
import { useScrollContext } from '@/contexts/ScrollContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError, ACTION_ERROR_MESSAGES } from '@/utils/errorHandling';

export default function HomeScreen() {
  const theme = useTheme();
  const { setScrollY } = useScrollContext();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
  const [currentWeekSubscriptionOrder, setCurrentWeekSubscriptionOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableEggs, setAvailableEggs] = useState(0);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const [paymentSettings, setPaymentSettings] = useState<{
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  } | null>(null);
  const [outstandingOrders, setOutstandingOrders] = useState<any[]>([]);
  const [paymentOrderContext, setPaymentOrderContext] = useState<{ type: 'current' | 'outstanding', order?: any } | null>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

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
      // Filter out current week orders (they're shown separately)
      const previousWeekUnpaid = unpaidOrders.filter((o: any) => o.weekId !== stockData.id);
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

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDeliveryDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
    });
  };

  const getTotalAmount = () => {
    return (currentWeekOrder?.total || 0) + (currentWeekSubscriptionOrder?.total || 0);
  };

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
      
      // Handle outstanding orders
      if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
        await apiService.markOrderPaymentSubmitted(paymentOrderContext.order.id);
        await loadData();
        hidePaymentDialog();
        setSnackbar({ visible: true, message: 'Payment marked as submitted!' });
        return;
      }
      
      // Handle current week orders
      const orderIds = OrderHelpers.getOrdersNeedingPaymentSubmission(currentWeekOrder, currentWeekSubscriptionOrder);

      if (orderIds.length === 0) {
        setSnackbar({ visible: true, message: 'All orders have already been marked as paid' });
        hidePaymentDialog();
        return;
      }

      await Promise.all(orderIds.map(id => apiService.markOrderPaymentSubmitted(id)));
      await loadData();
      hidePaymentDialog();
      setSnackbar({ visible: true, message: 'Payment marked as submitted!' });
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
      setSnackbar({ visible: true, message: 'Pickup confirmed!' });
    } catch (err: any) {
      const appError = parseError(err);
      setSnackbar({ visible: true, message: appError.message });
    } finally {
      setConfirmingPickup(false);
    }
  };

  /** Generates NBS IPS format QR code for Serbian payment system */
  const generateNBSIPSQRCode = (customAmount?: number) => {
    if (!paymentSettings) return '';
    
    const amount = customAmount ?? (
      OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
        ? OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder)
        : OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder)
    );
    
    const amountFormatted = `RSD${amount.toFixed(2).replace('.', ',')}`;
    const bankAccountFormatted = paymentSettings.bankAccountNumber.replace(/-/g, '');
    
    return `K:PR|V:01|C:1|R:${bankAccountFormatted}|N:${paymentSettings.recipientName}|I:${amountFormatted}|SF:${paymentSettings.paymentCode}|S:${paymentSettings.paymentPurpose}`;
  };

  if (loading) {
    return <LoadingView message="Loading your orders..." />;
  }

  if (error || !weeklyStock) {
    return (
      <ErrorView 
        message={error || 'Unable to load data'} 
        onRetry={() => loadData()} 
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#ff6b35']}
          tintColor="#ff6b35"
        />
      }
    >
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEmoji}>🥚</Text>
        <Text style={styles.heroTitle}>Egg9</Text>
        <Text style={styles.heroSubtitle}>
          {formatDate(weeklyStock.weekStart)} - {formatDate(weeklyStock.weekEnd)}
        </Text>
        
        {/* Stats Card */}
        <Surface style={styles.statCard} elevation={4}>
          {weeklyStock.isOrderingOpen ? (
            <>
          <Text style={styles.statNumber}>{availableEggs}</Text>
          <Text style={styles.statLabel}>Available Eggs</Text>
            </>
          ) : weeklyStock.allOrdersDelivered ? (
            <>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statLabel}>Orders Delivered!</Text>
              <Text style={styles.statSubtext}>See you next week!</Text>
            </>
          ) : (
            <>
              <Text style={styles.statIcon}>📦</Text>
              <Text style={styles.statLabel}>Stock not set up yet</Text>
              <Text style={styles.statSubtext}>Admin will update soon</Text>
            </>
          )}
        </Surface>
      </LinearGradient>

      <RNView style={styles.content}>
        {/* Delivery Status */}
        <Card style={styles.deliveryCard} mode="elevated">
          {['delivered', 'completed'].includes(currentWeekOrder?.status || '') || ['delivered', 'completed'].includes(currentWeekSubscriptionOrder?.status || '') || weeklyStock.allOrdersDelivered ? (
            <LinearGradient
              colors={OrderHelpers.areAllOrdersComplete(currentWeekOrder, currentWeekSubscriptionOrder) 
                ? ['#d4edda', '#f1f9f3'] 
                : [theme.colors.tertiary, theme.colors.tertiaryContainer]}
              style={styles.deliveryGradient}
            >
              <RNView style={styles.deliveryContent}>
                <RNView style={styles.deliveryIconCircle}>
                  <Text style={styles.deliveryIconCheck}>✓</Text>
                </RNView>
                <Text style={styles.deliveryTitle}>
                  {OrderHelpers.areAllOrdersComplete(currentWeekOrder, currentWeekSubscriptionOrder) ? 'Order Complete!' : 'Order Delivered!'}
                </Text>
                <Text style={styles.deliverySubtitle}>
                  {OrderHelpers.areAllOrdersComplete(currentWeekOrder, currentWeekSubscriptionOrder) 
                    ? 'Thank you! Your order is complete. See you next week!' 
                    : `${((currentWeekOrder?.quantity || 0) + (currentWeekSubscriptionOrder?.quantity || 0))} eggs have been delivered`}
                </Text>
                {!OrderHelpers.areAllOrdersComplete(currentWeekOrder, currentWeekSubscriptionOrder) && (
                  <Button
                    mode="contained"
                    onPress={handleConfirmPickup}
                    loading={confirmingPickup}
                    disabled={confirmingPickup || OrderHelpers.areAllOrdersPickedUp(currentWeekOrder, currentWeekSubscriptionOrder)}
                    icon="check-circle"
                    style={styles.confirmPickupButton}
                    buttonColor="#ffffff"
                    textColor={theme.colors.tertiary}
                  >
                    {OrderHelpers.areAllOrdersPickedUp(currentWeekOrder, currentWeekSubscriptionOrder) ? 'Pickup Confirmed' : 'Confirm Pickup'}
                  </Button>
                )}
              </RNView>
            </LinearGradient>
          ) : weeklyStock.deliveryDate && weeklyStock.deliveryTime ? (
            <Card.Content style={styles.deliveryPadding}>
              <RNView style={styles.deliveryHeader}>
                <RNView style={styles.deliveryIconContainer}>
                  <Text style={styles.deliveryIcon}>🚚</Text>
                </RNView>
                <RNView style={styles.deliveryInfo}>
                  <Text variant="titleMedium" style={styles.deliveryInfoTitle}>
                    Delivery Scheduled
                  </Text>
                  <Text variant="bodyLarge" style={styles.deliveryDate}>
                    {formatDeliveryDate(weeklyStock.deliveryDate)}
                  </Text>
                  <Chip icon="clock-outline" style={styles.timeChip} mode="flat">
                    {weeklyStock.deliveryTime}
                  </Chip>
                </RNView>
              </RNView>
            </Card.Content>
          ) : (
            <Card.Content style={styles.deliveryPadding}>
              <RNView style={styles.deliveryPendingContainer}>
                <Text style={styles.deliveryPendingIcon}>📅</Text>
                <Text variant="titleMedium" style={styles.deliveryPendingText}>
                  Delivery time pending
                </Text>
                <Text variant="bodySmall" style={styles.deliveryPendingSubtext}>
                  We'll notify you once scheduled
                </Text>
              </RNView>
            </Card.Content>
          )}
        </Card>

        {/* Outstanding Orders from Previous Weeks */}
        {outstandingOrders.length > 0 && (
          <Surface style={styles.outstandingCard} elevation={3}>
            <RNView style={styles.outstandingHeader}>
              <Text style={styles.outstandingIcon}>🐔</Text>
              <Text variant="titleLarge" style={styles.outstandingTitle}>
                Outstanding Orders
              </Text>
            </RNView>
            <Text variant="bodyMedium" style={styles.outstandingSubtitle}>
              Hey! We noticed you have some unpaid eggs waiting for you 🥚
            </Text>
            {outstandingOrders.map((order) => (
              <RNView key={order.id} style={styles.outstandingItem}>
                <RNView style={styles.outstandingItemLeft}>
                  <Text variant="bodyLarge" style={styles.outstandingWeek}>
                    Week of {new Date(order.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  <Text variant="bodyMedium" style={styles.outstandingDetails}>
                    {order.quantity} eggs • {order.total.toFixed(0)} RSD
                  </Text>
                </RNView>
                {order.paymentSubmitted ? (
                  <Chip icon="clock-outline" mode="flat" style={styles.outstandingWaitingChip}>
                    Waiting
                  </Chip>
                ) : (
                  <Button 
                    mode="contained" 
                    compact 
                    onPress={() => showPaymentDialog('outstanding', order)}
                    buttonColor={theme.colors.primary}
                    style={styles.outstandingPayButton}
                  >
                    Pay
                  </Button>
                )}
              </RNView>
            ))}
            <Text variant="bodySmall" style={styles.outstandingNote}>
              Our chickens would really appreciate it when you get a chance! 🐣
            </Text>
          </Surface>
        )}

        {/* Payment Section */}
        {(currentWeekOrder || currentWeekSubscriptionOrder) && (
          <Surface style={styles.orderCard} elevation={2}>
            <LinearGradient
              colors={OrderHelpers.areAllOrdersPaid(currentWeekOrder, currentWeekSubscriptionOrder) 
                ? ['#d4edda', '#f1f9f3'] 
                : OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
                ? ['#e3f2fd', '#f5f9ff']
                : ['#fff3cd', '#fff9e6']}
              style={styles.orderGradient}
            >
              <RNView style={styles.orderContent}>
                <RNView style={styles.orderHeader}>
                  <RNView style={styles.orderIconContainer}>
                    <Text style={styles.orderIcon}>
                      {OrderHelpers.areAllOrdersPaid(currentWeekOrder, currentWeekSubscriptionOrder) ? '✅' : OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder) ? '⏳' : '💳'}
                    </Text>
                  </RNView>
                  <Text variant="titleLarge" style={styles.orderTitle}>
                    Payment Status
                  </Text>
                </RNView>
                
                <RNView style={styles.orderDetails}>
                  {OrderHelpers.areAllOrdersPaid(currentWeekOrder, currentWeekSubscriptionOrder) ? (
                    <>
                      <Chip icon="check-circle" mode="flat" style={styles.paidChip}>
                        Paid
                      </Chip>
                      <Text variant="headlineSmall" style={styles.orderQuantity}>
                        {((currentWeekOrder?.quantity || 0) + (currentWeekSubscriptionOrder?.quantity || 0))} eggs
                      </Text>
                      <Text variant="headlineMedium" style={styles.paymentAmountPaid}>
                        {getTotalAmount().toFixed(0)} RSD
                      </Text>
                      <Text variant="bodyLarge" style={styles.paymentConfirmation}>
                        Your order was paid
                      </Text>
                    </>
                  ) : OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder) ? (
                    <>
                      <Chip icon="clock-outline" mode="flat" style={styles.waitingChip}>
                        Waiting for Admin confirmation
                      </Chip>
                      <Text variant="headlineSmall" style={styles.orderQuantity}>
                        {OrderHelpers.getUnpaidSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder)} eggs
                      </Text>
                      <Text variant="headlineMedium" style={styles.paymentAmount}>
                        {OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder).toFixed(0)} RSD
                      </Text>
                      <Text variant="bodyMedium" style={styles.paymentLabel}>
                        Payment submitted - awaiting confirmation
                      </Text>
                    </>
                  ) : (
                    <>
                      <Chip icon="alert-circle" mode="flat" style={styles.unpaidChip}>
                        Unpaid
                      </Chip>
                      <Text variant="headlineSmall" style={styles.orderQuantity}>
                        {OrderHelpers.getUnpaidNotSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder)} eggs
                      </Text>
                      <Text variant="headlineMedium" style={styles.paymentAmount}>
                        {OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder).toFixed(0)} RSD
                      </Text>
                      <Text variant="bodyMedium" style={styles.paymentLabel}>
                        Total to be paid
                      </Text>
                      <Button
                        mode="contained"
                        onPress={() => showPaymentDialog('current')}
                        icon="qrcode"
                        style={styles.paymentButton}
                        buttonColor={theme.colors.primary}
                      >
                        View Payment Details
                      </Button>
                    </>
                  )}
                </RNView>
              </RNView>
            </LinearGradient>
          </Surface>
        )}

        {/* Your Orders */}
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Your Orders
        </Text>

        {/* Subscription */}
        <Surface style={styles.orderCard} elevation={2}>
          <LinearGradient
            colors={subscription ? [theme.colors.primaryContainer, theme.colors.surfaceVariant] : ['#f5f5f5', '#fafafa']}
            style={styles.orderGradient}
          >
            <RNView style={styles.orderContent}>
              <RNView style={styles.orderHeader}>
                <RNView style={styles.orderIconContainer}>
                  <Text style={styles.orderIcon}>📅</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.orderTitle}>
                  Subscription
                </Text>
              </RNView>
              
              {subscription ? (
                <RNView style={styles.orderDetails}>
                  <Chip icon="check-circle" mode="flat" style={styles.activeChip}>
                    Active
                  </Chip>
                  <Text variant="headlineSmall" style={styles.orderQuantity}>
                    {subscription.quantity} eggs
                  </Text>
                  <Text variant="bodyMedium" style={styles.orderFrequency}>
                    delivered weekly
                  </Text>
                  <Text variant="bodyLarge" style={styles.orderRemainingWeeks}>
                    {subscription.weeksRemaining} {subscription.weeksRemaining === 1 ? 'week' : 'weeks'} remaining
                  </Text>
                </RNView>
              ) : (
                <Text variant="bodyMedium" style={styles.orderInactive}>
                  No active subscription
                </Text>
              )}
            </RNView>
          </LinearGradient>
        </Surface>

        {/* One-Time Order */}
        <Surface style={styles.orderCard} elevation={2}>
          <LinearGradient
            colors={currentWeekOrder ? [theme.colors.secondaryContainer, theme.colors.surfaceVariant] : ['#f5f5f5', '#fafafa']}
            style={styles.orderGradient}
          >
            <RNView style={styles.orderContent}>
              <RNView style={styles.orderHeader}>
                <RNView style={styles.orderIconContainer}>
                  <Text style={styles.orderIcon}>🛒</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.orderTitle}>
                  One time orders for this week
                </Text>
              </RNView>
              
              {currentWeekOrder ? (
                <RNView style={styles.orderDetails}>
                  <Chip icon="check-circle" mode="flat" style={styles.activeChip}>
                    Ordered
                  </Chip>
                  <Text variant="headlineSmall" style={styles.orderQuantity}>
                    {currentWeekOrder.quantity} eggs
                  </Text>
                  <Text variant="bodyMedium" style={styles.orderPrice}>
                    {currentWeekOrder.total.toFixed(0)} RSD
                  </Text>
                </RNView>
              ) : (
                <Text variant="bodyMedium" style={styles.orderInactive}>
                  No order for this week
                </Text>
              )}
            </RNView>
          </LinearGradient>
        </Surface>

      </RNView>

      {/* Unified Payment Dialog */}
      <Portal>
        <Dialog visible={paymentDialogVisible} onDismiss={hidePaymentDialog} style={styles.paymentDialog}>
          <Dialog.Title style={styles.dialogTitle}>
            {paymentOrderContext?.type === 'outstanding' ? '🐔 Outstanding Payment' : 'Payment Information'}
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            {paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order && (
              <Text variant="bodyMedium" style={styles.outstandingDialogSubtitle}>
                Week of {new Date(paymentOrderContext.order.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            )}
            <RNView style={styles.qrCodeContainer}>
              <QRCode
                value={generateNBSIPSQRCode(paymentOrderContext?.type === 'outstanding' ? paymentOrderContext.order?.total : undefined)}
                size={200}
                backgroundColor="white"
              />
            </RNView>
            <Text variant="titleMedium" style={styles.paymentDialogAmount}>
              {getPaymentDialogQuantity()} eggs • {getPaymentDialogAmount().toFixed(0)} RSD
            </Text>
            <RNView style={styles.bankDetailsContainer}>
              <Text variant="bodyMedium" style={styles.bankDetailLabel}>Account:</Text>
              <Text variant="bodyMedium" style={styles.bankDetailValue}>{paymentSettings?.bankAccountNumber}</Text>
            </RNView>
            <RNView style={styles.bankDetailsContainer}>
              <Text variant="bodyMedium" style={styles.bankDetailLabel}>Recipient:</Text>
              <Text variant="bodyMedium" style={styles.bankDetailValue}>{paymentSettings?.recipientName}</Text>
            </RNView>
            <RNView style={styles.bankDetailsContainer}>
              <Text variant="bodyMedium" style={styles.bankDetailLabel}>Purpose:</Text>
              <Text variant="bodyMedium" style={styles.bankDetailValue}>{paymentSettings?.paymentPurpose}</Text>
            </RNView>
            <Text variant="bodySmall" style={styles.paymentInstructions}>
              Scan the QR code with your banking app for instant payment, or use the bank account details above.
              {' After payment, click "Mark Paid" below. Admin will confirm once received.'}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            {/* Show Mark Paid for outstanding orders if not already submitted */}
            {paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order && !paymentOrderContext.order.paymentSubmitted && (
              <Button 
                onPress={handleMarkPaymentSubmitted} 
                mode="contained"
                loading={markingPayment}
                disabled={markingPayment}
                buttonColor={theme.colors.tertiary}
                style={{ marginRight: 8 }}
              >
                Mark Paid
              </Button>
            )}
            {/* Show Mark Paid for current week orders if not all submitted */}
            {paymentOrderContext?.type === 'current' && !OrderHelpers.areAllOrdersPaymentSubmitted(currentWeekOrder, currentWeekSubscriptionOrder) && (
              <Button 
                onPress={handleMarkPaymentSubmitted} 
                mode="contained"
                loading={markingPayment}
                disabled={markingPayment}
                buttonColor={theme.colors.tertiary}
                style={{ marginRight: 8 }}
              >
                Mark Paid
              </Button>
            )}
            <Button onPress={hidePaymentDialog} mode="contained">Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbar({ visible: false, message: '' }),
        }}
      >
        {snackbar.message}
      </Snackbar>
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
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 42,
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
    marginBottom: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  deliveryCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  deliveryGradient: {
    padding: 24,
  },
  deliveryContent: {
    alignItems: 'center',
  },
  deliveryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  deliveryIconCheck: {
    fontSize: 32,
    color: '#4ecdc4',
  },
  deliveryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  deliverySubtitle: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  confirmPickupButton: {
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  deliveryPadding: {
    padding: 20,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deliveryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff0eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryIcon: {
    fontSize: 28,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryDate: {
    fontWeight: '600',
    marginBottom: 8,
  },
  timeChip: {
    alignSelf: 'flex-start',
  },
  deliveryPendingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deliveryPendingIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  deliveryPendingText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryPendingSubtext: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  outstandingCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#feb2b2',
  },
  outstandingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  outstandingIcon: {
    fontSize: 24,
  },
  outstandingTitle: {
    fontWeight: 'bold',
    color: '#c53030',
  },
  outstandingSubtitle: {
    color: '#742a2a',
    marginBottom: 12,
    opacity: 0.8,
  },
  outstandingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  outstandingItemLeft: {
    flex: 1,
  },
  outstandingWeek: {
    fontWeight: '600',
    color: '#2d3748',
  },
  outstandingDetails: {
    color: '#718096',
    marginTop: 2,
  },
  outstandingPayButton: {
    borderRadius: 8,
  },
  outstandingWaitingChip: {
    backgroundColor: '#e3f2fd',
  },
  outstandingDialogSubtitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  outstandingNote: {
    textAlign: 'center',
    color: '#742a2a',
    marginTop: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  orderCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  orderGradient: {
    borderRadius: 20,
  },
  orderContent: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderIcon: {
    fontSize: 24,
  },
  orderTitle: {
    fontWeight: 'bold',
    flex: 1,
    flexShrink: 1,
  },
  orderDetails: {
    alignItems: 'center',
    paddingTop: 8,
  },
  activeChip: {
    marginBottom: 12,
  },
  orderQuantity: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderFrequency: {
    opacity: 0.8,
  },
  orderRemainingWeeks: {
    opacity: 0.85,
    marginTop: 8,
    fontWeight: '600',
  },
  orderPrice: {
    opacity: 0.8,
  },
  orderInactive: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 12,
  },
  paidChip: {
    marginBottom: 12,
  },
  unpaidChip: {
    marginBottom: 12,
  },
  waitingChip: {
    marginBottom: 12,
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
  },
  paymentAmount: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#2d3748',
  },
  paymentAmountPaid: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#28a745',
  },
  paymentLabel: {
    opacity: 0.7,
    marginBottom: 16,
  },
  paymentButton: {
    marginTop: 8,
  },
  paymentConfirmation: {
    fontWeight: '600',
    color: '#28a745',
    marginTop: 8,
  },
  paymentDialog: {
    maxWidth: 400,
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
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: 20,
    color: '#2d3748',
  },
  bankDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
    gap: 4,
  },
  bankDetailLabel: {
    fontWeight: '600',
    color: '#666',
    flexShrink: 0,
  },
  bankDetailValue: {
    fontWeight: 'bold',
    color: '#2d3748',
    flexShrink: 1,
    textAlign: 'right',
  },
  paymentInstructions: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
  },
});
