import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPinOff } from 'lucide-react';
import type { TripRow } from '../types';

// ── Custom SVG Markers ──────────────────────────────────────────

function createSvgIcon(color: string, label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
        </filter>
      </defs>
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z"
            fill="${color}" filter="url(#shadow)"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
      <text x="14" y="18" text-anchor="middle" fill="${color}" font-size="11" font-weight="bold" font-family="sans-serif">${label}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

const pickupIcon = createSvgIcon('#05944F', 'P');
const dropoffIcon = createSvgIcon('#E54B4B', 'D');

// ── Auto-fit bounds subcomponent ────────────────────────────────

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, bounds]);
  return null;
}

// ── Main map component ──────────────────────────────────────────

interface TripMapProps {
  trip: TripRow | null;
}

export default function TripMap({ trip }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  // Resolve start coordinates (prefer begintrip, fall back to request)
  const coords = useMemo(() => {
    if (!trip) return null;

    const startLat = trip.begintrip_lat ?? trip.request_lat;
    const startLng = trip.begintrip_lng ?? trip.request_lng;
    const endLat = trip.dropoff_lat;
    const endLng = trip.dropoff_lng;

    if (startLat == null || startLng == null) return null;

    return {
      start: [startLat, startLng] as [number, number],
      end: endLat != null && endLng != null ? ([endLat, endLng] as [number, number]) : null,
    };
  }, [trip]);

  if (!trip) {
    return (
      <div className="bg-surface rounded-2xl border border-border h-100 flex items-center justify-center">
        <div className="text-center text-text-muted">
          <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Select a trip from the table above</p>
          <p className="text-xs mt-1">Click any row to see the route on the map</p>
        </div>
      </div>
    );
  }

  if (!coords) {
    return (
      <div className="bg-surface rounded-2xl border border-border h-100 flex items-center justify-center">
        <div className="text-center text-text-muted">
          <MapPinOff className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No GPS data for this trip</p>
          <p className="text-xs mt-1">This trip may have been canceled before a driver was assigned</p>
        </div>
      </div>
    );
  }

  const bounds: L.LatLngBoundsExpression = coords.end
    ? [coords.start, coords.end]
    : [coords.start, coords.start];

  return (
    <div ref={mapRef} className="bg-surface rounded-2xl border border-border overflow-hidden">
      <MapContainer
        center={coords.start}
        zoom={13}
        className="h-100 w-full z-0"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds bounds={bounds} />

        {/* Pickup marker */}
        <Marker position={coords.start} icon={pickupIcon}>
        </Marker>

        {/* Dropoff marker + route line */}
        {coords.end && (
          <>
            <Marker position={coords.end} icon={dropoffIcon}>
            </Marker>
            <Polyline
              positions={[coords.start, coords.end]}
              pathOptions={{
                color: '#276EF1',
                weight: 3,
                opacity: 0.7,
                dashArray: '8 6',
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Map legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t border-border bg-surface-alt/50 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent" /> Pickup
          {trip.begintrip_address && (
            <span className="text-text-secondary ml-1 truncate max-w-50">{trip.begintrip_address}</span>
          )}
        </span>
        {coords.end && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger" /> Dropoff
            {trip.dropoff_address && (
              <span className="text-text-secondary ml-1 truncate max-w-50">{trip.dropoff_address}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
