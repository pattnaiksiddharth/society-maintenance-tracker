import React from 'react';
import type { Complaint, DashboardStats, Notice } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ArrowUpRight, 
  Bell, 
  Calendar, 
  Plus, 
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  complaints: Complaint[];
  notices: Notice[];
  onSelectComplaint: (complaint: Complaint) => void;
  onViewAllComplaints: () => void;
  onOpenCreateNoticeModal: () => void;
  onQuickUpdateStatus: (complaint: Complaint) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  complaints,
  notices,
  onSelectComplaint,
  onViewAllComplaints,
  onOpenCreateNoticeModal,
  onQuickUpdateStatus
}) => {
  const recentComplaints = complaints.slice(0, 6);
  const recentNotices = notices.slice(0, 3);
  const overdueComplaints = complaints.filter(c => c.isOverdue && c.status !== 'RESOLVED');

  return (
    <div className="space-y-8">
      {/* 4 Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Open */}
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition group">
          <p className="text-slate-400 text-sm mb-2 font-medium">Total Open</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-white">
              {stats?.totalOpen ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              +{stats?.openToday ?? 4} today
            </span>
          </div>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-slate-400 h-full rounded-full" style={{ width: `${Math.min(100, (stats?.totalOpen || 1) * 8)}%` }} />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition group">
          <p className="text-slate-400 text-sm mb-2 font-medium">In Progress</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-white">
              {stats?.inProgress ?? 0}
            </span>
            <span className="text-xs text-blue-400 font-medium">Active work</span>
          </div>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (stats?.inProgress || 1) * 15)}%` }} />
          </div>
        </div>

        {/* Overdue (Urgent Glow) */}
        <div className="p-6 rounded-3xl bg-red-500/10 backdrop-blur-md border border-red-500/25 hover:border-red-500/40 transition group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <p className="text-red-400 text-sm mb-2 font-medium">Overdue</p>
            {overdueComplaints.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-red-500 tracking-tight">
              {String(stats?.overdue ?? 0).padStart(2, '0')}
            </span>
            <span className="text-xs text-red-400 font-medium">Critical SLA</span>
          </div>
          <div className="mt-3 w-full bg-red-950/40 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (stats?.overdue || 1) * 20)}%` }} />
          </div>
        </div>

        {/* Resolved */}
        <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 transition group">
          <p className="text-slate-400 text-sm mb-2 font-medium">Resolved (MTD)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-white">
              {stats?.resolved ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              {stats?.resolutionRatePercent ?? 94}% rate
            </span>
          </div>
          <div className="mt-3 w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats?.resolutionRatePercent ?? 90}%` }} />
          </div>
        </div>
      </section>

      {/* Main Grid: Recent Complaints (2 cols) & Pin Board (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Recent Complaints Table */}
        <div className="lg:col-span-2 flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
          <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-lg text-white">Recent Complaints</h2>
              <p className="text-xs text-slate-400">Live ticket queue across society towers</p>
            </div>
            <button
              onClick={onViewAllComplaints}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
            >
              View All ({complaints.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] uppercase text-slate-400 tracking-wider bg-white/5">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Resident</th>
                  <th className="px-6 py-3.5 font-semibold">Category</th>
                  <th className="px-6 py-3.5 font-semibold">Priority</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold">Age</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {recentComplaints.map((c) => {
                  const isHighAge = (c.ageDays ?? 0) >= 7;
                  return (
                    <tr 
                      key={c.id} 
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => onSelectComplaint(c)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white group-hover:text-blue-300 transition">
                            {c.residentName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {c.residentUnit} • {c.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-xs text-slate-200 border border-white/5">
                          {c.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} isOverdue={c.isOverdue} />
                      </td>
                      <td className="px-6 py-4">
                        {c.isOverdue ? (
                          <span className="text-red-400 font-bold text-xs flex items-center gap-1">
                            {c.ageDays}d (!)
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {c.ageDays === 0 ? 'Today' : `${c.ageDays}d`}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onQuickUpdateStatus(c)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-blue-600/30 text-blue-300 hover:text-white text-xs font-medium border border-white/10 transition"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {recentComplaints.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                      No complaints registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Pin Board */}
        <div className="flex flex-col bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="font-semibold text-lg text-white">Pin Board</h2>
              <p className="text-xs text-slate-400">Society notices & broadcast feed</p>
            </div>
            <button
              onClick={onOpenCreateNoticeModal}
              className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center gap-1 transition"
              title="Post New Notice"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </div>

          <div className="space-y-4">
            {recentNotices.map((notice) => (
              <div
                key={notice.id}
                className={`p-4 rounded-2xl transition-all ${
                  notice.important
                    ? 'bg-blue-500/10 border border-blue-500/30 shadow-lg shadow-blue-500/5'
                    : 'bg-white/5 border border-white/5 hover:border-white/15'
                }`}
              >
                {notice.important && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      Important Notice
                    </span>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-white mb-1.5 leading-snug">
                  {notice.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {notice.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-500">
                  <span>{notice.category}</span>
                  <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {recentNotices.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No active announcements on the pin board.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
