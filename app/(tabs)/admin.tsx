import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View as RNView } from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';

export default function AdminScreen() {
  const theme = useTheme();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [editingStock, setEditingStock] = useState(false);
  const [newStockAmount, setNewStockAmount] = useState('');
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [newDeliveryTime, setNewDeliveryTime] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stockData, orders, subscriptions] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getAllOrdersAdmin(),
        apiService.getAllSubscriptionsAdmin(),
      ]);
      setWeeklyStock(stockData);
      setAllOrders(orders);
      setAllSubscriptions(subscriptions);
      setNewStockAmount(stockData.availableEggs.toString());
      setNewDeliveryDate(stockData.deliveryDate || '');
      setNewDeliveryTime(stockData.deliveryTime || '');
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

      await apiService.updateWeeklyStockAdmin(amount);
      setSuccessMessage('Stock updated successfully!');
      setEditingStock(false);
      
      const updatedStock = await apiService.getWeeklyStock();
      setWeeklyStock(updatedStock);
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
      await apiService.updateDeliveryInfo(
        newDeliveryDate || undefined,
        newDeliveryTime || undefined
      );
      setSuccessMessage('Delivery information updated!');
      setEditingDelivery(false);
      
      const updatedStock = await apiService.getWeeklyStock();
      setWeeklyStock(updatedStock);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update delivery info');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkAllDelivered = async () => {
    setProcessing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await apiService.markAllOrdersDelivered();
      setSuccessMessage('All orders marked as delivered!');
      
      const [stockData, orders] = await Promise.all([
        apiService.getWeeklyStock(),
        apiService.getAllOrdersAdmin(),
      ]);
      setWeeklyStock(stockData);
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
    const pendingOrders = allOrders
      .filter(order => order.deliveryStatus === 'not_delivered')
      .map(order => ({
        id: `order-${order.id}`,
        userName: order.userName || 'Unknown',
        quantity: order.quantity,
        price: order.total,
        type: 'One-time Order' as const,
      }));

    const activeSubscriptions = allSubscriptions.map(sub => ({
      id: `sub-${sub.id}`,
      userName: sub.userName || 'Unknown',
      quantity: sub.quantity,
      price: (sub.quantity / 10) * (weeklyStock?.pricePerDozen || 0),
      type: 'Subscription' as const,
    }));

    return [...pendingOrders, ...activeSubscriptions];
  };

  const getRemainingStock = () => {
    if (!weeklyStock) return 0;
    const totalOrdered = getAllPendingItems().reduce((sum, item) => sum + item.quantity, 0);
    return weeklyStock.availableEggs - totalOrdered;
  };

  const getPendingOrders = () => {
    return allOrders.filter(order => order.deliveryStatus === 'not_delivered');
  };

  const getDeliveredOrders = () => {
    return allOrders.filter(order => order.deliveryStatus === 'delivered');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" animating={true} color={theme.colors.primary} />
        <Text variant="bodyLarge" style={styles.loadingText}>Loading admin data...</Text>
      </View>
    );
  }

  if (error || !weeklyStock) {
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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

              <Surface style={styles.statsCard} elevation={2}>
                <RNView style={styles.statRow}>
                  <Text variant="bodyMedium" style={styles.statLabel}>Total Set:</Text>
                  <Text variant="headlineSmall" style={styles.statValue}>
                    {weeklyStock.availableEggs}
                  </Text>
                </RNView>
                <RNView style={styles.statRow}>
                  <Text variant="bodyMedium" style={styles.statLabel}>Ordered:</Text>
                  <Text variant="headlineSmall" style={[styles.statValue, { color: theme.colors.error }]}>
                    {allPendingItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Text>
                </RNView>
                <RNView style={[styles.statRow, styles.remainingRow]}>
                  <Text variant="titleMedium" style={styles.remainingLabel}>Remaining:</Text>
                  <Text variant="headlineMedium" style={styles.remainingValue}>
                    {getRemainingStock()}
                  </Text>
                </RNView>
              </Surface>

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
                        setNewStockAmount(weeklyStock.availableEggs.toString());
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

              {!editingDelivery && weeklyStock.deliveryDate && weeklyStock.deliveryTime ? (
                <Surface style={styles.infoCard} elevation={2}>
                  <Text variant="bodyLarge" style={styles.infoText}>
                    📅 {formatDate(weeklyStock.deliveryDate)}
                  </Text>
                  <Text variant="bodyLarge" style={styles.infoText}>
                    🕐 {weeklyStock.deliveryTime}
                  </Text>
                </Surface>
              ) : !editingDelivery ? (
                <Text variant="bodyMedium" style={styles.noDataText}>
                  No delivery scheduled
                </Text>
              ) : null}

              {editingDelivery ? (
                <>
                  <TextInput
                    label="Delivery Date (YYYY-MM-DD)"
                    value={newDeliveryDate}
                    onChangeText={setNewDeliveryDate}
                    mode="outlined"
                    style={styles.input}
                    placeholder="2024-12-25"
                  />
                  <TextInput
                    label="Delivery Time"
                    value={newDeliveryTime}
                    onChangeText={setNewDeliveryTime}
                    mode="outlined"
                    style={styles.input}
                    placeholder="10:00 AM - 2:00 PM"
                  />
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
                        setNewDeliveryDate(weeklyStock.deliveryDate || '');
                        setNewDeliveryTime(weeklyStock.deliveryTime || '');
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
                  onPress={() => setEditingDelivery(true)}
                  icon="pencil"
                  style={styles.button}
                >
                  Edit Delivery
                </Button>
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
                  <RNView>
                    <Text variant="titleMedium">{sub.userName}</Text>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {sub.period || 4} weeks subscription
                    </Text>
                  </RNView>
                  <Text variant="titleMedium" style={styles.itemValue}>
                    {sub.quantity} eggs/week
                  </Text>
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
              <RNView style={styles.sectionHeader}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  📋 This Week's Summary
                </Text>
                {getPendingOrders().length > 0 && (
                  <Button
                    mode="contained"
                    onPress={handleMarkAllDelivered}
                    loading={processing}
                    disabled={processing}
                    icon="check-all"
                    buttonColor={theme.colors.tertiary}
                    compact
                  >
                    Deliver All
                  </Button>
                )}
              </RNView>

              {allPendingItems.length > 0 ? (
                <Surface style={styles.tableContainer} elevation={2}>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>User</DataTable.Title>
                      <DataTable.Title>Type</DataTable.Title>
                      <DataTable.Title numeric>Eggs</DataTable.Title>
                      <DataTable.Title numeric>Price</DataTable.Title>
                    </DataTable.Header>

                    {allPendingItems.map((item) => (
                      <DataTable.Row key={item.id}>
                        <DataTable.Cell>{item.userName}</DataTable.Cell>
                        <DataTable.Cell>
                          {item.type === 'Subscription' ? '📅' : '🛒'}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>{item.quantity}</DataTable.Cell>
                        <DataTable.Cell numeric>${item.price.toFixed(2)}</DataTable.Cell>
                      </DataTable.Row>
                    ))}

                    <DataTable.Row style={styles.totalRow}>
                      <DataTable.Cell>
                        <Text style={styles.totalText}>Total</Text>
                      </DataTable.Cell>
                      <DataTable.Cell></DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={styles.totalText}>
                          {allPendingItems.reduce((sum, item) => sum + item.quantity, 0)}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={styles.totalText}>
                          ${allPendingItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  </DataTable>
                </Surface>
              ) : (
                <Text variant="bodyMedium" style={styles.noDataText}>
                  No pending orders or subscriptions
                </Text>
              )}
            </RNView>
          </LinearGradient>
        </Card>

        {/* Pending Orders Details */}
        {getPendingOrders().length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                ⏳ Pending Orders Details
              </Text>
              
              {getPendingOrders().map((order, index) => (
                <Surface key={order.id} style={[styles.listItem, index === 0 && styles.firstItem]} elevation={1}>
                  <RNView>
                    <Text variant="titleMedium">{order.userName}</Text>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </RNView>
                  <RNView style={styles.orderDetails}>
                    <Text variant="titleMedium" style={styles.itemValue}>
                      {order.quantity} eggs
                    </Text>
                    <Text variant="bodyMedium" style={styles.priceText}>
                      ${order.total.toFixed(2)}
                    </Text>
                  </RNView>
                </Surface>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Delivered Orders */}
        {getDeliveredOrders().length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <RNView style={styles.sectionHeader}>
                <Text variant="titleLarge" style={styles.sectionTitle}>
                  ✅ Delivered Orders
                </Text>
                <Chip icon="check-circle" mode="flat">
                  {getDeliveredOrders().length}
                </Chip>
              </RNView>
              
              {getDeliveredOrders().map((order, index) => (
                <Surface key={order.id} style={[styles.listItem, styles.deliveredItem, index === 0 && styles.firstItem]} elevation={0}>
                  <RNView>
                    <Text variant="titleMedium" style={styles.deliveredText}>
                      {order.userName}
                    </Text>
                    <Text variant="bodySmall" style={styles.dateText}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </RNView>
                  <RNView style={styles.orderDetails}>
                    <Text variant="titleMedium" style={[styles.itemValue, styles.deliveredText]}>
                      {order.quantity} eggs
                    </Text>
                    <Text variant="bodyMedium" style={[styles.priceText, styles.deliveredText]}>
                      ${order.total.toFixed(2)}
                    </Text>
                  </RNView>
                </Surface>
              ))}
            </Card.Content>
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
  },
  statLabel: {
    color: '#666',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#2d3748',
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
    alignItems: 'center',
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
});
