import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View as RNView } from 'react-native';
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

export default function OrderScreen() {
  const theme = useTheme();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [loading, setLoading] = useState(true);
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stockData, subData, currentOrder, available] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
      ]);
      setWeeklyStock(stockData);
      setSubscription(subData);
      setCurrentWeekOrder(currentOrder);
      setAvailableEggs(available);
      
      if (currentOrder) {
        setQuantity(currentOrder.quantity);
      } else {
        setQuantity(10);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
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
      setCurrentWeekOrder(currentOrder);
      setAvailableEggs(available);
      
      if (currentOrder) {
        setQuantity(currentOrder.quantity);
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
      setCurrentWeekOrder(currentOrder);
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
    return maxAvailable;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !weeklyStock) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
          {error || 'Failed to load data'}
        </Text>
      </View>
    );
  }

  const maxAvailable = getMaxAvailable();
  const canOrder = maxAvailable >= 10;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Stock Info Card */}
        <Surface style={styles.stockCard} elevation={3}>
          <RNView style={styles.stockRow}>
            <RNView style={styles.stockItem}>
              <Text style={styles.stockNumber}>{availableEggs}</Text>
              <Text style={styles.stockLabel}>Available</Text>
            </RNView>
            <RNView style={styles.stockDivider} />
            <RNView style={styles.stockItem}>
              <Text style={styles.stockNumber}>${weeklyStock.pricePerDozen}</Text>
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
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text variant="titleMedium" style={styles.warningText}>
                  Not enough stock available
                </Text>
                <Text variant="bodyMedium" style={styles.warningSubtext}>
                  Try a subscription for guaranteed weekly delivery!
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
                    iconColor={quantity <= 10 ? theme.colors.outlineVariant : theme.colors.primary}
                    onPress={decrementQuantity}
                    disabled={quantity <= 10 || processing}
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
                    iconColor={quantity >= maxAvailable ? theme.colors.outlineVariant : theme.colors.primary}
                    onPress={incrementQuantity}
                    disabled={quantity >= maxAvailable || processing}
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
                  <Text style={styles.priceAmount}>${calculatePrice().toFixed(2)}</Text>
                  <Text style={styles.priceDetails}>
                    {quantity / 10} dozen × ${weeklyStock.pricePerDozen}
                  </Text>
                </RNView>
              </LinearGradient>
            </Card>

            {/* Action Buttons */}
            <Button
              mode="contained"
              onPress={handleBuyNow}
              loading={processing}
              disabled={processing || quantity > maxAvailable}
              style={styles.orderButton}
              contentStyle={styles.orderButtonContent}
              labelStyle={styles.orderButtonLabel}
              buttonColor={theme.colors.primary}
              icon={currentWeekOrder ? "check" : "cart-check"}
            >
              {processing ? 'Processing...' : currentWeekOrder ? 'Update Order' : 'Place Order'}
            </Button>

            {currentWeekOrder && (
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
    paddingTop: 40,
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
