import { useState } from 'react';
import SplashScreen from './components/Landingscreen';
import OnboardingScreen from './components/OnboardingScreen';
import MapView from './components/MapView';
import MissionsScreen from './components/MissionsScreen';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import ProfileSetupScreen from './components/ProfileSetupScreen';
import Navigation from './components/Navigation';
import MissionPanel from './components/MissionPanel';
import { useGameState } from './hooks/useGameState';
import { useGeolocation, getDistanceMeters } from './hooks/useGeolocation';

import CitySelectionScreen from './components/CitySelectionScreen';

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [customCityLocation, setCustomCityLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const {
    profile,
    pois,
    rewards,
    badges,
    currentScreen,
    selectedPOI,
    hasOnboarded,
    timeOfDay,
    setCurrentScreen,
    setSelectedPOI,
    completeOnboarding,
    completePOI,
    completeChallenge,
    claimReward,
    getTimeOptimizedRewards,
    updateProfileBasic,
    fetchDynamicPOIs,
    resetPOIsForCity,
    getVisiblePOIs,
  } = useGameState();

  const geo = useGeolocation();
  const actualUserLocation =
    geo.lat !== null && geo.lng !== null ? { lat: geo.lat, lng: geo.lng } : null;

  // L'app utiizza come posizione il customCity scelto (se presente) ALTRIMENTI la vera posizione GPS
  const userLocation = customCityLocation || actualUserLocation;

  const getUserDistanceToPOI = () => {
    if (!selectedPOI || !userLocation) return null;
    return getDistanceMeters(userLocation.lat, userLocation.lng, selectedPOI.lat, selectedPOI.lng);
  };

  // 1️⃣ Splash — prima di tutto
  if (!splashDone) {
    return <SplashScreen onStart={() => setSplashDone(true)} />;
  }

  // 2️⃣ Profile Setup -- prima dell'onboarding
  if (!profile.username) {
    return (
      <ProfileSetupScreen
        onComplete={(username, age) => {
          updateProfileBasic(username, age);
        }}
      />
    );
  }

  // 3️⃣ Onboarding — solo se non ancora completato
  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // 4️⃣ Scelta della città -- dopo l'onboarding, prima della mappa principale
  if (currentScreen === 'city_selection') {
    return (
      <CitySelectionScreen
        onSelect={(coords) => {
          if (coords) {
            setCustomCityLocation(coords);
            resetPOIsForCity(coords.name);
          } else {
            setCustomCityLocation(null);
            resetPOIsForCity('Roma');
          }
          setCurrentScreen('map');
        }}
      />
    );
  }

  // 5️⃣ App principale
  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="pb-16">
        {currentScreen === 'map' && (
          <MapView
            pois={userLocation ? getVisiblePOIs(userLocation.lat, userLocation.lng) : pois}
            profile={profile}
            userLocation={userLocation}
            isDemoMode={geo.isDemoMode}
            onPOISelect={setSelectedPOI}
            timeOfDay={timeOfDay}
            onRequestDynamicPOIs={fetchDynamicPOIs}
            hideBottomCard={!!selectedPOI}
            cityName={customCityLocation?.name}
            onChangeCity={() => setCurrentScreen('city_selection')}
          />
        )}
        {currentScreen === 'missions' && (
          <MissionsScreen pois={pois} onPOISelect={setSelectedPOI} />
        )}
        {currentScreen === 'shop' && (
          <ShopScreen
            rewards={getTimeOptimizedRewards()}
            profile={profile}
            onClaimReward={claimReward}
            timeOfDay={timeOfDay}
          />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen profile={profile} badges={badges} totalPOICount={pois.length} />
        )}
      </div>
      <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      {selectedPOI && (
        <MissionPanel
          poi={selectedPOI}
          profile={profile}
          timeOfDay={timeOfDay}
          onClose={() => setSelectedPOI(null)}
          onCompleteChallenge={completeChallenge}
          onCompletePOI={completePOI}
          userDistance={getUserDistanceToPOI()}
        />
      )}
    </div>
  );
}

export default App;