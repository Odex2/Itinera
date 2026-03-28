
// npm remove react-leaflet leaflet
// npm install mapbox-gl react-map-gl

import { useMemo, useCallback, useState, useRef } from 'react';
import Map, {
  Marker,
  Source,
  Layer,
  type MapRef,
  type LayerProps,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POI, UserProfile } from '../types';
import { getDistanceMeters } from '../hooks/useGeolocation';
import { MapPin, Coins, Sun, Moon, Sunset, CloudMoon, Star, Navigation } from 'lucide-react';

interface MapViewProps {
  pois: POI[];
  profile: UserProfile;
  userLocation: { lat: number; lng: number } | null;
  onPOISelect: (poi: POI) => void;
  timeOfDay: 'mattina' | 'pomeriggio' | 'sera' | 'notte';
}

const ROME_CENTER = { lat: 41.8967, lng: 12.4822 };

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Minimal flat style — closest to Pokémon GO aesthetic
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

const TIME_LABELS: Record<MapViewProps['timeOfDay'], { label: string; icon: typeof Sun }> = {
  mattina: { label: 'Mattina', icon: Sun },
  pomeriggio: { label: 'Pomeriggio', icon: Sunset },
  sera: { label: 'Sera', icon: CloudMoon },
  notte: { label: 'Notte', icon: Moon },
};

// 3D buildings layer — extrudes OSM building footprints
const buildingsLayer: LayerProps = {
  id: '3d-buildings',
  source: 'composite',
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minzoom: 14,
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['get', 'height'],
      0, '#ede8e3',
      20, '#ddd6ce',
      60, '#ccc4ba',
      120, '#b8afa4',
    ],
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-base': ['get', 'min_height'],
    'fill-extrusion-opacity': 0.82,
  },
};

// Colors per status
const STATUS_COLORS: Record<POI['status'], { bg: string; border: string; pulse: boolean }> = {
  available: { bg: '#f59e0b', border: '#d97706', pulse: true },
  completed: { bg: '#22c55e', border: '#16a34a', pulse: false },
  locked: { bg: '#9ca3af', border: '#6b7280', pulse: false },
  active: { bg: '#ef4444', border: '#dc2626', pulse: true },
};

// SVG icons per status
const STATUS_ICONS: Record<POI['status'], string> = {
  available: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
  completed: `<polyline points="20 6 9 17 4 12"/>`,
  locked: `<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`,
  active: `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
};

// ── POI Marker component ──────────────────────────────────────────────────────
interface POIMarkerProps {
  poi: POI;
  isNearest: boolean;
  onClick: () => void;
}

function POIMarker({ poi, isNearest, onClick }: POIMarkerProps) {
  const size = isNearest ? 40 : 32;
  const half = size / 2;
  const { bg, border, pulse } = STATUS_COLORS[poi.status];
  const icon = STATUS_ICONS[poi.status];
  const iconSize = poi.status === 'locked' ? 14 : 16;

  return (
    <Marker
      longitude={poi.lng}
      latitude={poi.lat}
      anchor="center"
      onClick={(e) => { e.originalEvent.stopPropagation(); onClick(); }}
    >
      <div style={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}>
        {/* Pulse ring */}
        {pulse && (
          <span style={{
            position: 'absolute',
            top: -4,
            left: -4,
            width: size + 8,
            height: size + 8,
            borderRadius: '50%',
            border: `2px solid ${bg}`,
            animation: 'poi-pulse 2s ease-out infinite',
            pointerEvents: 'none',
          }} />
        )}
        {/* Nearest highlight ring */}
        {isNearest && (
          <span style={{
            position: 'absolute',
            top: -3,
            left: -3,
            width: size + 6,
            height: size + 6,
            borderRadius: '50%',
            boxShadow: `0 0 0 3px rgba(245,158,11,0.4)`,
            pointerEvents: 'none',
          }} />
        )}
        {/* Main circle */}
        <div style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: bg,
          border: `2.5px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isNearest
            ? '0 4px 12px rgba(0,0,0,0.3)'
            : '0 2px 6px rgba(0,0,0,0.25)',
          position: 'relative',
          zIndex: 1,
        }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth={poi.status === 'locked' ? 2.5 : 2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            dangerouslySetInnerHTML={{ __html: icon }}
          />
        </div>
      </div>
    </Marker>
  );
}

