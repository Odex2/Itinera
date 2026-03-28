import { Map, Target, ShoppingBag, User } from 'lucide-react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const navItems: { id: Screen; label: string; icon: typeof Map }[] = [
    { id: 'map', label: 'Mappa', icon: Map },
    { id: 'missions', label: 'Missioni', icon: Target },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Profilo', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg z-30">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex flex-col items-center justify-center gap-0.5 py-2 px-4 rounded-xl
                transition-all duration-200
                ${isActive ? 'bg-amber-50' : 'hover:bg-stone-50'}
              `}
            >
              <Icon
                className={`
                  w-5 h-5 transition-colors duration-200
                  ${isActive ? 'text-amber-600' : 'text-stone-400'}
                `}
              />
              <span
                className={`
                  text-[10px] font-semibold transition-colors duration-200
                  ${isActive ? 'text-amber-600' : 'text-stone-400'}
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
