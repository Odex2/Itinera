import { Map, Target, Award } from 'lucide-react';

interface NavigationProps {
    currentScreen: 'map' | 'missions' | 'badges';
    onNavigate: (screen: 'map' | 'missions' | 'badges') => void;
}

export default function Navigation({ currentScreen, onNavigate }: NavigationProps) {
    const navItems = [
        { id: 'map' as const, label: 'Map', icon: Map },
        { id: 'missions' as const, label: 'Missions', icon: Target },
        { id: 'badges' as const, label: 'Badges', icon: Award },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
            <div className="flex items-center justify-around px-4 py-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`
                flex flex-col items-center justify-center gap-1 py-2 px-6 rounded-xl
                transition-all duration-200
                ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}
              `}
                        >
                            <Icon
                                className={`
                  w-6 h-6 transition-colors duration-200
                  ${isActive ? 'text-blue-500' : 'text-gray-400'}
                `}
                            />
                            <span
                                className={`
                  text-xs font-semibold transition-colors duration-200
                  ${isActive ? 'text-blue-500' : 'text-gray-400'}
                `}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
