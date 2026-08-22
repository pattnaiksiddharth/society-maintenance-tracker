import React, { useState } from 'react';
import type { Complaint, ComplaintStatus, ComplaintPriority } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { 
  X, 
  Calendar, 
  User, 
  Phone, 
  Building2, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  ShieldCheck, 
  Image as ImageIcon,
  History,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ComplaintDetailsModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpdateStatus: (id: string, payload: {
    newStatus: ComplaintStatus;
    actorId: string;
    actorName: string;
    actorRole: string;
    note?: string;
    assignedTo?: string;
    priority?: ComplaintPriority;
  }) => Promise<void>;
}

export const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({
  complaint,
  onClose,
  onUpdateStatus
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  if (!complaint) return null;

  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>(complaint.status);
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>(complaint.priority);
  const [assignedTo, setAssignedTo] = useState<string>(complaint.assignedTo || '');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showFullImage, setShowFullImage] = useState<boolean>(false);

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await onUpdateStatus(complaint.id, {
        newStatus: selectedStatus,
        priority: selectedPriority,
        assignedTo: assignedTo || undefined,
        note: note || undefined,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role
      });
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-blue-400 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30">
              {complaint.code}
            </span>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {complaint.title}
              </h2>
              <p className="text-xs text-slate-400">
                Logged on {new Date(complaint.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Overdue Warning Alert */}
          {complaint.isOverdue && complaint.status !== 'RESOLVED' && (
            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center gap-3 text-red-300">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold">Overdue SLA Target Breached!</span> This ticket has been active for{' '}
                <span className="font-mono font-bold text-white">{complaint.ageDays} days</span> without resolution. Immediate priority escalation recommended.
              </div>
            </div>
          )}

          {/* Quick Details Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Status</p>
              <StatusBadge status={complaint.status} isOverdue={complaint.isOverdue} />
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Priority</p>
              <PriorityBadge priority={complaint.priority} />
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Category</p>
              <span className="text-xs font-semibold text-white">{complaint.category}</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Unit</p>
              <span className="text-xs font-mono font-semibold text-blue-300">{complaint.residentUnit}</span>
            </div>
          </div>

          {/* Resident Contact Info */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Registered By</p>
                <p className="text-sm font-semibold text-white">{complaint.residentName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {complaint.residentContact}
              </span>
              {complaint.assignedTo && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  <Wrench className="w-3 h-3" />
                  Assigned: {complaint.assignedTo}
                </span>
              )}
            </div>
          </div>

          {/* Issue Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Problem Description
            </h3>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-slate-200 leading-relaxed">
              {complaint.description}
            </div>
          </div>

          {/* Attached Photo Preview */}
          {complaint.photoUrl && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Attached Media / Photo Evidence
              </h3>
              <div 
                onClick={() => setShowFullImage(true)}
                className="relative rounded-2xl overflow-hidden border border-white/10 max-h-60 bg-black/40 group cursor-pointer"
              >
                <img 
                  src={complaint.photoUrl} 
                  alt="Complaint attachment" 
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                  Click to Expand
                </div>
              </div>
            </div>
          )}

          {/* Lightbox Modal */}
          {showFullImage && complaint.photoUrl && (
            <div 
              className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setShowFullImage(false)}
            >
              <img 
                src={complaint.photoUrl} 
                alt="Enlarged" 
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Immutable Timeline Audit Trail */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" />
              Status Lifecycle & History Log
            </h3>

            <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
              {complaint.history && complaint.history.length > 0 ? (
                complaint.history.map((h, i) => (
                  <div key={h.id || i} className="flex items-start gap-4 relative pl-8">
                    <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-blue-400 shadow-sm" />
                    <div className="flex-1 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{h.actorName}</span>
                          <span className="text-[10px] text-slate-400 uppercase">({h.actorRole})</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(h.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] mb-1">
                        <span className="text-slate-400">Transition:</span>
                        <span className="font-mono text-slate-300">{h.previousStatus}</span>
                        <span className="text-blue-400">→</span>
                        <span className="font-mono font-semibold text-blue-300">{h.newStatus}</span>
                      </div>

                      {h.note && (
                        <p className="text-slate-300 mt-1 italic bg-white/5 p-2 rounded-lg border border-white/5">
                          "{h.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 pl-8">Initial ticket registered.</p>
              )}
            </div>
          </div>

          {/* Admin Status & Assignment Updater */}
          {isAdmin && (
            <form onSubmit={handleSaveUpdate} className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/25 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-400" />
                  Update Ticket Status & Assignee (Admin)
                </h4>
                <span className="text-[10px] text-blue-300 font-medium">Auto-triggers resident email</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Target Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e: any) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={selectedPriority}
                    onChange={(e: any) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Assign Technician / Agency</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Plumbing Works"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Remarks / Progress Note (Sent in Notification)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Dispatched technician to flat. Replacement parts ordered."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400 placeholder-slate-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Apply Status Update'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
