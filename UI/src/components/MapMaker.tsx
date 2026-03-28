import { MapPin, Lock, CheckCircle2 } from 'lucide-react';

interface Mission {
    id: number;
    name: string;
    x: number;
    y: number;
    status: 'locked' | 'available' | 'completed';
    isActive?: boolean;
}

interface MapMarkerProps {
    mission: Mission;
    onSelect: () => void;
}

export default function MapMarker({ mission, onSelect }: MapMarkerProps) {
    const getMarkerStyle = () => {
        switch (mission.status) {
            case 'locked':
                return 'bg-gray-400 text-white';
            case 'available':
                return mission.isActive
                    ? 'bg-orange-500 text-white animate-pulse'
                    : 'bg-blue-500 text-white';
            case 'completed':
                return 'bg-green-500 text-white';
            default:
                return 'bg-gray-400 text-white';
        }
    };

    const getIcon = () => {
        if (mission.status === 'locked') return <Lock className="w-4 h-4" />;
        if (mission.status === 'completed') return <CheckCircle2 className="w-4 h-4" />;
        return <MapPin className="w-4 h-4" />;
    };

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: `${mission.x}%`, top: `${mission.y}%` }}
            onClick={mission.status !== 'locked' ? onSelect : undefined}
        >
            <div className="relative">
                {mission.isActive && (
                    <div className="absolute inset-0 -m-2">
                        <div className="w-12 h-12 bg-orange-400 rounded-full opacity-50 animate-ping"></div>
                    </div>
                )}
                <div
                    className={`
            w-10 h-10 rounded-full shadow-lg flex items-center justify-center
            transition-all duration-200 hover:scale-110
            ${getMarkerStyle()}
          `}
                >
                    {getIcon()}
                </div>
            </div>
            <div className="mt-1 bg-white px-2 py-1 rounded-lg shadow-md text-xs font-semibold text-gray-800 whitespace-nowrap">
                {mission.name}
            </div>
        </div>
    );
}
