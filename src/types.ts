export interface TripRow {
  request_timestamp_local: Date;
  fare_amount: number;
  currency_code: string;
  status: string;
  product_type_name: string;
  begintrip_lat: number | null;
  begintrip_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  request_lat: number | null;
  request_lng: number | null;
  begintrip_address: string;
  dropoff_address: string;
}

export interface Filters {
  dateRange: [Date | null, Date | null];
  statuses: string[];
  products: string[];
}
