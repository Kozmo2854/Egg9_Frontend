import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View as RNView, NativeSyntheticEvent, NativeScrollEvent, RefreshControl } from 'react-native';
import { View } from '@/components/Themed';
import {
  Card,
  Text,
  Button,
  IconButton,
  ActivityIndicator,
  Snackbar,
  Chip,
  useTheme,
  Surface,
  SegmentedButtons,
  Dialog,
  Portal,
  Paragraph,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { useScrollContext } from '@/contexts/ScrollContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { setScrollY } = useScrollContext();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [subscriptionQuantity, setSubscriptionQuantity] = useState(10);
  const [subscriptionPeriod, setSubscriptionPeriod] = useState(2); // Default 2 weeks
  const [nextWeekConfirmation, setNextWeekConfirmation] = useState<{
    show: boolean;
    nextWeekStart: string;
    nextWeekEnd: string;
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
      const [stockData, subData] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
      ]);
      setWeeklyStock(stockData);
      setSubscription(subData);
      
      if (subData) {
        setSubscriptionQuantity(subData.quantity);
        setSubscriptionPeriod(subData.period || 4);
      }
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
      setSuccessMessage(
        startNextWeek 
          ? `Subscription created! Starting next week: ${subscriptionQuantity} eggs per week for ${subscriptionPeriod} weeks.`
          : `Subscription created! ${subscriptionQuantity} eggs per week for ${subscriptionPeriod} weeks.`
      );
      setEditingSubscription(false);
      setNextWeekConfirmation(null);
      
      const updatedStock = await apiService.getWeeklyStock();
      setWeeklyStock(updatedStock);
    } catch (err: any) {
      // Handle insufficient stock error with next week confirmation dialog
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

  const handleUpdateSubscription = async (startNextWeek: boolean = false) => {
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
      setSuccessMessage(
        startNextWeek 
          ? `Subscription updated! Starting next week: ${subscriptionQuantity} eggs per week for ${subscriptionPeriod} weeks.`
          : `Subscription updated! ${subscriptionQuantity} eggs per week for ${subscriptionPeriod} weeks.`
      );
      setEditingSubscription(false);
      setNextWeekConfirmation(null);
      
      const updatedStock = await apiService.getWeeklyStock();
      setWeeklyStock(updatedStock);
    } catch (err: any) {
      // Handle insufficient stock error with next week confirmation dialog
      if (err.statusCode === 409 && err.data?.message === 'insufficient_stock_this_week') {
        setNextWeekConfirmation({
          show: true,
          nextWeekStart: err.data.nextWeekStart,
          nextWeekEnd: err.data.nextWeekEnd,
        });
      } else {
        const errorMsg = err?.message || err?.toString() || 'Failed to update subscription';
        setErrorMessage(typeof errorMsg === 'string' ? errorMsg : 'Failed to update subscription');
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
      setSuccessMessage('Subscription cancelled');
      setEditingSubscription(false);
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
    return <LoadingView message="Loading subscription..." />;
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
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollY(e.nativeEvent.contentOffset.y)}
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
        {/* Header with Gradient */}
        <LinearGradient
          colors={[theme.colors.tertiary, theme.colors.tertiaryContainer]}
          style={styles.header}
        >
          <Text style={styles.headerIcon}>📅</Text>
          <Text style={styles.headerTitle}>Weekly Subscription</Text>
          <Text style={styles.headerSubtitle}>Fresh eggs delivered every week</Text>
        </LinearGradient>

        {/* Current Subscription Status */}
        {subscription && !editingSubscription && (
          <Card style={styles.card} mode="elevated">
            <LinearGradient
              colors={[theme.colors.primaryContainer, theme.colors.surfaceVariant]}
              style={styles.cardGradient}
            >
              <RNView style={styles.cardContent}>
                <RNView style={styles.activeHeader}>
                  <RNView style={styles.activeIconCircle}>
                    <Text style={styles.activeIcon}>✓</Text>
                  </RNView>
                  <Text variant="headlineSmall" style={styles.activeTitle}>
                    Active Subscription
                  </Text>
                </RNView>

                <Surface style={styles.detailsCard} elevation={2}>
                  <RNView style={styles.detailRow}>
                    <Text variant="bodyLarge" style={styles.detailLabel}>Weekly Delivery:</Text>
                    <Text variant="headlineSmall" style={styles.detailValue}>
                      {subscription.quantity} eggs
                    </Text>
                  </RNView>
                  <RNView style={styles.detailRow}>
                    <Text variant="bodyLarge" style={styles.detailLabel}>Duration:</Text>
                    <Text variant="headlineSmall" style={styles.detailValue}>
                      {subscription.period} weeks
                    </Text>
                  </RNView>
                  <RNView style={styles.detailRow}>
                    <Text variant="bodyLarge" style={styles.detailLabel}>Weekly Price:</Text>
                    <Text variant="headlineSmall" style={styles.detailValue}>
                      {calculateWeeklyPrice().toFixed(0)} RSD
                    </Text>
                  </RNView>
                  <RNView style={[styles.detailRow, styles.totalRow]}>
                    <Text variant="titleMedium" style={styles.totalLabel}>Total:</Text>
                    <Text variant="headlineMedium" style={styles.totalValue}>
                      {calculateTotalPrice().toFixed(0)} RSD
                    </Text>
                  </RNView>
                </Surface>

                <Button
                  mode="outlined"
                  onPress={() => setEditingSubscription(true)}
                  style={styles.button}
                  icon="pencil"
                >
                  Modify Subscription
                </Button>
                <Button
                  mode="text"
                  onPress={handleCancelSubscription}
                  disabled={processing}
                  loading={processing}
                  style={styles.button}
                  textColor={theme.colors.error}
                  icon="close-circle-outline"
                >
                  Cancel Subscription
                </Button>
              </RNView>
            </LinearGradient>
          </Card>
        )}

        {/* Subscription Form */}
        {(!subscription || editingSubscription) && (
          <>
            <Card style={styles.card} mode="elevated">
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  {subscription ? 'Edit Subscription' : 'Create Subscription'}
                </Text>
                
                {/* Quantity Selector */}
                <Text variant="titleMedium" style={styles.sectionLabel}>Weekly Quantity</Text>
                <RNView style={styles.quantityContainer}>
                  <IconButton
                    icon="minus-circle"
                    size={48}
                    iconColor={subscriptionQuantity <= 10 ? theme.colors.outlineVariant : theme.colors.tertiary}
                    onPress={decrementSubscriptionQuantity}
                    disabled={subscriptionQuantity <= 10 || processing}
                  />
                  
                  <Surface style={styles.quantityDisplay} elevation={2}>
                    <Text variant="displayMedium" style={styles.quantityNumber}>
                      {subscriptionQuantity}
                    </Text>
                    <Text variant="bodyLarge" style={styles.quantityLabel}>
                      eggs/week
                    </Text>
                    <Chip icon="egg" mode="outlined" style={styles.dozenChip}>
                      {subscriptionQuantity / 10} dozen
                    </Chip>
                  </Surface>
                  
                  <IconButton
                    icon="plus-circle"
                    size={48}
                    iconColor={subscriptionQuantity >= 30 ? theme.colors.outlineVariant : theme.colors.tertiary}
                    onPress={incrementSubscriptionQuantity}
                    disabled={subscriptionQuantity >= 30 || processing}
                  />
                </RNView>

                <Text variant="bodySmall" style={styles.maxText}>
                  Maximum: 30 eggs per week
                </Text>

                {/* Period Selector */}
                <Text variant="titleMedium" style={styles.sectionLabel}>Subscription Duration</Text>
                <Surface style={styles.periodContainer} elevation={1}>
                  <RNView style={styles.periodHeader}>
                    <Text variant="bodyMedium" style={styles.periodHeaderText}>Selected:</Text>
                    <Chip mode="flat" style={styles.periodChip}>
                      {subscriptionPeriod} {subscriptionPeriod === 1 ? 'week' : 'weeks'}
                    </Chip>
                  </RNView>
                  <RNView style={styles.periodGrid}>
                    {[2, 3, 4].map((weeks) => (
                      <Button
                        key={weeks}
                        mode={subscriptionPeriod === weeks ? 'contained' : 'outlined'}
                        onPress={() => setSubscriptionPeriod(weeks)}
                        style={styles.periodButton}
                        buttonColor={subscriptionPeriod === weeks ? theme.colors.primary : 'transparent'}
                        textColor={subscriptionPeriod === weeks ? '#fff' : theme.colors.primary}
                        compact
                      >
                        {weeks} {weeks === 1 ? 'week' : 'weeks'}
                      </Button>
                    ))}
                  </RNView>
                </Surface>
                
                <Text variant="bodySmall" style={styles.periodNote}>
                  Subscribe for 2-4 weeks (for single week, use one-time order)
                </Text>
              </Card.Content>
            </Card>

            {/* Price Card */}
            <Card style={styles.priceCard} mode="elevated">
              <LinearGradient
                colors={[theme.colors.tertiary, theme.colors.tertiaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.priceGradient}
              >
                <RNView style={styles.priceContent}>
                  <Text style={styles.priceLabel}>Subscription Summary</Text>
                  
                  <RNView style={styles.priceSummary}>
                    <RNView style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Weekly Price:</Text>
                      <Text style={styles.summaryValue}>{calculateWeeklyPrice().toFixed(0)} RSD</Text>
                    </RNView>
                    <RNView style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Duration:</Text>
                      <Text style={styles.summaryValue}>{subscriptionPeriod} weeks</Text>
                    </RNView>
                  </RNView>
                  
                  <Text style={styles.priceTotalLabel}>Total Price</Text>
                  <Text style={styles.priceAmount}>{calculateTotalPrice().toFixed(0)} RSD</Text>
                  <Text style={styles.priceDetails}>
                    {subscriptionQuantity} eggs × {subscriptionPeriod} weeks
                  </Text>
                </RNView>
              </LinearGradient>
            </Card>

            {/* Action Buttons */}
            {subscription ? (
              <>
                <Button
                  mode="contained"
                  onPress={() => handleUpdateSubscription()}
                  loading={processing}
                  disabled={processing}
                  style={styles.subscribeButton}
                  contentStyle={styles.subscribeButtonContent}
                  labelStyle={styles.subscribeButtonLabel}
                  buttonColor={theme.colors.tertiary}
                  icon="check"
                >
                  Update Subscription
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setEditingSubscription(false);
                    setSubscriptionQuantity(subscription.quantity);
                    setSubscriptionPeriod(subscription.period || 4);
                  }}
                  disabled={processing}
                  style={styles.button}
                  icon="close"
                >
                  Cancel Changes
                </Button>
              </>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleSubscribe()}
                loading={processing}
                disabled={processing}
                style={styles.subscribeButton}
                contentStyle={styles.subscribeButtonContent}
                labelStyle={styles.subscribeButtonLabel}
                buttonColor={theme.colors.tertiary}
                icon="calendar-check"
              >
                {processing ? 'Processing...' : 'Subscribe Now'}
              </Button>
            )}
          </>
        )}

        {/* Benefits Card */}
        <Card style={styles.benefitsCard} mode="outlined">
          <Card.Content>
            <Text variant="titleLarge" style={styles.benefitsTitle}>✨ Why Subscribe?</Text>
            
            {[
              { icon: '🎯', text: 'Guaranteed weekly stock - never miss out!' },
              { icon: '📦', text: 'Flexible duration: 2 to 4 weeks' },
              { icon: '🚚', text: 'Automatic delivery scheduling' },
              { icon: '🔄', text: 'Cancel or modify anytime' },
            ].map((benefit, index) => (
              <RNView key={index} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text variant="bodyMedium" style={styles.benefitText}>
                  {benefit.text}
                </Text>
              </RNView>
            ))}
          </Card.Content>
        </Card>
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
        action={{
          label: 'Dismiss',
          onPress: () => setErrorMessage(null),
        }}
        style={{ backgroundColor: theme.colors.error }}
      >
        {errorMessage}
      </Snackbar>

      {/* Confirmation Dialog for Next Week Start */}
      <Portal>
        <Dialog
          visible={!!nextWeekConfirmation?.show}
          onDismiss={() => setNextWeekConfirmation(null)}
        >
          <Dialog.Icon icon="calendar-alert" size={60} />
          <Dialog.Title style={{ textAlign: 'center', fontSize: 20 }}>
            No Stock Available This Week
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ textAlign: 'center', marginBottom: 16, fontSize: 16 }}>
              Unfortunately, there are no eggs left for this week.
            </Paragraph>
            <Paragraph style={{ textAlign: 'center', marginBottom: 12, fontSize: 16, fontWeight: 'bold' }}>
              Would you like to start your subscription from next week instead?
            </Paragraph>
            {nextWeekConfirmation && (
              <Surface style={{ 
                padding: 12, 
                borderRadius: 8, 
                backgroundColor: theme.colors.primaryContainer,
                marginTop: 8 
              }}>
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: 'bold', 
                  color: theme.colors.primary,
                  fontSize: 16 
                }}>
                  📅 Next Week
                </Text>
                <Text style={{ 
                  textAlign: 'center', 
                  fontWeight: '600',
                  color: theme.colors.onPrimaryContainer,
                  marginTop: 4,
                  fontSize: 15
                }}>
                  {new Date(nextWeekConfirmation.nextWeekStart).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })} - {new Date(nextWeekConfirmation.nextWeekEnd).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </Surface>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'space-between', paddingHorizontal: 40 }}>
            <Button 
              onPress={() => setNextWeekConfirmation(null)}
              mode="outlined"
              style={{ minWidth: 100, marginLeft: 16 }}
            >
              No
            </Button>
            <Button 
              onPress={() => subscription ? handleUpdateSubscription(true) : handleSubscribe(true)} 
              mode="contained"
              style={{ minWidth: 100, marginRight: 16 }}
              icon="check"
            >
              Yes
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
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
  header: {
    padding: 32,
    paddingTop: 70,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
  },
  cardContent: {
    gap: 16,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  activeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIcon: {
    fontSize: 28,
    color: '#4ecdc4',
  },
  activeTitle: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 4,
  },
  detailLabel: {
    color: '#666',
    flexShrink: 0,
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#2d3748',
    flexShrink: 1,
    textAlign: 'right',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  button: {
    borderRadius: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityDisplay: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 160,
    marginHorizontal: 8,
  },
  quantityNumber: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  quantityLabel: {
    color: '#666',
    marginTop: 4,
    marginBottom: 8,
  },
  dozenChip: {
    marginTop: 4,
  },
  maxText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  periodContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodHeaderText: {
    fontWeight: '600',
    color: '#2d3748',
  },
  periodChip: {
    backgroundColor: '#4ecdc4',
    minWidth: 80,
  },
  periodGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  periodButton: {
    flex: 1,
  },
  periodNote: {
    textAlign: 'center',
    color: '#666',
  },
  priceCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  priceGradient: {
    padding: 28,
  },
  priceContent: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 18,
    color: '#2d3748',
    opacity: 0.85,
    marginBottom: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    flexShrink: 0,
  },
  summaryValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: 'bold',
    flexShrink: 1,
    textAlign: 'right',
  },
  priceTotalLabel: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  priceDetails: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.8,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  subscribeButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#95e1d3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonContent: {
    paddingVertical: 12,
  },
  subscribeButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderColor: '#e0d4d0',
    borderWidth: 2,
  },
  benefitsTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitText: {
    flex: 1,
    color: '#524541',
  },
});