// ── Unlock radius circle rendered as GeoJSON Source+Layer ────────────────────
interface UnlockCircleProps {
  poi: POI;
}

function UnlockCircle({ poi }: UnlockCircleProps) {
  const color =
    poi.status === 'completed' ? '#22c55e' :
      poi.status === 'available' ? '#f59e0b' :
        '#9ca3af';

  // Build a GeoJSON circle approximation (64 points)
  const circleGeoJSON = useMemo(() => {
    const points = 64;
    const radiusInDeg = poi.unlockDistance / 111320; // meters → degrees (approx)
    const coords: [number, number][] = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      coords.push([
        poi.lng + radiusInDeg * Math.cos(angle) / Math.cos((poi.lat * Math.PI) / 180),
        poi.lat + radiusInDeg * Math.sin(angle),
      ]);
    }
    return {
      type: 'Feature' as const,
      geometry: { type: 'Polygon' as const, coordinates: [coords] },
      properties: {},
    };
  }, [poi.lat, poi.lng, poi.unlockDistance]);

  const fillLayerProps: LayerProps = {
    id: `circle-fill-${poi.id}`,
    type: 'fill',
    paint: {
      'fill-color': color,
      'fill-opacity': 0.08,
    },
  };

  const outlineLayerProps: LayerProps = {
    id: `circle-outline-${poi.id}`,
    type: 'line',
    paint: {
      'line-color': color,
      'line-opacity': 0.3,
      'line-width': 1,
    },
  };

  return (
    <Source id={`circle-${poi.id}`} type="geojson" data={circleGeoJSON}>
      <Layer {...fillLayerProps} />
      <Layer {...outlineLayerProps} />
    </Source>
  );
}

