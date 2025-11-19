// Data models matching Laravel backend structure

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface WeeklyStock {
  id: number;
  weekStart: string; // ISO date string
  weekEnd: string;
  availableEggs: number;
  pricePerDozen: number;
  isOrderingOpen: boolean;
  deliveryDate: string | null; // ISO date string - optional
  deliveryTime: string | null; // e.g., "10:00 AM - 2:00 PM" - optional
  allOrdersDelivered: boolean; // Track if all orders for this week are delivered
}

export interface Order {
  id: number;
  userId: number;
  userName?: string; // For admin view
  userEmail?: string; // For admin view
  quantity: number; // Number of eggs (multiples of 10)
  pricePerDozen: number; // Price per dozen eggs
  total: number; // Total price for the order
  status: 'pending' | 'approved' | 'declined' | 'completed';
  deliveryStatus: 'not_delivered' | 'delivered';
  weekStart: string; // ISO date string - which week this order is for
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  userName?: string; // For admin view
  quantity: number; // Number of eggs per week (multiples of 10, max 30)
  frequency: 'weekly';
  period: number; // Total duration in weeks (4-12)
  weeksRemaining: number; // Weeks left in subscription
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  nextDelivery: string | null; // ISO date string - next delivery date
  createdAt: string;
  updatedAt: string;
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

