import OnboardingScreen from './components/OnboardingScreen';
import MapView from './components/MapView';
import MissionsScreen from './components/MissionsScreen';
import ShopScreen from './components/ShopScreen';
import ProfileScreen from './components/ProfileScreen';
import Navigation from './components/Navigation';
import MissionPanel from './components/MissionPanel';
import { useGameState } from './hooks/useGameState';
import { useGeolocation, getDistanceMeters } from './hooks/useGeolocation';

function App() {
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
  } = useGameState();

  const geo = useGeolocation();
  const userLocation =
    geo.lat !== null && geo.lng !== null ? { lat: geo.lat, lng: geo.lng } : null;

  const getUserDistanceToPOI = () => {
    if (!selectedPOI || !userLocation) return null;
    return getDistanceMeters(userLocation.lat, userLocation.lng, selectedPOI.lat, selectedPOI.lng);
  };

  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 relative">
      <div className="pb-16">
        {currentScreen === 'map' && (
          <MapView
            pois={pois}
            profile={profile}
            userLocation={userLocation}
            isDemoMode={geo.isDemoMode}
            onPOISelect={setSelectedPOI}
            timeOfDay={timeOfDay}
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
          <ProfileScreen profile={profile} badges={badges} />
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