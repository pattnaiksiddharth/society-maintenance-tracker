import React, { useState } from 'react';
import type { Notice, NoticeCategory } from '../../types';
import { 
  BellRing, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  Wrench, 
  PartyPopper, 
  FileText, 
  X, 
  Send,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NoticeBoardProps {
  notices: Notice[];
  onCreateNotice: (data: {
    title: string;
    content: string;
    category: NoticeCategory;
    important: boolean;
  }) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({
  notices,
  onCreateNotice,
  onDeleteNotice
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('IMPORTANT');
  const [important, setImportant] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { label: string; value: string; icon: any }[] = [
    { label: 'All Notices', value: 'ALL', icon: BellRing },
    { label: 'Important', value: 'IMPORTANT', icon: AlertCircle },
    { label: 'Maintenance', value: 'MAINTENANCE', icon: Wrench },
    { label: 'Events & AGM', value: 'EVENT', icon: PartyPopper },
    { label: 'General Circulars', value: 'GENERAL', icon: FileText }
  ];

  const filteredNotices = notices.filter(n => {
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'IMPORTANT') return n.important || n.category === 'IMPORTANT';
    return n.category === activeCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateNotice({
        title,
        content,
        category,
        important
      });
      setTitle('');
      setContent('');
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Categories & Admin CTA */}
      <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const isActive = activeCategory === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => setActiveCategory(c.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-md shadow-blue-500/10'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Admin Create Notice Button */}
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 border border-blue-400/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className={`p-6 rounded-3xl backdrop-blur-md border transition-all flex flex-col justify-between ${
              notice.important
                ? 'bg-blue-500/10 border-blue-500/30 shadow-xl shadow-blue-500/5'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div>
              {/* Top Banner */}
              <div className="flex items-center justify-between gap-2 mb-3">
                {notice.important ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    Important Circular
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/5 text-slate-400 border border-white/5">
                    {notice.category}
                  </span>
                )}

                {isAdmin && (
                  <button
                    onClick={() => onDeleteNotice(notice.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Delete Notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-white mb-2 leading-snug">
                {notice.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {notice.content}
              </p>
            </div>

            <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5 text-[11px] text-slate-500">
              <span className="font-medium text-slate-400">By {notice.authorName}</span>
              <span className="font-mono">{new Date(notice.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {filteredNotices.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white/5 rounded-3xl border border-white/10">
            <BellRing className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-white">No notices in this category</p>
            <p className="text-xs text-slate-500 mt-1">Check other categories or publish a new notice.</p>
          </div>
        )}
      </div>

      {/* Create Notice Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl p-6 md:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Publish Society Notice</h3>
                  <p className="text-xs text-slate-400">Broadcast circular to all resident portals & emails</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Tank Cleaning on Friday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="IMPORTANT">Important</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="EVENT">Event / AGM</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pin High Priority</label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-xl bg-slate-950 border border-white/15">
                    <input
                      type="checkbox"
                      id="important-checkbox"
                      checked={important}
                      onChange={(e) => setImportant(e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="important-checkbox" className="text-xs text-slate-300 cursor-pointer">
                      Mark as Important
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notice Body & Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide complete details, exact timings, affected towers, and instructions for residents..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-white text-xs leading-relaxed focus:outline-none focus:border-blue-400 placeholder-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish & Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
