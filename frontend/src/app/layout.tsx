'use client';

import React, { useEffect } from 'react';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '../store/useUIStore';
import { useSocket } from '../hooks/useSocket';
import { useAssignmentStore } from '../store/useAssignmentStore';
import {
  LayoutDashboard,
  PlusCircle,
  AlertTriangle,
  Menu,
  X,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
} from 'lucide-react';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    mobileDrawerOpen,
    toasts,
    toggleSidebar,
    toggleMobileDrawer,
    setMobileDrawer,
    removeToast,
  } = useUIStore();

  const fetchAssignments = useAssignmentStore((state) => state.fetchAssignments);

  // Initialize socket listener globally
  useSocket();

  // Load initial list of assignments
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Create Paper', href: '/create', icon: PlusCircle },
  ];

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-[#0a0a0c] text-[#f3f4f6] min-h-screen flex flex-col`}>
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 no-print">
          <Link href="/" className="flex items-center gap-2 text-violet-400 font-bold text-lg">
            <Sparkles className="w-5 h-5 fill-current" />
            <span>VedaAI</span>
          </Link>
          <button
            onClick={toggleMobileDrawer}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 flex relative">
          {/* Desktop Sidebar */}
          <aside
            className={`hidden lg:flex flex-col border-r border-white/5 bg-[#0e0e12]/60 backdrop-blur-lg transition-all duration-300 no-print ${
              sidebarOpen ? 'w-64' : 'w-20'
            }`}
          >
            <div className="h-16 flex items-center px-6 border-b border-white/5">
              <Link href="/" className="flex items-center gap-2 text-violet-400 font-bold text-xl">
                <Sparkles className="w-6 h-6 fill-current" />
                {sidebarOpen && <span className="tracking-wide">VedaAI</span>}
              </Link>
            </div>

            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-violet-600/25 text-violet-300 border border-violet-500/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/5 flex items-center justify-center">
              <button
                onClick={toggleSidebar}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-2 border border-white/5 rounded-lg"
              >
                {sidebarOpen ? 'Collapse menu' : '➔'}
              </button>
            </div>
          </aside>

          {/* Mobile Drawer (Overlay backdrop & drawer panel) */}
          {mobileDrawerOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex no-print">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileDrawer(false)}
              />
              <aside className="relative flex flex-col w-72 bg-[#0e0e12] border-r border-white/5 p-6 animate-slide-in">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-violet-400 font-bold text-xl">
                    <Sparkles className="w-6 h-6 fill-current" />
                    <span>VedaAI</span>
                  </div>
                  <button
                    onClick={() => setMobileDrawer(false)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 flex flex-col gap-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawer(false)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
                          active
                            ? 'bg-violet-600/25 text-violet-300 border border-violet-500/20'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </aside>
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 min-h-[calc(100vh-4rem)] lg:min-h-screen flex flex-col p-6 lg:p-10 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Global Floating Toasts Container */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm no-print">
          {toasts.map((toast) => {
            let Icon = Info;
            let themeClass = 'bg-[#181824] border-gray-500/20 text-gray-300';
            if (toast.type === 'success') {
              Icon = CheckCircle;
              themeClass = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300';
            } else if (toast.type === 'error') {
              Icon = AlertCircle;
              themeClass = 'bg-rose-950/40 border-rose-500/20 text-rose-300';
            } else if (toast.type === 'warning') {
              Icon = AlertTriangle;
              themeClass = 'bg-amber-950/40 border-amber-500/20 text-amber-300';
            }

            return (
              <div
                key={toast.id}
                className={`flex gap-3 items-start p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 ${themeClass}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm font-medium">{toast.message}</div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
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
