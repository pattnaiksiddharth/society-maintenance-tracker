import React, { useState, useMemo } from 'react';
import type { Complaint, ComplaintStatus, ComplaintPriority, ComplaintCategory } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  Plus, 
  Eye, 
  CheckCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ComplaintListProps {
  complaints: Complaint[];
  onSelectComplaint: (complaint: Complaint) => void;
  onOpenRaiseModal: () => void;
  onQuickUpdateStatus: (complaint: Complaint) => void;
}

export const ComplaintList: React.FC<ComplaintListProps> = ({
  complaints,
  onSelectComplaint,
  onOpenRaiseModal,
  onQuickUpdateStatus
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority' | 'age'>('newest');

  // Categories list
  const categories: ComplaintCategory[] = [
    'Plumbing',
    'Electrical',
    'Elevator',
    'Water',
    'Carpentry',
    'HVAC',
    'Common Area',
    'Security',
    'Pest Control',
    'Other'
  ];

  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    // If resident, filter to only their complaints by default
    if (!isAdmin && currentUser) {
      result = result.filter(c => c.residentId === currentUser.id);
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(c => c.status === statusFilter);
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter(c => c.category === categoryFilter);
    }

    if (priorityFilter !== 'ALL') {
      result = result.filter(c => c.priority === priorityFilter);
    }

    if (overdueOnly) {
      result = result.filter(c => c.isOverdue && c.status !== 'RESOLVED');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.residentName.toLowerCase().includes(q) ||
        c.residentUnit.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'age') return (b.ageDays || 0) - (a.ageDays || 0);
      if (sortBy === 'priority') {
        const priorityWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

    return result;
  }, [complaints, isAdmin, currentUser, statusFilter, categoryFilter, priorityFilter, overdueOnly, searchTerm, sortBy]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setOverdueOnly(false);
  };

  const hasActiveFilters = statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || overdueOnly || searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/20">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by ticket code (e.g. CMP-1042), title, resident, unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Overdue SLA Toggle Button */}
            <button
              onClick={() => setOverdueOnly(!overdueOnly)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                overdueOnly
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-lg shadow-red-500/10'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Overdue Only</span>
            </button>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition border border-white/5"
              >
                Reset
              </button>
            )}

            {/* New Ticket CTA */}
            <button
              onClick={onOpenRaiseModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{filteredComplaints.length}</span> tickets
          {hasActiveFilters && ' (filtered)'}
        </p>

        {/* Sort selector */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Highest Priority</option>
            <option value="age">Longest Pending (Age)</option>
          </select>
        </div>
      </div>

      {/* Complaints Table / List */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-400 tracking-wider bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Ticket Code</th>
                <th className="px-6 py-4 font-semibold">Resident / Unit</th>
                <th className="px-6 py-4 font-semibold">Category & Title</th>
                <th className="px-6 py-4 font-semibold">Priority</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Age</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/5">
              {filteredComplaints.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectComplaint(c)}
                  className="group hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-semibold text-blue-400 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      {c.code}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white group-hover:text-blue-300 transition">
                        {c.residentName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {c.residentUnit}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 max-w-md">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/5">
                          {c.category}
                        </span>
                        {c.photoUrl && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                            📷 Photo attached
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-200 line-clamp-1 font-medium">
                        {c.title}
                      </span>
                    </div>
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
                        <AlertTriangle className="w-3 h-3" />
                        {c.ageDays}d
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        {c.ageDays === 0 ? 'Today' : `${c.ageDays}d`}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelectComplaint(c)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => onQuickUpdateStatus(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-medium border border-blue-500/30 transition"
                        >
                          Update Status
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-white">No complaints found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-white/10 text-xs text-blue-400 hover:bg-white/15"
                      >
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
