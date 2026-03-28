import { useState } from 'react';
import OnboardingScreen from './components/OnboardingScreen';
import MapView from './components/MapView';
import MissionsScreen from './components/MissionsScreen';
import BadgesScreen from './components/BadgesScreen';
import Navigation from './components/Navigation';
import MissionPanel from './components/MissionPanel';

type Screen = 'onboarding' | 'map' | 'missions' | 'badges';

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
    const [hasOnboarded, setHasOnboarded] = useState(false);
    const [selectedMission, setSelectedMission] = useState<number | null>(null);

    const handleOnboardingComplete = () => {
        setHasOnboarded(true);
        setCurrentScreen('map');
    };

    const handleMissionSelect = (missionId: number) => {
        setSelectedMission(missionId);
    };

    const handleMissionClose = () => {
        setSelectedMission(null);
    };

    if (!hasOnboarded) {
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <div className="pb-20">
                {currentScreen === 'map' && (
                    <MapView onMissionSelect={handleMissionSelect} />
                )}
                {currentScreen === 'missions' && <MissionsScreen />}
                {currentScreen === 'badges' && <BadgesScreen />}
            </div>

            <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />

            {selectedMission !== null && (
                <MissionPanel missionId={selectedMission} onClose={handleMissionClose} />
            )}
        </div>
    );
}

export default App;
