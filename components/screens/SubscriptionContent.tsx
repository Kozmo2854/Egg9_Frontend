import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  useTheme,
  Surface,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { WeeklyStock } from '@/types/models';

const HORIZONTAL_PADDING = 16;

interface SubscriptionContentProps {
  weeklyStock: WeeklyStock;
  subscription: any;
  currentWeekSubOrder: any;
  refreshing: boolean;
  onRefresh: () => void;
  onDataChange: () => void;
  showSnackbar: (message: string, type?: 'success' | 'error') => void;
}

export default function SubscriptionContent({
  weeklyStock,
  subscription: initialSubscription,
  currentWeekSubOrder,
  refreshing,
  onRefresh,
  onDataChange,
  showSnackbar,
}: SubscriptionContentProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  
  const [subscription, setSubscription] = useState(initialSubscription);
  const [processing, setProcessing] = useState(false);
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(initialSubscription?.quantity || 10);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(initialSubscription?.period || 4);
  const [nextWeekConfirmation, setNextWeekConfirmation] = useState<{
    show: boolean;
    nextWeekStart: string;
    nextWeekEnd: string;
  } | null>(null);
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);

  // Sync with parent data
  useEffect(() => {
    setSubscription(initialSubscription);
    if (initialSubscription) {
      setSubscriptionQuantity(initialSubscription.quantity);
      setSubscriptionPeriod(initialSubscription.period || 4);
    }
  }, [initialSubscription]);

  const handleSubscribe = async (startNextWeek: boolean = false) => {
    setProcessing(true);

    try {
      const sub = await apiService.createSubscription(
        subscriptionQuantity, 
        subscriptionPeriod, 
        startNextWeek
      );
      setSubscription(sub);
      showSnackbar(t('subscription.subscriptionCreated', { quantity: subscriptionQuantity, period: subscriptionPeriod }));
      setNextWeekConfirmation(null);
      onDataChange();
    } catch (err: any) {
      if (err.statusCode === 409 && err.data?.message === 'insufficient_stock_this_week') {
        setNextWeekConfirmation({
          show: true,
          nextWeekStart: err.data.nextWeekStart,
          nextWeekEnd: err.data.nextWeekEnd,
        });
      } else {
        const errorMsg = err?.message || err?.toString() || 'Failed to create subscription';
        showSnackbar(typeof errorMsg === 'string' ? errorMsg : 'Failed to create subscription', 'error');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    setCancelConfirmVisible(true);
  };

  const confirmCancelSubscription = async () => {
    setProcessing(true);

    try {
      await apiService.cancelSubscription();
      setSubscription(null);
      setCancelConfirmVisible(false);
      showSnackbar(t('subscription.subscriptionCancelled'));
      setSubscriptionQuantity(10);
      setSubscriptionPeriod(4);
      onDataChange();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to cancel subscription', 'error');
    } finally {
      setProcessing(false);
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

  const showForm = !subscription && !weeklyStock.isLowSeason;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      {subscription && (
        <View style={styles.heroSection}>
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
        </View>
      )}

      {/* Active Subscription Card */}
      {subscription && (
        <Surface style={styles.subscriptionCard} elevation={2}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Text style={styles.cardHeaderIconText}>✓</Text>
            </View>
            <Text style={styles.cardHeaderTitle}>{t('subscription.activeSubscription')}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('subscription.weeklyDelivery')}</Text>
            <Text style={styles.detailValue}>{subscription.quantity} {t('common.eggs')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('subscription.duration')}</Text>
            <Text style={styles.detailValue}>{subscription.weeksRemaining || subscription.period} {t('dashboard.weeksLeft')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('subscription.weeklyPrice')}</Text>
            <Text style={styles.detailValue}>{calculateWeeklyPrice().toFixed(0)} {t('common.rsd')}</Text>
          </View>

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

      {/* Low Season Card */}
      {weeklyStock.isLowSeason && !subscription && (
        <Surface style={styles.lowSeasonCard} elevation={2}>
          <View style={styles.cardHeader}>
            <Text style={styles.lowSeasonIcon}>🐔</Text>
            <Text style={styles.lowSeasonTitle}>{t('subscription.subscriptionsPaused')}</Text>
          </View>
          <Text style={styles.lowSeasonCardText}>{t('subscription.lowSeasonMessage')}</Text>
          <Text style={[styles.lowSeasonCardText, { marginTop: 8, fontWeight: '500' }]}>
            {t('subscription.canStillOrder', { cap: weeklyStock.lowSeasonOrderCap || 20 })}
          </Text>
        </Surface>
      )}

      {/* Subscription Form */}
      {showForm && (
        <Surface style={styles.formCard} elevation={2}>
          <Text style={styles.formTitle}>
            {t('subscription.createSubscription')}
          </Text>

          <Text style={styles.sectionLabel}>{t('subscription.weeklyQuantity')}</Text>
          <View style={styles.quantityRow}>
            <IconButton
              icon="minus-circle"
              size={36}
              iconColor={subscriptionQuantity <= 10 ? theme.colors.outlineVariant : theme.colors.tertiary}
              onPress={decrementSubscriptionQuantity}
              disabled={subscriptionQuantity <= 10 || processing}
            />
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityNumber}>{subscriptionQuantity}</Text>
              <Text style={styles.quantityLabel}>{t('common.eggs')}</Text>
            </View>
            <IconButton
              icon="plus-circle"
              size={36}
              iconColor={subscriptionQuantity >= 30 ? theme.colors.outlineVariant : theme.colors.tertiary}
              onPress={incrementSubscriptionQuantity}
              disabled={subscriptionQuantity >= 30 || processing}
            />
          </View>

          <Text style={styles.sectionLabel}>{t('subscription.subscriptionDuration')}</Text>
          <View style={styles.periodGrid}>
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
          </View>

          <View style={styles.priceSummary}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('subscription.totalPrice')}</Text>
              <Text style={styles.priceAmount}>{calculateTotalPrice().toFixed(0)} {t('common.rsd')}</Text>
            </View>
            <Text style={styles.priceDetails}>
              {subscriptionQuantity} {t('common.eggs')} × {subscriptionPeriod} {t('common.weeks')}
            </Text>
          </View>

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

      {/* Benefits */}
      {!subscription && !weeklyStock.isLowSeason && (
        <Surface style={styles.benefitsCard} elevation={1}>
          <Text style={styles.benefitsTitle}>{t('subscription.whySubscribe')}</Text>
          {[
            { icon: '🎯', text: t('subscription.benefit1') },
            { icon: '📦', text: t('subscription.benefit2') },
            { icon: '🔄', text: t('subscription.benefit4') },
          ].map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </Surface>
      )}

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

      {/* Cancel Subscription Confirmation Dialog */}
      <ConfirmDialog
        visible={cancelConfirmVisible}
        onDismiss={() => setCancelConfirmVisible(false)}
        onConfirm={confirmCancelSubscription}
        isLoading={processing}
        title={t('subscription.cancelSubscriptionTitle')}
        message={t('subscription.cancelSubscriptionMessage')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5f1',
  },
  content: {
    flexGrow: 1,
    padding: HORIZONTAL_PADDING,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'center',
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

