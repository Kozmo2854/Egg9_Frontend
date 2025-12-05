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
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { useScrollContext } from '@/contexts/ScrollContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';

export default function OrderScreen() {
  const theme = useTheme();
  const { setScrollY } = useScrollContext();
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
      const [stockData, subData, currentOrder, available] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
      ]);
      setWeeklyStock(stockData);
      setSubscription(subData);
      // Only show one-time orders (not subscription orders) on Order tab
      const oneTimeOrder = currentOrder && !currentOrder.subscriptionId ? currentOrder : null;
      setCurrentWeekOrder(oneTimeOrder);
      setAvailableEggs(available);
      
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

  const onRefresh = useCallback(() => {
    loadData(true);
  }, []);

  const handleBuyNow = async () => {
    if (!weeklyStock) return;

    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (currentWeekOrder) {
        await apiService.updateOrder(currentWeekOrder.id, quantity, weeklyStock.pricePerDozen);
        setSuccessMessage(`Order updated! ${quantity} eggs for this week.`);
      } else {
        await apiService.createOrder(quantity, weeklyStock.pricePerDozen);
        setSuccessMessage(`Order placed! ${quantity} eggs ordered.`);
      }
      
      const [updatedStock, subData, currentOrder, available] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
      ]);
      setWeeklyStock(updatedStock);
      setSubscription(subData);
      // Only show one-time orders (not subscription orders) on Order tab
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
      setSuccessMessage('Order cancelled successfully');
      
      const [updatedStock, subData, currentOrder, available] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
      ]);
      setWeeklyStock(updatedStock);
      setSubscription(subData);
      // Only show one-time orders (not subscription orders) on Order tab
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

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const incrementQuantity = () => {
    let maxAvailable = availableEggs;
    if (currentWeekOrder) {
      maxAvailable += currentWeekOrder.quantity;
    }
    
    // Apply low season cap if applicable
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
    
    // Apply low season cap if applicable
    const lowSeasonCap = weeklyStock?.lowSeasonOrderCap;
    if (lowSeasonCap !== null && lowSeasonCap !== undefined) {
      maxAvailable = Math.min(maxAvailable, lowSeasonCap);
    }
    
    return maxAvailable;
  };

  if (loading) {
    return <LoadingView message="Loading order..." />;
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
  const orderingClosed = !weeklyStock.isOrderingOpen;
  const stockNotSetup = !weeklyStock.isOrderingOpen && !weeklyStock.allOrdersDelivered;
  const ordersDelivered = weeklyStock.allOrdersDelivered;

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
          colors={[theme.colors.secondary, theme.colors.secondaryContainer]}
          style={styles.header}
        >
          <Text style={styles.headerIcon}>🛒</Text>
          <Text style={styles.headerTitle}>Order This Week</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(weeklyStock.weekStart)} - {formatDate(weeklyStock.weekEnd)}
          </Text>
        </LinearGradient>

        {/* Low Season Notice */}
        {weeklyStock.isLowSeason && (
          <Surface style={[styles.stockCard, { backgroundColor: '#fff3e0', marginBottom: 8 }]} elevation={2}>
            <RNView style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>🐔</Text>
              <Text style={{ color: '#e65100', fontWeight: '500' }}>
                Our chickens are resting – orders up to {weeklyStock.lowSeasonOrderCap} eggs
              </Text>
            </RNView>
          </Surface>
        )}

        {/* Stock Info Card */}
        <Surface style={styles.stockCard} elevation={3}>
          <RNView style={styles.stockRow}>
            <RNView style={styles.stockItem}>
              <Text style={styles.stockNumber}>{availableEggs}</Text>
              <Text style={styles.stockLabel}>Available</Text>
            </RNView>
            <RNView style={styles.stockDivider} />
            <RNView style={styles.stockItem}>
              <Text style={styles.stockNumber}>{weeklyStock.pricePerDozen.toFixed(0)} RSD</Text>
              <Text style={styles.stockLabel}>Per Dozen</Text>
            </RNView>
          </RNView>
        </Surface>

        {!canOrder ? (
          <Card style={styles.warningCard} mode="elevated">
            <LinearGradient
              colors={[theme.colors.errorContainer, '#ffebee']}
              style={styles.warningGradient}
            >
              <RNView style={styles.warningContent}>
                <Text style={styles.warningIcon}>
                  {stockNotSetup ? '📦' : (ordersDelivered ? '✅' : '⚠️')}
                </Text>
                <Text variant="titleMedium" style={styles.warningText}>
                  {stockNotSetup 
                    ? 'Stock Not Set Up Yet' 
                    : (ordersDelivered ? 'Orders Delivered' : 'Not Enough Stock Available')}
                </Text>
                <Text variant="bodyMedium" style={styles.warningSubtext}>
                  {stockNotSetup 
                    ? 'Admin is preparing this week\'s inventory. Check back soon!' 
                    : (ordersDelivered 
                      ? 'All orders have been delivered. New week starts Monday!' 
                      : 'Try a subscription for guaranteed weekly delivery!')}
                </Text>
              </RNView>
            </LinearGradient>
          </Card>
        ) : (
          <>
            {/* Quantity Selector */}
            <Card style={styles.quantityCard} mode="elevated">
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>Select Quantity</Text>
                
                <RNView style={styles.quantityContainer}>
                  <IconButton
                    icon="minus-circle"
                    size={48}
                    iconColor={quantity <= 10 || currentWeekOrder?.isPaid ? theme.colors.outlineVariant : theme.colors.primary}
                    onPress={decrementQuantity}
                    disabled={quantity <= 10 || processing || currentWeekOrder?.isPaid}
                    style={styles.quantityButton}
                  />
                  
                  <Surface style={styles.quantityDisplay} elevation={2}>
                    <Text variant="displayMedium" style={styles.quantityNumber}>
                      {quantity}
                    </Text>
                    <Text variant="bodyLarge" style={styles.quantityLabel}>
                      eggs
                    </Text>
                    <Chip icon="egg" mode="outlined" style={styles.dozenChip}>
                      {quantity / 10} dozen
                    </Chip>
                  </Surface>
                  
                  <IconButton
                    icon="plus-circle"
                    size={48}
                    iconColor={quantity >= maxAvailable || currentWeekOrder?.isPaid ? theme.colors.outlineVariant : theme.colors.primary}
                    onPress={incrementQuantity}
                    disabled={quantity >= maxAvailable || processing || currentWeekOrder?.isPaid}
                    style={styles.quantityButton}
                  />
                </RNView>

                <Text variant="bodySmall" style={styles.maxText}>
                  Maximum available: {maxAvailable} eggs
                </Text>
              </Card.Content>
            </Card>

            {/* Price Card */}
            <Card style={styles.priceCard} mode="elevated">
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.priceGradient}
              >
                <RNView style={styles.priceContent}>
                  <Text style={styles.priceLabel}>Total Price</Text>
                  <Text style={styles.priceAmount}>{calculatePrice().toFixed(0)} RSD</Text>
                  <Text style={styles.priceDetails}>
                    {quantity / 10} dozen × {weeklyStock.pricePerDozen.toFixed(0)} RSD
                  </Text>
                </RNView>
              </LinearGradient>
            </Card>

            {/* Action Buttons */}
            {/* Order Status Badge */}
            {currentWeekOrder && (
              <RNView style={styles.statusContainer}>
                {currentWeekOrder.status === 'pending' && !currentWeekOrder.isPaid && (
                  <Chip icon="clock-outline" mode="flat" style={styles.statusPending}>
                    ⏳ Pending Payment
                  </Chip>
                )}
                {currentWeekOrder.status === 'pending' && currentWeekOrder.isPaid && (
                  <Chip icon="check-circle" mode="flat" style={styles.statusPaid}>
                    ✓ Payment Confirmed
                  </Chip>
                )}
                {currentWeekOrder.status === 'completed' && (
                  <Chip icon="package-check" mode="flat" style={styles.statusCompleted}>
                    📦 Delivered
                  </Chip>
                )}
              </RNView>
            )}

            <Button
              mode="contained"
              onPress={handleBuyNow}
              loading={processing}
              disabled={processing || quantity > maxAvailable || currentWeekOrder?.isPaid}
              style={styles.orderButton}
              contentStyle={styles.orderButtonContent}
              labelStyle={styles.orderButtonLabel}
              buttonColor={theme.colors.primary}
              icon={currentWeekOrder ? "check" : "cart-check"}
            >
              {processing ? 'Processing...' : currentWeekOrder?.isPaid ? 'Payment Confirmed - Cannot Update' : currentWeekOrder ? 'Update Order' : 'Place Order'}
            </Button>

            {currentWeekOrder && !currentWeekOrder.isPaid && (
              <Button
                mode="outlined"
                onPress={handleCancelOrder}
                disabled={processing}
                style={styles.cancelButton}
                contentStyle={styles.cancelButtonContent}
                icon="close-circle-outline"
                textColor={theme.colors.error}
              >
                Cancel Order
              </Button>
            )}
          </>
        )}

        {/* Info Note */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Orders must be in increments of 1 dozen (10 eggs)
          </Text>
        </Surface>
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
    marginBottom: 16,
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
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  stockCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  stockLabel: {
    fontSize: 14,
    color: '#666',
  },
  stockDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  warningCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  warningGradient: {
    padding: 24,
  },
  warningContent: {
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  warningText: {
    fontWeight: 'bold',
    color: '#8b0000',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningSubtext: {
    color: '#8b0000',
    textAlign: 'center',
  },
  quantityCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quantityButton: {
    margin: 0,
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
  orderButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  orderButtonContent: {
    paddingVertical: 12,
  },
  orderButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 2,
  },
  cancelButtonContent: {
    paddingVertical: 12,
  },
  statusContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  statusPaid: {
    backgroundColor: '#d4f4f1',
    borderWidth: 1,
    borderColor: '#4ecdc4',
  },
  statusCompleted: {
    backgroundColor: '#e6ffe6',
    borderWidth: 1,
    borderColor: '#66bb6a',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#fff0eb',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    color: '#524541',
  },
});
