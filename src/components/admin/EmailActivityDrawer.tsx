import React from 'react';
import type { EmailLog } from '../../types';
import { 
  X, 
  Mail, 
  Send, 
  Clock, 
  CheckCircle2, 
  Bell, 
  AlertCircle, 
  FileText, 
  Inbox
} from 'lucide-react';

interface EmailActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  emails: EmailLog[];
}

export const EmailActivityDrawer: React.FC<EmailActivityDrawerProps> = ({
  isOpen,
  onClose,
  emails
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-slate-900/95 border-l border-white/15 h-full flex flex-col shadow-2xl p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Email Dispatch Log</h3>
              <p className="text-xs text-slate-400">Simulated system notification broadcasts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Logs List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {emails.map((em) => (
            <div
              key={em.id}
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {em.type.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(em.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div>
                <p className="text-slate-400 text-[11px]">
                  To: <span className="text-white font-medium">{em.recipientName}</span> &lt;{em.to}&gt;
                </p>
                <h4 className="font-semibold text-white mt-1 text-sm leading-snug">
                  {em.subject}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 text-slate-300 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                {em.body}
              </div>
            </div>
          ))}

          {emails.length === 0 && (
            <div className="py-20 text-center text-slate-500">
              <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-medium text-slate-300">No emails logged yet</p>
              <p className="text-xs text-slate-500 mt-1">Actions like status updates will show here.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400">
            Plug-and-play notification architecture configured for SendGrid / SMTP.
          </p>
        </div>
      </div>
    </div>
  );
};
