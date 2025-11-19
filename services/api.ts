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
 * Connects to Laravel backend API
 * All methods use real fetch() calls to the backend
 * 
 * Usage:
 *   import { apiService } from '@/services/api';
 *   const stock = await apiService.getWeeklyStock();
 */

class ApiService {
  private baseUrl: string = 'http://localhost:8000/api';

  // ============================================
  // HELPER METHODS
  // ============================================

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    
    // Store token and user
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // First check AsyncStorage
      const stored = await AsyncStorage.getItem('currentUser');
      if (stored) {
        return JSON.parse(stored);
      }

      // If no stored user, fetch from API
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/user`, {
        headers: await this.getAuthHeaders(),
      });

      if (response.ok) {
        const user = await response.json();
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));
        return user;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ name, email, password }),
    });

    const data = await this.handleResponse<AuthResponse>(response);
    
    // Store token and user
    await AsyncStorage.setItem('auth_token', data.token);
    await AsyncStorage.setItem('currentUser', JSON.stringify(data.user));
    
    return data;
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      });
    } catch (error) {
      // Ignore errors on logout
    }

    // Clear local storage
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('currentUser');
  }

  // ============================================
  // WEEKLY STOCK
  // ============================================

  async getWeeklyStock(): Promise<WeeklyStock> {
    const response = await fetch(`${this.baseUrl}/weekly-stock`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ weeklyStock: WeeklyStock }>(response);
    return data.weeklyStock;
  }

  async updateWeeklyStock(availableEggs: number): Promise<WeeklyStock> {
    const response = await fetch(`${this.baseUrl}/weekly-stock`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ availableEggs }),
    });

    const data = await this.handleResponse<{ weeklyStock: WeeklyStock }>(response);
    return data.weeklyStock;
  }

  // ============================================
  // ORDERS
  // ============================================

  async createOrder(quantity: number, pricePerDozen: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ quantity }),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
  }

  async updateOrder(orderId: number, newQuantity: number, pricePerDozen: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ quantity: newQuantity }),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
  }

  async getCurrentWeekOrder(): Promise<Order | null> {
    const response = await fetch(`${this.baseUrl}/orders/current-week`, {
      headers: await this.getAuthHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    const data = await this.handleResponse<{ order: Order | null }>(response);
    return data.order;
  }

  async cancelOrder(orderId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    await this.handleResponse(response);
  }

  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ orders: Order[] }>(response);
    return data.orders;
  }

  async getAvailableEggsForUser(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/available-eggs`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ availableEggs: number }>(response);
    return data.availableEggs;
  }

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  async createSubscription(quantity: number, period: number): Promise<Subscription> {
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ quantity, period }),
    });

    const data = await this.handleResponse<{ subscription: Subscription }>(response);
    return data.subscription;
  }

  async getSubscription(): Promise<Subscription | null> {
    const response = await fetch(`${this.baseUrl}/subscriptions/current`, {
      headers: await this.getAuthHeaders(),
    });

    if (response.status === 404) {
      return null;
    }

    const data = await this.handleResponse<{ subscription: Subscription | null }>(response);
    return data.subscription;
  }

  async cancelSubscription(): Promise<void> {
    const subscription = await this.getSubscription();
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const response = await fetch(`${this.baseUrl}/subscriptions/${subscription.id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    await this.handleResponse(response);
  }

  // ============================================
  // ADMIN - ORDERS & SUBSCRIPTIONS
  // ============================================

  async getAllOrdersAdmin(): Promise<Order[]> {
    const response = await fetch(`${this.baseUrl}/admin/orders`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ orders: Order[] }>(response);
    return data.orders;
  }

  async getAllSubscriptionsAdmin(): Promise<Subscription[]> {
    const response = await fetch(`${this.baseUrl}/admin/subscriptions`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ subscriptions: Subscription[] }>(response);
    return data.subscriptions;
  }

  // ============================================
  // ADMIN - STOCK & DELIVERY
  // ============================================

  async updateWeeklyStockAdmin(newAmount: number): Promise<WeeklyStock> {
    const response = await fetch(`${this.baseUrl}/admin/weekly-stock`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ availableEggs: newAmount }),
    });

    const data = await this.handleResponse<{ weeklyStock: WeeklyStock }>(response);
    return data.weeklyStock;
  }

  async updateDeliveryInfo(deliveryDate?: string, deliveryTime?: string): Promise<WeeklyStock> {
    const response = await fetch(`${this.baseUrl}/admin/delivery-info`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ 
        deliveryDate: deliveryDate || null, 
        deliveryTime: deliveryTime || null 
      }),
    });

    const data = await this.handleResponse<{ weeklyStock: WeeklyStock }>(response);
    return data.weeklyStock;
  }

  async markAllOrdersDelivered(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/orders/mark-delivered`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    await this.handleResponse(response);
  }

  // ============================================
  // ADMIN - ORDER MANAGEMENT
  // ============================================

  async approveOrder(orderId: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/admin/orders/${orderId}/approve`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
  }

  async declineOrder(orderId: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/admin/orders/${orderId}/decline`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
  }

  // ============================================
  // DEVELOPMENT HELPER
  // ============================================

  async clearAllData(): Promise<void> {
    // For development: just clear local storage
    // The backend manages its own data
    await AsyncStorage.multiRemove(['auth_token', 'currentUser']);
  }
}

export const apiService = new ApiService();
