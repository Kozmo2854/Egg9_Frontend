import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View as RNView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { View } from '@/components/Themed';
import { 
  Text, 
  useTheme,
  Card,
  DataTable,
  Chip,
  Surface,
  ActivityIndicator,
  IconButton,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { UserDetails } from '@/types/models';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScrollContext } from '@/contexts/ScrollContext';

export default function UserDetailsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setScrollY } = useScrollContext();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadUserDetails = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const details = await apiService.getUserDetailsAdmin(parseInt(userId));
      setUserDetails(details);
    } catch (error) {
      setError('Failed to load user details');
    } finally{
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUserDetails();
  }, [loadUserDetails]);

  if (loading) {
    return (
      <RNView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16 }}>Loading user details...</Text>
      </RNView>
    );
  }

  if (error || !userDetails) {
    return (
      <RNView style={styles.centerContainer}>
        <Text style={{ color: theme.colors.error }}>
          {error || 'User not found'}
        </Text>
      </RNView>
    );
  }

  const { user, orders, subscriptions, totalEggsBought } = userDetails;

  const getPendingOrders = () => orders.filter(order => order.status === 'pending');
  const getCompletedOrders = () => orders.filter(order => order.status === 'completed');
  const getActiveSubscriptions = () => subscriptions.filter(sub => sub.status === 'active');
  const getInactiveSubscriptions = () => subscriptions.filter(sub => sub.status !== 'active');

  return (
    <ScrollView 
      style={styles.container}
      onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => setScrollY(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <RNView style={styles.content}>
          {/* Back Button */}
          <RNView style={styles.backButtonContainer}>
            <IconButton
              icon="arrow-left"
              mode="contained"
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </RNView>

          {/* User Info Card */}
          <Surface style={styles.userCard} elevation={4}>
            <RNView style={styles.userHeader}>
              <Text variant="headlineMedium" style={styles.userName}>
                {user.name}
              </Text>
              <Chip mode="flat" style={user.role === 'admin' ? styles.adminChip : styles.customerChip}>
                {user.role}
              </Chip>
            </RNView>

            <Divider style={styles.divider} />

            <RNView style={styles.userInfoGrid}>
              <RNView style={styles.userInfoItem}>
                <Text style={styles.userInfoLabel}>📧 Email</Text>
                <Text style={styles.userInfoValue}>{user.email}</Text>
              </RNView>
              
              {user.phoneNumber && (
                <RNView style={styles.userInfoItem}>
                  <Text style={styles.userInfoLabel}>📱 Phone</Text>
                  <Text style={styles.userInfoValue}>{user.phoneNumber}</Text>
                </RNView>
              )}

              <RNView style={styles.userInfoItem}>
                <Text style={styles.userInfoLabel}>📅 Joined</Text>
                <Text style={styles.userInfoValue}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </RNView>
            </RNView>
          </Surface>

          {/* Statistics */}
          <Surface style={styles.statsCard} elevation={2}>
            <Text variant="titleLarge" style={styles.sectionTitle}>📊 Statistics</Text>
            <RNView style={styles.statsGrid}>
              <RNView style={styles.statBox}>
                <Text style={styles.statNumber}>{orders.length}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </RNView>
              <RNView style={styles.statBox}>
                <Text style={styles.statNumber}>{getCompletedOrders().length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </RNView>
              <RNView style={styles.statBox}>
                <Text style={styles.statNumber}>{getPendingOrders().length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </RNView>
              <RNView style={styles.statBox}>
                <Text style={styles.statNumber}>{totalEggsBought}</Text>
                <Text style={styles.statLabel}>Eggs Bought</Text>
              </RNView>
            </RNView>
          </Surface>

          {/* Active Subscriptions */}
          {getActiveSubscriptions().length > 0 && (
            <Card style={styles.tableCard} mode="elevated">
              <Card.Title 
                title="Active Subscriptions" 
                titleVariant="titleLarge"
                left={(props) => <IconButton {...props} icon="calendar-check" />}
              />
              <Card.Content>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Quantity</DataTable.Title>
                    <DataTable.Title>Weeks Left</DataTable.Title>
                    <DataTable.Title>Status</DataTable.Title>
                  </DataTable.Header>

                  {getActiveSubscriptions().map((subscription) => (
                    <DataTable.Row key={subscription.id}>
                      <DataTable.Cell>{subscription.quantity} eggs/week</DataTable.Cell>
                      <DataTable.Cell>{subscription.weeksRemaining} weeks</DataTable.Cell>
                      <DataTable.Cell>
                        <Chip mode="flat" style={styles.activeChip}>
                          {subscription.status}
                        </Chip>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>
          )}

          {/* Pending Orders */}
          {getPendingOrders().length > 0 && (
            <Card style={styles.tableCard} mode="elevated">
              <Card.Title 
                title="Pending Orders" 
                titleVariant="titleLarge"
                left={(props) => <IconButton {...props} icon="clock-outline" />}
              />
              <Card.Content>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Week</DataTable.Title>
                    <DataTable.Title>Quantity</DataTable.Title>
                    <DataTable.Title>Total</DataTable.Title>
                    <DataTable.Title>Type</DataTable.Title>
                    <DataTable.Title>Paid</DataTable.Title>
                  </DataTable.Header>

                  {getPendingOrders().map((order) => (
                    <DataTable.Row key={order.id}>
                      <DataTable.Cell>
                        {new Date(order.weekStart!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </DataTable.Cell>
                      <DataTable.Cell>{order.quantity} eggs</DataTable.Cell>
                      <DataTable.Cell>{order.total.toFixed(0)} RSD</DataTable.Cell>
                      <DataTable.Cell>
                        <Chip mode="flat" style={order.isSubscription ? styles.subscriptionChip : styles.oneTimeChip} compact>
                          {order.isSubscription ? 'Sub' : 'One-time'}
                        </Chip>
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <Chip mode="flat" style={order.isPaid ? styles.paidChip : styles.unpaidChip} compact>
                          {order.isPaid ? 'Paid' : 'Unpaid'}
                        </Chip>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>
          )}

          {/* Order History */}
          {getCompletedOrders().length > 0 && (
            <Card style={styles.tableCard} mode="elevated">
              <Card.Title 
                title="Order History" 
                titleVariant="titleLarge"
                left={(props) => <IconButton {...props} icon="history" />}
              />
              <Card.Content>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Week</DataTable.Title>
                    <DataTable.Title>Quantity</DataTable.Title>
                    <DataTable.Title>Total</DataTable.Title>
                    <DataTable.Title>Status</DataTable.Title>
                  </DataTable.Header>

                  {getCompletedOrders().slice(0, 10).map((order) => (
                    <DataTable.Row key={order.id}>
                      <DataTable.Cell>
                        {new Date(order.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </DataTable.Cell>
                      <DataTable.Cell>{order.quantity} eggs</DataTable.Cell>
                      <DataTable.Cell>{order.total.toFixed(0)} RSD</DataTable.Cell>
                      <DataTable.Cell>
                        <Chip mode="flat" style={styles.completedChip}>
                          Completed
                        </Chip>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
                {getCompletedOrders().length > 10 && (
                  <Text style={styles.moreText}>
                    + {getCompletedOrders().length - 10} more orders
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Inactive Subscriptions */}
          {getInactiveSubscriptions().length > 0 && (
            <Card style={styles.tableCard} mode="elevated">
              <Card.Title 
                title="Past Subscriptions" 
                titleVariant="titleLarge"
                left={(props) => <IconButton {...props} icon="calendar-remove" />}
              />
              <Card.Content>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Period</DataTable.Title>
                    <DataTable.Title>Quantity</DataTable.Title>
                    <DataTable.Title>Status</DataTable.Title>
                  </DataTable.Header>

                  {getInactiveSubscriptions().map((subscription) => (
                    <DataTable.Row key={subscription.id}>
                      <DataTable.Cell>{subscription.period} weeks</DataTable.Cell>
                      <DataTable.Cell>{subscription.quantity} eggs/week</DataTable.Cell>
                      <DataTable.Cell>
                        <Chip mode="flat" style={styles.inactiveChip}>
                          {subscription.status}
                        </Chip>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>
              </Card.Content>
            </Card>
          )}

          {orders.length === 0 && subscriptions.length === 0 && (
            <Surface style={styles.emptyCard} elevation={2}>
              <Text style={styles.emptyText}>No orders or subscriptions yet</Text>
            </Surface>
          )}
        </RNView>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    minHeight: '100%',
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 16,
  },
  backButtonContainer: {
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  userCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  adminChip: {
    backgroundColor: '#ff6b35',
  },
  customerChip: {
    backgroundColor: '#4ecdc4',
  },
  divider: {
    marginVertical: 16,
  },
  userInfoGrid: {
    gap: 16,
  },
  userInfoItem: {
    marginBottom: 12,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userInfoValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '500',
  },
  statsCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tableCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  activeChip: {
    backgroundColor: '#d4f4dd',
  },
  subscriptionChip: {
    backgroundColor: '#f3e5f5',
  },
  oneTimeChip: {
    backgroundColor: '#e3f2fd',
  },
  paidChip: {
    backgroundColor: '#d4f4dd',
  },
  unpaidChip: {
    backgroundColor: '#ffe0e0',
  },
  completedChip: {
    backgroundColor: '#e3f2fd',
  },
  inactiveChip: {
    backgroundColor: '#f5f5f5',
  },
  moreText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});

