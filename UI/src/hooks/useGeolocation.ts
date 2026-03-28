import { useState, useEffect } from 'react';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  isDemoMode: boolean;
}

// Demo locations — add any POI coordinates here for easy hackathon testing
const DEMO_LOCATIONS: Record<string, { lat: number; lng: number; label: string }> = {
  gazometro:      { lat: 41.86957167289657, lng: 12.47498410826282, label: 'Gazometro (venue)' },
  colosseo:       { lat: 41.8902, lng: 12.4922, label: 'Colosseo' },
  fontana_trevi:  { lat: 41.9009, lng: 12.4833, label: 'Fontana di Trevi' },
  pantheon:       { lat: 41.8986, lng: 12.4769, label: 'Pantheon' },
  piazza_navona:  { lat: 41.8992, lng: 12.4731, label: 'Piazza Navona' },
  centro:         { lat: 41.8967, lng: 12.4822, label: 'Centro Roma' },
};

/**
 * Check URL params for demo mode.
 * Usage: ?demo=true (defaults to Gazometro) or ?demo=colosseo
 */
function getDemoLocation(): { lat: number; lng: number } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo');
    if (!demoParam) return null;

    // ?demo=true → default to Gazometro (hackathon venue)
    if (demoParam === 'true' || demoParam === '1') {
      return DEMO_LOCATIONS.gazometro;
    }

    // ?demo=colosseo → specific location
    const named = DEMO_LOCATIONS[demoParam.toLowerCase()];
    if (named) return named;

    // ?demo=41.89,12.48 → raw coordinates
    const parts = demoParam.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    return DEMO_LOCATIONS.gazometro; // fallback
  } catch {
    return null;
  }
}

export function useGeolocation() {
  const demoLocation = getDemoLocation();
  const isDemoMode = demoLocation !== null;

  const [state, setState] = useState<GeolocationState>({
    lat: demoLocation?.lat ?? null,
    lng: demoLocation?.lng ?? null,
    accuracy: isDemoMode ? 10 : null,
    error: null,
    loading: !isDemoMode,
    isDemoMode,
  });

  useEffect(() => {
    // In demo mode: skip real GPS, position is already set from URL param
    if (isDemoMode) return;

    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: 'Geolocation non supportata', loading: false }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          isDemoMode: false,
        });
      },
      (error) => {
        setState((prev) => ({ ...prev, error: error.message, loading: false }));
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isDemoMode]);

  return state;
}

export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}