import { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View as RNView } from 'react-native';
import { View } from '@/components/Themed';
import { 
  Card, 
  Text, 
  ActivityIndicator, 
  Chip, 
  useTheme,
  Surface,
  IconButton 
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { WeeklyStock } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const theme = useTheme();
  const [weeklyStock, setWeeklyStock] = useState<WeeklyStock | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentWeekOrder, setCurrentWeekOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDeliveryDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
    });
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroEmoji}>🥚</Text>
        <Text style={styles.heroTitle}>Egg9</Text>
        <Text style={styles.heroSubtitle}>
          {formatDate(weeklyStock.weekStart)} - {formatDate(weeklyStock.weekEnd)}
        </Text>
        
        {/* Stats Cards */}
        <RNView style={styles.statsRow}>
          <Surface style={styles.statCard} elevation={4}>
            <Text style={styles.statNumber}>{availableEggs}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </Surface>
          
          <Surface style={styles.statCard} elevation={4}>
            <Text style={styles.statNumber}>${weeklyStock.pricePerDozen}</Text>
            <Text style={styles.statLabel}>Per Dozen</Text>
          </Surface>
        </RNView>
      </LinearGradient>

      <RNView style={styles.content}>
        {/* Delivery Status */}
        <Card style={styles.deliveryCard} mode="elevated">
          {weeklyStock.allOrdersDelivered ? (
            <LinearGradient
              colors={[theme.colors.tertiary, theme.colors.tertiaryContainer]}
              style={styles.deliveryGradient}
            >
              <RNView style={styles.deliveryContent}>
                <RNView style={styles.deliveryIconCircle}>
                  <Text style={styles.deliveryIconCheck}>✓</Text>
                </RNView>
                <Text style={styles.deliveryTitle}>Orders Delivered!</Text>
                <Text style={styles.deliverySubtitle}>
                  This week's orders have been delivered
                </Text>
              </RNView>
            </LinearGradient>
          ) : weeklyStock.deliveryDate && weeklyStock.deliveryTime ? (
            <Card.Content style={styles.deliveryPadding}>
              <RNView style={styles.deliveryHeader}>
                <RNView style={styles.deliveryIconContainer}>
                  <Text style={styles.deliveryIcon}>🚚</Text>
                </RNView>
                <RNView style={styles.deliveryInfo}>
                  <Text variant="titleMedium" style={styles.deliveryInfoTitle}>
                    Delivery Scheduled
                  </Text>
                  <Text variant="bodyLarge" style={styles.deliveryDate}>
                    {formatDeliveryDate(weeklyStock.deliveryDate)}
                  </Text>
                  <Chip icon="clock-outline" style={styles.timeChip} mode="flat">
                    {weeklyStock.deliveryTime}
                  </Chip>
                </RNView>
              </RNView>
            </Card.Content>
          ) : (
            <Card.Content style={styles.deliveryPadding}>
              <RNView style={styles.deliveryPendingContainer}>
                <Text style={styles.deliveryPendingIcon}>📅</Text>
                <Text variant="titleMedium" style={styles.deliveryPendingText}>
                  Delivery time pending
                </Text>
                <Text variant="bodySmall" style={styles.deliveryPendingSubtext}>
                  We'll notify you once scheduled
                </Text>
              </RNView>
            </Card.Content>
          )}
        </Card>

        {/* Your Orders */}
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Your Orders
        </Text>

        {/* Subscription */}
        <Surface style={styles.orderCard} elevation={2}>
          <LinearGradient
            colors={subscription ? [theme.colors.primaryContainer, theme.colors.surfaceVariant] : ['#f5f5f5', '#fafafa']}
            style={styles.orderGradient}
          >
            <RNView style={styles.orderContent}>
              <RNView style={styles.orderHeader}>
                <RNView style={styles.orderIconContainer}>
                  <Text style={styles.orderIcon}>📅</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.orderTitle}>
                  Subscription
                </Text>
              </RNView>
              
              {subscription ? (
                <RNView style={styles.orderDetails}>
                  <Chip icon="check-circle" mode="flat" style={styles.activeChip}>
                    Active
                  </Chip>
                  <Text variant="headlineSmall" style={styles.orderQuantity}>
                    {subscription.quantity} eggs
                  </Text>
                  <Text variant="bodyMedium" style={styles.orderFrequency}>
                    delivered weekly
                  </Text>
                </RNView>
              ) : (
                <Text variant="bodyMedium" style={styles.orderInactive}>
                  No active subscription
                </Text>
              )}
            </RNView>
          </LinearGradient>
        </Surface>

        {/* One-Time Order */}
        <Surface style={styles.orderCard} elevation={2}>
          <LinearGradient
            colors={currentWeekOrder ? [theme.colors.secondaryContainer, theme.colors.surfaceVariant] : ['#f5f5f5', '#fafafa']}
            style={styles.orderGradient}
          >
            <RNView style={styles.orderContent}>
              <RNView style={styles.orderHeader}>
                <RNView style={styles.orderIconContainer}>
                  <Text style={styles.orderIcon}>🛒</Text>
                </RNView>
                <Text variant="titleLarge" style={styles.orderTitle}>
                  This Week
                </Text>
              </RNView>
              
              {currentWeekOrder ? (
                <RNView style={styles.orderDetails}>
                  <Chip icon="check-circle" mode="flat" style={styles.activeChip}>
                    Ordered
                  </Chip>
                  <Text variant="headlineSmall" style={styles.orderQuantity}>
                    {currentWeekOrder.quantity} eggs
                  </Text>
                  <Text variant="bodyMedium" style={styles.orderPrice}>
                    ${currentWeekOrder.total.toFixed(2)}
                  </Text>
                </RNView>
              ) : (
                <Text variant="bodyMedium" style={styles.orderInactive}>
                  No order for this week
                </Text>
              )}
            </RNView>
          </LinearGradient>
        </Surface>
      </RNView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
  },
  hero: {
    padding: 32,
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    marginBottom: 24,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 400,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  deliveryCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  deliveryGradient: {
    padding: 24,
  },
  deliveryContent: {
    alignItems: 'center',
  },
  deliveryIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  deliveryIconCheck: {
    fontSize: 32,
    color: '#4ecdc4',
  },
  deliveryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  deliverySubtitle: {
    fontSize: 16,
    color: '#2d3748',
    opacity: 0.85,
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  deliveryPadding: {
    padding: 20,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deliveryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff0eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryIcon: {
    fontSize: 28,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryDate: {
    fontWeight: '600',
    marginBottom: 8,
  },
  timeChip: {
    alignSelf: 'flex-start',
  },
  deliveryPendingContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deliveryPendingIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  deliveryPendingText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deliveryPendingSubtext: {
    opacity: 0.7,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  orderCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  orderGradient: {
    borderRadius: 20,
  },
  orderContent: {
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  orderIconContainer: {
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
  orderIcon: {
    fontSize: 24,
  },
  orderTitle: {
    fontWeight: 'bold',
  },
  orderDetails: {
    alignItems: 'center',
    paddingTop: 8,
  },
  activeChip: {
    marginBottom: 12,
  },
  orderQuantity: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderFrequency: {
    opacity: 0.8,
  },
  orderPrice: {
    opacity: 0.8,
  },
  orderInactive: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 12,
  },
});
