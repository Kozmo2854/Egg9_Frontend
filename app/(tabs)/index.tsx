import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView, Dimensions, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Text, 
  useTheme,
  Surface,
  Button,
  Snackbar,
  IconButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import * as OrderHelpers from '@/utils/orderHelpers';
import { useWeekContext } from '@/contexts/WeekContext';
import { LoadingView, ErrorView } from '@/components/common';
import { parseError } from '@/utils/errorHandling';
import { PaymentDialog, ConfirmPaymentDialog } from '@/components/PaymentDialog';
import { PagerViewWrapper } from '@/components/PagerViewWrapper';

// Import screen content components
import DashboardContent from '@/components/screens/DashboardContent';
import OrderContent from '@/components/screens/OrderContent';
import SubscriptionContent from '@/components/screens/SubscriptionContent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GalleryTabsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { setWeekDates } = useWeekContext();
  const router = useRouter();
  const pagerRef = useRef<any>(null);
  
  // Tab state
  const [currentPage, setCurrentPage] = useState(0);
  
  // Shared data state
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
  const [currentWeekSubscriptionOrder, setCurrentWeekSubscriptionOrder] = useState<any>(null);
  const [availableEggs, setAvailableEggs] = useState(0);
  const [outstandingOrders, setOutstandingOrders] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<{
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  } | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type?: 'success' | 'error' }>({ visible: false, message: '' });
  
  // Payment dialog states
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);
  const [paymentOrderContext, setPaymentOrderContext] = useState<{ type: 'current' | 'outstanding' | 'outstanding-all', order?: any } | null>(null);
  const [confirmPaymentVisible, setConfirmPaymentVisible] = useState(false);
  const [confirmingPickup, setConfirmingPickup] = useState(false);

  // Load data on mount (NOT on focus)
  useEffect(() => {
    loadData();
  }, []);

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
      
      if (stockData) {
        setWeekDates(stockData.weekStart, stockData.weekEnd);
      }
      
      const previousWeekUnpaid = unpaidOrders.filter((o: any) => o.weekId !== stockData?.id);
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

  const showSnackbar = (message: string, type: 'success' | 'error' = 'success') => {
    setSnackbar({ visible: true, message, type });
  };

  // Tab navigation
  const goToPage = (index: number) => {
    setCurrentPage(index);
    // On native, pagerRef.setPage animates to the page
    pagerRef.current?.setPage?.(index);
  };

  // Payment helpers
  const showPaymentDialog = (type: 'current' | 'outstanding' | 'outstanding-all' = 'current', order?: any) => {
    setPaymentOrderContext({ type, order });
    setPaymentDialogVisible(true);
  };

  // Pay ALL outstanding orders at once (single button in the dashboard outstanding box).
  const onPayAllOutstanding = () => showPaymentDialog('outstanding-all');

  const hidePaymentDialog = () => {
    setPaymentDialogVisible(false);
    setPaymentOrderContext(null);
  };

  const getPaymentAmount = () => {
    if (paymentOrderContext?.type === 'outstanding-all') {
      return outstandingOrders.reduce((sum, o) => sum + o.total, 0);
    }
    if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
      return paymentOrderContext.order.total;
    }
    return OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
      ? OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder)
      : OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);
  };

  const getPaymentQuantity = () => {
    if (paymentOrderContext?.type === 'outstanding-all') {
      return outstandingOrders.reduce((sum, o) => sum + o.quantity, 0);
    }
    if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
      return paymentOrderContext.order.quantity;
    }
    return OrderHelpers.areOrdersWaitingForConfirmation(currentWeekOrder, currentWeekSubscriptionOrder)
      ? OrderHelpers.getUnpaidSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder)
      : OrderHelpers.getUnpaidNotSubmittedQuantity(currentWeekOrder, currentWeekSubscriptionOrder);
  };

  const getCurrentUnpaidAmount = () => {
    const notSubmittedAmount = OrderHelpers.getUnpaidNotSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);
    const submittedAmount = OrderHelpers.getUnpaidSubmittedAmount(currentWeekOrder, currentWeekSubscriptionOrder);
    return notSubmittedAmount > 0 ? notSubmittedAmount : submittedAmount;
  };

  const showConfirmPayment = () => {
    setConfirmPaymentVisible(true);
  };

  const hideConfirmPayment = () => {
    setConfirmPaymentVisible(false);
  };

  const handleMarkPaymentSubmitted = async () => {
    hideConfirmPayment();
    try {
      setMarkingPayment(true);
      
      if (paymentOrderContext?.type === 'outstanding-all') {
        if (outstandingOrders.length === 0) {
          hidePaymentDialog();
          return;
        }
        await Promise.all(outstandingOrders.map((o) => apiService.markOrderPaymentSubmitted(o.id)));
        await loadData();
        hidePaymentDialog();
        showSnackbar(t('payment.paymentMarked'));
        return;
      }

      if (paymentOrderContext?.type === 'outstanding' && paymentOrderContext.order) {
        await apiService.markOrderPaymentSubmitted(paymentOrderContext.order.id);
        await loadData();
        hidePaymentDialog();
        showSnackbar(t('payment.paymentMarked'));
        return;
      }
      
      const orderIds = OrderHelpers.getOrdersNeedingPaymentSubmission(currentWeekOrder, currentWeekSubscriptionOrder);
      if (orderIds.length === 0) {
        showSnackbar(t('payment.allOrdersMarked'));
        hidePaymentDialog();
        return;
      }

      await Promise.all(orderIds.map(id => apiService.markOrderPaymentSubmitted(id)));
      await loadData();
      hidePaymentDialog();
      showSnackbar(t('payment.paymentMarked'));
    } catch (err: any) {
      const appError = parseError(err, 'markPayment');
      showSnackbar(appError.message, 'error');
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
      showSnackbar(t('payment.pickupConfirmed'));
    } catch (err: any) {
      const appError = parseError(err);
      showSnackbar(appError.message, 'error');
    } finally {
      setConfirmingPickup(false);
    }
  };

  const generateNBSIPSQRCode = (customAmount?: number) => {
    const amount = customAmount ?? getPaymentAmount();
    return OrderHelpers.generateNBSIPSQRCode(paymentSettings, amount);
  };

  const getPaymentDialogProps = () => {
    const isOutstanding = paymentOrderContext?.type === 'outstanding';
    const isOutstandingAll = paymentOrderContext?.type === 'outstanding-all';

    let isPaymentSubmitted: boolean;
    let weekLabel: string | undefined;
    if (isOutstandingAll) {
      isPaymentSubmitted = outstandingOrders.length === 0;
      weekLabel = t('payment.ordersCount', { count: outstandingOrders.length });
    } else if (isOutstanding) {
      isPaymentSubmitted = paymentOrderContext.order?.paymentSubmitted;
      weekLabel = paymentOrderContext.order
        ? t('home.weekOf', { date: new Date(paymentOrderContext.order.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })
        : undefined;
    } else {
      isPaymentSubmitted = OrderHelpers.areAllOrdersPaymentSubmitted(currentWeekOrder, currentWeekSubscriptionOrder);
      weekLabel = undefined;
    }

    return {
      quantity: getPaymentQuantity(),
      amount: getPaymentAmount(),
      qrCodeValue: generateNBSIPSQRCode(
        isOutstandingAll
          ? outstandingOrders.reduce((sum, o) => sum + o.total, 0)
          : (isOutstanding ? paymentOrderContext?.order?.total : undefined)
      ),
      isPaymentSubmitted,
      weekLabel,
    };
  };

  if (loading) {
    return <LoadingView message={t('common.loading')} />;
  }

  if (error || !weeklyStock) {
    return (
      <ErrorView 
        message={error || 'Unable to load data'} 
        onRetry={() => loadData()} 
      />
    );
  }

  const tabLabels = [t('tabs.home'), t('tabs.order'), t('tabs.subscription')];
  const tabIcons = ['home', 'shopping-basket', 'refresh'];

  // Shared content props
  const dashboardProps = {
    weeklyStock,
    subscription,
    currentWeekOrder,
    currentWeekSubscriptionOrder,
    availableEggs,
    outstandingOrders,
    refreshing,
    onRefresh,
    showPaymentDialog,
    onPayAllOutstanding,
    showConfirmPayment,
    handleConfirmPickup,
    confirmingPickup,
    markingPayment,
    getCurrentUnpaidAmount,
    goToPage,
  };

  const orderProps = {
    weeklyStock,
    subscription,
    currentWeekOrder,
    availableEggs,
    refreshing,
    onRefresh,
    onDataChange: loadData,
    showSnackbar,
    paymentSettings,
  };

  const subscriptionProps = {
    weeklyStock,
    subscription,
    currentWeekSubOrder: currentWeekSubscriptionOrder,
    refreshing,
    onRefresh,
    onDataChange: loadData,
    showSnackbar,
    paymentSettings,
  };

  // Unified render using PagerViewWrapper (handles platform differences internally)
  return (
    <View style={styles.container}>
      <PagerViewWrapper
        currentPage={currentPage}
        onPageSelected={setCurrentPage}
        pagerRef={pagerRef}
      >
        <DashboardContent {...dashboardProps} />
        <OrderContent {...orderProps} />
        <SubscriptionContent {...subscriptionProps} />
      </PagerViewWrapper>

      {/* Custom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
        {tabLabels.map((label, index) => {
          const isActive = currentPage === index;
          return (
            <Pressable
              key={index}
              style={styles.tab}
              onPress={() => goToPage(index)}
            >
              <FontAwesome
                name={tabIcons[index] as any}
                size={24}
                color={isActive ? theme.colors.primary : '#999'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? theme.colors.primary : '#999' },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Payment Dialog */}
      <PaymentDialog
        visible={paymentDialogVisible}
        onDismiss={hidePaymentDialog}
        onMarkPaid={showConfirmPayment}
        {...getPaymentDialogProps()}
        bankAccountNumber={paymentSettings?.bankAccountNumber}
        recipientName={paymentSettings?.recipientName}
        isMarkingPayment={markingPayment}
      />
      <ConfirmPaymentDialog
        visible={confirmPaymentVisible}
        onDismiss={hideConfirmPayment}
        onConfirm={handleMarkPaymentSubmitted}
        isLoading={markingPayment}
      />

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        style={{ backgroundColor: snackbar.type === 'error' ? theme.colors.error : theme.colors.tertiary }}
        action={{ label: 'OK', textColor: '#fff', onPress: () => setSnackbar({ visible: false, message: '' }) }}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5f1',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
