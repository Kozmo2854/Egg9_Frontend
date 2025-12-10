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
  Dialog,
  Portal,
} from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { useScrollContext } from '@/contexts/ScrollContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';

export default function OrderScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
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
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
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
      const [stockData, subData, currentOrder, available, settings] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getSubscription(),
        apiService.getCurrentWeekOrder(),
        apiService.getAvailableEggsForUser(),
        apiService.getAppSettings(),
      ]);
      setWeeklyStock(stockData);
      setSubscription(subData);
      // Only show one-time orders (not subscription orders) on Order tab
      const oneTimeOrder = currentOrder && !currentOrder.subscriptionId ? currentOrder : null;
      setCurrentWeekOrder(oneTimeOrder);
      setAvailableEggs(available);
      setPaymentSettings(settings.paymentSettings);
      
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

  /** Generates NBS IPS format QR code for Serbian payment system */
  const generateNBSIPSQRCode = () => {
    if (!paymentSettings || !currentWeekOrder) return '';
    
    const amount = currentWeekOrder.total;
    const amountFormatted = `RSD${amount.toFixed(2).replace('.', ',')}`;
    const bankAccountFormatted = paymentSettings.bankAccountNumber.replace(/-/g, '');
    
    return `K:PR|V:01|C:1|R:${bankAccountFormatted}|N:${paymentSettings.recipientName}|I:${amountFormatted}|SF:${paymentSettings.paymentCode}|S:${paymentSettings.paymentPurpose}`;
  };

  const handleMarkPaymentSubmitted = async () => {
    if (!currentWeekOrder) return;
    
    try {
      setMarkingPayment(true);
      await apiService.markOrderPaymentSubmitted(currentWeekOrder.id);
      await loadData();
      setPaymentDialogVisible(false);
      setSuccessMessage(t('payment.paymentMarked'));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark payment');
    } finally {
      setMarkingPayment(false);
    }
  };

  if (loading) {
    return <LoadingView message={t('order.loadingOrder')} />;
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
          <Text style={styles.headerTitle}>{t('order.title')}</Text>
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
                {t('order.lowSeasonNotice', { cap: weeklyStock.lowSeasonOrderCap })}
              </Text>
            </RNView>
          </Surface>
        )}

        {/* Stock Info Card */}
        <Surface style={styles.stockCard} elevation={3}>
          <RNView style={styles.stockRow}>
            <RNView style={styles.stockItem}>
              <Text style={styles.stockNumber}>{availableEggs}</Text>
              <Text style={styles.stockLabel}>{t('common.available')}</Text>
            </RNView>
            <RNView style={styles.stockDivider} />
            <RNView style={styles.stockItem}>
              <Text style={styles.stockNumber}>{weeklyStock.pricePerDozen.toFixed(0)} {t('common.rsd')}</Text>
              <Text style={styles.stockLabel}>{t('common.perDozen')}</Text>
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
                    ? t('order.stockNotSetUp')
                    : (ordersDelivered ? t('order.ordersDelivered') : t('order.notEnoughStock'))}
                </Text>
                <Text variant="bodyMedium" style={styles.warningSubtext}>
                  {stockNotSetup 
                    ? t('order.stockNotSetUpDesc')
                    : (ordersDelivered 
                      ? t('order.ordersDeliveredDesc')
                      : t('order.notEnoughStockDesc'))}
                </Text>
              </RNView>
            </LinearGradient>
          </Card>
        ) : (
          <>
            {/* Quantity Selector */}
            <Card style={styles.quantityCard} mode="elevated">
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>{t('order.selectQuantity')}</Text>
                
                <RNView style={styles.quantityContainer}>
                  <IconButton
                    icon="minus-circle"
                    size={48}
                    iconColor={quantity <= 10 || currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted ? theme.colors.outlineVariant : theme.colors.primary}
                    onPress={decrementQuantity}
                    disabled={quantity <= 10 || processing || currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted}
                    style={styles.quantityButton}
                  />
                  
                  <Surface style={styles.quantityDisplay} elevation={2}>
                    <Text variant="displayMedium" style={styles.quantityNumber}>
                      {quantity}
                    </Text>
                    <Text variant="bodyLarge" style={styles.quantityLabel}>
                      {t('common.eggs')}
                    </Text>
                    <Chip icon="egg" mode="outlined" style={styles.dozenChip}>
                      {quantity / 10} dozen
                    </Chip>
                  </Surface>
                  
                  <IconButton
                    icon="plus-circle"
                    size={48}
                    iconColor={quantity >= maxAvailable || currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted ? theme.colors.outlineVariant : theme.colors.primary}
                    onPress={incrementQuantity}
                    disabled={quantity >= maxAvailable || processing || currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted}
                    style={styles.quantityButton}
                  />
                </RNView>

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
                  <Text style={styles.priceLabel}>{t('order.totalPrice')}</Text>
                  <Text style={styles.priceAmount}>{calculatePrice().toFixed(0)} {t('common.rsd')}</Text>
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
                {currentWeekOrder.status === 'pending' && !currentWeekOrder.isPaid && !currentWeekOrder.paymentSubmitted && (
                  <Chip icon="clock-outline" mode="flat" style={styles.statusPending}>
                    {t('order.pendingPayment')}
                  </Chip>
                )}
                {currentWeekOrder.status === 'pending' && !currentWeekOrder.isPaid && currentWeekOrder.paymentSubmitted && (
                  <Chip icon="clock-outline" mode="flat" style={styles.statusWaiting}>
                    {t('order.awaitingConfirmation')}
                  </Chip>
                )}
                {currentWeekOrder.status === 'pending' && currentWeekOrder.isPaid && (
                  <Chip icon="check-circle" mode="flat" style={styles.statusPaid}>
                    {t('order.paymentConfirmed')}
                  </Chip>
                )}
                {currentWeekOrder.status === 'completed' && (
                  <Chip icon="package-check" mode="flat" style={styles.statusCompleted}>
                    {t('order.delivered')}
                  </Chip>
                )}
              </RNView>
            )}

            <Button
              mode="contained"
              onPress={handleBuyNow}
              loading={processing}
              disabled={processing || quantity > maxAvailable || currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted}
              style={styles.orderButton}
              contentStyle={styles.orderButtonContent}
              labelStyle={styles.orderButtonLabel}
              buttonColor={theme.colors.primary}
              icon={currentWeekOrder ? "check" : "cart-check"}
            >
              {processing ? t('order.processing') : (currentWeekOrder?.isPaid || currentWeekOrder?.paymentSubmitted) ? t('order.paymentSubmittedCantUpdate') : currentWeekOrder ? t('order.updateOrder') : t('order.placeOrder')}
            </Button>

            {currentWeekOrder && !currentWeekOrder.isPaid && !currentWeekOrder.paymentSubmitted && (
              <Button
                mode="outlined"
                onPress={handleCancelOrder}
                disabled={processing}
                style={styles.cancelButton}
                contentStyle={styles.cancelButtonContent}
                icon="close-circle-outline"
                textColor={theme.colors.error}
              >
                {t('order.cancelOrder')}
              </Button>
            )}

            {/* Payment Button - show when order exists and not fully paid */}
            {currentWeekOrder && !currentWeekOrder.isPaid && (
              <Button
                mode="contained"
                onPress={() => setPaymentDialogVisible(true)}
                style={styles.paymentButton}
                contentStyle={styles.paymentButtonContent}
                icon="qrcode"
                buttonColor={theme.colors.tertiary}
              >
                {currentWeekOrder.paymentSubmitted ? t('order.viewPayment') : t('order.payNow')}
              </Button>
            )}
          </>
        )}

        {/* Info Note */}
        <Surface style={styles.infoCard} elevation={1}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            {t('order.infoNote')}
          </Text>
        </Surface>
      </ScrollView>

      {/* Payment Dialog */}
      <Portal>
        <Dialog visible={paymentDialogVisible} onDismiss={() => setPaymentDialogVisible(false)} style={styles.paymentDialog}>
          <Dialog.Title style={styles.dialogTitle}>{t('payment.title')}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            {currentWeekOrder && (
              <>
                <RNView style={styles.qrCodeContainer}>
                  <QRCode
                    value={generateNBSIPSQRCode()}
                    size={200}
                    backgroundColor="white"
                  />
                </RNView>
                <Text variant="titleMedium" style={styles.paymentDialogAmount}>
                  {currentWeekOrder.quantity} {t('common.eggs')} • {currentWeekOrder.total.toFixed(0)} {t('common.rsd')}
                </Text>
                <RNView style={styles.bankDetailsContainer}>
                  <Text variant="bodyMedium" style={styles.bankDetailLabel}>{t('payment.account')}</Text>
                  <Text variant="bodyMedium" style={styles.bankDetailValue}>{paymentSettings?.bankAccountNumber}</Text>
                </RNView>
                <RNView style={styles.bankDetailsContainer}>
                  <Text variant="bodyMedium" style={styles.bankDetailLabel}>{t('payment.recipient')}</Text>
                  <Text variant="bodyMedium" style={styles.bankDetailValue}>{paymentSettings?.recipientName}</Text>
                </RNView>
                <RNView style={styles.bankDetailsContainer}>
                  <Text variant="bodyMedium" style={styles.bankDetailLabel}>{t('payment.purpose')}</Text>
                  <Text variant="bodyMedium" style={styles.bankDetailValue}>{paymentSettings?.paymentPurpose}</Text>
                </RNView>
                <Text variant="bodySmall" style={styles.paymentInstructions}>
                  {t('payment.scanQR')} {t('payment.afterPayment')}
                </Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            {!currentWeekOrder?.paymentSubmitted && (
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
            <Button onPress={() => setPaymentDialogVisible(false)} mode="contained">{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  statusWaiting: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#2196f3',
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
  paymentButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },
  paymentButtonContent: {
    paddingVertical: 12,
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
