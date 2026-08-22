import React from 'react';
import { 
  LayoutDashboard, 
  AlertCircle, 
  BellRing, 
  Settings, 
  Mail, 
  Building2, 
  PlusCircle, 
  Users, 
  Sliders, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { SystemSettings } from '../../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings: SystemSettings | null;
  onOpenRaiseModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenEmailDrawer: () => void;
  emailCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  onOpenRaiseModal,
  onOpenSettingsModal,
  onOpenEmailDrawer,
  emailCount
}) => {
  const { currentUser, switchRole } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'resident']
    },
    {
      id: 'complaints',
      label: isAdmin ? 'All Complaints' : 'My Complaints',
      icon: AlertCircle,
      roles: ['admin', 'resident']
    },
    {
      id: 'notices',
      label: 'Notice Board',
      icon: BellRing,
      roles: ['admin', 'resident']
    }
  ];

  return (
    <nav className="w-64 shrink-0 flex flex-col bg-white/5 backdrop-blur-xl border-r border-white/10 min-h-screen text-slate-100 select-none">
      {/* Brand Header */}
      <div className="p-6 md:p-8 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-lg tracking-tight block leading-tight">
              {isAdmin ? 'SocietyAdmin' : 'ResidentPortal'}
            </span>
            <span className="text-[11px] text-slate-400">
              {settings?.societyName || 'Silver Oaks Residency'}
            </span>
          </div>
        </div>

        {/* Quick Raise CTA for Resident */}
        {!isAdmin && (
          <button
            onClick={onOpenRaiseModal}
            className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-600/20 transition-all border border-blue-400/30 active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            Raise Complaint
          </button>
        )}
      </div>

      {/* Main Nav Links */}
      <div className="p-4 md:p-6 space-y-1.5 flex-1">
        <p className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-2">
          Navigation
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                isActive
                  ? 'bg-white/10 text-blue-400 shadow-sm border border-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  isActive ? 'bg-blue-400 shadow-sm shadow-blue-400' : 'border border-slate-500'
                }`}
              />
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}

        {/* Admin Tools Section */}
        {isAdmin && (
          <div className="pt-6 space-y-1.5">
            <p className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-2">
              Management
            </p>

            <button
              onClick={onOpenSettingsModal}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all text-left"
            >
              <div className="w-2 h-2 rounded-full border border-slate-500" />
              <Sliders className="w-4 h-4 text-slate-400" />
              <span className="flex-1">SLA & Settings</span>
            </button>

            <button
              onClick={onOpenEmailDrawer}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all text-left relative"
            >
              <div className="w-2 h-2 rounded-full border border-slate-500" />
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="flex-1">Email Dispatches</span>
              {emailCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  {emailCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* SLA Threshold Card */}
      <div className="p-6 border-t border-white/5 mt-auto">
        <div 
          onClick={isAdmin ? onOpenSettingsModal : undefined}
          className={`p-4 rounded-2xl bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-transparent border border-white/10 text-center relative overflow-hidden group ${
            isAdmin ? 'cursor-pointer hover:border-blue-500/40 transition' : ''
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
            SLA Threshold
          </p>
          <p className="text-2xl font-bold tracking-tight text-white group-hover:scale-105 transition">
            {settings?.overdueThresholdDays ?? 7} Days
          </p>
          <p className="text-[10px] text-blue-300 font-medium mt-0.5">
            Overdue Target {isAdmin ? '• Click to edit' : ''}
          </p>
        </div>

        {/* Role Switcher Pill - Development/Demo Only */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-xs font-medium text-slate-300">
                Role: <span className="capitalize text-white font-semibold">{currentUser?.role}</span>
              </span>
            </div>
            <button
              onClick={() => switchRole(isAdmin ? 'resident' : 'admin')}
              className="text-[11px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-blue-300 font-medium transition"
            >
              Switch to {isAdmin ? 'Resident' : 'Admin'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
