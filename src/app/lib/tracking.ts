// Status mapping for tracking.my statuses to our order statuses
export const statusMapping: Record<string, string> = {
  'info_received': 'pending',
  'pending': 'pending',
  'available_for_pickup': 'pending',
  'generated': 'processing',
  'printed': 'processing',
  'in_transit': 'shipped',
  'out_for_delivery': 'shipped',
  'delivery_office': 'shipped',
  'attempt_fail': 'shipped',
  'exception': 'shipped',
  'delivered': 'delivered',
  'completed': 'delivered',
  'cancelled': 'cancelled',
  'returned': 'cancelled',
  'expired': 'cancelled'
}; 