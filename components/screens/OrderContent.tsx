import React, { useState, useEffect } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView } from 'react-native';
import {
  Text,
  Button,
  IconButton,
  useTheme,
  Surface,
} from 'react-native-paper';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);

  // Sync with parent data
  useEffect(() => {
    setCurrentWeekOrder(initialOrder);
    setAvailableEggs(initialAvailable);
    if (initialOrder) {
      setQuantity(initialOrder.quantity);
    } else {
      setQuantity(10);
    }
    // Reset editing state when order changes
    setEditingOrder(false);
  }, [initialOrder, initialAvailable]);

  const handlePlaceOrder = async () => {
    if (!weeklyStock) return;

    setProcessing(true);

    try {
      if (currentWeekOrder) {
        await apiService.updateOrder(currentWeekOrder.id, quantity, weeklyStock.pricePerDozen);
        showSnackbar(t('order.orderUpdated', { count: quantity }));
        setEditingOrder(false);
      } else {
        await apiService.createOrder(quantity, weeklyStock.pricePerDozen);
        showSnackbar(t('order.orderPlaced', { count: quantity }));
      }
      
      onDataChange();
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to place order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = () => {
    setCancelConfirmVisible(true);
  };

  const confirmCancelOrder = async () => {
    if (!currentWeekOrder) return;

    setProcessing(true);

    try {
      await apiService.cancelOrder(currentWeekOrder.id);
      setCancelConfirmVisible(false);
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

  const getWarningInfo = () => {
    if (!canOrder) {
      if (weeklyStock.isSkipped) {
        return {
          icon: '⏭️',
          message: t('dashboard.weekSkipped'),
          subtitle: subscription ? t('dashboard.weekSkippedDesc') : t('dashboard.weekSkippedDescNoSub'),
        };
      }
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
  
  // Show form when: can order AND (no order exists OR editing unpaid order)
  const showForm = canOrder && (!currentWeekOrder || (editingOrder && !currentWeekOrder.isPaid));
  
  // Show order card when: order exists AND not editing
  const showOrderCard = currentWeekOrder && !editingOrder;

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

      {/* Eggs Available Badge - only when no order */}
      {canOrder && !currentWeekOrder && (
        <Surface style={styles.availableBadge} elevation={2}>
          <Text style={styles.availableNumber}>{availableEggs}</Text>
          <Text style={styles.availableLabel}>{t('dashboard.eggsAvailable')}</Text>
        </Surface>
      )}

      {/* Hero Section - When order exists and not editing */}
      {showOrderCard && (
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

      {/* Active Order Card - Same style as Subscription Card */}
      {showOrderCard && (
        <Surface style={styles.orderDetailsCard} elevation={2}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderIcon}>
              <Text style={styles.cardHeaderIconText}>🛒</Text>
            </View>
            <Text style={styles.cardHeaderTitle}>{t('order.activeOrder')}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('order.quantity')}</Text>
            <Text style={styles.detailValue}>{currentWeekOrder.quantity} {t('common.eggs')}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('order.paidOn')}</Text>
            <Text style={styles.detailValue}>
              {currentWeekOrder.payment_submitted_at 
                ? new Date(currentWeekOrder.payment_submitted_at).toLocaleDateString()
                : t('order.notPaidYet')}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('order.totalPrice')}</Text>
            <Text style={styles.detailValue}>{currentWeekOrder.total.toFixed(0)} {t('common.rsd')}</Text>
          </View>

          {/* Modify/Cancel Buttons - Only show if NOT paid */}
          {!currentWeekOrder.isPaid && (
            <View style={styles.actionRow}>
              <Button
                mode="outlined"
                onPress={() => setEditingOrder(true)}
                icon="pencil"
                style={styles.actionButton}
                compact
              >
                {t('common.modify')}
              </Button>
              <Button
                mode="outlined"
                onPress={handleCancelOrder}
                disabled={processing}
                loading={processing}
                textColor={theme.colors.error}
                icon="close-circle-outline"
                style={styles.actionButton}
                compact
              >
                {t('common.cancel')}
              </Button>
            </View>
          )}
        </Surface>
      )}

      {/* Order Form - Show when placing new order or editing */}
      {showForm && (
        <Surface style={styles.orderCard} elevation={2}>
          <Text style={styles.formTitle}>
            {editingOrder ? t('order.updateOrder') : t('order.placeOrder')}
          </Text>

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
            onPress={handlePlaceOrder}
            loading={processing}
            disabled={processing || quantity > maxAvailable}
            style={styles.submitButton}
            buttonColor={theme.colors.primary}
            icon={editingOrder ? "check" : "cart-check"}
          >
            {editingOrder ? t('order.updateOrder') : t('order.placeOrder')}
          </Button>

          {editingOrder && (
            <Button
              mode="text"
              onPress={() => {
                setEditingOrder(false);
                setQuantity(currentWeekOrder.quantity);
              }}
              disabled={processing}
            >
              {t('subscription.cancelChanges')}
            </Button>
          )}
        </Surface>
      )}

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        visible={cancelConfirmVisible}
        onDismiss={() => setCancelConfirmVisible(false)}
        onConfirm={confirmCancelOrder}
        isLoading={processing}
        title={t('order.cancelOrderTitle')}
        message={t('order.cancelOrderMessage')}
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
  
  // Order Details Card (same style as Subscription Card)
  orderDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
    backgroundColor: '#ffe4d6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderIconText: {
    fontSize: 18,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },

  // Order Form Card
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
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
  submitButton: {
    borderRadius: 12,
    marginBottom: 8,
  },
});
