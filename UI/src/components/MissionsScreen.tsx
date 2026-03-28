import { Target, Lock, CheckCircle2, Clock } from 'lucide-react';

const missions = [
    {
        id: 1,
        name: 'Colosseum',
        category: 'Ancient Rome',
        status: 'available',
        progress: 0,
        distance: '300m',
        xp: 100,
    },
    {
        id: 2,
        name: 'Trevi Fountain',
        category: 'Baroque Art',
        status: 'completed',
        progress: 100,
        completedAt: '2 hours ago',
        xp: 100,
    },
    {
        id: 3,
        name: 'Pantheon',
        category: 'Ancient Rome',
        status: 'completed',
        progress: 100,
        completedAt: '1 day ago',
        xp: 100,
    },
    {
        id: 4,
        name: 'Spanish Steps',
        category: 'Art & Culture',
        status: 'available',
        progress: 0,
        distance: '1.2km',
        xp: 150,
    },
    {
        id: 5,
        name: 'Vatican Museums',
        category: 'Renaissance Art',
        status: 'locked',
        progress: 0,
        unlockRequirement: 'Complete 5 missions',
        xp: 200,
    },
    {
        id: 6,
        name: 'Roman Forum',
        category: 'Ancient Rome',
        status: 'locked',
        progress: 0,
        unlockRequirement: 'Level 3 required',
        xp: 150,
    },
];

export default function MissionsScreen() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-md">
                <div className="px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Missions</h1>
                    <p className="text-gray-600">Complete missions to unlock new locations</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {missions.map((mission) => (
                    <div
                        key={mission.id}
                        className={`
              bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-200
              ${mission.status !== 'locked' ? 'hover:shadow-lg' : 'opacity-75'}
            `}
                    >
                        <div className="p-5">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`
                    p-3 rounded-xl
                    ${mission.status === 'completed'
                                            ? 'bg-green-100'
                                            : mission.status === 'available'
                                                ? 'bg-blue-100'
                                                : 'bg-gray-100'
                                        }
                  `}
                                >
                                    {mission.status === 'completed' && (
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    )}
                                    {mission.status === 'available' && (
                                        <Target className="w-6 h-6 text-blue-600" />
                                    )}
                                    {mission.status === 'locked' && <Lock className="w-6 h-6 text-gray-400" />}
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-1">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{mission.name}</h3>
                                            <span className="text-sm text-gray-600">{mission.category}</span>
                                        </div>
                                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                                            {mission.xp} XP
                                        </div>
                                    </div>

                                    {mission.status === 'completed' && (
                                        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            <span>Completed {mission.completedAt}</span>
                                        </div>
                                    )}

                                    {mission.status === 'available' && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                                <span>{mission.distance} away</span>
                                                <span>{mission.progress}%</span>
                                            </div>
                                            <div className="bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${mission.progress}%` }}
                                                />
                                            </div>
                                            <button className="mt-3 w-full bg-blue-500 text-white py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors">
                                                Start Mission
                                            </button>
                                        </div>
                                    )}

                                    {mission.status === 'locked' && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                            <Lock className="w-4 h-4" />
                                            <span>{mission.unlockRequirement}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
