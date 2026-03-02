export const PRODUCT_MAPPING: Record<string, string> = {
  'MOTO': 'Scooter',
  'Test.UberX Saver.3': 'UberX Saver',
  'UberX Saver': 'UberX Saver',
  '[B2C} Bus': 'Uber Bus',
  'uberX': 'UberX',
  'Comfort': 'Comfort',
  'Wait & Save 2': 'Wait & Save',
  'UberX Priority': 'UberX Priority',
  'Concentrix Shuttle': 'Concentrix Shuttle',
};

export const KNOWN_STATUSES = [
  'completed',
  'rider_canceled',
  'unfulfilled',
] as const;

export const KNOWN_PRODUCTS = [
  'UberX',
  'UberX Saver',
  'Uber Bus',
  'Scooter',
  'Comfort',
  'Wait & Save',
  'UberX Priority',
  'Concentrix Shuttle',
] as const;

export const REQUIRED_COLUMNS = [
  'request_timestamp_local',
  'fare_amount',
  'status',
  'product_type_name',
] as const;

// Curated chart color palette — friendly, accessible, distinguishable
export const CHART_COLORS = [
  '#276EF1', // primary blue
  '#05944F', // green
  '#FFC043', // amber
  '#E54B4B', // red
  '#7B61FF', // purple
  '#00B0FF', // cyan
  '#FF6D00', // orange
  '#EC407A', // pink
  '#26A69A', // teal
  '#8D6E63', // brown
] as const;

export const STATUS_COLORS: Record<string, string> = {
  completed: '#05944F',
  rider_canceled: '#E54B4B',
  unfulfilled: '#FFC043',
};
