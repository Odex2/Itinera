import { Award, Lock, Crown, Star, Map, Brain, Compass } from 'lucide-react';

const badges = [
    {
        id: 1,
        name: 'Explorer',
        description: 'Visit 5 locations',
        icon: Map,
        progress: 3,
        total: 5,
        unlocked: false,
        color: 'blue',
    },
    {
        id: 2,
        name: 'Time Traveler',
        description: 'Complete Ancient Rome missions',
        icon: Compass,
        progress: 2,
        total: 3,
        unlocked: false,
        color: 'orange',
    },
    {
        id: 3,
        name: 'Quiz Master',
        description: 'Answer 10 questions correctly',
        icon: Brain,
        progress: 3,
        total: 10,
        unlocked: false,
        color: 'green',
    },
    {
        id: 4,
        name: 'First Steps',
        description: 'Complete your first mission',
        icon: Star,
        progress: 1,
        total: 1,
        unlocked: true,
        color: 'green',
    },
    {
        id: 5,
        name: 'Art Enthusiast',
        description: 'Visit all art locations',
        icon: Award,
        progress: 0,
        total: 5,
        unlocked: false,
        color: 'pink',
    },
    {
        id: 6,
        name: 'City Master',
        description: 'Complete all missions in Rome',
        icon: Crown,
        progress: 3,
        total: 6,
        unlocked: false,
        color: 'yellow',
        special: true,
    },
];

export default function BadgesScreen() {
    const getColorClasses = (color: string, unlocked: boolean) => {
        if (!unlocked) {
            return {
                bg: 'bg-gray-100',
                text: 'text-gray-400',
                progress: 'bg-gray-300',
            };
        }

        const colors: Record<string, { bg: string; text: string; progress: string }> = {
            blue: { bg: 'bg-blue-100', text: 'text-blue-600', progress: 'bg-blue-500' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-600', progress: 'bg-orange-500' },
            green: { bg: 'bg-green-100', text: 'text-green-600', progress: 'bg-green-500' },
            pink: { bg: 'bg-pink-100', text: 'text-pink-600', progress: 'bg-pink-500' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', progress: 'bg-yellow-500' },
        };

        return colors[color] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-md">
                <div className="px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Badges</h1>
                    <p className="text-gray-600">Collect achievements as you explore</p>
                </div>
            </div>

            <div className="p-4">
                <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 rounded-3xl shadow-xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-white bg-opacity-20 p-4 rounded-2xl backdrop-blur-sm">
                                <Crown className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">City Master</h2>
                                <p className="text-white text-opacity-90">The ultimate achievement</p>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-20 rounded-full h-3 backdrop-blur-sm">
                            <div
                                className="bg-white h-3 rounded-full transition-all duration-500"
                                style={{ width: '50%' }}
                            />
                        </div>
                        <p className="text-white text-sm mt-2">3/6 missions completed</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {badges
                        .filter((badge) => !badge.special)
                        .map((badge) => {
                            const colors = getColorClasses(badge.color, badge.unlocked);
                            const Icon = badge.icon;
                            const progressPercent = (badge.progress / badge.total) * 100;

                            return (
                                <div
                                    key={badge.id}
                                    className={`
                    bg-white rounded-2xl shadow-md p-4 transition-all duration-200
                    ${badge.unlocked ? 'hover:shadow-lg' : ''}
                  `}
                                >
                                    <div className="relative mb-3">
                                        <div className={`${colors.bg} p-4 rounded-2xl inline-block relative`}>
                                            <Icon className={`w-8 h-8 ${colors.text}`} />
                                            {!badge.unlocked && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-2xl">
                                                    <Lock className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                                    <p className="text-xs text-gray-600 mb-3">{badge.description}</p>
                                    <div className="bg-gray-200 rounded-full h-2 mb-1">
                                        <div
                                            className={`${colors.progress} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {badge.progress}/{badge.total}
                                    </p>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}
