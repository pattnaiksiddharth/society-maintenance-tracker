import React, { useState } from 'react';
import type { Complaint } from '../../types';
import { PieChart, CheckCircle2, Clock, Activity } from 'lucide-react';
import { AnimatedCounter } from '../common/AnimatedCounter';

interface ComplaintStatsChartProps {
  complaints: Complaint[];
  title?: string;
  subtitle?: string;
}

export const ComplaintStatsChart: React.FC<ComplaintStatsChartProps> = ({
  complaints,
  title = 'Complaint Statistics',
  subtitle = 'Overview of complaint resolution'
}) => {
  const [activeSegment, setActiveSegment] = useState<'completed' | 'remaining' | null>(null);

  const completedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const remainingCount = complaints.filter(c => c.status !== 'RESOLVED').length;
  const totalCount = complaints.length;

  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingPercent = totalCount > 0 ? 100 - completedPercent : 0;

  // SVG Donut Calculations (radius = 50, circumference = 314.159)
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const completedStroke = (completedPercent / 100) * circumference;
  const remainingStroke = (remainingPercent / 100) * circumference;

  return (
    <div className="card-interactive bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/20 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-400" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-medium flex items-center gap-1">
          <AnimatedCounter value={completedPercent} suffix="%" />
          <span>Closed</span>
        </div>
      </div>

      {/* Main Content: Donut Chart & Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
        {/* Donut Chart SVG */}
        <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90 transform overflow-visible" viewBox="0 0 120 120">
            {/* Background Circle Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="text-slate-800"
              strokeWidth="14"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Remaining Arc */}
            {totalCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                onMouseEnter={() => setActiveSegment('remaining')}
                onMouseLeave={() => setActiveSegment(null)}
                className={`text-amber-500/80 transition-all duration-300 cursor-pointer ${
                  activeSegment === 'remaining' ? 'stroke-[16px] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'stroke-[14px]'
                }`}
                strokeDasharray={`${remainingStroke} ${circumference}`}
                strokeDashoffset={-completedStroke}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            )}
            {/* Completed Arc */}
            {totalCount > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                onMouseEnter={() => setActiveSegment('completed')}
                onMouseLeave={() => setActiveSegment(null)}
                className={`text-blue-500 transition-all duration-300 cursor-pointer ${
                  activeSegment === 'completed' ? 'stroke-[16px] filter drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'stroke-[14px]'
                }`}
                strokeDasharray={`${completedStroke} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            )}
          </svg>

          {/* Center Info Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <AnimatedCounter
              value={activeSegment === 'completed' ? completedCount : activeSegment === 'remaining' ? remainingCount : totalCount}
              className="text-2xl font-bold text-white tracking-tight leading-none transition-all duration-200"
            />
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mt-1 transition-all duration-200">
              {activeSegment === 'completed' ? 'Completed' : activeSegment === 'remaining' ? 'Remaining' : 'Total Tickets'}
            </span>
          </div>
        </div>

        {/* Legend & Breakdown */}
        <div className="flex flex-col gap-3.5 w-full sm:w-auto">
          {/* Completed Segment Legend */}
          <div
            onMouseEnter={() => setActiveSegment('completed')}
            onMouseLeave={() => setActiveSegment(null)}
            className={`flex items-center justify-between sm:justify-start gap-4 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
              activeSegment === 'completed' 
                ? 'bg-blue-500/15 border-blue-500/40 shadow-lg shadow-blue-500/10' 
                : 'bg-white/5 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 shrink-0" />
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Completed</span>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-white bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
              <AnimatedCounter value={completedCount} />
            </div>
          </div>

          {/* Remaining Segment Legend */}
          <div
            onMouseEnter={() => setActiveSegment('remaining')}
            onMouseLeave={() => setActiveSegment(null)}
            className={`flex items-center justify-between sm:justify-start gap-4 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
              activeSegment === 'remaining' 
                ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10' 
                : 'bg-white/5 border-white/5 hover:border-white/15'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50 shrink-0" />
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Remaining</span>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-white bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              <AnimatedCounter value={remainingCount} />
            </div>
          </div>

          {/* Ratio Summary */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-white/5">
            <span>Resolution Rate</span>
            <span className="font-semibold text-emerald-400">
              <AnimatedCounter value={completedPercent} suffix="%" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
