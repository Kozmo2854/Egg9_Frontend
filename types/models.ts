// Data models matching Laravel backend structure

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface UserDetails {
  user: User;
  orders: Order[];
  subscriptions: Subscription[];
  totalEggsBought: number;
}

export interface Week {
  id: number;
  weekStart: string; // ISO date string
  weekEnd: string;
  availableEggs: number;
  pricePerDozen: number;
  isOrderingOpen: boolean;
  deliveryDate: string | null; // ISO date string - optional
  deliveryTime: string | null; // e.g., "10:00 AM - 2:00 PM" - optional
  allOrdersDelivered: boolean; // Track if all orders for this week are delivered
  isLowSeason: boolean; // Whether this week is in low season (affects subscriptions and order caps)
  subscriptionsProcessed: boolean; // Whether subscriptions have been processed for this week
  lowSeasonOrderCap: number | null; // Max eggs for one-time orders in low season (null if high season)
}

export interface AppSettings {
  id: number;
  defaultPricePerDozen: number;
  maxSubscriptionEggs: number; // Total cap for all subscriptions
  maxPerSubscription: number; // Max eggs per individual subscription
  paymentSettings: {
    bankAccountNumber: string;
    recipientName: string;
    paymentPurpose: string;
    paymentCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionAvailability {
  canSubscribe: boolean;
  reason?: 'no_week' | 'low_season' | 'capacity_full';
  message?: string;
  maxAllowed?: number; // Max eggs this user can subscribe to
  maxPerSubscription?: number;
  remainingCapacity?: number;
  currentTotal?: number;
  maxSubscriptionEggs?: number;
  isLowSeason?: boolean;
}

export interface Order {
  id: number;
  userId: number;
  subscriptionId?: number | null; // Foreign key to subscriptions table (if order came from subscription)
  type: 'subscription' | 'one-time'; // Order type based on subscription_id
  isSubscription?: boolean; // For admin view - indicates if order is from a subscription
  weekId: number; // Foreign key to weeks table
  userName?: string; // For admin view
  userEmail?: string; // For admin view
  quantity: number; // Number of eggs (multiples of 10)
  total: number; // Total price for the order
  status: 'pending' | 'completed';
  isPaid: boolean; // Payment confirmation status (by admin)
  paymentConfirmedAt?: string | null; // ISO date when payment was confirmed by admin
  paymentSubmitted: boolean; // Payment marked as submitted by user
  pickedUp: boolean; // Pickup confirmed by user
  weekStart?: string; // ISO date string - which week this order is for (from week relation)
  weekEnd?: string; // ISO date string - week end date
  createdAt: string;
  updatedAt?: string;
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

// Backwards compatibility alias
export type WeeklyStock = Week;

