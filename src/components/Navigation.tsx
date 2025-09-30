'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { MapPin, Zap, Save, ChevronDown, Map, List, Menu, X } from 'lucide-react';

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
  const [isGeofencingDropdownOpen, setIsGeofencingDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGeofencingDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
      <div className="mx-auto px-10 py-4">
        <div className="flex justify-between items-center">
          {/* Left side - Title */}
          <h1 className="text-xl font-bold text-gray-900">Evergreen Data Management Tool</h1>
          
          {/* Right side - Navigation and buttons */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="flex items-center space-x-2">
              {/* Geofencing with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsGeofencingDropdownOpen(!isGeofencingDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Geofencing
                  <ChevronDown className={`w-4 h-4 transition-transform ${isGeofencingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isGeofencingDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <Link
                      href="/"
                      onClick={() => setIsGeofencingDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Map className="w-4 h-4" />
                      Structure Map
                    </Link>
                    {onHierarchyClick && (
                      <button
                        onClick={() => {
                          onHierarchyClick();
                          setIsGeofencingDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                      >
                        <List className="w-4 h-4" />
                        Hierarchy Manager
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Triggers Link */}
              <Link
                href="/triggers"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/triggers' 
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Zap className="w-4 h-4" />
                Triggers
              </Link>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* Save Button - Special Green Style */}
              <Link
                href="/save"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/save' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Save className="w-4 h-4" />
                Save Data
              </Link>
              
              {/* Mobile toggle button - only for home page */}
              {pathname === '/' && isMobile && onMobileToggle && (
                <button
                  onClick={onMobileToggle}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
