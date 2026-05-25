'use client';

import React, { useEffect, useState } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '../store/useUIStore';
import { useSocket } from '../hooks/useSocket';
import { useAssignmentStore } from '../store/useAssignmentStore';
import {
  LayoutGrid,
  Contact2,
  FileText,
  Notebook,
  History,
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
  ArrowLeft,
  FilePlus,
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
    { label: 'Home', href: '/', icon: LayoutGrid },
    { label: 'My Groups', href: '/my-groups', icon: Contact2 },
    { label: 'Assignments', href: '/', icon: FileText, badge: true },
    { label: 'AI Teacher\'s Toolkit', href: '/toolkit', icon: Notebook },
    { label: 'My Library', href: '/', icon: History },
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

  let headerIcon = LayoutGrid;
  let headerTitle = 'Assignment';

  if (pathname.startsWith('/create') || pathname.startsWith('/assignments')) {
    headerIcon = Sparkles;
    headerTitle = 'Create New';
  } else if (pathname === '/settings') {
    headerIcon = Settings;
    headerTitle = 'Settings';
  } else if (pathname === '/my-groups') {
    headerIcon = Contact2;
    headerTitle = 'My Groups';
  } else if (pathname === '/toolkit') {
    headerIcon = Notebook;
    headerTitle = "AI Teacher's Toolkit";
  }

  const HeaderIcon = headerIcon;

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-[#ededed] text-[#181818] min-h-screen flex flex-col antialiased`}>
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="lg:hidden h-16 border-b border-[#eaeaea] bg-white sticky top-0 z-40 flex items-center justify-between px-6 no-print">
          <Link href="/" className="flex items-center gap-2 text-[#3d3d3d] font-bold text-lg">
            <svg viewBox="0 0 100 100" className="w-8 h-8 flex-shrink-0 shadow-[0_2px_6px_rgba(0,0,0,0.06)]">
              <defs>
                <linearGradient id="logo-bg-mobile" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ED762F" />
                  <stop offset="100%" stopColor="#961618" />
                </linearGradient>
                <radialGradient id="gloss-mobile" cx="20%" cy="20%" r="60%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="left-wing-mobile" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="45%" stopColor="#ffffff" />
                  <stop offset="85%" stopColor="#d2d2d6" />
                  <stop offset="100%" stopColor="#a3a3a8" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="24" fill="url(#logo-bg-mobile)" />
              <rect width="100" height="100" rx="24" fill="url(#gloss-mobile)" />
              <path d="M22 26h15.5l11 29.5c.5 1.3 1 1.8 1.5 2.5L45 75h-2c-2.5 0-4.5-1.5-5-3.5L22 26z" fill="url(#left-wing-mobile)" />
              <path d="M45 75l5-17c.5-.7 1-1.2 1.5-2.5l11-29.5H78L57.5 71.5c-.5 2-2.5 3.5-5 3.5H45z" fill="#ffffff" />
            </svg>
            <span className="tracking-tight">VedaAI</span>
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
          <aside className="hidden lg:flex flex-col w-64 bg-white border border-[#eaeaea] rounded-[28px] m-4 mr-2 shadow-sm h-[calc(100vh-2rem)] sticky top-4 justify-between flex-shrink-0 no-print">
            <div className="flex flex-col flex-1">
              {/* Logo block */}
              <div className="pt-8 pb-4 px-7 flex items-center">
                <Link href="/" className="flex items-center gap-2 text-[#3d3d3d] font-bold text-[22px]">
                  <svg viewBox="0 0 100 100" className="w-10 h-10 flex-shrink-0 shadow-[0_3px_8px_rgba(0,0,0,0.06)]">
                    <defs>
                      <linearGradient id="logo-bg-desktop" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ED762F" />
                        <stop offset="100%" stopColor="#961618" />
                      </linearGradient>
                      <radialGradient id="gloss-desktop" cx="20%" cy="20%" r="60%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                      </radialGradient>
                      <linearGradient id="left-wing-desktop" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor="#ffffff" />
                        <stop offset="85%" stopColor="#d2d2d6" />
                        <stop offset="100%" stopColor="#a3a3a8" />
                      </linearGradient>
                    </defs>
                    <rect width="100" height="100" rx="24" fill="url(#logo-bg-desktop)" />
                    <rect width="100" height="100" rx="24" fill="url(#gloss-desktop)" />
                    <path d="M22 26h15.5l11 29.5c.5 1.3 1 1.8 1.5 2.5L45 75h-2c-2.5 0-4.5-1.5-5-3.5L22 26z" fill="url(#left-wing-desktop)" />
                    <path d="M45 75l5-17c.5-.7 1-1.2 1.5-2.5l11-29.5H78L57.5 71.5c-.5 2-2.5 3.5-5 3.5H45z" fill="#ffffff" />
                  </svg>
                  <span className="tracking-[-0.03em]">VedaAI</span>
                </Link>
              </div>

              {/* Create Assignment Button */}
              <div className="px-6 pb-4">
                <Link
                  href="/create"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-b from-[#2d2d30] to-[#1b1b1d] border-2 border-[#ed6c37] hover:border-[#f07b4d] text-white text-sm font-semibold shadow-md transition-all duration-200"
                >
                  <Sparkles className="w-4 h-4 text-white fill-white" />
                  <span>Create Assignment</span>
                </Link>
              </div>

              {/* Sidebar Menu items */}
              <nav className="flex-1 px-4 py-2 flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active =
                    (item.label === 'Assignments' && (pathname === '/' || pathname.startsWith('/assignments') || pathname.startsWith('/create'))) ||
                    (item.label === 'My Groups' && pathname === '/my-groups') ||
                    (item.label === 'AI Teacher\'s Toolkit' && pathname === '/toolkit') ||
                    (item.label === 'My Library' && pathname === '/library');
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                        active
                          ? 'bg-[#f0f0f2] text-[#18181b]'
                          : 'text-gray-500 hover:bg-gray-100/50 hover:text-[#181818]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          active ? 'text-[#18181b]' : 'text-gray-400 group-hover:text-gray-600'
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
            <div className="flex flex-col gap-2 px-4 pb-6">
              <Link
                href="/settings"
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                  pathname === '/settings'
                    ? 'bg-[#f0f0f2] text-[#18181b]'
                    : 'text-gray-500 hover:bg-gray-100/50 hover:text-[#181818]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Settings className={`w-5 h-5 flex-shrink-0 ${
                    pathname === '/settings' ? 'text-[#18181b]' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <span className="font-semibold text-sm">Settings</span>
                </div>
              </Link>

              <div className="p-3.5 rounded-2xl bg-[#f0f0f2] flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#fae0d6] flex items-center justify-center border border-pink-100/50">
                  <img src="/ape-avatar.png" alt="School Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-[#181818] truncate leading-tight">{orgName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{orgLoc}</p>
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
              <aside className="relative flex flex-col w-72 bg-white border-r border-[#eaeaea] p-6 h-full shadow-2xl justify-between">
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-6">
                    <Link href="/" onClick={() => setMobileDrawer(false)} className="flex items-center gap-2 text-[#3d3d3d] font-bold text-xl">
                      <svg viewBox="0 0 100 100" className="w-9 h-9 flex-shrink-0 shadow-[0_3px_7px_rgba(0,0,0,0.06)]">
                        <defs>
                          <linearGradient id="logo-bg-drawer" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ED762F" />
                            <stop offset="100%" stopColor="#961618" />
                          </linearGradient>
                          <radialGradient id="gloss-drawer" cx="20%" cy="20%" r="60%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="left-wing-drawer" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="45%" stopColor="#ffffff" />
                            <stop offset="85%" stopColor="#d2d2d6" />
                            <stop offset="100%" stopColor="#a3a3a8" />
                          </linearGradient>
                        </defs>
                        <rect width="100" height="100" rx="24" fill="url(#logo-bg-drawer)" />
                        <rect width="100" height="100" rx="24" fill="url(#gloss-drawer)" />
                        <path d="M22 26h15.5l11 29.5c.5 1.3 1 1.8 1.5 2.5L45 75h-2c-2.5 0-4.5-1.5-5-3.5L22 26z" fill="url(#left-wing-drawer)" />
                        <path d="M45 75l5-17c.5-.7 1-1.2 1.5-2.5l11-29.5H78L57.5 71.5c-.5 2-2.5 3.5-5 3.5H45z" fill="#ffffff" />
                      </svg>
                      <span className="tracking-[-0.03em]">VedaAI</span>
                    </Link>
                    <button
                      onClick={() => setMobileDrawer(false)}
                      className="p-2 text-gray-400 hover:text-gray-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Create Assignment Button in Mobile Drawer */}
                  <div className="pb-4">
                    <Link
                      href="/create"
                      onClick={() => setMobileDrawer(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-b from-[#2d2d30] to-[#1b1b1d] border-2 border-[#ed6c37] text-white text-sm font-semibold shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-white fill-white" />
                      <span>Create Assignment</span>
                    </Link>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active =
                        (item.label === 'Assignments' && (pathname === '/' || pathname.startsWith('/assignments') || pathname.startsWith('/create'))) ||
                        (item.label === 'My Groups' && pathname === '/my-groups') ||
                        (item.label === 'AI Teacher\'s Toolkit' && pathname === '/toolkit');
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileDrawer(false)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                            active
                              ? 'bg-[#f0f0f2] text-[#18181b]'
                              : 'text-gray-500 hover:bg-gray-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <Icon className={`w-5 h-5 ${active ? 'text-[#18181b]' : 'text-gray-400'}`} />
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
                </div>
                
                {/* Mobile Drawer Footer (Settings + School Card) */}
                <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-[#eaeaea]">
                  <Link
                    href="/settings"
                    onClick={() => setMobileDrawer(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-150 group ${
                      pathname === '/settings'
                        ? 'bg-[#f0f0f2] text-[#18181b]'
                        : 'text-gray-500 hover:bg-gray-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Settings className={`w-5 h-5 ${pathname === '/settings' ? 'text-[#18181b]' : 'text-gray-400'}`} />
                      <span className="font-semibold text-sm">Settings</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f0f0f2]">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[#fae0d6] flex items-center justify-center border border-pink-100/50">
                      <img src="/ape-avatar.png" alt="School Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-[#181818] truncate leading-tight">{orgName}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{orgLoc}</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* Main Layout Area */}
          <main className="flex-1 flex flex-col m-4 ml-2 lg:m-4 lg:ml-2 overflow-hidden min-h-[calc(100vh-2rem)]">
            
            {/* Desktop Floating Top Header Capsule */}
            {/* Desktop Floating Top Header Capsule */}
            <header className="hidden lg:flex bg-[#fafafa] rounded-3xl h-[52px] items-center justify-between pl-[22px] pr-[26px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-6 flex-shrink-0 no-print">
              {/* Left Section */}
              <div className="flex items-center gap-[11px]">
                <button 
                  onClick={() => window.history.back()} 
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-[#f0f0f0]/30 cursor-pointer"
                >
                  <ArrowLeft className="w-[18px] h-[18px] text-[#595959]" strokeWidth={2.2} />
                </button>
                <div className="flex items-center gap-[9px]">
                  <HeaderIcon className="w-[18px] h-[18px] text-[#a3a3a8]" strokeWidth={2.2} />
                  <span className="text-[#b1b1b1] font-medium text-sm tracking-tight">{headerTitle}</span>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-[19px]">
                <button className="w-9 h-9 rounded-full bg-[#f6f6f6] flex items-center justify-center hover:bg-gray-200/50 transition-colors relative cursor-pointer">
                  <Bell className="w-[18px] h-[18px] text-[#595959]" strokeWidth={2.2} />
                  <span className="absolute top-[2px] right-[2.5px] w-[7px] h-[7px] rounded-full bg-[#ff5624] ring-1 ring-white" />
                </button>
                
                <div className="flex items-center cursor-pointer group">
                  <div className="w-[30px] h-[30px] rounded-full overflow-hidden flex-shrink-0 bg-[#fae0d6] mr-[10px]">
                    <img src="/ape-avatar.png" alt="User Avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-[#323232] text-sm group-hover:text-[#ed6c37] transition-colors tracking-tight mr-[9px]">John Doe</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#a3a3a8] group-hover:text-gray-600 transition-colors" />
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
        <nav className="lg:hidden fixed bottom-6 left-6 right-6 z-40 bg-[#121212] text-white flex justify-around items-center px-4 py-3 rounded-[28px] shadow-2xl border border-white/5 no-print">
          {/* Home */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              pathname === '/' && !pathname.includes('/assignments') && !pathname.includes('/create') ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <LayoutGrid className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="mt-0.5">Home</span>
          </Link>

          {/* Assignments */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              (pathname === '/' || pathname.startsWith('/assignments') || pathname.startsWith('/create')) ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <FileText className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="mt-0.5">Assignments</span>
          </Link>

          {/* Library */}
          <Link
            href="/"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              pathname === '/library' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <FilePlus className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="mt-0.5">Library</span>
          </Link>

          {/* AI Toolkit */}
          <Link
            href="/toolkit"
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-all ${
              pathname === '/toolkit' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="mt-0.5">AI Toolkit</span>
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
