import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

/**
 * Header component props
 */
interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Page title mapping
 */
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customer Management',
  '/modules': 'Module Management',
  '/analytics': 'Analytics & Reports',
  '/settings': 'Settings',
};

/**
 * Header component with navigation and user actions
 */
function Header({ onMenuClick }: HeaderProps): React.ReactElement {
  const location = useLocation();
  
  // Get page title based on current route
  const getPageTitle = (): string => {
    const path = location.pathname;
    
    // Check for customer detail page
    if (path.startsWith('/customers/') && path !== '/customers') {
      return 'Customer Configuration';
    }
    
    return pageTitles[path] || 'Configuration Admin';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={onMenuClick}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Page title */}
          <div className="ml-4 lg:ml-0">
            <h1 className="text-2xl font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-lg mx-8 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-connect-500 focus:border-connect-500 sm:text-sm"
              placeholder="Search configurations, customers, modules..."
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md relative"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 block h-2 w-2 bg-error-400 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
            >
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8" />
            </button>
          </div>

          {/* Environment indicator */}
          <div className="hidden sm:block">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
              Development
            </span>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="px-4 pb-4 md:hidden">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-connect-500 focus:border-connect-500 sm:text-sm"
            placeholder="Search..."
          />
        </div>
      </div>
    </header>
  );
}

export default Header;