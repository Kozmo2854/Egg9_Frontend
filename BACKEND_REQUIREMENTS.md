# Laravel Backend API Requirements for Egg9 Application

## Project Overview

**Egg9** is a cross-platform (iOS, Android, Web) egg selling application built with React Native + Expo on the frontend. This document specifies the complete backend API requirements for a Laravel backend that will replace the current mock data implementation.

---

## Business Context

### Application Purpose
Egg9 connects egg producers with customers, enabling:
- **Customers**: Browse available eggs, place one-time orders, manage weekly subscriptions
- **Admins**: Manage weekly stock, delivery schedules, and orders

### Key Business Rules

1. **Single Product Model**: Only one type of egg is sold
2. **Weekly Stock System**: Admin sets available eggs each week
3. **Dozen Definition**: 1 dozen = 10 eggs (not 12)
4. **Order Increments**: All orders must be in multiples of 10 eggs
5. **One-Time Orders**: Can only be placed for current week's available stock
6. **Subscriptions**: 
   - Recurring weekly orders
   - Duration: 4-12 weeks
   - Max quantity: 30 eggs/week
   - Regular pricing (no discount)
7. **Multi-User System**: 
   - Global shared stock
   - Users can only see their own orders/subscriptions
   - Admins can see all orders/subscriptions
8. **Stock Management**: Stock is reduced when orders/subscriptions are placed

---

## Technology Stack Required

- **Framework**: Laravel 10.x or 11.x
- **Database**: MySQL or PostgreSQL
- **Authentication**: Laravel Sanctum (for SPA/API authentication)
- **API**: RESTful JSON API
- **CORS**: Must support requests from React Native mobile app and web

---

## Data Models & Database Schema

### 1. Users Table
```
id: bigint (primary key)
name: string
email: string (unique)
password: string (hashed)
role: enum('customer', 'admin') default 'customer'
created_at: timestamp
updated_at: timestamp
```

**Seed Users** (for testing):
```
1. admin@egg9.com / password123 (Admin User, role: admin)
2. user1@egg9.com / password123 (John Smith, role: customer)
3. user2@egg9.com / password123 (Jane Doe, role: customer)
```

### 2. Weekly_Stocks Table
```
id: bigint (primary key)
week_start: date (ISO 8601)
week_end: date (ISO 8601)
available_eggs: integer
price_per_dozen: decimal(8,2)
is_ordering_open: boolean default true
delivery_date: date (nullable)
delivery_time: string (nullable) // e.g., "10:00 AM - 2:00 PM"
all_orders_delivered: boolean default false
created_at: timestamp
updated_at: timestamp
```

**Note**: Only one active weekly stock record should exist at a time (current week)

### 3. Orders Table
```
id: bigint (primary key)
user_id: bigint (foreign key -> users.id)
quantity: integer (must be multiple of 10)
price_per_dozen: decimal(8,2)
total: decimal(8,2)
status: enum('pending', 'approved', 'declined', 'completed') default 'pending'
delivery_status: enum('not_delivered', 'delivered') default 'not_delivered'
week_start: date (which week this order is for)
created_at: timestamp
updated_at: timestamp
```

**Note**: Each user can only have ONE pending order per week

### 4. Subscriptions Table
```
id: bigint (primary key)
user_id: bigint (foreign key -> users.id)
quantity: integer (must be multiple of 10, max 30)
frequency: enum('weekly') default 'weekly'
period: integer (4-12 weeks)
weeks_remaining: integer (countdown, starts at period value)
status: enum('active', 'paused', 'cancelled') default 'active'
next_delivery: date
created_at: timestamp
updated_at: timestamp
```

**Note**: Each user can only have ONE active subscription at a time

---

## API Endpoints Specification

### Base URL
```
http://your-domain.com/api
```

