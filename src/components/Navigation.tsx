'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  onHierarchyClick?: () => void;
  onMobileToggle?: () => void;
  isMobile?: boolean;
  sidebarOpen?: boolean;
}

export default function Navigation({ 
  onHierarchyClick, 
  onMobileToggle, 
  isMobile = false, 
  sidebarOpen = false 
}: NavigationProps) {
  const pathname = usePathname();
  
  return (
    <header className="bg-green-700 text-white p-4 shadow-md z-10 flex-shrink-0">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Evergreen Geofencing Tool</h1>
        <div className="flex items-center space-x-4">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-2">
            <Link
              href="/"
              className={`px-3 py-1 rounded text-sm transition-colors ${
                pathname === '/' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-800 hover:bg-green-600'
              }`}
            >
              Geofencing
            </Link>
            <Link
              href="/triggers"
              className={`px-3 py-1 rounded text-sm transition-colors ${
                pathname === '/triggers' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-800 hover:bg-green-600'
              }`}
            >
              Triggers
            </Link>
          </nav>
          
          {/* Additional Actions */}
          {pathname === '/' && onHierarchyClick && (
            <button
              onClick={onHierarchyClick}
              className="px-3 py-1 bg-green-800 hover:bg-green-900 rounded text-sm transition-colors"
            >
              Hierarchy
            </button>
          )}
          
          {/* Mobile toggle button - only for home page */}
          {pathname === '/' && isMobile && onMobileToggle && (
            <button
              onClick={onMobileToggle}
              className="p-2 rounded bg-green-800 hover:bg-green-900 transition-colors"
            >
              {sidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
