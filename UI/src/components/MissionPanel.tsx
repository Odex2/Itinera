import { useState } from 'react';
import { X, MapPin, Award, ChevronRight, Check } from 'lucide-react';

interface MissionPanelProps {
    missionId: number;
    onClose: () => void;
}

interface MissionData {
    name: string;
    category: string;
    step: number;
    totalSteps: number;
    story: string;
    funFact: string;
    question: string;
    answers: string[];
    correctAnswer: number;
}

const missionData: Record<number, MissionData> = {
    1: {
        name: 'Colosseum',
        category: 'Ancient Rome',
        step: 1,
        totalSteps: 3,
        story:
            'You stand before the mighty Colosseum, where gladiators once battled for glory and survival. The echoes of 50,000 spectators still whisper through these ancient stones.',
        funFact:
            'The Colosseum could be filled or emptied in just 15 minutes through its 80 entrances!',
        question: 'In what year was the Colosseum completed?',
        answers: ['70 AD', '80 AD', '90 AD'],
        correctAnswer: 1,
    },
    2: {
        name: 'Trevi Fountain',
        category: 'Baroque Art',
        step: 1,
        totalSteps: 3,
        story:
            'Legend says if you toss a coin over your shoulder into the Trevi Fountain, you are guaranteed to return to Rome. Every day, approximately 3,000 euros are tossed into this fountain.',
        funFact: 'The coins collected are donated to charity, helping those in need!',
        question: 'Who designed the Trevi Fountain?',
        answers: ['Nicola Salvi', 'Gian Lorenzo Bernini', 'Michelangelo'],
        correctAnswer: 0,
    },
};

export default function MissionPanel({ missionId, onClose }: MissionPanelProps) {
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [hasAnswered, setHasAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const mission = missionData[missionId];

    if (!mission) return null;

    const handleSubmit = () => {
        if (selectedAnswer === null) return;
        setHasAnswered(true);
        setIsCorrect(selectedAnswer === mission.correctAnswer);
    };

    const handleComplete = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-gray-900">{mission.name}</h2>
                            <span className="text-sm text-gray-600">{mission.category}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${(mission.step / mission.totalSteps) * 100}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-gray-600">
                            {mission.step}/{mission.totalSteps}
                        </span>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-5 mb-6">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="text-lg">📖</span>
                            Story
                        </h3>
                        <p className="text-gray-700 leading-relaxed">{mission.story}</p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mb-6">
                        <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            Fun Fact
                        </h3>
                        <p className="text-green-800 leading-relaxed">{mission.funFact}</p>
                    </div>

                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 mb-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-orange-500" />
                            Quiz Challenge
                        </h3>
                        <p className="text-gray-700 font-medium mb-4">{mission.question}</p>

                        <div className="space-y-3">
                            {mission.answers.map((answer: string, index: number) => (
                                <button
                                    key={index}
                                    onClick={() => !hasAnswered && setSelectedAnswer(index)}
                                    disabled={hasAnswered}
                                    className={`
                    w-full p-4 rounded-xl font-medium text-left transition-all duration-200
                    ${selectedAnswer === index && !hasAnswered
                                            ? 'bg-blue-500 text-white shadow-lg'
                                            : ''
                                        }
                    ${hasAnswered && index === mission.correctAnswer
                                            ? 'bg-green-500 text-white'
                                            : ''
                                        }
                    ${hasAnswered &&
                                            selectedAnswer === index &&
                                            index !== mission.correctAnswer
                                            ? 'bg-red-500 text-white'
                                            : ''
                                        }
                    ${!hasAnswered && selectedAnswer !== index
                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            : ''
                                        }
                    ${hasAnswered &&
                                            selectedAnswer !== index &&
                                            index !== mission.correctAnswer
                                            ? 'bg-gray-100 text-gray-400'
                                            : ''
                                        }
                  `}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{answer}</span>
                                        {hasAnswered && index === mission.correctAnswer && (
                                            <Check className="w-5 h-5" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {hasAnswered && (
                        <div
                            className={`
                p-4 rounded-2xl mb-6 animate-fade-in
                ${isCorrect ? 'bg-green-100 border-2 border-green-300' : 'bg-orange-100 border-2 border-orange-300'}
              `}
                        >
                            <p
                                className={`font-semibold ${isCorrect ? 'text-green-900' : 'text-orange-900'}`}
                            >
                                {isCorrect ? '🎉 Correct! Great job!' : '💪 Not quite, but keep exploring!'}
                            </p>
                        </div>
                    )}

                    {!hasAnswered ? (
                        <button
                            onClick={handleSubmit}
                            disabled={selectedAnswer === null}
                            className={`
                w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2
                transition-all duration-200
                ${selectedAnswer !== null
                                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }
              `}
                        >
                            Submit Answer
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            className="w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Check className="w-5 h-5" />
                            Complete Mission
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
