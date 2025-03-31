import { Link, useLocation } from 'react-router-dom';
import { Search, BarChart2, Users, MessageSquare } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();

  const tabs = [
    { name: 'Search', path: '/', icon: Search },
    { name: 'Lead Data', path: '/leads', icon: Users },
    { name: 'Campaigns', path: '/campaigns', icon: BarChart2 },
    { name: 'Sales Tracker', path: '/sales', icon: MessageSquare },
  ];

  return (
    <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex w-full">
            <div className="flex space-x-1 sm:space-x-8 w-full justify-between sm:justify-start">
              {tabs.map(({ name, path, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`inline-flex items-center px-2 sm:px-1 pt-1 text-xs sm:text-sm font-medium border-b-2 ${
                    location.pathname === path
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}