import React from 'react';
import type { Complaint, Notice } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { 
  PlusCircle, 
  PhoneCall, 
  ShieldCheck, 
  Clock, 
  Wrench, 
  AlertCircle, 
  ChevronRight, 
  Sparkles,
  Building,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ResidentDashboardProps {
  complaints: Complaint[];
  notices: Notice[];
  onOpenRaiseModal: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onViewAllComplaints: () => void;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({
  complaints,
  notices,
  onOpenRaiseModal,
  onSelectComplaint,
  onViewAllComplaints
}) => {
  const { currentUser } = useAuth();

  const myComplaints = complaints.filter(c => c.residentId === currentUser?.id);
  const activeComplaints = myComplaints.filter(c => c.status !== 'RESOLVED');
  const resolvedComplaints = myComplaints.filter(c => c.status === 'RESOLVED');
  const importantNotices = notices.filter(n => n.important);

  return (
    <div className="space-y-8">
      {/* Resident Welcome Banner */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-purple-600/10 border border-blue-500/20 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 inline-block mb-3">
              Unit {currentUser?.unitNumber || 'A-402'}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Welcome back, {currentUser?.name || 'Resident'}
            </h2>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Log maintenance issues, track real-time resolution timelines with photo proofs, and stay updated with official society circulars.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenRaiseModal}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 border border-blue-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Raise New Complaint</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resident Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">My Open Tickets</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {myComplaints.filter(c => c.status === 'OPEN').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Awaiting technician inspection</p>
        </div>

        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">In Progress</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">
            {activeComplaints.filter(c => c.status === 'IN_PROGRESS').length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Technician assigned & active</p>
        </div>

        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm font-medium">Resolved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">
            {resolvedComplaints.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">Successfully closed tickets</p>
        </div>
      </div>

      {/* Grid: Active Tickets (2 cols) & Notices / Emergency Contacts (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Active Tickets List */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">My Active Complaints</h3>
              <p className="text-xs text-slate-400">Track resolution progress and audit history</p>
            </div>
            <button
              onClick={onViewAllComplaints}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition"
            >
              View History
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {activeComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-semibold text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-400 px-2 py-0.5 rounded-md bg-white/5">
                      {c.category}
                    </span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <StatusBadge status={c.status} isOverdue={c.isOverdue} />
                </div>

                <h4 className="text-base font-semibold text-white group-hover:text-blue-300 transition mt-1">
                  {c.title}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                  {c.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Logged {new Date(c.createdAt).toLocaleDateString()} ({c.ageDays === 0 ? 'Today' : `${c.ageDays}d ago`})
                  </span>
                  <span className="text-blue-400 text-xs font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Details & Timeline <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}

            {activeComplaints.length === 0 && (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-white/5">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                <h4 className="text-base font-semibold text-white">No Open Complaints</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Everything in your unit is operating smoothly. Need assistance? Click below to log a request.
                </p>
                <button
                  onClick={onOpenRaiseModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition"
                >
                  Log New Request
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Important Announcements & Emergency Contacts */}
        <div className="space-y-6">
          {/* Important Notices */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Notice Feed
            </h3>

            <div className="space-y-3">
              {notices.slice(0, 3).map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 rounded-2xl ${
                    n.important ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-white/5 border border-white/5'
                  }`}
                >
                  {n.important && (
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                      ★ High Priority Notice
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-white leading-tight">{n.title}</h4>
                  <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Help & Emergency Contacts */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20">
            <h3 className="text-lg font-semibold text-white mb-3">Facility Contacts</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="font-semibold text-white">Main Security Gate</p>
                  <p className="text-slate-400 text-[11px]">Intercom Ext: 100 / 101</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-medium">24x7</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="font-semibold text-white">Duty Electrician</p>
                  <p className="text-slate-400 text-[11px]">+91 98765 00012</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-medium">8am-8pm</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="font-semibold text-white">Emergency Plumbing</p>
                  <p className="text-slate-400 text-[11px]">+91 98765 00014</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-mono font-medium">8am-8pm</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