### Response Format
All API responses should follow this structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field_name": ["Error details"]
  }
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. POST /api/login
**Description**: Authenticate user and return token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Smith",
    "email": "user1@egg9.com",
    "role": "customer",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "1|laravel_sanctum_token_here"
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password"
}
```

---

#### 2. POST /api/register
**Description**: Register new customer account

**Request Body:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Success Response (201):**
```json
{
  "user": {
    "id": 4,
    "name": "New User",
    "email": "newuser@example.com",
    "role": "customer",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "2|laravel_sanctum_token_here"
}
```

**Validation Rules:**
- name: required, string, max:255
- email: required, email, unique:users
- password: required, min:6, confirmed

---

#### 3. POST /api/logout
**Description**: Logout user and revoke token

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### 4. GET /api/user
**Description**: Get current authenticated user

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "John Smith",
  "email": "user1@egg9.com",
  "role": "customer",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Weekly Stock Endpoints

#### 5. GET /api/weekly-stock
**Description**: Get current week's stock information

**Success Response (200):**
```json
{
  "weekStart": "2024-01-01T00:00:00.000Z",
  "weekEnd": "2024-01-08T00:00:00.000Z",
  "availableEggs": 250,
  "pricePerDozen": 5.99,
  "isOrderingOpen": true,
  "deliveryDate": "2024-01-04T00:00:00.000Z",
  "deliveryTime": "10:00 AM - 2:00 PM",
  "allOrdersDelivered": false
}
```

**Note**: If no stock exists for current week, create a default one with 0 available eggs

---

#### 6. GET /api/available-eggs
**Description**: Get available eggs for current user (considering their existing orders/subscriptions)

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "availableEggs": 230
}
```

**Business Logic:**
- Start with weekly stock available_eggs
- If user has a pending order this week, ADD that order's quantity back (so they can edit)
- Subtract ALL other users' pending orders for this week
- Subtract ALL active subscriptions (all users) from available stock
- Return the result

---

### Order Endpoints

#### 7. POST /api/orders
**Description**: Create a new order for current week

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "quantity": 20,
  "pricePerDozen": 5.99
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "userId": 2,
  "products": [{
    "productId": 1,
    "quantity": 20,
    "price": 11.98
  }],
  "total": 11.98,
  "status": "pending",
  "deliveryStatus": "not_delivered",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Validation:**
- quantity: required, integer, multiple of 10, min:10
- Check if enough stock available
- Check if user already has a pending order this week (should update, not create new)

---

#### 8. PUT /api/orders/{id}
**Description**: Update an existing order (only if status is 'pending')

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "quantity": 30,
  "pricePerDozen": 5.99
}
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 2,
  "products": [{
    "productId": 1,
    "quantity": 30,
    "price": 17.97
  }],
  "total": 17.97,
  "status": "pending",
  "deliveryStatus": "not_delivered",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Validation:**
- Only allow if order belongs to authenticated user
- Only allow if order status is 'pending'
- Check if enough stock available for new quantity

---

#### 9. GET /api/orders/current-week
**Description**: Get user's order for current week

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 2,
  "products": [{
    "productId": 1,
    "quantity": 20,
    "price": 11.98
  }],
  "total": 11.98,
  "status": "pending",
  "deliveryStatus": "not_delivered",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**If no order exists:**
```json
null
```

---

#### 10. DELETE /api/orders/{id}
**Description**: Cancel an order (only if status is 'pending')

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "Order cancelled successfully"
}
```

**Validation:**
- Only allow if order belongs to authenticated user
- Only allow if order status is 'pending'
- Restore stock when cancelled

---

#### 11. GET /api/orders
**Description**: Get all orders for authenticated user

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 2,
    "products": [{
      "productId": 1,
      "quantity": 20,
      "price": 11.98
    }],
    "total": 11.98,
    "status": "pending",
    "deliveryStatus": "not_delivered",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

### Subscription Endpoints

#### 12. POST /api/subscriptions
**Description**: Create a new subscription

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "quantity": 20,
  "period": 8
}
```

**Success Response (201):**
```json
{
  "id": 1,
  "userId": 2,
  "productId": 1,
  "quantity": 20,
  "frequency": "weekly",
  "period": 8,
  "status": "active",
  "nextDelivery": "2024-01-08T00:00:00.000Z",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**Validation:**
- quantity: required, integer, multiple of 10, min:10, max:30
- period: required, integer, min:4, max:12
- Check if user already has active subscription (cancel old one first)
- Check if enough stock available

---

#### 13. GET /api/subscriptions/current
**Description**: Get user's current active subscription

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 2,
  "productId": 1,
  "quantity": 20,
  "frequency": "weekly",
  "period": 8,
  "status": "active",
  "nextDelivery": "2024-01-08T00:00:00.000Z",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

**If no subscription:**
```json
null
```

---

#### 14. DELETE /api/subscriptions/{id}
**Description**: Cancel a subscription

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "Subscription cancelled successfully"
}
```

**Validation:**
- Only allow if subscription belongs to authenticated user
- Set status to 'cancelled'

---

### Admin Endpoints (Role: admin required)

#### 15. GET /api/admin/orders
**Description**: Get all orders with user information

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 2,
    "userName": "John Smith",
    "products": [{
      "productId": 1,
      "quantity": 20,
      "price": 11.98
    }],
    "total": 11.98,
    "status": "pending",
    "deliveryStatus": "not_delivered",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

#### 16. GET /api/admin/subscriptions
**Description**: Get all subscriptions with user information

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "userId": 2,
    "userName": "John Smith",
    "productId": 1,
    "quantity": 20,
    "frequency": "weekly",
    "period": 8,
    "status": "active",
    "nextDelivery": "2024-01-08T00:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

