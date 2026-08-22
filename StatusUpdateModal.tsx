import React, { useState } from 'react';
import type { Complaint, ComplaintStatus, ComplaintPriority } from '../../types';
import { 
  X, 
  Wrench, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StatusUpdateModalProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, payload: {
    newStatus: ComplaintStatus;
    actorId: string;
    actorName: string;
    actorRole: string;
    note?: string;
    assignedTo?: string;
    priority?: ComplaintPriority;
  }) => Promise<void>;
}

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { currentUser } = useAuth();
  if (!isOpen || !complaint) return null;

  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [priority, setPriority] = useState<ComplaintPriority>(complaint.priority);
  const [assignedTo, setAssignedTo] = useState(complaint.assignedTo || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await onUpdate(complaint.id, {
        newStatus: status,
        priority,
        assignedTo: assignedTo || undefined,
        note: note || undefined,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Quick Status Update</h3>
              <p className="text-xs text-slate-400 font-mono">{complaint.code} • {complaint.residentUnit}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <p className="text-[11px] text-slate-400">Complaint:</p>
            <p className="font-semibold text-white line-clamp-1">{complaint.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Status Transition</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-blue-400"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-blue-400"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Assign Contractor / Technician</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Plumbing Works / Otis Support"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-blue-400 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Remarks / History Note</label>
            <textarea
              rows={2}
              placeholder="Provide reason or technician inspection report..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-blue-400 placeholder-slate-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2 text-blue-300 text-[11px]">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>An email notification will be dispatched to {complaint.residentName} automatically.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Updating...' : 'Save & Notify'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
