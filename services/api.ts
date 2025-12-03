import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  UserDetails,
  Week,
  AppSettings,
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
 *   const week = await apiService.getWeeklyStock();
 */

class ApiService {
  private baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

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
      const error: any = new Error(data.message || 'Request failed');
      error.statusCode = response.status;
      error.data = data;
      throw error;
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

  async register(name: string, email: string, phoneNumber: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ 
        name, 
        email, 
        phone_number: phoneNumber, 
        password 
      }),
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

  async getWeeklyStock(): Promise<Week> {
    const response = await fetch(`${this.baseUrl}/week/current`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ week: Week }>(response);
    return data.week;
  }

  async getAppSettings(): Promise<AppSettings> {
    const response = await fetch(`${this.baseUrl}/settings`, {
      headers: await this.getAuthHeaders(),
    });

    return await this.handleResponse<AppSettings>(response);
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

  async getCurrentWeekSubscriptionOrder(): Promise<Order | null> {
    const response = await fetch(`${this.baseUrl}/orders/current-week-subscription`, {
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

  async markOrderPaymentSubmitted(orderId: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/mark-payment-submitted`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
  }

  async confirmOrderPickup(orderId: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}/confirm-pickup`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
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

  async createSubscription(quantity: number, period: number, startNextWeek: boolean = false): Promise<Subscription> {
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ quantity, period, start_next_week: startNextWeek }),
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

  async getAllUsersAdmin(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/admin/users`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ users: User[] }>(response);
    return data.users;
  }

  async getUserDetailsAdmin(userId: number): Promise<UserDetails> {
    const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
      headers: await this.getAuthHeaders(),
    });

    return await this.handleResponse<UserDetails>(response);
  }

  // ============================================
  // ADMIN - STOCK & DELIVERY
  // ============================================

  async updateCurrentWeek(params: {
    availableEggs?: number;
    pricePerDozen?: number;
    deliveryDate?: string | null;
    deliveryTime?: string | null;
  }): Promise<Week> {
    const response = await fetch(`${this.baseUrl}/admin/week/current`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        available_eggs: params.availableEggs,
        price_per_dozen: params.pricePerDozen,
        delivery_date: params.deliveryDate,
        delivery_time: params.deliveryTime,
      }),
    });

    const data = await this.handleResponse<{ week: Week }>(response);
    return data.week;
  }

  async updateDefaultPrice(price: number, applyToCurrentWeek: boolean = true): Promise<AppSettings> {
    const response = await fetch(`${this.baseUrl}/admin/settings/price`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ 
        price,
        apply_to_current_week: applyToCurrentWeek,
      }),
    });

    const data = await this.handleResponse<{ settings: AppSettings }>(response);
    return data.settings;
  }

  async confirmOrderPayment(orderId: number): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/admin/orders/${orderId}/confirm-payment`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ order: Order }>(response);
    return data.order;
  }

  async markAllOrdersDelivered(): Promise<{ updatedCount: number }> {
    const response = await fetch(`${this.baseUrl}/admin/orders/mark-delivered`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ message: string; updatedCount: number }>(response);
    return { updatedCount: data.updatedCount };
  }

  // ============================================
  // ADMIN - PAYMENT SETTINGS
  // ============================================

  async getPaymentSettings(): Promise<{
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  }> {
    const response = await fetch(`${this.baseUrl}/admin/settings/payment`, {
      headers: await this.getAuthHeaders(),
    });

    const data = await this.handleResponse<{ paymentSettings: any }>(response);
    return data.paymentSettings;
  }

  async updatePaymentSettings(settings: {
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  }): Promise<void> {
    const response = await fetch(`${this.baseUrl}/admin/settings/payment`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        bank_account_number: settings.bankAccountNumber,
        recipient_name: settings.recipientName,
        payment_purpose: settings.paymentPurpose,
        payment_code: settings.paymentCode,
      }),
    });

    await this.handleResponse(response);
  }

  // ============================================
  // PUSH NOTIFICATIONS
  // ============================================

  async registerPushToken(token: string, deviceType: 'ios' | 'android' | 'web' = 'android'): Promise<void> {
    const response = await fetch(`${this.baseUrl}/push-token`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({
        token,
        device_type: deviceType,
      }),
    });

    await this.handleResponse(response);
  }

  async unregisterPushToken(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/push-token`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    await this.handleResponse(response);
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
