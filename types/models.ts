// Data models matching Laravel backend structure

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface WeeklyStock {
  weekStart: string; // ISO date string
  weekEnd: string;
  availableEggs: number;
  pricePerDozen: number;
  isOrderingOpen: boolean;
  deliveryDate?: string; // ISO date string - optional
  deliveryTime?: string; // e.g., "10:00 AM - 2:00 PM" - optional
  allOrdersDelivered: boolean; // Track if all orders for this week are delivered
}

export interface Order {
  id: number;
  userId: number;
  userName?: string; // For admin view
  products: {
    productId: number;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  deliveryStatus: 'not_delivered' | 'delivered';
  createdAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  userName?: string; // For admin view
  productId: number;
  quantity: number;
  frequency: 'weekly';
  period: number; // Duration in weeks (4-12)
  status: 'active' | 'paused' | 'cancelled';
  nextDelivery: string;
  createdAt: string;
}

// API Response types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