// ── User location dot ─────────────────────────────────────────────────────────
function UserDot({ location }: { location: { lat: number; lng: number } }) {
  return (
    <Marker longitude={location.lng} latitude={location.lat} anchor="center">
      <div style={{ position: 'relative', width: 20, height: 20 }}>
        <span style={{
          position: 'absolute',
          top: -6,
          left: -6,
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(59,130,246,0.25)',
          animation: 'poi-pulse 2s ease-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#3b82f6',
          border: '3px solid white',
          boxShadow: '0 2px 8px rgba(59,130,246,0.5)',
          position: 'relative',
          zIndex: 1,
        }} />
      </div>
    </Marker>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function getXpForLevel(level: number): number {
  return level * 200;
}

function renderImportanceStars(score: number): string {
  const maxStars = 5;
  const filled = Math.round(score * maxStars);
  return Array.from({ length: maxStars }, (_, i) => i < filled ? '★' : '☆').join('');
}

const CATEGORY_LABELS: Record<string, string> = {
  enogastronomia: 'Enogastronomia',
  cultura: 'Cultura',
  arte: 'Arte',
  storia: 'Storia',
  natura: 'Natura',
  paesaggio: 'Paesaggio',
  shopping: 'Shopping',
  artigianato: 'Artigianato',
  intrattenimento: 'Intrattenimento',
  family: 'Family',
  sport: 'Sport',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function MapView({ pois, profile, userLocation, onPOISelect, timeOfDay }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);

  const nearestAvailable = useMemo(() => {
    if (!userLocation) return null;
    const available = pois.filter((p) => p.status === 'available');
    if (available.length === 0) return null;
    let nearest: POI | null = null;
    let minDist = Infinity;
    for (const poi of available) {
      const d = getDistanceMeters(userLocation.lat, userLocation.lng, poi.lat, poi.lng);
      if (d < minDist) { minDist = d; nearest = poi; }
    }
    return nearest ? { poi: nearest, distance: minDist } : null;
  }, [pois, userLocation]);

  // Recenter on user location when it changes
  const prevLocation = useRef<{ lat: number; lng: number } | null>(null);
  useMemo(() => {
    if (!userLocation || !mapRef.current) return;
    const prev = prevLocation.current;
    if (!prev || prev.lat !== userLocation.lat || prev.lng !== userLocation.lng) {
      mapRef.current.easeTo({
        center: [userLocation.lng, userLocation.lat],
        duration: 800,
      });
      prevLocation.current = userLocation;
    }
  }, [userLocation]);

  const xpForCurrentLevel = getXpForLevel(profile.level);
  const xpProgress = xpForCurrentLevel > 0 ? Math.min((profile.xp / xpForCurrentLevel) * 100, 100) : 0;
  const TimeIcon = TIME_LABELS[timeOfDay].icon;

  return (
    <div className="relative w-full h-screen">
      {/* Pulse animation */}
      <style>{`
        @keyframes poi-pulse {
          0%   { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right { display: none; }
      `}</style>

      {/* ── Mapbox 3D Map ── */}
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: userLocation?.lng ?? ROME_CENTER.lng,
          latitude: userLocation?.lat ?? ROME_CENTER.lat,
          zoom: 15.5,
          pitch: 45,
          bearing: -17.6,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        logoPosition="bottom-right"
      >
        {/* 3D buildings */}
        <Layer {...buildingsLayer} />

        {/* Unlock radius circles */}
        {pois.map((poi) => (
          <UnlockCircle key={`circle-${poi.id}`} poi={poi} />
        ))}

        {/* User dot */}
        {userLocation && <UserDot location={userLocation} />}

        {/* POI markers */}
        {pois.map((poi) => (
          <POIMarker
            key={poi.id}
            poi={poi}
            isNearest={nearestAvailable?.poi.id === poi.id}
            onClick={() => onPOISelect(poi)}
          />
        ))}
      </Map>

      {/* ── Top Bar Overlay ── */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="mx-3 mt-3 pointer-events-auto">
          <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-stone-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                <span className="text-white font-bold text-lg tracking-wide">Roma</span>
                <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-stone-800 rounded-full">
                  <TimeIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-amber-200 text-xs font-medium">
                    {TIME_LABELS[timeOfDay].label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-bold text-sm">{profile.coins}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-amber-200 text-xs font-semibold">Lv. {profile.level}</span>
              </div>
              <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <span className="text-stone-400 text-xs">
                {profile.xp}/{xpForCurrentLevel} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Card Overlay ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="mx-3 mb-6 pointer-events-auto">
          {nearestAvailable ? (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-stone-200">
              <div className="flex items-center gap-1.5 mb-2">
                <Navigation className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 text-xs font-bold uppercase tracking-wider">
                  Prossima Tappa
                </span>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-stone-900 font-bold text-base truncate">
                    {nearestAvailable.poi.name}
                  </h3>
                  <p className="text-stone-500 text-sm">
                    {CATEGORY_LABELS[nearestAvailable.poi.category] || nearestAvailable.poi.category}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-stone-600 text-xs">
                      {userLocation
                        ? formatDistance(nearestAvailable.distance)
                        : 'GPS non disponibile'}
                    </span>
                    <span className="text-amber-500 text-sm tracking-wide">
                      {renderImportanceStars(nearestAvailable.poi.importanceScore)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onPOISelect(nearestAvailable.poi)}
                  className="ml-3 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm rounded-xl shadow-md hover:from-amber-600 hover:to-amber-700 active:scale-95 transition-all"
                >
                  Esplora
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-stone-200 text-center">
              <p className="text-stone-500 text-sm">
                {userLocation
                  ? 'Nessun punto di interesse disponibile nelle vicinanze.'
                  : 'Attiva il GPS per scoprire i punti di interesse.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}