---

#### 17. PUT /api/admin/weekly-stock
**Description**: Update current week's available eggs

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "availableEggs": 300
}
```

**Success Response (200):**
```json
{
  "weekStart": "2024-01-01T00:00:00.000Z",
  "weekEnd": "2024-01-08T00:00:00.000Z",
  "availableEggs": 300,
  "pricePerDozen": 5.99,
  "isOrderingOpen": true,
  "deliveryDate": "2024-01-04T00:00:00.000Z",
  "deliveryTime": "10:00 AM - 2:00 PM",
  "allOrdersDelivered": false
}
```

---

#### 18. PUT /api/admin/delivery-info
**Description**: Update delivery date and time

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "deliveryDate": "2024-01-05",
  "deliveryTime": "2:00 PM - 6:00 PM"
}
```

**Success Response (200):**
```json
{
  "weekStart": "2024-01-01T00:00:00.000Z",
  "weekEnd": "2024-01-08T00:00:00.000Z",
  "availableEggs": 250,
  "pricePerDozen": 5.99,
  "isOrderingOpen": true,
  "deliveryDate": "2024-01-05T00:00:00.000Z",
  "deliveryTime": "2:00 PM - 6:00 PM",
  "allOrdersDelivered": false
}
```

---

#### 19. POST /api/admin/orders/mark-delivered
**Description**: Mark all pending orders as delivered

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "message": "All orders marked as delivered",
  "ordersUpdated": 5
}
```

**Business Logic:**
- Find all orders with status 'pending' and delivery_status 'not_delivered'
- Update their delivery_status to 'delivered'
- Update weekly_stock.all_orders_delivered to true

---

#### 20. PUT /api/admin/orders/{id}/approve
**Description**: Approve an order

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 2,
  "userName": "John Smith",
  "products": [{
    "productId": 1,
    "quantity": 20,
    "price": 11.98
  }],
  "total": 11.98,
  "status": "approved",
  "deliveryStatus": "not_delivered",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

---

#### 21. PUT /api/admin/orders/{id}/decline
**Description**: Decline an order

**Headers:**
```
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "id": 1,
  "userId": 2,
  "userName": "John Smith",
  "products": [{
    "productId": 1,
    "quantity": 20,
    "price": 11.98
  }],
  "total": 11.98,
  "status": "declined",
  "deliveryStatus": "not_delivered",
  "createdAt": "2024-01-01T12:00:00.000Z"
}
```

---

## Additional Requirements

### 1. Authentication Middleware
- Use Laravel Sanctum for token-based authentication
- Protect all endpoints except `/login` and `/register` with `auth:sanctum` middleware
- Admin endpoints require additional role check

### 2. CORS Configuration
Configure CORS to allow:
- Origins: `http://localhost:8081` (Expo dev server), `exp://` (Expo app), `http://localhost:19006` (Web)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization, Accept

### 3. Date Format
- All dates should be in ISO 8601 format
- Use timezone: UTC
- Example: `2024-01-01T00:00:00.000Z`

### 4. Validation
- Use Laravel Form Requests for validation
- Return validation errors in standard format:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "quantity": ["The quantity must be a multiple of 10."]
  }
}
```

### 5. Error Handling
- Use Laravel's exception handler
- Return consistent error responses
- HTTP Status Codes:
  - 200: Success
  - 201: Created
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 422: Validation Error
  - 500: Server Error

### 6. Database Seeding
Create seeders for:
- 3 users (1 admin, 2 customers) as specified
- Initial weekly stock record for current week
- Optional: Sample orders and subscriptions for testing

### 7. API Documentation
Provide OpenAPI/Swagger documentation or Postman collection

---

## Weekly Automation (REQUIRED - Core Feature)

**CRITICAL REQUIREMENT**: This must be implemented as a core backend feature using Laravel's task scheduling.

### Implementation: Laravel Scheduled Command

Create a Laravel scheduled command that runs **every Monday at 00:01** to automate the weekly cycle.

### Command: `php artisan egg9:process-weekly-cycle`

**Schedule in `app/Console/Kernel.php`:**
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('egg9:process-weekly-cycle')
             ->weeklyOn(1, '00:01') // Monday at 00:01
             ->timezone('UTC');
}
```

### Required Actions (in order):

#### 1. Archive Previous Week
- Mark the previous week's stock record as closed
- Keep the record for historical/reporting purposes
- Set `is_ordering_open = false` for the old week

#### 2. Create New Weekly Stock
- Create a new `weekly_stocks` record for the current week
- Set `week_start` to current Monday (today)
- Set `week_end` to next Monday (7 days from now)
- Initialize with default values:
  - `available_eggs` = 0 (admin will set this)
  - `price_per_dozen` = 5.99 (or carry from previous week)
  - `is_ordering_open` = true
  - `delivery_date` = null (admin will set)
  - `delivery_time` = null (admin will set)
  - `all_orders_delivered` = false

