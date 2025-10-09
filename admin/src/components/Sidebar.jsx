import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  Clock, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Users, label: 'Users', active: false },
    { icon: UserCog, label: 'Teams', active: false },
    { icon: BarChart3, label: 'Reports', active: false },
  ];

  return (
    <div 
      className={`
        h-screen bg-gray-900 text-white 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-20'}
      `}
    >
      {/* Header avec toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <h1 className={`font-bold text-xl transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          Time Manager
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Menu items */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${item.active 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <item.icon size={20} className="flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout en bas */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <button
          className="
            w-full flex items-center gap-3 px-4 py-3 rounded-lg
            text-gray-400 hover:bg-gray-800 hover:text-white
            transition-all duration-200
          "
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;