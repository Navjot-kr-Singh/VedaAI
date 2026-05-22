'use client';

import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '../store/useUIStore';
import { useSocket } from '../hooks/useSocket';
import { useAssignmentStore } from '../store/useAssignmentStore';
import {
  Home,
  Users,
  ClipboardList,
  Sparkles,
  Settings,
  Menu,
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    mobileDrawerOpen,
    toasts,
    setMobileDrawer,
    removeToast,
    organizationName,
    organizationLocation,
    userName,
    userInitials,
    userRole,
  } = useUIStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const orgName = mounted ? organizationName : 'Delhi Public School';
  const orgLoc = mounted ? organizationLocation : 'Bokaro Steel City';
  const name = mounted ? userName : 'John Doe';
  const initials = mounted ? userInitials : 'JD';
  const role = mounted ? userRole : 'Teacher Account';

  const { assignments, fetchAssignments } = useAssignmentStore();

  // Initialize socket listener globally
  useSocket();

  // Load initial list of assignments
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'My Groups', href: '/my-groups', icon: Users },
    { label: 'Assignments', href: '/', icon: ClipboardList, badge: true },
    { label: 'AI Teacher\'s Toolkit', href: '/toolkit', icon: Sparkles },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Detect current breadcrumb page title
  let pageTitle = 'Assignments';
  if (pathname.includes('/create')) {
    pageTitle = 'Create Assignment';
  } else if (pathname.includes('/assignments/')) {
    pageTitle = 'Assignment View';
  } else if (pathname === '/settings') {
    pageTitle = 'Settings';
  } else if (pathname === '/my-groups') {
    pageTitle = 'My Groups';
  } else if (pathname === '/toolkit') {
    pageTitle = 'AI Teacher\'s Toolkit';
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-[#f6f6f6] text-[#181818] min-h-screen flex flex-col antialiased`}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden h-16 border-b border-[#eaeaea] bg-white sticky top-0 z-40 flex items-center justify-between px-6 no-print">
          <Link href="/" className="flex items-center gap-2 text-[#ed6c37] font-bold text-lg">
            <Sparkles className="w-5 h-5 fill-[#ed6c37]" />
            <span>VedaAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-[#ed6c37] absolute top-1.5 right-1.5 border border-white" />
            </button>
            <button
              onClick={() => setMobileDrawer(true)}
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex relative">
          
          {/* Desktop Floating Sidebar (Hidden on Mobile) */}
          <aside className="hidden lg:flex flex-col w-64 bg-white border border-[#eaeaea] rounded-2xl m-4 mr-2 shadow-sm h-[calc(100vh-2rem)] sticky top-4 justify-between flex-shrink-0 no-print">
            <div className="flex flex-col flex-1">
              {/* Logo block */}
              <div className="h-16 flex items-center px-6 border-b border-[#eaeaea]">
                <Link href="/" className="flex items-center gap-2 text-[#ed6c37] font-bold text-xl">
                  <Sparkles className="w-6 h-6 fill-[#ed6c37]" />
                  <span className="tracking-wide">vedaai</span>
                </Link>
              </div>

              {/* Sidebar Menu items */}
              <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  // Assignments is the active navigation item corresponding to home route /
                  const active =
                    (item.label === 'Assignments' && (pathname === '/' || pathname.startsWith('/assignments') || pathname.startsWith('/create'))) ||
                    (item.label === 'Settings' && pathname === '/settings') ||
                    (item.label === 'My Groups' && pathname === '/my-groups') ||
                    (item.label === 'AI Teacher\'s Toolkit' && pathname === '/toolkit');
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group ${
                        active
                          ? 'bg-[#fae0d6] text-[#ed6c37]'
                          : 'text-[#262626] hover:bg-gray-50 hover:text-[#181818]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          active ? 'text-[#ed6c37]' : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        <span className="font-semibold text-sm">{item.label}</span>
                      </div>
                      
                      {/* Active count badge */}
                      {item.badge && assignments.length > 0 && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          active ? 'bg-[#ed6c37] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {assignments.length}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* School profile panel footer */}
            <div className="p-4 border-t border-[#eaeaea]">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="p-2 bg-[#fae0d6] text-[#ed6c37] rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#181818] truncate leading-tight">{orgName}</p>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{orgLoc}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Navigation Drawer */}
          {mobileDrawerOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex no-print">
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileDrawer(false)}
              />
              <aside className="relative flex flex-col w-72 bg-white border-r border-[#eaeaea] p-6 h-full shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-[#ed6c37] font-bold text-xl">
                    <Sparkles className="w-6 h-6 fill-[#ed6c37]" />
                    <span>vedaai</span>
                  </div>
                  <button
                    onClick={() => setMobileDrawer(false)}
                    className="p-2 text-gray-400 hover:text-gray-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 flex flex-col gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active =
                      (item.label === 'Assignments' && (pathname === '/' || pathname.startsWith('/assignments') || pathname.startsWith('/create'))) ||
                      (item.label === 'Settings' && pathname === '/settings') ||
                      (item.label === 'My Groups' && pathname === '/my-groups') ||
                      (item.label === 'AI Teacher\'s Toolkit' && pathname === '/toolkit');
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileDrawer(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 group ${
                          active
                            ? 'bg-[#fae0d6] text-[#ed6c37]'
                            : 'text-[#262626] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className={`w-5 h-5 ${active ? 'text-[#ed6c37]' : 'text-gray-400'}`} />
                          <span className="font-semibold text-sm">{item.label}</span>
                        </div>
                        {item.badge && assignments.length > 0 && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            active ? 'bg-[#ed6c37] text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {assignments.length}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
                
                {/* School panel in mobile drawer footer */}
                <div className="border-t border-[#eaeaea] pt-4 mt-auto">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="p-2 bg-[#fae0d6] text-[#ed6c37] rounded-lg">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#181818]">{orgName}</p>
                      <p className="text-[10px] text-gray-500">{orgLoc}</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* Main Layout Area */}
          <main className="flex-1 flex flex-col m-4 ml-2 lg:m-4 lg:ml-2 overflow-hidden min-h-[calc(100vh-2rem)]">
            
            {/* Desktop Floating Top Header Capsule */}
            <header className="hidden lg:flex bg-white border border-[#eaeaea] rounded-2xl px-6 py-3.5 shadow-sm items-center justify-between mb-6 flex-shrink-0 no-print">
              {/* Breadcrumb / Title */}
              <div className="flex items-center gap-2 text-sm font-semibold text-[#181818]">
                <span className="text-gray-400">Home</span>
                <span className="text-gray-300">/</span>
                {pathname.includes('/create') ? (
                  <>
                    <span className="text-gray-400">Assignments</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-[#ed6c37]">Create</span>
                  </>
                ) : pathname.startsWith('/assignments/') ? (
                  <>
                    <span className="text-gray-400">Assignments</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-[#ed6c37]">View</span>
                  </>
                ) : pathname === '/settings' ? (
                  <span className="text-[#ed6c37]">Settings</span>
                ) : pathname === '/my-groups' ? (
                  <span className="text-[#ed6c37]">My Groups</span>
                ) : pathname === '/toolkit' ? (
                  <span className="text-[#ed6c37]">AI Teacher's Toolkit</span>
                ) : (
                  <span className="text-[#ed6c37]">Assignments</span>
                )}
              </div>

              {/* Header Right Items (Search, Notification, Profile) */}
              <div className="flex items-center gap-4">
                {/* Search box */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    disabled
                    placeholder="Search anything here..."
                    className="pl-9 pr-4 py-1.5 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none w-60 cursor-not-allowed"
                  />
                </div>

                {/* Notification Bell */}
                <button className="p-2 hover:bg-gray-50 rounded-xl relative border border-[#eaeaea]">
                  <Bell className="w-4 h-4 text-gray-600" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ed6c37] absolute top-1 right-1 border-2 border-white" />
                </button>

                {/* User Dropdown */}
                <div className="flex items-center gap-2.5 border-l border-gray-100 pl-4 py-0.5 cursor-pointer group">
                  <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-[#ed6c37] flex items-center justify-center font-bold text-xs shadow-sm uppercase">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#181818] group-hover:text-[#ed6c37] transition-colors leading-tight">{name}</p>
                    <p className="text-[10px] text-gray-400">{role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />
                </div>
              </div>
            </header>

            {/* Child content render container */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Floating Mobile Tab Bar Navigation (capsule at bottom) */}
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-40 bg-[#181818] text-white flex justify-around items-center px-6 py-3 rounded-full shadow-2xl border border-white/10 no-print">
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              pathname === '/' || pathname.startsWith('/assignments') ? 'text-[#ed6c37]' : 'text-gray-400'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Assignments</span>
          </Link>
          <Link
            href="/create"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
              pathname.includes('/create') ? 'text-[#ed6c37]' : 'text-gray-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Create</span>
          </Link>
        </nav>

        {/* Global Floating Toasts Container */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm no-print">
          {toasts.map((toast) => {
            let Icon = Info;
            let themeClass = 'bg-white border-gray-200 text-gray-800 shadow-xl';
            if (toast.type === 'success') {
              Icon = CheckCircle;
              themeClass = 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-xl';
            } else if (toast.type === 'error') {
              Icon = AlertCircle;
              themeClass = 'bg-rose-50 border-rose-100 text-rose-800 shadow-xl';
            } else if (toast.type === 'warning') {
              Icon = AlertTriangle;
              themeClass = 'bg-amber-50 border-amber-100 text-amber-800 shadow-xl';
            }

            return (
              <div
                key={toast.id}
                className={`flex gap-3 items-start p-4 rounded-xl border backdrop-blur-md transition-all duration-300 ${themeClass}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-current" />
                <div className="flex-1 text-xs font-semibold">{toast.message}</div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </body>
    </html>
  );
}
