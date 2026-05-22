'use client';

import React from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function MyGroupsPlaceholder() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>
      <div className="bg-white border border-[#eaeaea] rounded-2xl p-12 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 bg-[#fae0d6] text-[#ed6c37] rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-[#181818]">My Groups</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
          Manage your student groups, classes, and sections. This feature is coming soon to your VedaAI workspace.
        </p>
      </div>
    </div>
  );
}