#### 3. Process Active Subscriptions
For each subscription where `status = 'active'`:

a. **Create Weekly Order:**
   - Create a new order in `orders` table
   - Set `user_id` from subscription
   - Set `quantity` from subscription
   - Set `price_per_dozen` from new weekly stock
   - Calculate `total` = (quantity / 10) * price_per_dozen
   - Set `status` = 'pending'
   - Set `delivery_status` = 'not_delivered'
   - Set `week_start` = new week's start date

b. **Decrement Weeks Remaining:**
   - Decrease `weeks_remaining` by 1
   - If `weeks_remaining` reaches 0:
     - Set subscription `status` = 'completed' or 'cancelled'
     - This is the last order for this subscription

c. **Update Next Delivery:**
   - Set `next_delivery` = next Monday (7 days from now)

d. **Stock Management:**
   - The new orders created will automatically reduce available stock
   - Ensure stock calculation accounts for these new orders

#### 4. Error Handling & Logging
- Log all subscription processing (success/failure)
- If a subscription fails to process (e.g., insufficient stock):
  - Log the error
  - Notify admin via email/database notification
  - DO NOT mark subscription as failed (let admin decide)
- Send email notification to users about their auto-generated orders
- Create system log for the weekly cycle completion

#### 5. Notifications (Optional but Recommended)
- Email users about their new weekly order from subscription
- Notify admin about the new week starting
- Alert admin if any subscriptions couldn't be processed

### Example Processing Flow:

```
Monday 00:01 - Automation Runs:
----------------------------------
1. Old week: Jan 1-7 → Mark as closed
2. New week: Jan 8-14 → Create stock record
3. User A subscription: 20 eggs
   → Create order for Jan 8-14, 20 eggs
   → weeks_remaining: 8 → 7
   → next_delivery: Jan 15
4. User B subscription: 30 eggs
   → Create order for Jan 8-14, 30 eggs
   → weeks_remaining: 4 → 3
   → next_delivery: Jan 15
5. User C subscription: 10 eggs, was at 1 week remaining
   → Create FINAL order for Jan 8-14, 10 eggs
   → weeks_remaining: 1 → 0
   → status: 'completed'
```

### Database Considerations

**Subscriptions Table - Track Completion:**
- `weeks_remaining` starts at `period` value when created
- Decrements by 1 each week
- When reaches 0, subscription is completed

**Orders Table - Link to Subscription:**
Consider adding a `subscription_id` field (optional) to track which orders were auto-generated from subscriptions.

### Testing the Automation

Provide a manual command for testing:
```bash
php artisan egg9:process-weekly-cycle --force
```

This allows admin to test the automation without waiting for Monday.

### Deployment Note

Ensure Laravel's task scheduler is running on the server:
```bash
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

Add this cron job to the server for Laravel's scheduler to work.

---

**This automation is critical for the subscription feature to work properly. Without it, subscriptions are just dormant records.**

---

## Testing Requirements

Please provide:
1. Unit tests for critical business logic
2. Feature tests for all API endpoints
3. Test database seeder for development
4. Postman collection or similar for manual testing

---

## Deployment Notes

After deployment, provide:
1. Base API URL (e.g., `https://api.egg9.com/api`)
2. Any required API keys or credentials
3. Instructions for frontend integration
4. Database migration commands

---

## Frontend Integration Instructions

The frontend expects you to provide:

1. **Base API URL**: Replace `http://localhost:8000/api` in `services/api.ts`
2. **Token Storage**: Frontend stores token in AsyncStorage after login
3. **Request Headers**: Frontend will send `Authorization: Bearer {token}` header
4. **Response Format**: Must match the interfaces defined in `types/models.ts`

To integrate with the React Native frontend:

```typescript
// In services/api.ts, update:
private baseUrl: string = 'YOUR_API_URL_HERE'; // e.g., 'https://api.egg9.com/api'

// Replace all mock implementations with real fetch calls, e.g.:
async login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${this.baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) {
    throw new Error('Invalid email or password');
  }
  
  const data = await response.json();
  this.authToken = data.token;
  return data;
}
```

---

## Questions or Clarifications

If you need any clarification on:
- Business logic
- Data models
- API endpoints
- Expected behavior

Please ask before implementing. The frontend is already built and waiting for this backend API.

---

**Document Version**: 1.0  
**Date**: November 19, 2025  
**Frontend Repository**: https://github.com/Kozmo2854/Egg9  
**Frontend Framework**: React Native + Expo + TypeScript

