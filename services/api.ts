import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  WeeklyStock,
  Order, 
  Subscription, 
  AuthResponse
} from '@/types/models';

/**
 * API Service Layer
 * 
 * Currently uses mock data stored in AsyncStorage.
 * When Laravel backend is ready, replace method implementations with real fetch() calls.
 * 
 * Usage:
 *   import { apiService } from '@/services/api';
 *   const stock = await apiService.getWeeklyStock();
 */

class ApiService {
  private baseUrl: string = 'http://localhost:8000/api'; // Your Laravel API URL
  private authToken: string | null = null;

  // ============================================
  // MOCK DATA (Remove when API is ready)
  // ============================================
  
  // Hardcoded credentials
  private readonly MOCK_CREDENTIALS = [
    {
      id: 1,
      email: 'admin@egg9.com',
      password: 'password123',
      name: 'Admin User',
      role: 'admin' as const,
    },
    {
      id: 2,
      email: 'user1@egg9.com',
      password: 'password123',
      name: 'John Smith',
      role: 'customer' as const,
    },
    {
      id: 3,
      email: 'user2@egg9.com',
      password: 'password123',
      name: 'Jane Doe',
      role: 'customer' as const,
    },
  ];

  // Current week's stock
  private mockWeeklyStock: WeeklyStock = {
    weekStart: new Date().toISOString(),
    weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    availableEggs: 250,
    pricePerDozen: 5.99,
    isOrderingOpen: true,
    deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    deliveryTime: '10:00 AM - 2:00 PM',
    allOrdersDelivered: false,
  };

  private currentUser: User | null = null;

  // ============================================
  // AUTHENTICATION
  // ============================================

