import React from 'react';
import type { ComplaintStatus, ComplaintPriority } from '../../types';
import { Clock, Wrench, CheckCircle2, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  isOverdue?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isOverdue, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm font-medium';

  if (isOverdue && status !== 'RESOLVED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold tracking-wide ${sizeClasses}`}>
        <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        Overdue ({status.replace('_', ' ')})
      </span>
    );
  }

  switch (status) {
    case 'OPEN':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse-soft shrink-0" />
          <Clock className={size === 'sm' ? 'w-3 h-3 text-slate-400' : 'w-4 h-4 text-slate-400'} />
          Open
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-soft shrink-0" />
          <Wrench className={size === 'sm' ? 'w-3 h-3 text-blue-400' : 'w-4 h-4 text-blue-400'} />
          In Progress
        </span>
      );
    case 'RESOLVED':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium ${sizeClasses}`}>
          <CheckCircle2 className={size === 'sm' ? 'w-3 h-3 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
          Resolved
        </span>
      );
    default:
      return null;
  }
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (priority) {
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider ${sizeClasses}`}>
          <AlertCircle className="w-2.5 h-2.5" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold uppercase tracking-wider ${sizeClasses}`}>
          <Clock className="w-2.5 h-2.5" />
          Medium
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-wider ${sizeClasses}`}>
          Low
        </span>
      );
    default:
      return null;
  }
};

export const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
      {category}
    </span>
  );
};
