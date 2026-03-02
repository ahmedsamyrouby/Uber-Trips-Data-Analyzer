import Papa from 'papaparse';
import type { TripRow } from '../types';
import { PRODUCT_MAPPING, REQUIRED_COLUMNS } from '../constants';

function toFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseAndClean(file: File): Promise<TripRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        // Validate required columns
        const headers = results.meta.fields ?? [];
        const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
        if (missing.length > 0) {
          reject(new Error(`Missing required columns: ${missing.join(', ')}`));
          return;
        }

        const rows: TripRow[] = [];

        for (const raw of results.data as Record<string, string>[]) {
          // Parse date — skip row if invalid
          const date = new Date(raw.request_timestamp_local);
          if (isNaN(date.getTime())) continue;

          // Map product name
          const rawProduct = (raw.product_type_name ?? '').trim();
          const product = PRODUCT_MAPPING[rawProduct] ?? rawProduct;

          // Parse fare — default 0
          const fare = toFloat(raw.fare_amount) ?? 0;

          rows.push({
            ...raw,
            request_timestamp_local: date,
            fare_amount: fare,
            currency_code: (raw.currency_code ?? 'USD').trim(),
            status: (raw.status ?? '').trim().toLowerCase(),
            product_type_name: product,
            begintrip_lat: toFloat(raw.begintrip_lat),
            begintrip_lng: toFloat(raw.begintrip_lng),
            dropoff_lat: toFloat(raw.dropoff_lat),
            dropoff_lng: toFloat(raw.dropoff_lng),
            request_lat: toFloat(raw.request_lat),
            request_lng: toFloat(raw.request_lng),
            begintrip_address: (raw.begintrip_address ?? '').trim(),
            dropoff_address: (raw.dropoff_address ?? '').trim(),
          });
        }

        resolve(rows);
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}