  // Helper to clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'allOrders',
        'allSubscriptions',
        'weeklyStock'
      ]);
      // Reset stock to initial state
      await AsyncStorage.setItem('weeklyStock', JSON.stringify(this.mockWeeklyStock));
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    // const data = await response.json();
    // this.authToken = data.token;
    // return data;

    // Mock implementation with credential verification
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Find user by credentials
        const user = this.MOCK_CREDENTIALS.find(
          u => u.email === email && u.password === password
        );
        
        if (user) {
          this.authToken = `mock-token-${user.id}`;
          this.currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: new Date().toISOString(),
          };
          
          // Store current user in AsyncStorage
          AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          
          resolve({
            user: this.currentUser,
            token: this.authToken,
          });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 800); // Simulate network delay
    });
  }

  async getCurrentUser(): Promise<User | null> {
    // Check memory first
    if (this.currentUser) {
      return this.currentUser;
    }
    
    // Check AsyncStorage
    try {
      const stored = await AsyncStorage.getItem('currentUser');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch (error) {
      // Ignore error
    }
    
    return null;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/register`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ name, email, password })
    // });
    // return await response.json();

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: Date.now(), // Generate unique ID
          name,
          email,
          role: 'customer',
          createdAt: new Date().toISOString(),
        };
        this.authToken = `mock-token-${newUser.id}`;
        this.currentUser = newUser;
        
        AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        resolve({
          user: newUser,
          token: this.authToken,
        });
      }, 500);
    });
  }

  async logout(): Promise<void> {
    // TODO: Replace with real API call
    // await fetch(`${this.baseUrl}/logout`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders()
    // });

    this.authToken = null;
    this.currentUser = null;
    await AsyncStorage.removeItem('currentUser');
  }

  // ============================================
  // WEEKLY STOCK
  // ============================================

  async getWeeklyStock(): Promise<WeeklyStock> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/weekly-stock`);
    // return await response.json();

    // Mock implementation with AsyncStorage persistence
    try {
      const stored = await AsyncStorage.getItem('weeklyStock');
      if (stored) {
        return JSON.parse(stored);
      }
      // First time - save mock data
      await AsyncStorage.setItem('weeklyStock', JSON.stringify(this.mockWeeklyStock));
      return this.mockWeeklyStock;
    } catch (error) {
      // Fallback to mock data if storage fails
      return this.mockWeeklyStock;
    }
  }

  async updateWeeklyStock(availableEggs: number): Promise<WeeklyStock> {
    // TODO: Replace with real API call
    
    // Mock implementation - update local storage
    try {
      const stock = await this.getWeeklyStock();
      stock.availableEggs = availableEggs;
      await AsyncStorage.setItem('weeklyStock', JSON.stringify(stock));
      return stock;
    } catch (error) {
      throw new Error('Failed to update stock');
    }
  }

  // ============================================
  // ORDERS
  // ============================================

  async createOrder(quantity: number, pricePerDozen: number): Promise<Order> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/orders`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({ quantity, pricePerDozen })
    // });
    // return await response.json();

    // Mock implementation with stock reduction
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      const stock = await this.getWeeklyStock();
      const available = await this.getAvailableEggsForUser();
      
      // Check if enough stock
      if (quantity > available) {
        throw new Error('Not enough eggs available');
      }

      const order: Order = {
        id: Date.now(), // Use timestamp for unique ID
        userId: user.id,
        userName: user.name,
        products: [{
          productId: 1,
          quantity,
          price: (quantity / 10) * pricePerDozen,
        }],
        total: (quantity / 10) * pricePerDozen,
        status: 'pending',
        deliveryStatus: 'not_delivered',
        createdAt: new Date().toISOString(),
      };

      // Reduce stock
      await this.updateWeeklyStock(stock.availableEggs - quantity);

      // Save order to storage (all users' orders)
      const allOrders = await this.getAllOrders();
      allOrders.push(order);
      await AsyncStorage.setItem('allOrders', JSON.stringify(allOrders));

      return order;
    } catch (error) {
      throw error;
    }
  }

  async updateOrder(orderId: number, newQuantity: number, pricePerDozen: number): Promise<Order> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
    //   method: 'PUT',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({ quantity: newQuantity })
    // });
    // return await response.json();

    // Mock implementation
    try {
      const allOrders = await this.getAllOrders();
      const orderIndex = allOrders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      const currentOrder = allOrders[orderIndex];
      const oldQuantity = currentOrder.products[0].quantity;
      const quantityDifference = newQuantity - oldQuantity;

      // Check available stock
      const stock = await this.getWeeklyStock();
      const newStockAmount = stock.availableEggs - quantityDifference;
      
      if (newStockAmount < 0) {
        throw new Error('Not enough eggs available');
      }

      // Update order
      currentOrder.products[0].quantity = newQuantity;
      currentOrder.products[0].price = (newQuantity / 10) * pricePerDozen;
      currentOrder.total = (newQuantity / 10) * pricePerDozen;
      
      allOrders[orderIndex] = currentOrder;
      
      // Save updated orders
      await AsyncStorage.setItem('allOrders', JSON.stringify(allOrders));
      
      // Update stock
      await this.updateWeeklyStock(newStockAmount);

      return currentOrder;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentWeekOrder(): Promise<Order | null> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/orders/current-week`, {
    //   headers: this.getAuthHeaders()
    // });
    // return await response.json();

    // Mock implementation - get current user's most recent order
    try {
      const orders = await this.getOrders();
      // For simplicity, return the last order as "current week's order"
      // In real app, you'd filter by date
      return orders.length > 0 ? orders[orders.length - 1] : null;
    } catch (error) {
      return null;
    }
  }

  // Get ALL orders (all users) - used internally for stock calculations
  private async getAllOrders(): Promise<Order[]> {
    try {
      const stored = await AsyncStorage.getItem('allOrders');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  async cancelOrder(orderId: number): Promise<void> {
    // TODO: Replace with real API call
    // await fetch(`${this.baseUrl}/orders/${orderId}`, {
    //   method: 'DELETE',
    //   headers: this.getAuthHeaders()
    // });

    // Mock implementation
    try {
      const allOrders = await this.getAllOrders();
      const orderIndex = allOrders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        throw new Error('Order not found');
      }

      const order = allOrders[orderIndex];
      const orderQuantity = order.products[0].quantity;

      // Remove order from storage
      allOrders.splice(orderIndex, 1);
      await AsyncStorage.setItem('allOrders', JSON.stringify(allOrders));

      // Restore stock
      const stock = await this.getWeeklyStock();
      await this.updateWeeklyStock(stock.availableEggs + orderQuantity);
    } catch (error) {
      throw new Error('Failed to cancel order');
    }
  }

  async getOrders(): Promise<Order[]> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/orders`, {
    //   headers: this.getAuthHeaders()
    // });
    // return await response.json();

    // Mock implementation - get current user's orders only
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];
      
      const allOrders = await this.getAllOrders();
      return allOrders.filter(order => order.userId === user.id);
    } catch (error) {
      return [];
    }
  }

  // Helper: Get available eggs for current user (considering all users' orders/subscriptions)
  async getAvailableEggsForUser(): Promise<number> {
    try {
      const stock = await this.getWeeklyStock();
      const allSubscriptions = await this.getAllSubscriptions();
      
      let available = stock.availableEggs;
      
      // Subtract all subscriptions (from all users)
      allSubscriptions.forEach(sub => {
        available -= sub.quantity;
      });
      
      return Math.max(0, available);
    } catch (error) {
      return 0;
    }
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  async createSubscription(quantity: number, period: number): Promise<Subscription> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/subscriptions`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({ quantity, period })
    // });
    // return await response.json();

    // Mock implementation - max 30 eggs, period 4-12 weeks
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }

      if (quantity > 30) {
        throw new Error('Maximum subscription is 30 eggs per week');
      }

      if (period < 4 || period > 12) {
        throw new Error('Subscription period must be between 4 and 12 weeks');
      }

      const subscription: Subscription = {
        id: Date.now(), // Use timestamp for unique ID
        userId: user.id,
        productId: 1,
        quantity,
        period,
        frequency: 'weekly',
        status: 'active',
        nextDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save to storage (all users' subscriptions)
      const allSubscriptions = await this.getAllSubscriptions();
      // Remove existing subscription for this user if any
      const filtered = allSubscriptions.filter(s => s.userId !== user.id);
      filtered.push(subscription);
      await AsyncStorage.setItem('allSubscriptions', JSON.stringify(filtered));

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  async getSubscription(): Promise<Subscription | null> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/subscription`, {
    //   headers: this.getAuthHeaders()
    // });
    // return await response.json();

    // Mock implementation - get current user's subscription
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;
      
      const allSubscriptions = await this.getAllSubscriptions();
      const userSub = allSubscriptions.find(s => s.userId === user.id && s.status === 'active');
      return userSub || null;
    } catch (error) {
      return null;
    }
  }

  // Get ALL subscriptions (all users) - used internally for stock calculations
  private async getAllSubscriptions(): Promise<Subscription[]> {
    try {
      const stored = await AsyncStorage.getItem('allSubscriptions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  async cancelSubscription(): Promise<void> {
    // TODO: Replace with real API call
    // await fetch(`${this.baseUrl}/subscription`, {
    //   method: 'DELETE',
    //   headers: this.getAuthHeaders()
    // });

    // Mock implementation - remove current user's subscription
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('User not logged in');
      }
      
      const allSubscriptions = await this.getAllSubscriptions();
      const filtered = allSubscriptions.filter(s => s.userId !== user.id);
      await AsyncStorage.setItem('allSubscriptions', JSON.stringify(filtered));
    } catch (error) {
      throw new Error('Failed to cancel subscription');
    }
  }

  // ============================================
  // ADMIN METHODS
  // ============================================

  async getAllOrdersAdmin(): Promise<Order[]> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/admin/orders`, {
    //   headers: this.getAuthHeaders()
    // });
    // return await response.json();

    // Mock implementation - get all orders with user names
    try {
      const allOrders = await this.getAllOrders();
      return allOrders;
    } catch (error) {
      return [];
    }
  }

  async getAllSubscriptionsAdmin(): Promise<Subscription[]> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/admin/subscriptions`, {
    //   headers: this.getAuthHeaders()
    // });
    // return await response.json();

    // Mock implementation - get all subscriptions with user names
    try {
      const allSubscriptions = await this.getAllSubscriptions();
      // Add user names
      const users = this.MOCK_CREDENTIALS;
      return allSubscriptions.map(sub => ({
        ...sub,
        userName: users.find(u => u.id === sub.userId)?.name || 'Unknown User',
      }));
    } catch (error) {
      return [];
    }
  }

  async updateWeeklyStockAdmin(newAmount: number): Promise<WeeklyStock> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/admin/weekly-stock`, {
    //   method: 'PUT',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({ availableEggs: newAmount })
    // });
    // return await response.json();

    // Mock implementation
    return await this.updateWeeklyStock(newAmount);
  }

  async updateDeliveryInfo(deliveryDate?: string, deliveryTime?: string): Promise<WeeklyStock> {
    // TODO: Replace with real API call
    // const response = await fetch(`${this.baseUrl}/admin/delivery`, {
    //   method: 'PUT',
    //   headers: this.getAuthHeaders(),
    //   body: JSON.stringify({ deliveryDate, deliveryTime })
    // });
    // return await response.json();

    // Mock implementation
    try {
      const stock = await this.getWeeklyStock();
      stock.deliveryDate = deliveryDate;
      stock.deliveryTime = deliveryTime;
      await AsyncStorage.setItem('weeklyStock', JSON.stringify(stock));
      return stock;
    } catch (error) {
      throw new Error('Failed to update delivery info');
    }
  }

  async markAllOrdersDelivered(): Promise<void> {
    // TODO: Replace with real API call
    // await fetch(`${this.baseUrl}/admin/orders/deliver-all`, {
    //   method: 'POST',
    //   headers: this.getAuthHeaders()
    // });

    // Mock implementation
    try {
      const allOrders = await this.getAllOrders();
      
      // Mark all orders as delivered
      allOrders.forEach(order => {
        order.deliveryStatus = 'delivered';
      });
      
      await AsyncStorage.setItem('allOrders', JSON.stringify(allOrders));
      
      // Update weekly stock to mark all orders as delivered
      const stock = await this.getWeeklyStock();
      stock.allOrdersDelivered = true;
      await AsyncStorage.setItem('weeklyStock', JSON.stringify(stock));
    } catch (error) {
      throw new Error('Failed to mark orders as delivered');
    }
  }

  // ============================================
  // ADMIN - ORDER MANAGEMENT
  // ============================================

  async approveOrder(orderId: number): Promise<Order> {
    // TODO: Replace with real API call

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: orderId,
          userId: 1,
          products: [],
          total: 0,
          status: 'approved',
          deliveryStatus: 'not_delivered',
          createdAt: new Date().toISOString(),
        });
      }, 300);
    });
  }

  async declineOrder(orderId: number): Promise<Order> {
    // TODO: Replace with real API call

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: orderId,
          userId: 1,
          products: [],
          total: 0,
          status: 'declined',
          deliveryStatus: 'not_delivered',
          createdAt: new Date().toISOString(),
        });
      }, 300);
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
    };
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  isAuthenticated(): boolean {
    return this.authToken !== null;
  }
}

// Export singleton instance
export const apiService = new ApiService();

