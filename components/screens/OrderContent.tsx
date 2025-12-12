import React, { useState, useEffect } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView, Dimensions } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  useTheme,
  Surface,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';

const HORIZONTAL_PADDING = 16;

interface OrderContentProps {
  weeklyStock: WeeklyStock;
  subscription: any;
  currentWeekOrder: any;
  availableEggs: number;
  refreshing: boolean;
  onRefresh: () => void;
  onDataChange: () => void;
  showSnackbar: (message: string, type?: 'success' | 'error') => void;
}

export default function OrderContent({
  weeklyStock,
  subscription,
  currentWeekOrder: initialOrder,
  availableEggs: initialAvailable,
  refreshing,
  onRefresh,
  onDataChange,
  showSnackbar,
}: OrderContentProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  
  // Local state for immediate UI updates
  const [currentWeekOrder, setCurrentWeekOrder] = useState(initialOrder);
  const [availableEggs, setAvailableEggs] = useState(initialAvailable);
  const [quantity, setQuantity] = useState(initialOrder?.quantity || 10);
  const [processing, setProcessing] = useState(false);

  // Sync with parent data
  useEffect(() => {
    setCurrentWeekOrder(initialOrder);
    setAvailableEggs(initialAvailable);
    if (initialOrder) {
      setQuantity(initialOrder.quantity);
    } else {
      setQuantity(10);
    }
  }, [initialOrder, initialAvailable]);

  const handleBuyNow = async () => {
    if (!weeklyStock) return;

    setProcessing(true);

    try {
      if (currentWeekOrder) {
        await apiService.updateOrder(currentWeekOrder.id, quantity, weeklyStock.pricePerDozen);
        showSnackbar(t('order.orderUpdated', { count: quantity }));
      } else {
        await apiService.createOrder(quantity, weeklyStock.pricePerDozen);
        showSnackbar(t('order.orderPlaced', { count: quantity }));
      }
      
      onDataChange(); // Trigger parent to reload data
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to place order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentWeekOrder) return;

    setProcessing(true);

    try {
      await apiService.cancelOrder(currentWeekOrder.id);
      showSnackbar(t('order.orderCancelled'));
      onDataChange();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to cancel order', 'error');
    } finally {
      setProcessing(false);
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

  const maxAvailable = getMaxAvailable();
  const canOrder = maxAvailable >= 10 && weeklyStock.isOrderingOpen;
  const stockNotSetup = !weeklyStock.isOrderingOpen && !weeklyStock.allOrdersDelivered;
  const ordersDelivered = weeklyStock.allOrdersDelivered;
  const isLocked = currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted;

  const getWarningInfo = () => {
    if (!canOrder) {
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

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#ff6b35']} tintColor="#ff6b35" />}
    >
      {/* Warning Section */}
      {warningInfo && (
        <View style={styles.warningSection}>
          <Text style={styles.warningIcon}>{warningInfo.icon}</Text>
          <Text style={styles.warningTitle}>{warningInfo.message}</Text>
          <Text style={styles.warningSubtitle}>{warningInfo.subtitle}</Text>
        </View>
      )}

      {/* Low Season Notice */}
      {weeklyStock.isLowSeason && canOrder && !currentWeekOrder && (
        <Surface style={styles.lowSeasonBadge} elevation={1}>
          <Text style={styles.lowSeasonText}>🐔 {t('order.lowSeasonNotice', { cap: weeklyStock.lowSeasonOrderCap })}</Text>
        </Surface>
      )}

      {/* Eggs Available Badge */}
      {canOrder && !currentWeekOrder && (
        <Surface style={styles.availableBadge} elevation={2}>
          <Text style={styles.availableNumber}>{availableEggs}</Text>
          <Text style={styles.availableLabel}>{t('dashboard.eggsAvailable')}</Text>
        </Surface>
      )}

      {/* Hero Section - When order exists */}
      {currentWeekOrder && (
        <View style={styles.heroSection}>
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
        </View>
      )}

      {/* Order Form */}
      {canOrder && !isLocked && (
        <Surface style={styles.orderCard} elevation={2}>
          <View style={styles.quantityRow}>
            <IconButton
              icon="minus-circle"
              size={40}
              iconColor={quantity <= 10 ? theme.colors.outlineVariant : theme.colors.primary}
              onPress={decrementQuantity}
              disabled={quantity <= 10 || processing}
            />
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityNumber}>{quantity}</Text>
              <Text style={styles.quantityLabel}>{t('common.eggs')}</Text>
            </View>
            <IconButton
              icon="plus-circle"
              size={40}
              iconColor={quantity >= maxAvailable ? theme.colors.outlineVariant : theme.colors.primary}
              onPress={incrementQuantity}
              disabled={quantity >= maxAvailable || processing}
            />
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t('order.totalPrice')}</Text>
            <Text style={styles.priceAmount}>{calculatePrice().toFixed(0)} {t('common.rsd')}</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleBuyNow}
            loading={processing}
            disabled={processing || quantity > maxAvailable}
            style={styles.actionButton}
            buttonColor={theme.colors.primary}
            icon={currentWeekOrder ? "check" : "cart-check"}
          >
            {currentWeekOrder ? t('order.updateOrder') : t('order.placeOrder')}
          </Button>

          {currentWeekOrder && (
            <Button
              mode="text"
              onPress={handleCancelOrder}
              disabled={processing}
              textColor={theme.colors.error}
              icon="close-circle-outline"
              compact
            >
              {t('order.cancelOrder')}
            </Button>
          )}
        </Surface>
      )}

      {/* Order Summary - When locked */}
      {currentWeekOrder && isLocked && (
        <Surface style={styles.summaryCard} elevation={2}>
          <View style={styles.summaryQuantityDisplay}>
            <Text style={styles.summaryQuantityNumber}>{currentWeekOrder.quantity}</Text>
            <Text style={styles.summaryQuantityLabel}>{t('common.eggs')}</Text>
          </View>
          
          {!currentWeekOrder.isPaid && (
            <View style={styles.summaryPriceRow}>
              <Text style={styles.summaryPriceLabel}>{t('order.totalPrice')}</Text>
              <Text style={styles.summaryPriceValue}>{currentWeekOrder.total.toFixed(0)} {t('common.rsd')}</Text>
            </View>
          )}
        </Surface>
      )}
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
    justifyContent: 'center',
  },
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
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryQuantityDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryQuantityNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  summaryQuantityLabel: {
    fontSize: 18,
    color: '#666',
    marginTop: -8,
  },
  summaryPriceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f4f2',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  summaryPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
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

