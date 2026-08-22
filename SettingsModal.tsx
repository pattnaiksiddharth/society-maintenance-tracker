import React, { useState, useEffect } from 'react';
import type { SystemSettings } from '../../types';
import { 
  X, 
  Sliders, 
  Clock, 
  Mail, 
  Building2, 
  Save, 
  Check, 
  RotateCcw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SystemSettings | null;
  onSave: (data: Partial<SystemSettings>) => Promise<void>;
  onResetDemo: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetDemo
}) => {
  if (!isOpen) return null;

  const [thresholdDays, setThresholdDays] = useState<number>(settings?.overdueThresholdDays ?? 7);
  const [societyName, setSocietyName] = useState<string>(settings?.societyName ?? 'Silver Oaks Residency');
  const [workingHours, setWorkingHours] = useState<string>(settings?.workingHours ?? '08:00 AM - 08:00 PM');
  const [emailEnabled, setEmailEnabled] = useState<boolean>(settings?.emailNotificationsEnabled ?? true);
  const [smsEnabled, setSmsEnabled] = useState<boolean>(settings?.smsNotificationsEnabled ?? false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (settings) {
      setThresholdDays(settings.overdueThresholdDays);
      setSocietyName(settings.societyName);
      setWorkingHours(settings.workingHours);
      setEmailEnabled(settings.emailNotificationsEnabled);
      setSmsEnabled(settings.smsNotificationsEnabled);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        overdueThresholdDays: Number(thresholdDays),
        societyName,
        workingHours,
        emailNotificationsEnabled: emailEnabled,
        smsNotificationsEnabled: smsEnabled
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all demo data (complaints, notices, logs) to default initial state?')) {
      setIsResetting(true);
      try {
        await onResetDemo();
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SLA Rules & Portal Settings</h2>
              <p className="text-xs text-slate-400">Configure overdue thresholds, society details & alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Overdue Threshold SLA Slider */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 via-purple-500/10 to-transparent border border-blue-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Overdue SLA Resolution Target
                </label>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Tickets exceeding this age without resolution automatically flag as Overdue.
                </p>
              </div>
              <span className="text-2xl font-bold font-mono text-blue-400 px-3 py-1 rounded-xl bg-white/10 border border-white/10">
                {thresholdDays} Days
              </span>
            </div>

            <div className="pt-2">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={thresholdDays}
                onChange={(e) => setThresholdDays(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>1 Day (Express SLA)</span>
                <span>7 Days (Standard)</span>
                <span>14 Days (Relaxed)</span>
                <span>30 Days</span>
              </div>
            </div>
          </div>

          {/* Society Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Society Name</label>
              <input
                type="text"
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Helpdesk Working Hours</label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-400" />
              Automated Dispatch Triggers
            </h4>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">Email Broadcasts on Complaint Status Changes & Important Notices</span>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-300">SMS Alerts for High Priority Tickets</span>
              <input
                type="checkbox"
                checked={smsEnabled}
                onChange={(e) => setSmsEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
            </label>
          </div>

          {/* Reset Demo Data option */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isResetting ? 'Resetting...' : 'Reset Default Demo Data'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
