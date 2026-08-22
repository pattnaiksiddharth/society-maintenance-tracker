import React, { useState } from 'react';
import { 
  Plus, 
  Mail, 
  Sliders, 
  ChevronDown, 
  User, 
  LogOut, 
  Shield, 
  Sparkles,
  Building,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { SystemSettings } from '../../types';

interface HeaderProps {
  title: string;
  subtitle?: string;
  settings: SystemSettings | null;
  onOpenRaiseModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenEmailDrawer: () => void;
  onOpenAuthModal: () => void;
  emailCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  settings,
  onOpenRaiseModal,
  onOpenSettingsModal,
  onOpenEmailDrawer,
  onOpenAuthModal,
  emailCount
}) => {
  const { currentUser, allUsers, loginAsUser, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            {title}
          </h1>
          {isAdmin && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Admin View
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm">
          {subtitle || `Real-time management for ${settings?.societyName || 'Silver Oaks Residency'}`}
        </p>
      </div>

      <div className="flex items-center gap-3 self-end md:self-auto">
        {/* Email Activity Drawer Button */}
        <button
          onClick={onOpenEmailDrawer}
          title="Simulated Email Dispatch Logs"
          className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          <Mail className="w-4 h-4" />
          {emailCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-[#0f172a]">
              {emailCount > 9 ? '9+' : emailCount}
            </span>
          )}
        </button>

        {/* Admin Settings Quick Button */}
        {isAdmin && (
          <button
            onClick={onOpenSettingsModal}
            title="Configure SLA Threshold"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}

        {/* Raise Complaint Button */}
        <button
          onClick={onOpenRaiseModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>

        {/* Active User Switcher / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-left"
          >
            <div className="flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-white leading-tight">
                {currentUser?.name || 'Guest User'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentUser?.unitNumber} • {currentUser?.role === 'admin' ? 'Super Admin' : 'Resident'}
              </span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-500 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>

            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Menu Popover */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-2 z-50 text-slate-200 divide-y divide-white/10">
              <div className="px-3 py-2 text-left">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Guest'}</p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'No email associated'}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {currentUser?.role === 'admin' ? 'Super Admin' : 'Resident'}
                </p>
              </div>

              {/* Persona Switcher - Development Only */}
              {import.meta.env.DEV && allUsers.length > 0 && (
                <div className="py-1 max-h-56 overflow-y-auto space-y-1">
                  <div className="px-3 py-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Switch Persona Demo (Dev)
                    </p>
                  </div>
                  {allUsers.map((u) => {
                    const isSelected = u.id === currentUser?.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          loginAsUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                          isSelected 
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3 h-3 text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-white leading-tight">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.unitNumber} ({u.role})</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 p-1.5 space-y-1.5">
                {import.meta.env.DEV && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuthModal();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 text-center transition block"
                  >
                    + Add / Register New Resident
                  </button>
                )}
                {currentUser && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-400 hover:text-red-300 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
