import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, Chip, Button, ActivityIndicator, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '@/services/api';
import { Order } from '@/types/models';

export default function OrderHistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiService.getOrders();
      // Sort by date descending (newest first)
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string, isPaid: boolean) => {
    if (status === 'completed') return '#4caf50';
    if (status === 'delivered' && isPaid) return '#4caf50';
    if (status === 'delivered' && !isPaid) return '#ff9800';
    return '#999999';
  };

  const getStatusText = (order: Order) => {
    if (order.status === 'completed') return t('orderHistory.completed');
    if (order.status === 'delivered') {
      if (order.isPaid) return t('orderHistory.delivered');
      return t('orderHistory.awaitingPayment');
    }
    return t('orderHistory.pending');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatWeekRange = (order: Order) => {
    if (order.weekStart && order.weekEnd) {
      return `${formatDate(order.weekStart)} - ${formatDate(order.weekEnd)}`;
    }
    // Fallback to createdAt if week info not available
    return formatDate(order.createdAt);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Button 
            icon="arrow-left" 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            {t('common.back')}
          </Button>
          <Text style={styles.title}>{t('settings.orderHistory')}</Text>
          <Text style={styles.subtitle}>
            {t('orderHistory.totalOrders', { count: orders.length })}
          </Text>
        </View>

        {orders.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text style={styles.emptyText}>{t('orderHistory.noOrders')}</Text>
          </Surface>
        ) : (
          orders.map((order) => (
            <Surface key={order.id} style={styles.orderCard} elevation={1}>
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Text style={styles.orderDate}>{formatWeekRange(order)}</Text>
                  <Text style={styles.orderAmount}>{order.total} RSD</Text>
                </View>
                <View style={styles.chipColumn}>
                  <Chip 
                    style={[styles.typeChip, { 
                      backgroundColor: order.type === 'subscription' 
                        ? 'rgba(78, 205, 196, 0.15)' 
                        : 'rgba(255, 107, 53, 0.15)' 
                    }]}
                    textStyle={{ 
                      color: order.type === 'subscription' ? '#4ecdc4' : '#ff6b35',
                      fontSize: 12,
                    }}
                  >
                    {order.type === 'subscription' 
                      ? t('orderHistory.subscription') 
                      : t('orderHistory.oneTime')}
                  </Chip>
                  <Chip 
                    style={[styles.statusChip, { backgroundColor: getStatusColor(order.status, order.isPaid) + '22' }]}
                    textStyle={{ color: getStatusColor(order.status, order.isPaid), fontSize: 12, lineHeight: 16 }}
                  >
                    {getStatusText(order)}
                  </Chip>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('orderHistory.quantity')}</Text>
                  <Text style={styles.detailValue}>{order.quantity} {t('common.eggs')}</Text>
                </View>
                {order.paymentConfirmedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('orderHistory.paidOn')}</Text>
                    <Text style={styles.detailValue}>{formatFullDate(order.paymentConfirmedAt)}</Text>
                  </View>
                )}
              </View>

              {order.pickedUp && (
                <View style={styles.pickedUpBadge}>
                  <Text style={styles.pickedUpText}>✓ {t('orderHistory.pickedUp')}</Text>
                </View>
              )}
            </Surface>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef5f1',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: -8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  chipColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  typeChip: {
    height: 28,
    minWidth: 85,
  },
  statusChip: {
    height: 28,
    minWidth: 85,
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d3748',
  },
  pickedUpBadge: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pickedUpText: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '500',
  },
});

