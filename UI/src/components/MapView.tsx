// NOTE: Leaflet CSS must be imported in index.css:
// @import 'leaflet/dist/leaflet.css';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
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

const ROME_CENTER: [number, number] = [41.8967, 12.4822];

const TIME_LABELS: Record<MapViewProps['timeOfDay'], { label: string; icon: typeof Sun }> = {
  mattina: { label: 'Mattina', icon: Sun },
  pomeriggio: { label: 'Pomeriggio', icon: Sunset },
  sera: { label: 'Sera', icon: CloudMoon },
  notte: { label: 'Notte', icon: Moon },
};

function createPOIIcon(status: POI['status'], isNearest: boolean): L.DivIcon {
  const size = isNearest ? 40 : 32;
  const half = size / 2;

  let bgColor: string;
  let borderColor: string;
  let innerHTML: string;
  let pulseRing = '';

  switch (status) {
    case 'available':
      bgColor = '#f59e0b';
      borderColor = '#d97706';
      innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
      pulseRing = `<span style="position:absolute;top:-4px;left:-4px;width:${size + 8}px;height:${size + 8}px;border-radius:50%;border:2px solid #f59e0b;animation:poi-pulse 2s ease-out infinite;"></span>`;
      break;
    case 'completed':
      bgColor = '#22c55e';
      borderColor = '#16a34a';
      innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      break;
    case 'locked':
      bgColor = '#9ca3af';
      borderColor = '#6b7280';
      innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
      break;
    case 'active':
      bgColor = '#ef4444';
      borderColor = '#dc2626';
      innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      pulseRing = `<span style="position:absolute;top:-4px;left:-4px;width:${size + 8}px;height:${size + 8}px;border-radius:50%;border:2px solid #ef4444;animation:poi-pulse 1.5s ease-out infinite;"></span>`;
      break;
  }

  const highlight = isNearest
    ? `box-shadow:0 0 0 3px rgba(245,158,11,0.4),0 4px 12px rgba(0,0,0,0.3);`
    : `box-shadow:0 2px 6px rgba(0,0,0,0.3);`;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        ${pulseRing}
        <div style="
          width:${size}px;height:${size}px;border-radius:50%;
          background:${bgColor};border:2.5px solid ${borderColor};
          display:flex;align-items:center;justify-content:center;
          ${highlight}
          position:relative;z-index:1;
        ">
          ${innerHTML}
        </div>
      </div>
    `,
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <span style="
          position:absolute;top:-6px;left:-6px;width:32px;height:32px;
          border-radius:50%;background:rgba(59,130,246,0.25);
          animation:poi-pulse 2s ease-out infinite;
        "></span>
        <div style="
          width:20px;height:20px;border-radius:50%;
          background:#3b82f6;border:3px solid white;
          box-shadow:0 2px 8px rgba(59,130,246,0.5);
          position:relative;z-index:1;
        "></div>
      </div>
    `,
  });
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

function getXpForLevel(level: number): number {
  return level * 200;
}

function renderImportanceStars(score: number): string {
  const maxStars = 5;
  const filled = Math.round(score * maxStars);
  let result = '';
  for (let i = 0; i < maxStars; i++) {
    result += i < filled ? '\u2605' : '\u2606';
  }
  return result;
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

// Recenter map when user location updates
function RecenterOnUser({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();
  useMemo(() => {
    if (location) {
      map.setView([location.lat, location.lng], map.getZoom(), { animate: true });
    }
  }, [location?.lat, location?.lng]);
  return null;
}

export default function MapView({ pois, profile, userLocation, onPOISelect, timeOfDay }: MapViewProps) {
  const userIcon = useMemo(() => createUserIcon(), []);

  const nearestAvailable = useMemo(() => {
    if (!userLocation) return null;
    const available = pois.filter((p) => p.status === 'available');
    if (available.length === 0) return null;

    let nearest: POI | null = null;
    let minDist = Infinity;
    for (const poi of available) {
      const d = getDistanceMeters(userLocation.lat, userLocation.lng, poi.lat, poi.lng);
      if (d < minDist) {
        minDist = d;
        nearest = poi;
      }
    }
    return nearest ? { poi: nearest, distance: minDist } : null;
  }, [pois, userLocation]);

  const xpForCurrentLevel = getXpForLevel(profile.level);
  const xpProgress = xpForCurrentLevel > 0 ? Math.min((profile.xp / xpForCurrentLevel) * 100, 100) : 0;

  const TimeIcon = TIME_LABELS[timeOfDay].icon;

  return (
    <div className="relative w-full h-screen">
      {/* Pulse animation for markers */}
      <style>{`
        @keyframes poi-pulse {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* Leaflet Map */}
      <MapContainer
        center={ROME_CENTER}
        zoom={14}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <RecenterOnUser location={userLocation} />

        {/* User location blue dot */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <span className="text-sm font-medium">La tua posizione</span>
            </Popup>
          </Marker>
        )}

        {/* POI markers with unlock radius circles */}
        {pois.map((poi) => {
          const isNearest = nearestAvailable?.poi.id === poi.id;
          const icon = createPOIIcon(poi.status, isNearest);

          const circleColor =
            poi.status === 'completed'
              ? '#22c55e'
              : poi.status === 'available'
                ? '#f59e0b'
                : '#9ca3af';

          return (
            <span key={poi.id}>
              <Circle
                center={[poi.lat, poi.lng]}
                radius={poi.unlockDistance}
                pathOptions={{
                  color: circleColor,
                  fillColor: circleColor,
                  fillOpacity: 0.08,
                  weight: 1,
                  opacity: 0.3,
                }}
              />
              <Marker
                position={[poi.lat, poi.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onPOISelect(poi),
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{poi.name}</strong>
                    <br />
                    <span className="text-gray-500">
                      {CATEGORY_LABELS[poi.category] || poi.category}
                    </span>
                  </div>
                </Popup>
              </Marker>
            </span>
          );
        })}
      </MapContainer>

      {/* ===== Top Bar Overlay ===== */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
        <div className="mx-3 mt-3 pointer-events-auto">
          <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-stone-700/50">
            <div className="flex items-center justify-between">
              {/* City name and time-of-day badge */}
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

              {/* Coins display */}
              <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1 rounded-full">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-bold text-sm">{profile.coins}</span>
              </div>
            </div>

            {/* Level and XP progress bar */}
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

      {/* ===== Bottom Card Overlay -- Prossima Tappa ===== */}
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
