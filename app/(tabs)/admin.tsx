import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, ScrollView, View as RNView, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { View } from '@/components/Themed';
import {
  Card,
  Text,
  Button,
  TextInput,
  ActivityIndicator,
  Snackbar,
  useTheme,
  Surface,
  Chip,
  DataTable,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { Week, AppSettings } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useScrollContext } from '@/contexts/ScrollContext';

export default function AdminScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setScrollY } = useScrollContext();
  const [week, setWeek] = useState<Week | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    const checkAuth = async () => {
      const user = await apiService.getCurrentUser();
      if (!user || user.role !== 'admin') {
        router.replace('/(tabs)');
      }
    };
    checkAuth();
  }, []);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingStock, setEditingStock] = useState(false);
  const [newStockAmount, setNewStockAmount] = useState('');
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [newDeliveryTime, setNewDeliveryTime] = useState('');
  const [editingDefaultPrice, setEditingDefaultPrice] = useState(false);
  const [newDefaultPrice, setNewDefaultPrice] = useState('');
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [weekData, settingsData, orders, subscriptions] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getAppSettings(),
        apiService.getAllOrdersAdmin(),
        apiService.getAllSubscriptionsAdmin(),
      ]);
      setWeek(weekData);
      setSettings(settingsData);
      setAllOrders(orders);
      setAllSubscriptions(subscriptions);
      setNewStockAmount(weekData.availableEggs.toString());
      setNewDefaultPrice(settingsData.defaultPricePerDozen.toString());
      setNewDeliveryDate(weekData.deliveryDate || '');
      setNewDeliveryTime(weekData.deliveryTime || '');
      
      // Set date picker state
      if (weekData.deliveryDate) {
        setSelectedDate(new Date(weekData.deliveryDate));
      }
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const amount = parseInt(newStockAmount);
      if (isNaN(amount) || amount < 0) {
        throw new Error('Please enter a valid number');
      }

      await apiService.updateCurrentWeek({ availableEggs: amount });
      setSuccessMessage('Stock updated successfully!');
      setEditingStock(false);
      
      const updatedWeek = await apiService.getWeeklyStock();
      setWeek(updatedWeek);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update stock');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateDelivery = async () => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiService.updateCurrentWeek({
        deliveryDate: newDeliveryDate || null,
        deliveryTime: newDeliveryTime || null,
      });
      setSuccessMessage('Delivery information updated!');
      setEditingDelivery(false);
      
      const updatedWeek = await apiService.getWeeklyStock();
      setWeek(updatedWeek);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update delivery info');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateDefaultPrice = async () => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const price = parseFloat(newDefaultPrice);
      if (isNaN(price) || price < 0) {
        throw new Error('Please enter a valid price');
      }

      await apiService.updateDefaultPrice(price, true); // true = apply to current week too
      setSuccessMessage('Price updated! Applies to current and all future weeks.');
      setEditingDefaultPrice(false);
      
      const [updatedWeek, updatedSettings] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getAppSettings(),
      ]);
      setWeek(updatedWeek);
      setSettings(updatedSettings);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update default price');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async (orderId: number) => {
    if (processingOrderId === orderId) return; // Prevent double-click on same button
    
    setProcessingOrderId(orderId);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiService.confirmOrderPayment(orderId);
      setSuccessMessage('Payment confirmed!');
      
      const [weekData, orders] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getAllOrdersAdmin(),
      ]);
      setWeek(weekData);
      setAllOrders(orders);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm payment');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkAllDelivered = async () => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiService.markAllOrdersDelivered();
      setSuccessMessage('All paid orders marked as delivered!');
      
      const [weekData, orders] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getAllOrdersAdmin(),
      ]);
      setWeek(weekData);
      setAllOrders(orders);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark orders as delivered');
    } finally {
      setProcessing(false);
    }
  };


  const handleClearData = async () => {
    await apiService.clearAllData();
    setSuccessMessage('All data cleared! Please refresh.');
    setTimeout(() => loadData(), 1000);
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAllPendingItems = () => {
    // Only pending orders (not yet delivered) - used for "Mark All as Delivered" button
    const orders = allOrders
      .filter(order => order.status === 'pending' && order.weekId === week?.id)
      .map(order => ({
        id: `order-${order.id}`,
        userName: order.userName || 'Unknown',
        quantity: order.quantity,
        price: order.total,
        type: order.subscriptionId ? ('Subscription' as const) : ('One-time Order' as const),
        isPaid: order.isPaid,
        subscriptionId: order.subscriptionId,
      }));

    return orders;
  };

  const getAllWeekItems = () => {
    // All orders for the week (both pending and completed) for summary display
    const orders = allOrders
      .filter(order => order.weekId === week?.id)
      .map(order => ({
        id: `order-${order.id}`,
        userName: order.userName || 'Unknown',
        quantity: order.quantity,
        price: order.total,
        type: order.subscriptionId ? ('Subscription' as const) : ('One-time Order' as const),
        isPaid: order.isPaid,
        subscriptionId: order.subscriptionId,
        status: order.status,
      }));

    return orders;
  };

  const getAllThisWeeksOrders = () => {
    // Include all orders for this week to show total ordered (pending, delivered, completed)
    return allOrders
      .filter(order => 
        order.weekId === week?.id && 
        (order.status === 'pending' || order.status === 'delivered' || order.status === 'completed')
      )
      .reduce((sum, order) => sum + order.quantity, 0);
  };

  const getRemainingStock = () => {
    if (!week) return 0;
    const totalOrdered = getAllThisWeeksOrders();
    return week.availableEggs - totalOrdered;
  };

  // Get all orders for the current week, sorted by status
  const getAllWeekOrders = () => {
    const weekOrders = allOrders.filter(order => order.weekId === week?.id);
    
    // Sort by status priority: unpaid/pending first, then delivered, then completed
    return weekOrders.sort((a, b) => {
      // Priority order: unpaid pending -> paid pending -> delivered -> completed
      const getPriority = (order: any) => {
        if (order.status === 'completed') return 4; // Fully complete last
        if (order.status === 'delivered') return 3; // Delivered
        if (order.isPaid) return 2; // Paid but not delivered
        return 1; // Unpaid/pending first
      };
      
      const priorityDiff = getPriority(a) - getPriority(b);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same priority, sort by created date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const getOrderStatusInfo = (order: any) => {
    if (order.status === 'completed') {
      return {
        label: 'Delivered',
        icon: 'truck-check',
        color: '#4caf50',
        bgColor: '#e8f5e9',
      };
    } else if (order.isPaid) {
      return {
        label: 'Paid - Ready for Delivery',
        icon: 'check-circle',
        color: '#2196f3',
        bgColor: '#e3f2fd',
      };
    } else if (order.paymentSubmitted) {
      return {
        label: 'Payment Submitted',
        icon: 'clock-check',
        color: '#ff9800',
        bgColor: '#fff3e0',
      };
    } else {
      return {
        label: 'Awaiting Payment',
        icon: 'clock-alert',
        color: '#f44336',
        bgColor: '#ffebee',
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

  if (error || !week) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
          {error || 'Failed to load data'}
        </Text>
        <Button mode="contained" onPress={loadData} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  const allPendingItems = getAllPendingItems();
  const allWeekItems = getAllWeekItems();

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.header}
        >
          <Text style={styles.headerIcon}>📊</Text>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Manage stock, delivery & orders</Text>
        </LinearGradient>

        {/* Clear Data Button */}
        <Button
          mode="outlined"
          onPress={handleClearData}
          icon="delete-outline"
          textColor={theme.colors.error}
          style={styles.clearButton}
        >
          Clear All Data (Reset)
        </Button>

        {/* Stock Management */}
        <Card style={styles.card} mode="elevated">
          <LinearGradient
            colors={[theme.colors.primaryContainer, '#ffffff']}
            style={styles.cardGradient}
          >
            <RNView style={styles.cardContent}>
              <RNView style={styles.cardHeader}>
                <RNView style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>📦</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.cardTitle}>Weekly Stock</Text>
              </RNView>

              {week.availableEggs === 0 ? (
                <Surface style={styles.infoCard} elevation={2}>
                  <Text variant="bodyLarge" style={styles.noDataText}>
                    📦 Please add stock for this week
                  </Text>
                </Surface>
              ) : (
              <Surface style={styles.statsCard} elevation={2}>
                <RNView style={styles.statRow}>
                  <Text variant="bodyMedium" style={styles.statLabel}>Total Set:</Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                      {week.availableEggs}
                  </Text>
                </RNView>
                <RNView style={styles.statRow}>
                  <Text variant="bodyMedium" style={styles.statLabel}>Ordered:</Text>
                  <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.error }]}>
                      {getAllThisWeeksOrders()}
                  </Text>
                </RNView>
                <RNView style={[styles.statRow, styles.remainingRow]}>
                  <Text variant="titleMedium" style={styles.remainingLabel}>Remaining:</Text>
                  <Text variant="headlineMedium" style={styles.remainingValue}>
                    {getRemainingStock()}
                  </Text>
                </RNView>
              </Surface>
              )}

              {editingStock ? (
                <>
                  <TextInput
                    label="New Stock Amount"
                    value={newStockAmount}
                    onChangeText={setNewStockAmount}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                  />
                  <RNView style={styles.buttonRow}>
                    <Button
                      mode="contained"
                      onPress={handleUpdateStock}
                      loading={processing}
                      disabled={processing}
                      style={styles.halfButton}
                    >
                      Save
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEditingStock(false);
                        setNewStockAmount(week.availableEggs.toString());
                      }}
                      style={styles.halfButton}
                    >
                      Cancel
                    </Button>
                  </RNView>
                </>
              ) : (
                <Button
                  mode="outlined"
                  onPress={() => setEditingStock(true)}
                  icon="pencil"
                  style={styles.button}
                >
                  Edit Stock
                </Button>
              )}
            </RNView>
          </LinearGradient>
        </Card>

        {/* Price Management */}
        <Card style={styles.card} mode="elevated">
          <LinearGradient
            colors={[theme.colors.tertiaryContainer, '#ffffff']}
            style={styles.cardGradient}
          >
            <RNView style={styles.cardContent}>
              <RNView style={styles.cardHeader}>
                <RNView style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>💰</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.cardTitle}>Price Management</Text>
              </RNView>

              <Surface style={styles.statsCard} elevation={2}>
                <RNView style={styles.statRow}>
                  <Text variant="bodyMedium" style={styles.statLabel}>Current Price:</Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {week.pricePerDozen.toFixed(0)} RSD / dozen
                  </Text>
                </RNView>
              </Surface>

              <Text variant="bodySmall" style={styles.helperText}>
                💡 Changes apply to current week and all future weeks
              </Text>

              {editingDefaultPrice ? (
                <>
                  <TextInput
                    label="Price per Dozen (RSD)"
                    value={newDefaultPrice}
                    onChangeText={setNewDefaultPrice}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="currency-usd" />}
                  />
                  <RNView style={styles.buttonRow}>
                    <Button
                      mode="contained"
                      onPress={handleUpdateDefaultPrice}
                      loading={processing}
                      disabled={processing}
                      style={styles.halfButton}
                    >
                      Save
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEditingDefaultPrice(false);
                        setNewDefaultPrice(settings?.defaultPricePerDozen.toString() || '');
                      }}
                      style={styles.halfButton}
                    >
                      Cancel
                    </Button>
                  </RNView>
                </>
              ) : (
                <Button
                  mode="outlined"
                  onPress={() => setEditingDefaultPrice(true)}
                  icon="pencil"
                  style={styles.button}
                >
                  Update Price
                </Button>
              )}
            </RNView>
          </LinearGradient>
        </Card>

        {/* Delivery Management */}
        <Card style={styles.card} mode="elevated">
          <LinearGradient
            colors={[theme.colors.secondaryContainer, '#ffffff']}
            style={styles.cardGradient}
          >
            <RNView style={styles.cardContent}>
              <RNView style={styles.cardHeader}>
                <RNView style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>🚚</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.cardTitle}>Delivery Info</Text>
              </RNView>

              {!editingDelivery && week.deliveryDate && week.deliveryTime ? (
                <Surface style={styles.infoCard} elevation={2}>
                  <Text variant="bodyLarge" style={styles.infoText}>
                    📅 {formatDate(week.deliveryDate)}
                  </Text>
                  <Text variant="bodyLarge" style={styles.infoText}>
                    🕐 {week.deliveryTime}
                  </Text>
                </Surface>
              ) : !editingDelivery ? (
                <Surface style={styles.infoCard} elevation={2}>
                  <Text variant="bodyLarge" style={styles.noDataText}>
                    🚚 Please add delivery information for this week
                </Text>
                </Surface>
              ) : null}

              {/* Only show edit section if orders haven't been delivered yet */}
              {!week.allOrdersDelivered && editingDelivery ? (
                <>
                  {Platform.OS === 'web' ? (
                    <>
                      <RNView style={styles.webInputContainer}>
                        <Text style={styles.webInputLabel}>Delivery Date</Text>
                        <input
                          type="date"
                    value={newDeliveryDate}
                          onChange={(e) => {
                            setNewDeliveryDate(e.target.value);
                            if (e.target.value) {
                              setSelectedDate(new Date(e.target.value));
                            }
                          }}
                          style={{
                            padding: 16,
                            fontSize: 16,
                            borderRadius: 12,
                            border: '1px solid #e0e0e0',
                            width: '100%',
                            fontFamily: 'system-ui',
                            backgroundColor: '#ffffff',
                          }}
                        />
                      </RNView>
                      
                      <RNView style={styles.webInputContainer}>
                        <Text style={styles.webInputLabel}>Delivery Start Time</Text>
                        <input
                          type="time"
                          value={(() => {
                            const timeStr = newDeliveryTime.split(' - ')[0];
                            if (!timeStr) return '';
                            
                            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                            if (!match) return '';
                            
                            const [, h, m, p] = match;
                            let hours = parseInt(h);
                            
                            if (p.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                            if (p.toUpperCase() === 'AM' && hours === 12) hours = 0;
                            
                            return `${String(hours).padStart(2, '0')}:${m}`;
                          })()}
                          onChange={(e) => {
                            const time = e.target.value; // HH:MM format
                            if (!time) return;
                            
                            const [hours, minutes] = time.split(':').map(Number);
                            
                            // Start time
                            const period = hours >= 12 ? 'PM' : 'AM';
                            const displayHours = hours % 12 || 12;
                            
                            // End time (4 hours later)
                            let endHours = hours + 4;
                            if (endHours >= 24) endHours -= 24; // Handle midnight crossing
                            const endPeriod = endHours >= 12 ? 'PM' : 'AM';
                            const endDisplayHours = endHours % 12 || 12;
                            
                            setNewDeliveryTime(`${displayHours}:${String(minutes).padStart(2, '0')} ${period} - ${endDisplayHours}:${String(minutes).padStart(2, '0')} ${endPeriod}`);
                          }}
                          style={{
                            padding: 16,
                            fontSize: 16,
                            borderRadius: 12,
                            border: '1px solid #e0e0e0',
                            width: '100%',
                            fontFamily: 'system-ui',
                            backgroundColor: '#ffffff',
                          }}
                        />
                        <Text style={styles.webInputHelper}>4-hour delivery window will be added automatically</Text>
                      </RNView>
                    </>
                  ) : (
                    <>
                      <Button
                        mode="outlined"
                        onPress={() => setShowDatePicker(true)}
                        icon="calendar"
                        style={styles.pickerButton}
                      >
                        {newDeliveryDate ? selectedDate.toLocaleDateString() : 'Select Delivery Date'}
                      </Button>
                      
                      <Button
                        mode="outlined"
                        onPress={() => setShowTimePicker(true)}
                        icon="clock-outline"
                        style={styles.pickerButton}
                      >
                        {newDeliveryTime || 'Select Delivery Time'}
                      </Button>
                    </>
                  )}
                  
                  <RNView style={styles.buttonRow}>
                    <Button
                      mode="contained"
                      onPress={handleUpdateDelivery}
                      loading={processing}
                      disabled={processing}
                      style={styles.halfButton}
                    >
                      Save
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setEditingDelivery(false);
                        setNewDeliveryDate(week.deliveryDate || '');
                        setNewDeliveryTime(week.deliveryTime || '');
                        if (week.deliveryDate) {
                          setSelectedDate(new Date(week.deliveryDate));
                        }
                      }}
                      style={styles.halfButton}
                    >
                      Cancel
                    </Button>
                  </RNView>
                </>
              ) : !week.allOrdersDelivered ? (
                <Button
                  mode="outlined"
                  onPress={() => setEditingDelivery(true)}
                  icon="pencil"
                  style={styles.button}
                >
                  Edit Delivery
                </Button>
              ) : null}

              {/* Mark All as Delivered Button */}
              {!editingDelivery && getAllPendingItems().length > 0 && (
                <Button
                  mode="contained"
                  onPress={handleMarkAllDelivered}
                  loading={processing}
                  disabled={processing}
                  icon="check-all"
                  style={[styles.button, { marginTop: 16 }]}
                  buttonColor={theme.colors.tertiary}
                >
                  Mark All as Delivered ({getAllPendingItems().length} {getAllPendingItems().length === 1 ? 'order' : 'orders'})
                </Button>
              )}

              {week.allOrdersDelivered && (
                <Chip icon="check-circle" mode="flat" style={[styles.deliveredChip, { marginTop: 10 }]}>
                  All orders have been delivered!
                </Chip>
              )}
            </RNView>
          </LinearGradient>
        </Card>

        {/* Active Subscriptions */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <RNView style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                📅 Active Subscriptions
              </Text>
              <Chip mode="flat">{allSubscriptions.length}</Chip>
            </RNView>
            
            {allSubscriptions.length > 0 ? (
              allSubscriptions.map((sub, index) => (
                <Surface key={sub.id} style={[styles.listItem, index === 0 && styles.firstItem]} elevation={1}>
                  <RNView style={{ flex: 1 }}>
                    <Text variant="titleMedium">{sub.userName}</Text>
                    <Text variant="bodySmall" style={styles.dateText}>
                    {sub.quantity} eggs/week
                  </Text>
                    <RNView style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <Chip mode="flat" style={styles.weeksChip} textStyle={styles.weeksChipText}>
                        {sub.weeksRemaining} {sub.weeksRemaining === 1 ? 'week' : 'weeks'} remaining
                      </Chip>
                    </RNView>
                  </RNView>
                </Surface>
              ))
            ) : (
              <Text variant="bodyMedium" style={styles.noDataText}>
                No active subscriptions
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* This Week's Summary Table */}
        <Card style={styles.card} mode="elevated">
          <LinearGradient
            colors={[theme.colors.tertiaryContainer, '#ffffff']}
            style={styles.cardGradient}
          >
            <RNView style={styles.cardContent}>
              <RNView style={styles.cardHeader}>
                <RNView style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>📋</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.cardTitle}>This Week's Summary</Text>
              </RNView>

              {allWeekItems.length > 0 ? (
                <Surface style={styles.tableContainer} elevation={2}>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>User</DataTable.Title>
                      <DataTable.Title>Type</DataTable.Title>
                      <DataTable.Title numeric>Eggs</DataTable.Title>
                      <DataTable.Title numeric>Price</DataTable.Title>
                    </DataTable.Header>

                    {allWeekItems.map((item) => (
                      <DataTable.Row key={item.id}>
                        <DataTable.Cell>{item.userName}</DataTable.Cell>
                        <DataTable.Cell>
                          {item.type === 'Subscription' ? '📅' : '🛒'}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                        <DataTable.Cell numeric>{item.price.toFixed(0)} RSD</DataTable.Cell>
                      </DataTable.Row>
                    ))}

                    <DataTable.Row style={styles.totalRow}>
                      <DataTable.Cell>
                        <Text style={styles.totalText}>Total</Text>
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <Text> </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={styles.totalText}>
                          {allWeekItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={styles.totalText}>
                          {allWeekItems.reduce((sum, item) => sum + item.price, 0).toFixed(0)} RSD
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  </DataTable>
                </Surface>
              ) : (
                <Text variant="bodyMedium" style={styles.noDataText}>
                  No orders for this week
                </Text>
              )}
            </RNView>
          </LinearGradient>
        </Card>

        {/* All Orders - Consolidated View */}
        {getAllWeekOrders().length > 0 && (
          <Card style={styles.card} mode="elevated">
            <LinearGradient
              colors={[theme.colors.primaryContainer, '#ffffff']}
              style={styles.cardGradient}
            >
              <RNView style={styles.cardContent}>
                <RNView style={styles.cardHeader}>
                  <RNView style={styles.iconCircle}>
                    <Text style={styles.iconEmoji}>📋</Text>
                  </RNView>
                  <Text variant="titleLarge" style={styles.cardTitle}>Orders</Text>
                  <Chip icon="cart" mode="flat" style={styles.countChip}>
                    {getAllWeekOrders().length}
                  </Chip>
                </RNView>
              
                {getAllWeekOrders().map((order, index) => {
                  const isFullyComplete = order.status === 'completed';
                  const isUnpaid = !order.isPaid && !order.paymentSubmitted;
                  
                  return (
                  <Surface 
                    key={order.id} 
                    style={[
                      styles.listItem, 
                      index === 0 && styles.firstItem,
                      isUnpaid && styles.unpaidListItem,
                      isFullyComplete && styles.completedListItem,
                    ]} 
                    elevation={1}
                  >
                    <RNView style={{ flex: 1 }}>
                      {/* User Name and Order Type */}
                      <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <Text variant="titleMedium" style={isUnpaid && styles.unpaidText}>
                          {order.userName}
                        </Text>
                        {order.subscriptionId && (
                          <Chip mode="flat" style={styles.subscriptionBadge} textStyle={styles.subscriptionBadgeText}>
                            🔄 Sub
                          </Chip>
                        )}
                        {!order.subscriptionId && (
                          <Chip mode="flat" style={styles.oneTimeBadge} textStyle={styles.oneTimeBadgeText}>
                            🛒 One-time
                          </Chip>
                        )}
                      </RNView>
                      
                      {/* Three Status Indicators */}
                      <RNView style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {/* Payment Status - 3 states */}
                        <Chip 
                          icon={order.isPaid ? "check-circle" : order.paymentSubmitted ? "clock-check" : "close-circle"} 
                          mode="flat" 
                          style={{
                            backgroundColor: order.isPaid ? '#d4f4d1' : order.paymentSubmitted ? '#fff3e0' : '#ffebee',
                            borderColor: order.isPaid ? '#4caf50' : order.paymentSubmitted ? '#ff9800' : '#ef5350',
                            borderWidth: 1,
                            height: 28,
                          }}
                          textStyle={{ 
                            color: order.isPaid ? '#2e7d32' : order.paymentSubmitted ? '#e65100' : '#d32f2f', 
                            fontSize: 11, 
                            fontWeight: '600' 
                          }}
                        >
                          {order.isPaid ? 'Paid' : order.paymentSubmitted ? 'Awaiting Confirmation' : 'Not Paid'}
                        </Chip>
                        
                        {/* Delivery Status */}
                        <Chip 
                          icon={['delivered', 'completed'].includes(order.status) ? "truck-check" : "clock-outline"} 
                          mode="flat" 
                          style={{
                            backgroundColor: ['delivered', 'completed'].includes(order.status) ? '#e3f2fd' : '#fff3e0',
                            borderColor: ['delivered', 'completed'].includes(order.status) ? '#2196f3' : '#ff9800',
                            borderWidth: 1,
                            height: 28,
                          }}
                          textStyle={{ 
                            color: ['delivered', 'completed'].includes(order.status) ? '#1976d2' : '#e65100', 
                            fontSize: 11, 
                            fontWeight: '600' 
                          }}
                        >
                          {['delivered', 'completed'].includes(order.status) ? 'Delivered' : 'Awaiting Delivery'}
                        </Chip>
                        
                        {/* Pickup Status - only show for delivered orders */}
                        {['delivered', 'completed'].includes(order.status) && (
                          <Chip 
                            icon={order.pickedUp ? "checkbox-marked-circle" : "package-variant"} 
                            mode="flat" 
                            style={{
                              backgroundColor: order.pickedUp ? '#e8f5e9' : '#fff3e0',
                              borderColor: order.pickedUp ? '#4caf50' : '#ff9800',
                              borderWidth: 1,
                              height: 28,
                            }}
                            textStyle={{ 
                              color: order.pickedUp ? '#2e7d32' : '#e65100', 
                              fontSize: 11, 
                              fontWeight: '600' 
                            }}
                          >
                            {order.pickedUp ? 'Picked Up' : 'Awaiting Pickup'}
                          </Chip>
                        )}
                      </RNView>
                      
                      {/* Order Details */}
                      <Text variant="bodySmall" style={styles.dateText}>
                        {formatDate(order.createdAt)}
                      </Text>
                      <RNView style={styles.orderQuantityRow}>
                        <Text variant="bodyMedium" style={styles.itemValue}>
                          {order.quantity} eggs
                        </Text>
                        <Text variant="bodyMedium" style={styles.priceText}>
                          {order.total.toFixed(0)} RSD
                        </Text>
                      </RNView>
                    </RNView>
                    
                    {/* Action button - only show when there's an action to take */}
                    <RNView style={styles.orderActions}>
                      {!order.isPaid && order.paymentSubmitted && (
                        <Button
                          mode="contained"
                          onPress={() => handleConfirmPayment(order.id)}
                          loading={processingOrderId === order.id}
                          disabled={processingOrderId !== null}
                          icon="check"
                          buttonColor={theme.colors.tertiary}
                          style={styles.confirmButton}
                        >
                          Confirm Payment
                        </Button>
                      )}
                    </RNView>
                  </Surface>
                );
              })}
              </RNView>
            </LinearGradient>
          </Card>
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
        action={{
          label: 'Dismiss',
          onPress: () => setErrorMessage(null),
        }}
        style={{ backgroundColor: theme.colors.error }}
      >
        {errorMessage}
      </Snackbar>

      {/* Date Picker - Native only */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              setSelectedDate(date);
              // Format as YYYY-MM-DD for backend
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              setNewDeliveryDate(`${year}-${month}-${day}`);
            }
          }}
        />
      )}

      {/* Time Picker - Native only */}
      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (date) {
              setSelectedTime(date);
              // Format as "HH:MM AM/PM - HH:MM AM/PM" with 4-hour delivery window
              const hours = date.getHours();
              const minutes = date.getMinutes();
              const period = hours >= 12 ? 'PM' : 'AM';
              const displayHours = hours % 12 || 12;
              const displayMinutes = String(minutes).padStart(2, '0');
              const endHours = hours + 4;
              const endPeriod = endHours >= 12 ? 'PM' : 'AM';
              const endDisplayHours = endHours % 12 || 12;
              setNewDeliveryTime(`${displayHours}:${displayMinutes} ${period} - ${endDisplayHours}:${displayMinutes} ${endPeriod}`);
            }
          }}
        />
      )}
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
  clearButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconEmoji: {
    fontSize: 24,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 4,
  },
  statLabel: {
    color: '#666',
    flexShrink: 0,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#2d3748',
    flexShrink: 1,
    textAlign: 'right',
  },
  remainingRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  remainingLabel: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  remainingValue: {
    color: '#4ecdc4',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#ffffff',
  },
  pickerButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  webInputContainer: {
    marginBottom: 16,
  },
  webInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  webInputHelper: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  helperText: {
    color: '#666',
    marginVertical: 8,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  halfButton: {
    flex: 1,
    borderRadius: 12,
  },
  button: {
    borderRadius: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  infoText: {
    marginBottom: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  firstItem: {
    marginTop: 8,
  },
  itemValue: {
    fontWeight: 'bold',
  },
  orderDetails: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#666',
    marginTop: 4,
  },
  priceText: {
    color: '#666',
    marginTop: 4,
  },
  deliveredItem: {
    opacity: 0.6,
    backgroundColor: '#fafafa',
  },
  deliveredText: {
    opacity: 0.7,
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  totalRow: {
    backgroundColor: '#f5f5f5',
  },
  totalText: {
    fontWeight: 'bold',
    color: '#2d3748',
  },
  orderContent: {
    flex: 1,
  },
  orderQuantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  orderActions: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 0,
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  actionButton: {
    borderRadius: 8,
    minWidth: 100,
  },
  approveButton: {
    shadowColor: '#95e1d3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  declineButton: {
    borderColor: '#ff5252',
  },
  actionButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    borderRadius: 8,
  },
  countChip: {
    marginLeft: 'auto',
    backgroundColor: '#fff3cd',
  },
  subscriptionBadge: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
    height: 24,
  },
  subscriptionBadgeText: {
    fontSize: 10,
    color: '#1976d2',
    lineHeight: 12,
  },
  oneTimeBadge: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 1,
    height: 24,
  },
  oneTimeBadgeText: {
    fontSize: 10,
    color: '#e65100',
    lineHeight: 12,
  },
  weeksChip: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 1,
    height: 24,
  },
  weeksChipText: {
    fontSize: 11,
    color: '#e65100',
    lineHeight: 12,
  },
  paidChip: {
    backgroundColor: '#d4f4d1',
    borderColor: '#4caf50',
    borderWidth: 1,
    height: 40,
  },
  paidChipText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  unpaidListItem: {
    backgroundColor: '#ffebee',
    borderColor: '#ef5350',
    borderWidth: 2,
  },
  unpaidText: {
    color: '#d32f2f',
  },
  completedListItem: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  pickedUpChip: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 1,
    height: 32,
  },
  pickedUpChipText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  awaitingPickupChip: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 1,
    height: 32,
  },
  awaitingPickupChipText: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: '600',
  },
  deliveredChip: {
    backgroundColor: '#d4f4d1',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
});
