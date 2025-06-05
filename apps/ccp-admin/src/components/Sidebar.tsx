import React from 'react';
import type {
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
} from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  UserGroupIcon,
  CubeIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

/**
 * Navigation item interface
 */
interface NavItem {
  name: string;
  href: string;
  icon: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string;
      titleId?: string;
    } & RefAttributes<SVGSVGElement>
  >;
  description: string;
}

/**
 * Navigation items configuration
 */
const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Overview and metrics',
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: UserGroupIcon,
    description: 'Manage customer configurations',
  },
  {
    name: 'Modules',
    href: '/modules',
    icon: CubeIcon,
    description: 'Available modules and components',
  },
  {
    name: 'Branding',
    href: '/branding',
    icon: SwatchIcon,
    description: 'Custom themes and styling',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    description: 'Usage analytics and reports',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'System settings and preferences',
  },
];

/**
 * Sidebar navigation component
 */
function Sidebar(): React.ReactElement {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-connect-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CCP</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
            <p className="text-xs text-gray-500">Configuration Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive: linkActive }) => {
                const active = isActive || linkActive;
                return `
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${active
                    ? 'bg-connect-50 text-connect-700 border-r-2 border-connect-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `;
              }}
            >
              {({ isActive: linkActive }) => {
                const active = isActive || linkActive;
                const IconComponent = item.icon;
                
                return (
                  <>
                    <IconComponent
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200
                        ${active 
                          ? 'text-connect-600' 
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={`
                        text-xs transition-colors duration-200
                        ${active 
                          ? 'text-connect-600' 
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `}>
                        {item.description}
                      </div>
                    </div>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500 text-center">
          <div className="font-medium">Amazon Connect CCP</div>
          <div>Configuration Management</div>
          <div className="mt-1 text-gray-400">v1.0.0</div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;