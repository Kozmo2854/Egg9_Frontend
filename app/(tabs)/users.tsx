import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View as RNView, RefreshControl, Platform, TouchableOpacity } from 'react-native';
import { View } from '@/components/Themed';
import { 
  Text, 
  useTheme,
  Card,
  DataTable,
  Chip,
  IconButton,
  Surface,
  Divider,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '@/services/api';
import { User } from '@/types/models';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export default function UsersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

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

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedUsers = await apiService.getAllUsersAdmin();
      setUsers(fetchedUsers);
    } catch (error) {
      // Error loading users - could add user-facing error handling here
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const getCustomers = () => users.filter(user => user.role === 'customer');
  const getAdmins = () => users.filter(user => user.role === 'admin');

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadUsers} />
      }
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <RNView style={styles.content}>
          {/* Header */}
          <Surface style={styles.headerCard} elevation={4}>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              👥 User Management
            </Text>
            <RNView style={styles.statsContainer}>
              <RNView style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {getCustomers().length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Customers
                </Text>
              </RNView>
              <Divider style={styles.statDivider} />
              <RNView style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {getAdmins().length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Admins
                </Text>
              </RNView>
              <Divider style={styles.statDivider} />
              <RNView style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {users.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Total Users
                </Text>
              </RNView>
            </RNView>
          </Surface>

          {/* Customers Table */}
          <Card style={styles.tableCard} mode="elevated">
            <Card.Title 
              title="Customers" 
              titleVariant="titleLarge"
              left={(props) => <IconButton {...props} icon="account-group" />}
            />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 2 }}>Name</DataTable.Title>
                  <DataTable.Title style={{ flex: 2 }}>Phone</DataTable.Title>
                </DataTable.Header>

                {getCustomers().length === 0 ? (
                  <RNView style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No customers yet</Text>
                  </RNView>
                ) : (
                  getCustomers().map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => router.push(`/(tabs)/user-details?userId=${user.id}`)}
                    >
                      <DataTable.Row>
                        <DataTable.Cell style={{ flex: 2 }}>
                          <Text style={styles.userName}>{user.name}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={{ flex: 2 }}>
                          <Text style={styles.userContact}>
                            {user.phoneNumber || 'No phone'}
                          </Text>
                        </DataTable.Cell>
                      </DataTable.Row>
                    </TouchableOpacity>
                  ))
                )}
              </DataTable>
            </Card.Content>
          </Card>

          {/* Admins Table */}
          <Card style={styles.tableCard} mode="elevated">
            <Card.Title 
              title="Administrators" 
              titleVariant="titleLarge"
              left={(props) => <IconButton {...props} icon="shield-account" />}
            />
            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 2 }}>Name</DataTable.Title>
                  <DataTable.Title style={{ flex: 2 }}>Phone</DataTable.Title>
                </DataTable.Header>

                {getAdmins().length === 0 ? (
                  <RNView style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No administrators</Text>
                  </RNView>
                ) : (
                  getAdmins().map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      onPress={() => router.push(`/(tabs)/user-details?userId=${user.id}`)}
                    >
                      <DataTable.Row>
                        <DataTable.Cell style={{ flex: 2 }}>
                          <Text style={styles.userName}>{user.name}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={{ flex: 2 }}>
                          <Text style={styles.userContact}>
                            {user.phoneNumber || 'No phone'}
                          </Text>
                        </DataTable.Cell>
                      </DataTable.Row>
                    </TouchableOpacity>
                  ))
                )}
              </DataTable>
            </Card.Content>
          </Card>
        </RNView>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    minHeight: '100%',
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 16,
  },
  headerCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2d3748',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    height: 40,
    width: 1,
  },
  tableCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  userName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#2d3748',
  },
  userContact: {
    fontSize: 13,
    color: '#2d3748',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});

