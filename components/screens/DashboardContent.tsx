import React from 'react';
import { StyleSheet, View, RefreshControl, ScrollView, Dimensions, Pressable } from 'react-native';
import { 
  Text, 
  useTheme,
  Surface,
  Button,
  IconButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as OrderHelpers from '@/utils/orderHelpers';
import { WeeklyStock } from '@/types/models';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;

interface DashboardContentProps {
  weeklyStock: WeeklyStock;
  subscription: any;
  currentWeekOrder: any;
  currentWeekSubscriptionOrder: any;
  availableEggs: number;
  outstandingOrders: any[];
  refreshing: boolean;
  onRefresh: () => void;
  showPaymentDialog: (type: 'current' | 'outstanding', order?: any) => void;
  showConfirmPayment: () => void;
  handleConfirmPickup: () => void;
  confirmingPickup: boolean;
  markingPayment: boolean;
  getCurrentUnpaidAmount: () => number;
  goToPage: (index: number) => void;
}

export default function DashboardContent({
  weeklyStock,
  subscription,
  currentWeekOrder,
  currentWeekSubscriptionOrder,
  availableEggs,
  outstandingOrders,
  refreshing,
  onRefresh,
  showPaymentDialog,
  showConfirmPayment,
  handleConfirmPickup,
  confirmingPickup,
  markingPayment,
  getCurrentUnpaidAmount,
  goToPage,
}: DashboardContentProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  // Determine current state
  const hasOutstanding = outstandingOrders.length > 0;
  const hasCurrentOrders = currentWeekOrder || currentWeekSubscriptionOrder;
  const isDelivered = ['delivered', 'completed'].includes(currentWeekOrder?.status || '') || 
                      ['delivered', 'completed'].includes(currentWeekSubscriptionOrder?.status || '') ||
                      weeklyStock?.allOrdersDelivered;
  const isPaid = OrderHelpers.areAllOrdersPaid(currentWeekOrder, currentWeekSubscriptionOrder);
  const isWaitingConfirmation = OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder);
  const isPickedUp = isDelivered && OrderHelpers.areAllOrdersPickedUp(currentWeekOrder, currentWeekSubscriptionOrder);
  const isComplete = isDelivered && isPickedUp && isPaid;
  const hasDeliveryScheduled = weeklyStock?.deliveryDate && weeklyStock?.deliveryTime;
  const getTotalEggs = () => (currentWeekOrder?.quantity || 0) + (currentWeekSubscriptionOrder?.quantity || 0);
  const needsPayment = hasCurrentOrders && !isPaid;

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
        const stockNotSetup = !weeklyStock.isOrderingOpen && !weeklyStock.allOrdersDelivered;
        const ordersDelivered = weeklyStock.allOrdersDelivered;
        
        if (stockNotSetup) {
          return { emoji: '📦', title: t('order.stockNotSetUp'), subtitle: t('order.stockNotSetUpDesc') };
        }
        if (ordersDelivered) {
          return { emoji: '✅', title: t('order.ordersDelivered'), subtitle: t('order.ordersDeliveredDesc') };
        }
        return { emoji: '🐣', title: t('dashboard.noOrdersYet'), subtitle: `${availableEggs} ${t('dashboard.eggsAvailable')}` };
      case 'ORDER_PLACED':
        return { emoji: '🚚', title: t('dashboard.thankYouOrder'), subtitle: t('dashboard.waitingDeliveryTime') };
      case 'DELIVERY_SCHEDULED':
        const deliveryDate = new Date(weeklyStock.deliveryDate!);
        const dayName = deliveryDate.toLocaleDateString(undefined, { weekday: 'short' });
        const dateStr = deliveryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return { emoji: '🐔', title: t('dashboard.deliveryScheduled'), subtitle: `${dayName} ${dateStr}, ${weeklyStock.deliveryTime}` };
      case 'DELIVERED':
        return { emoji: '📦', title: t('dashboard.eggsAreHere'), subtitle: t('dashboard.dontForgetPickup') };
      case 'PICKED_UP_NOT_PAID':
        return { emoji: '💳', title: t('dashboard.almostDone'), subtitle: t('dashboard.completePayment') };
      case 'COMPLETE':
        return { emoji: '✅', title: t('dashboard.allDone'), subtitle: t('dashboard.seeYouNext') };
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
        <Text style={styles.heroEmoji}>{heroContent.emoji}</Text>
        <Text style={styles.heroTitle}>{heroContent.title}</Text>
        
        {/* Available Eggs Badge - only for NO_ORDERS state */}
        {state === 'NO_ORDERS' && weeklyStock.isOrderingOpen && (
          <Surface style={styles.availableBadge} elevation={3}>
            <Text style={styles.availableNumber}>{availableEggs}</Text>
            <Text style={styles.availableLabel}>{t('dashboard.eggsAvailable')}</Text>
          </Surface>
        )}
        
        {/* Subtitle for other states or closed ordering */}
        {(state !== 'NO_ORDERS' || !weeklyStock.isOrderingOpen) && (
          <Text style={styles.heroSubtitle}>{heroContent.subtitle}</Text>
        )}
      </View>

      {/* Payment Card - shown when orders exist */}
      {hasCurrentOrders && state !== 'NO_ORDERS' && state !== 'PICKED_UP_NOT_PAID' && state !== 'COMPLETE' && (
        <Pressable onPress={() => !isPaid && showPaymentDialog('current')} disabled={isPaid}>
          <Surface style={[styles.paymentCard, isPaid && styles.paymentCardCompleted]} elevation={3}>
            <View style={styles.paymentCardHeader}>
              <Text style={styles.paymentCardIcon}>{isPaid ? '✅' : '💳'}</Text>
              <Text style={styles.paymentCardTitle}>
                {isPaid 
                  ? t('dashboard.paymentCompleted')
                  : (isWaitingConfirmation ? t('dashboard.waitingPaymentConfirmation') : t('dashboard.pleasePayOrder'))}
              </Text>
            </View>
            {!isPaid && (
              <View style={styles.paymentCardRow}>
                {!isWaitingConfirmation && (
                  <>
                    <Text style={styles.paymentCardAmount}>{getCurrentUnpaidAmount().toFixed(0)} {t('common.rsd')}</Text>
                    <View style={styles.paymentCardButtons}>
                      <IconButton icon="qrcode" size={24} onPress={() => showPaymentDialog('current')} style={styles.qrButton} />
                      <Button 
                        mode="contained" 
                        compact 
                        onPress={showConfirmPayment}
                        disabled={markingPayment}
                        buttonColor={theme.colors.tertiary}
                        labelStyle={styles.smallButtonLabel}
                      >
                        {t('dashboard.markPaid')}
                      </Button>
                    </View>
                  </>
                )}
              </View>
            )}
          </Surface>
        </Pressable>
      )}

      {/* PICKED_UP_NOT_PAID: Large payment card */}
      {state === 'PICKED_UP_NOT_PAID' && (
        <Pressable onPress={() => showPaymentDialog('current')}>
          <Surface style={styles.paymentCardLarge} elevation={3}>
            <View style={styles.paymentCardLargeContent}>
              <Text style={styles.paymentCardLargeTitle}>
                {isWaitingConfirmation ? t('dashboard.waitingPaymentConfirmation') : t('dashboard.pleasePayOrder')}
              </Text>
              {!isWaitingConfirmation && (
                <>
                  <Text style={styles.paymentCardLargeAmount}>{getCurrentUnpaidAmount().toFixed(0)} {t('common.rsd')}</Text>
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
                      onPress={showConfirmPayment}
                      disabled={markingPayment}
                      buttonColor={theme.colors.tertiary}
                      style={styles.paymentLargeButton}
                    >
                      {t('dashboard.markPaid')}
                    </Button>
                  </View>
                </>
              )}
            </View>
          </Surface>
        </Pressable>
      )}

      {/* DELIVERED: Confirm Pickup */}
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

      {/* Bottom Cards: Order + Subscription */}
      {state !== 'PICKED_UP_NOT_PAID' && state !== 'DELIVERED' && (
        <View style={styles.bottomRow}>
          <Pressable style={styles.bottomCardWrapper} onPress={() => goToPage(1)}>
            <Surface style={[
              styles.bottomCard, 
              currentWeekOrder && styles.bottomCardActive,
              currentWeekOrder && !currentWeekOrder.paymentSubmitted && !currentWeekOrder.isPaid && styles.bottomCardRed,
              currentWeekOrder && currentWeekOrder.paymentSubmitted && !currentWeekOrder.isPaid && styles.bottomCardYellow,
              currentWeekOrder && currentWeekOrder.isPaid && styles.bottomCardGreen,
            ]} elevation={2}>
              <Text style={styles.bottomCardIcon}>🛒</Text>
              {state === 'NO_ORDERS' || !currentWeekOrder ? (
                <Text style={styles.bottomCardTitle}>{t('dashboard.orderNow')}</Text>
              ) : state === 'COMPLETE' ? (
                <>
                  <Text style={styles.bottomCardQuantity}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
                  <Text style={styles.bottomCardCheck}>✓</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bottomCardTitle}>{t('tabs.order')}</Text>
                  <Text style={styles.bottomCardQuantity}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
                </>
              )}
            </Surface>
          </Pressable>

          <Pressable style={styles.bottomCardWrapper} onPress={() => goToPage(2)}>
            <Surface style={[
              styles.bottomCard, 
              currentWeekSubscriptionOrder && styles.bottomCardActive,
              currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.paymentSubmitted && !currentWeekSubscriptionOrder.isPaid && styles.bottomCardRed,
              currentWeekSubscriptionOrder && currentWeekSubscriptionOrder.paymentSubmitted && !currentWeekSubscriptionOrder.isPaid && styles.bottomCardYellow,
              currentWeekSubscriptionOrder && currentWeekSubscriptionOrder.isPaid && styles.bottomCardGreen,
            ]} elevation={2}>
              <Text style={styles.bottomCardIcon}>🔄</Text>
              {!subscription ? (
                <Text style={styles.bottomCardTitle}>{t('dashboard.subscribe')}</Text>
              ) : state === 'COMPLETE' ? (
                <>
                  <Text style={styles.bottomCardQuantity}>{subscription.quantity} {t('common.eggs')}</Text>
                  <Text style={styles.bottomCardStatus}>{t('dashboard.active')}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.bottomCardTitle}>{t('tabs.subscription')}</Text>
                  <Text style={styles.bottomCardQuantity}>{subscription.quantity} {t('common.eggs')}</Text>
                  <Text style={styles.bottomCardWeeks}>{subscription.weeksRemaining} {t('dashboard.weeksLeft')}</Text>
                </>
              )}
            </Surface>
          </Pressable>
        </View>
      )}
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 12,
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
  availableBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  availableNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  availableLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  paymentCard: {
    backgroundColor: '#fff5f0',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffb088',
    padding: 16,
  },
  paymentCardCompleted: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
  },
  paymentCardHeader: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  paymentCardIcon: {
    fontSize: 28,
  },
  paymentCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  paymentCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  paymentCardAmount: {
    fontSize: 24,
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
    padding: 16,
    alignItems: 'center',
    height: 140,
    justifyContent: 'center',
  },
  bottomCardActive: {
    backgroundColor: '#fff5f0',
    borderWidth: 2,
    borderColor: '#ffb088',
  },
  bottomCardRed: {
    borderWidth: 2,
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  bottomCardYellow: {
    borderWidth: 2,
    borderColor: '#ff9800',
    backgroundColor: '#fff8e1',
  },
  bottomCardGreen: {
    borderWidth: 2,
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e9',
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
  bottomCardWeeks: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
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
});

