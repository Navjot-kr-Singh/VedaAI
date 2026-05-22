'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { ArrowLeft, Save, RotateCcw, Settings, User, School } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const {
    organizationName,
    organizationLocation,
    userName,
    userInitials,
    userRole,
    updateOrganization,
    updateUser,
    resetSettings,
    addToast,
  } = useUIStore();

  const [mounted, setMounted] = useState(false);

  // Local state for the form inputs
  const [localOrgName, setLocalOrgName] = useState('');
  const [localOrgLoc, setLocalOrgLoc] = useState('');
  const [localUserName, setLocalUserName] = useState('');
  const [localUserInitials, setLocalUserInitials] = useState('');
  const [localUserRole, setLocalUserRole] = useState('');

  // Hydrate local state from Zustand store once mounted on the client
  useEffect(() => {
    setMounted(true);
    setLocalOrgName(organizationName);
    setLocalOrgLoc(organizationLocation);
    setLocalUserName(userName);
    setLocalUserInitials(userInitials);
    setLocalUserRole(userRole);
  }, [organizationName, organizationLocation, userName, userInitials, userRole]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!localOrgName.trim()) {
      addToast('Organization Name cannot be empty', 'error');
      return;
    }
    if (!localOrgLoc.trim()) {
      addToast('Organization Location cannot be empty', 'error');
      return;
    }
    if (!localUserName.trim()) {
      addToast('User Full Name cannot be empty', 'error');
      return;
    }
    if (!localUserInitials.trim()) {
      addToast('User Initials cannot be empty', 'error');
      return;
    }
    if (!localUserRole.trim()) {
      addToast('User Role cannot be empty', 'error');
      return;
    }

    updateOrganization(localOrgName.trim(), localOrgLoc.trim());
    updateUser(localUserName.trim(), localUserInitials.trim(), localUserRole.trim());
    addToast('Settings saved successfully!', 'success');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all profile and organization settings to defaults?')) {
      resetSettings();
      addToast('Settings reset to defaults', 'info');
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 px-4 py-8 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="h-96 bg-white border border-[#eaeaea] rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
      
      {/* Back to dashboard breadcrumb */}
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors no-print">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="bg-white border border-[#eaeaea] rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Header Section */}
        <div className="px-6 py-5 border-b border-[#eaeaea] bg-gray-50/50 flex items-center gap-3">
          <div className="p-2 bg-[#fae0d6] text-[#ed6c37] rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#181818]">System Settings</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">Customize your school organization profile and workspace settings.</p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="p-6 lg:p-8 space-y-8">
          
          {/* Section 1: School Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#181818] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
              <School className="w-4 h-4 text-gray-400" />
              Organization Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="orgName" className="text-xs font-semibold text-[#181818] flex items-center gap-1">
                  Organization Name
                </label>
                <div className="relative">
                  <input
                    id="orgName"
                    type="text"
                    value={localOrgName}
                    onChange={(e) => setLocalOrgName(e.target.value)}
                    placeholder="e.g. Delhi Public School"
                    className="w-full pl-3 pr-4 py-2.5 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none focus:border-[#ed6c37] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="orgLoc" className="text-xs font-semibold text-[#181818] flex items-center gap-1">
                  Organization Location
                </label>
                <div className="relative">
                  <input
                    id="orgLoc"
                    type="text"
                    value={localOrgLoc}
                    onChange={(e) => setLocalOrgLoc(e.target.value)}
                    placeholder="e.g. Bokaro Steel City"
                    className="w-full pl-3 pr-4 py-2.5 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none focus:border-[#ed6c37] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: User Profile Details */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-[#181818] uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              User Profile Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="userName" className="text-xs font-semibold text-[#181818] flex items-center gap-1">
                  User Full Name
                </label>
                <input
                  id="userName"
                  type="text"
                  value={localUserName}
                  onChange={(e) => setLocalUserName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2.5 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none focus:border-[#ed6c37] transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="userInitials" className="text-xs font-semibold text-[#181818] flex items-center gap-1">
                  Initials
                </label>
                <input
                  id="userInitials"
                  type="text"
                  maxLength={4}
                  value={localUserInitials}
                  onChange={(e) => setLocalUserInitials(e.target.value)}
                  placeholder="e.g. JD"
                  className="w-full px-3 py-2.5 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none focus:border-[#ed6c37] transition-colors text-center uppercase"
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <label htmlFor="userRole" className="text-xs font-semibold text-[#181818] flex items-center gap-1">
                  Account Role
                </label>
                <input
                  id="userRole"
                  type="text"
                  value={localUserRole}
                  onChange={(e) => setLocalUserRole(e.target.value)}
                  placeholder="e.g. Teacher Account"
                  className="w-full px-3 py-2.5 bg-white border border-[#eaeaea] rounded-xl text-xs text-[#181818] placeholder-gray-400 focus:outline-none focus:border-[#ed6c37] transition-colors"
                />
              </div>

            </div>
          </div>

          {/* Form Actions Section */}
          <div className="bg-gray-50 border-t border-[#eaeaea] -mx-6 lg:-mx-8 -mb-6 lg:-mb-8 px-6 py-4 flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#eaeaea] bg-white hover:bg-gray-100 rounded-xl text-xs font-bold text-gray-600 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#ed6c37] hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-500/10"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
