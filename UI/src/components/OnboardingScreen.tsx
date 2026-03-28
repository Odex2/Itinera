import { useState } from 'react';
import { Sparkles, MapPin } from 'lucide-react';

interface OnboardingScreenProps {
    onComplete: () => void;
}

const interests = [
    { id: 'history', label: 'History', icon: '🏛️' },
    { id: 'art', label: 'Art', icon: '🎨' },
    { id: 'food', label: 'Food', icon: '🍕' },
    { id: 'adventure', label: 'Adventure', icon: '🗺️' },
    { id: 'hidden', label: 'Hidden Spots', icon: '💎' },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const toggleInterest = (id: string) => {
        setSelectedInterests((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                        <MapPin className="w-12 h-12 text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Choose Your Adventure
                    </h1>
                    <p className="text-gray-600">
                        Select your interests and we'll create a personalized experience
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex flex-wrap gap-3 justify-center">
                        {interests.map((interest) => (
                            <button
                                key={interest.id}
                                onClick={() => toggleInterest(interest.id)}
                                className={`
                  px-5 py-3 rounded-full font-medium transition-all duration-200 transform
                  ${selectedInterests.includes(interest.id)
                                        ? 'bg-blue-500 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }
                `}
                            >
                                <span className="mr-2">{interest.icon}</span>
                                {interest.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    disabled={selectedInterests.length === 0}
                    className={`
            w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2
            transition-all duration-200 shadow-lg
            ${selectedInterests.length > 0
                            ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }
          `}
                >
                    <Sparkles className="w-5 h-5" />
                    Generate My Experience
                </button>
            </div>
        </div>
    );
}
