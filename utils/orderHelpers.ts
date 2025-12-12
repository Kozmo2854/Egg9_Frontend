/**
 * Helper functions for order and payment calculations
 */

export interface Order {
  id: number;
  quantity: number;
  total: number;
  isPaid: boolean;
  paymentSubmitted: boolean;
  status: 'pending' | 'delivered' | 'completed';
  pickedUp: boolean;
}

/**
 * Calculates total amount for orders that are unpaid and not yet submitted
 * Used for displaying "Unpaid" status
 */
export const getUnpaidNotSubmittedAmount = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): number => {
  let total = 0;
  if (currentWeekOrder && !currentWeekOrder.isPaid && !currentWeekOrder.paymentSubmitted) {
    total += currentWeekOrder.total || 0;
  }
  if (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid && !currentWeekSubscriptionOrder.paymentSubmitted) {
    total += currentWeekSubscriptionOrder.total || 0;
  }
  return total;
};

/**
 * Calculates total quantity for orders that are unpaid and not yet submitted
 * Used for displaying "Unpaid" status
 */
export const getUnpaidNotSubmittedQuantity = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): number => {
  let quantity = 0;
  if (currentWeekOrder && !currentWeekOrder.isPaid && !currentWeekOrder.paymentSubmitted) {
    quantity += currentWeekOrder.quantity || 0;
  }
  if (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid && !currentWeekSubscriptionOrder.paymentSubmitted) {
    quantity += currentWeekSubscriptionOrder.quantity || 0;
  }
  return quantity;
};

/**
 * Calculates total amount for orders that are unpaid but have submitted payment
 * Used for displaying "Waiting for confirmation" status
 */
export const getUnpaidSubmittedAmount = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): number => {
  let total = 0;
  if (currentWeekOrder && !currentWeekOrder.isPaid && currentWeekOrder.paymentSubmitted) {
    total += currentWeekOrder.total || 0;
  }
  if (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid && currentWeekSubscriptionOrder.paymentSubmitted) {
    total += currentWeekSubscriptionOrder.total || 0;
  }
  return total;
};

/**
 * Calculates total quantity for orders that are unpaid but have submitted payment
 * Used for displaying "Waiting for confirmation" status
 */
export const getUnpaidSubmittedQuantity = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): number => {
  let quantity = 0;
  if (currentWeekOrder && !currentWeekOrder.isPaid && currentWeekOrder.paymentSubmitted) {
    quantity += currentWeekOrder.quantity || 0;
  }
  if (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid && currentWeekSubscriptionOrder.paymentSubmitted) {
    quantity += currentWeekSubscriptionOrder.quantity || 0;
  }
  return quantity;
};

/**
 * Checks if all orders are paid
 * Returns true if no orders exist or all orders are paid
 */
export const areAllOrdersPaid = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): boolean => {
  const hasOrders = currentWeekOrder || currentWeekSubscriptionOrder;
  if (!hasOrders) return true;
  
  const oneTimeOrderPaid = currentWeekOrder ? currentWeekOrder.isPaid : true;
  const subscriptionOrderPaid = currentWeekSubscriptionOrder ? currentWeekSubscriptionOrder.isPaid : true;
  
  return oneTimeOrderPaid && subscriptionOrderPaid;
};

/**
 * Checks if all unpaid orders have submitted payment
 * Returns true if no unpaid orders exist or all unpaid orders have payment submitted
 */
export const areAllOrdersPaymentSubmitted = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): boolean => {
  const hasUnpaidOrders = (currentWeekOrder && !currentWeekOrder.isPaid) || 
                           (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid);
  if (!hasUnpaidOrders) return true;
  
  const oneTimeSubmitted = (currentWeekOrder && !currentWeekOrder.isPaid) ? currentWeekOrder.paymentSubmitted : true;
  const subscriptionSubmitted = (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid) ? currentWeekSubscriptionOrder.paymentSubmitted : true;
  
  return oneTimeSubmitted && subscriptionSubmitted;
};

/**
 * Checks if orders are waiting for admin confirmation
 * Returns true only if ALL unpaid orders have submitted payment
 */
export const areOrdersWaitingForConfirmation = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): boolean => {
  const hasUnpaidOrders = (currentWeekOrder && !currentWeekOrder.isPaid) || 
                           (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid);
  if (!hasUnpaidOrders) return false;
  
  return areAllOrdersPaymentSubmitted(currentWeekOrder, currentWeekSubscriptionOrder);
};

/**
 * Checks if all orders have been picked up
 * Returns true if no delivered orders exist or all delivered orders are picked up
 */
export const areAllOrdersPickedUp = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): boolean => {
  // If there are no orders, consider it as "picked up"
  if (!currentWeekOrder && !currentWeekSubscriptionOrder) return true;
  
  // Check if each existing order is picked up
  const oneTimePickedUp = currentWeekOrder ? currentWeekOrder.pickedUp : true;
  const subscriptionPickedUp = currentWeekSubscriptionOrder ? currentWeekSubscriptionOrder.pickedUp : true;
  
  return oneTimePickedUp && subscriptionPickedUp;
};

/**
 * Checks if all orders are complete (delivered + paid + picked up)
 * Returns true if no orders exist or all orders have status 'completed'
 */
export const areAllOrdersComplete = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): boolean => {
  const oneTimeComplete = currentWeekOrder ? (currentWeekOrder.status === 'completed') : true;
  const subscriptionComplete = currentWeekSubscriptionOrder ? (currentWeekSubscriptionOrder.status === 'completed') : true;
  
  return oneTimeComplete && subscriptionComplete;
};

/**
 * Gets order IDs that need payment submission
 * Returns array of order IDs for orders that are unpaid and not yet submitted
 */
export const getOrdersNeedingPaymentSubmission = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): number[] => {
  const orderIds: number[] = [];
  if (currentWeekOrder && !currentWeekOrder.isPaid && !currentWeekOrder.paymentSubmitted) {
    orderIds.push(currentWeekOrder.id);
  }
  if (currentWeekSubscriptionOrder && !currentWeekSubscriptionOrder.isPaid && !currentWeekSubscriptionOrder.paymentSubmitted) {
    orderIds.push(currentWeekSubscriptionOrder.id);
  }
  return orderIds;
};

/**
 * Gets order IDs that need pickup confirmation
 * Returns array of order IDs for delivered orders that haven't been picked up
 */
export const getOrdersNeedingPickupConfirmation = (
  currentWeekOrder: Order | null,
  currentWeekSubscriptionOrder: Order | null
): number[] => {
  const orderIds: number[] = [];
  if (currentWeekOrder && ['delivered', 'completed'].includes(currentWeekOrder.status) && !currentWeekOrder.pickedUp) {
    orderIds.push(currentWeekOrder.id);
  }
  if (currentWeekSubscriptionOrder && ['delivered', 'completed'].includes(currentWeekSubscriptionOrder.status) && !currentWeekSubscriptionOrder.pickedUp) {
    orderIds.push(currentWeekSubscriptionOrder.id);
  }
  return orderIds;
};

