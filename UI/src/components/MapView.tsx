import { Navigation as NavigationIcon, Target } from 'lucide-react';
import MapMarker from './MapMaker';

interface MapViewProps {
    onMissionSelect: (missionId: number) => void;
}

const missions: { id: number; name: string; x: number; y: number; status: 'locked' | 'available' | 'completed'; isActive?: boolean }[] = [
    { id: 1, name: 'Colosseum', x: 45, y: 55, status: 'available', isActive: true },
    { id: 2, name: 'Trevi Fountain', x: 60, y: 35, status: 'completed' },
    { id: 3, name: 'Pantheon', x: 55, y: 40, status: 'completed' },
    { id: 4, name: 'Spanish Steps', x: 65, y: 30, status: 'available' },
    { id: 5, name: 'Vatican', x: 35, y: 25, status: 'locked' },
    { id: 6, name: 'Roman Forum', x: 50, y: 60, status: 'locked' },
];

export default function MapView({ onMissionSelect }: MapViewProps) {
    return (
        <div className="relative h-screen w-full overflow-hidden">
            <div className="absolute top-0 left-0 right-0 z-20 bg-white shadow-md">
                <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Rome</h1>
                            <p className="text-sm text-gray-600">3/6 missions completed</p>
                        </div>
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                            Level 2
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-blue-50 to-orange-50">
                <svg
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M10,20 Q30,15 50,25 T90,20"
                        stroke="#cbd5e1"
                        strokeWidth="0.5"
                        fill="none"
                    />
                    <path
                        d="M5,40 Q25,35 45,45 T85,40"
                        stroke="#cbd5e1"
                        strokeWidth="0.5"
                        fill="none"
                    />
                    <path
                        d="M15,60 Q35,55 55,65 T95,60"
                        stroke="#cbd5e1"
                        strokeWidth="0.5"
                        fill="none"
                    />
                </svg>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative w-3 h-3 bg-blue-500 rounded-full shadow-lg animate-pulse">
                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                </div>

                {missions.map((mission) => (
                    <MapMarker
                        key={mission.id}
                        mission={mission}
                        onSelect={() => onMissionSelect(mission.id)}
                    />
                ))}
            </div>

            <div className="absolute bottom-24 left-4 right-4 z-20">
                <div className="bg-white rounded-2xl shadow-xl p-4 transform transition-all hover:scale-105">
                    <div className="flex items-start gap-3">
                        <div className="bg-orange-500 p-3 rounded-xl">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Next Mission</h3>
                            <p className="text-sm text-gray-600 mb-2">Colosseum - Ancient Rome</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <NavigationIcon className="w-4 h-4" />
                                <span>300m away</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onMissionSelect(1)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                        >
                            Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
