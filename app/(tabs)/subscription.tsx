import { useState, useCallback } from 'react';
import { StyleSheet, View as RNView, Dimensions, ScrollView } from 'react-native';
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
  Paragraph,
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

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { setWeekDates } = useWeekContext();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(10);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(2);
  const [currentWeekSubOrder, setCurrentWeekSubOrder] = useState<any>(null);
  const [nextWeekConfirmation, setNextWeekConfirmation] = useState<{
    show: boolean;
    nextWeekStart: string;
    nextWeekEnd: string;
  } | null>(null);
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stockData, subData, subOrder, settings] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekSubscriptionOrder(),
        apiService.getAppSettings(),
      ]);
      setWeeklyStock(stockData);
      setSubscription(subData);
      setCurrentWeekSubOrder(subOrder);
      setPaymentSettings(settings.paymentSettings);
      
      // Set week dates for header display
      if (stockData) {
        setWeekDates(stockData.weekStart, stockData.weekEnd);
      }
      
      if (subData) {
        setSubscriptionQuantity(subData.quantity);
        setSubscriptionPeriod(subData.period || 4);
      }
    } catch (err) {
      const appError = parseError(err, 'loadData');
      setError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (startNextWeek: boolean = false) => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const sub = await apiService.createSubscription(
        subscriptionQuantity, 
        subscriptionPeriod, 
        startNextWeek
      );
      setSubscription(sub);
      setSuccessMessage(t('subscription.subscriptionCreated', { quantity: subscriptionQuantity, period: subscriptionPeriod }));
      setNextWeekConfirmation(null);
      
      const updatedStock = await apiService.getWeeklyStock();
      setWeeklyStock(updatedStock);
    } catch (err: any) {
      if (err.statusCode === 409 && err.data?.message === 'insufficient_stock_this_week') {
        setNextWeekConfirmation({
          show: true,
          nextWeekStart: err.data.nextWeekStart,
          nextWeekEnd: err.data.nextWeekEnd,
        });
      } else {
        const errorMsg = err?.message || err?.toString() || 'Failed to create subscription';
        setErrorMessage(typeof errorMsg === 'string' ? errorMsg : 'Failed to create subscription');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiService.cancelSubscription();
      setSubscription(null);
      setSuccessMessage(t('subscription.subscriptionCancelled'));
      setSubscriptionQuantity(10);
      setSubscriptionPeriod(4);
      
      const updatedStock = await apiService.getWeeklyStock();
      setWeeklyStock(updatedStock);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaymentSubmitted = async () => {
    setConfirmPaymentVisible(false);
    if (!currentWeekSubOrder || currentWeekSubOrder.isPaid || currentWeekSubOrder.paymentSubmitted) return;
    try {
      setMarkingPayment(true);
      await apiService.markOrderPaymentSubmitted(currentWeekSubOrder.id);
      setPaymentDialogVisible(false);
      setSuccessMessage(t('payment.paymentMarked'));
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark payment');
    } finally {
      setMarkingPayment(false);
    }
  };

  const incrementSubscriptionQuantity = () => {
    if (subscriptionQuantity < 30) {
      setSubscriptionQuantity(subscriptionQuantity + 10);
    }
  };

  const decrementSubscriptionQuantity = () => {
    if (subscriptionQuantity > 10) {
      setSubscriptionQuantity(subscriptionQuantity - 10);
    }
  };

  const calculateWeeklyPrice = () => {
    if (!weeklyStock) return 0;
    return (subscriptionQuantity / 10) * weeklyStock.pricePerDozen;
  };

  const calculateTotalPrice = () => {
    return calculateWeeklyPrice() * subscriptionPeriod;
  };

  if (loading) {
    return <LoadingView message={t('subscription.loadingSubscription')} />;
  }

  if (error || !weeklyStock) {
    return (
      <ErrorView 
        message={error || 'Unable to load data'} 
        onRetry={() => loadData()} 
      />
    );
  }

  const showForm = !subscription && !weeklyStock.isLowSeason;

  const payableOrder = currentWeekSubOrder && !currentWeekSubOrder.isPaid && !currentWeekSubOrder.paymentSubmitted
    ? currentWeekSubOrder
    : null;
  const awaitingConfirmation = !!currentWeekSubOrder && !currentWeekSubOrder.isPaid && currentWeekSubOrder.paymentSubmitted;
  const paymentAmount = OrderHelpers.getUnpaidNotSubmittedAmount(null, currentWeekSubOrder);
  const paymentQuantity = OrderHelpers.getUnpaidNotSubmittedQuantity(null, currentWeekSubOrder);

  return (
    <View style={styles.container} {...swipeHandlers}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section - Show subscription status */}
        {subscription && (
          <RNView style={styles.heroSection}>
            <Text style={styles.heroEmoji}>
              {currentWeekSubOrder?.isPaid ? '✅' : (currentWeekSubOrder ? '🔄' : '📅')}
            </Text>
            <Text style={styles.heroTitle}>
              {currentWeekSubOrder?.isPaid 
                ? t('subscription.paymentConfirmed')
                : (currentWeekSubOrder 
                    ? t('subscription.activeThisWeek')
                    : t('subscription.activeSubscription'))}
            </Text>
            <Text style={styles.heroSubtitle}>
              {currentWeekSubOrder?.isPaid 
                ? t('dashboard.seeYouNext')
                : (currentWeekSubOrder?.paymentSubmitted 
                    ? t('dashboard.waitingPaymentConfirmation')
                    : (currentWeekSubOrder 
                        ? t('order.payOnDashboard')
                        : t('subscription.nextDeliveryScheduled')))}
            </Text>
          </RNView>
        )}

        {/* Active Subscription Card */}
        {subscription && (
          <Surface style={styles.subscriptionCard} elevation={2}>
            <RNView style={styles.cardHeader}>
              <RNView style={styles.cardHeaderIcon}>
                <Text style={styles.cardHeaderIconText}>✓</Text>
              </RNView>
              <Text style={styles.cardHeaderTitle}>{t('subscription.activeSubscription')}</Text>
            </RNView>
            
            <RNView style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('subscription.weeklyDelivery')}</Text>
              <Text style={styles.detailValue}>{subscription.quantity} {t('common.eggs')}</Text>
            </RNView>
            <RNView style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('subscription.duration')}</Text>
              <Text style={styles.detailValue}>{subscription.weeksRemaining || subscription.period} {t('dashboard.weeksLeft')}</Text>
            </RNView>
            <RNView style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('subscription.weeklyPrice')}</Text>
              <Text style={styles.detailValue}>{calculateWeeklyPrice().toFixed(0)} {t('common.rsd')}</Text>
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

            {/* Cancel Button */}
            <Button
              mode="outlined"
              onPress={handleCancelSubscription}
              disabled={processing}
              loading={processing}
              textColor={theme.colors.error}
              icon="close-circle-outline"
              style={styles.cancelButton}
            >
              {t('common.cancel')}
            </Button>
          </Surface>
        )}

        {/* Low Season - No Subscription */}
        {weeklyStock.isLowSeason && !subscription && (
          <Surface style={styles.lowSeasonCard} elevation={2}>
            <RNView style={styles.cardHeader}>
              <Text style={styles.lowSeasonIcon}>🐔</Text>
              <Text style={styles.lowSeasonTitle}>{t('subscription.subscriptionsPaused')}</Text>
            </RNView>
            <Text style={styles.lowSeasonCardText}>{t('subscription.lowSeasonMessage')}</Text>
            <Text style={[styles.lowSeasonCardText, { marginTop: 8, fontWeight: '500' }]}>{t('subscription.canStillOrder', { cap: weeklyStock.lowSeasonOrderCap || 20 })}</Text>
          </Surface>
        )}

        {/* Subscription Form */}
        {showForm && (
          <Surface style={styles.formCard} elevation={2}>
            <Text style={styles.formTitle}>
              {t('subscription.createSubscription')}
            </Text>

            {/* Quantity Selector */}
            <Text style={styles.sectionLabel}>{t('subscription.weeklyQuantity')}</Text>
            <RNView style={styles.quantityRow}>
              <IconButton
                icon="minus-circle"
                size={36}
                iconColor={subscriptionQuantity <= 10 ? theme.colors.outlineVariant : theme.colors.tertiary}
                onPress={decrementSubscriptionQuantity}
                disabled={subscriptionQuantity <= 10 || processing}
              />
              <RNView style={styles.quantityDisplay}>
                <Text style={styles.quantityNumber}>{subscriptionQuantity}</Text>
                <Text style={styles.quantityLabel}>{t('common.eggs')}</Text>
              </RNView>
              <IconButton
                icon="plus-circle"
                size={36}
                iconColor={subscriptionQuantity >= 30 ? theme.colors.outlineVariant : theme.colors.tertiary}
                onPress={incrementSubscriptionQuantity}
                disabled={subscriptionQuantity >= 30 || processing}
              />
            </RNView>

            {/* Period Selector */}
            <Text style={styles.sectionLabel}>{t('subscription.subscriptionDuration')}</Text>
            <RNView style={styles.periodGrid}>
              {[2, 3, 4].map((weeks) => (
                <Button
                  key={weeks}
                  mode={subscriptionPeriod === weeks ? 'contained' : 'outlined'}
                  onPress={() => setSubscriptionPeriod(weeks)}
                  style={styles.periodButton}
                  buttonColor={subscriptionPeriod === weeks ? theme.colors.tertiary : 'transparent'}
                  textColor={subscriptionPeriod === weeks ? '#fff' : theme.colors.tertiary}
                  compact
                >
                  {weeks} {t('common.weeks')}
                </Button>
              ))}
            </RNView>

            {/* Price Summary */}
            <RNView style={styles.priceSummary}>
              <RNView style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('subscription.totalPrice')}</Text>
                <Text style={styles.priceAmount}>{calculateTotalPrice().toFixed(0)} {t('common.rsd')}</Text>
              </RNView>
              <Text style={styles.priceDetails}>
                {subscriptionQuantity} {t('common.eggs')} × {subscriptionPeriod} {t('common.weeks')}
              </Text>
            </RNView>

            {/* Subscribe Button */}
            <Button
              mode="contained"
              onPress={() => handleSubscribe()}
              loading={processing}
              disabled={processing}
              style={styles.subscribeButton}
              buttonColor={theme.colors.tertiary}
              icon="calendar-check"
            >
              {t('subscription.subscribeNow')}
            </Button>
          </Surface>
        )}

        {/* Benefits - only show when no subscription */}
        {!subscription && !weeklyStock.isLowSeason && (
          <Surface style={styles.benefitsCard} elevation={1}>
            <Text style={styles.benefitsTitle}>{t('subscription.whySubscribe')}</Text>
            {[
              { icon: '🎯', text: t('subscription.benefit1') },
              { icon: '📦', text: t('subscription.benefit2') },
              { icon: '🔄', text: t('subscription.benefit4') },
            ].map((benefit, index) => (
              <RNView key={index} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </RNView>
            ))}
          </Surface>
        )}
      </ScrollView>

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

      {/* Next Week Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={!!nextWeekConfirmation?.show}
          onDismiss={() => setNextWeekConfirmation(null)}
        >
          <Dialog.Icon icon="calendar-alert" size={48} />
          <Dialog.Title style={{ textAlign: 'center', fontSize: 18 }}>
            {t('subscription.noStockThisWeek')}
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ textAlign: 'center', marginBottom: 12 }}>
              {t('subscription.startNextWeek')}
            </Paragraph>
            {nextWeekConfirmation && (
              <Surface style={styles.nextWeekBadge}>
                <Text style={styles.nextWeekText}>
                  📅 {new Date(nextWeekConfirmation.nextWeekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(nextWeekConfirmation.nextWeekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </Surface>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-around' }}>
            <Button onPress={() => setNextWeekConfirmation(null)} mode="outlined">
              {t('common.no')}
            </Button>
            <Button 
              onPress={() => handleSubscribe(true)} 
              mode="contained"
              icon="check"
            >
              {t('common.yes')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  
  // Hero Section
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

  // Card Header
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
    backgroundColor: '#d4f4f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderIconText: {
    fontSize: 18,
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },

  // Subscription Card
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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

  // Low Season Card
  lowSeasonCard: {
    backgroundColor: '#fff3e0',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  lowSeasonIcon: {
    fontSize: 24,
  },
  lowSeasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
  },
  lowSeasonCardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form Card
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textAlign: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityDisplay: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  quantityNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: -2,
  },
  periodGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  periodButton: {
    minWidth: 80,
  },
  priceSummary: {
    backgroundColor: '#f8f4f2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  priceDetails: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 2,
  },
  subscribeButton: {
    borderRadius: 12,
    marginBottom: 4,
  },

  // Benefits Card
  benefitsCard: {
    backgroundColor: '#fff0eb',
    borderRadius: 16,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#524541',
    marginBottom: 12,
    textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  benefitIcon: {
    fontSize: 18,
  },
  benefitText: {
    flex: 1,
    color: '#524541',
    fontSize: 13,
  },

  // Next Week Badge
  nextWeekBadge: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    marginTop: 8,
  },
  nextWeekText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#1976d2',
  },
});
