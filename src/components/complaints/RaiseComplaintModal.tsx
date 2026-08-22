import React, { useState, useRef } from 'react';
import type { ComplaintCategory, ComplaintPriority } from '../../types';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Send, 
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Zap,
  Droplets,
  Building,
  Hammer,
  Wind,
  Shield,
  Bug,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RaiseComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    residentId: string;
    residentName: string;
    residentUnit: string;
    residentContact: string;
    category: ComplaintCategory;
    title: string;
    description: string;
    photoUrl?: string;
    priority: ComplaintPriority;
  }) => Promise<void>;
}

export const RaiseComplaintModal: React.FC<RaiseComplaintModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { currentUser } = useAuth();

  const [category, setCategory] = useState<ComplaintCategory>('Plumbing');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>('MEDIUM');
  const [residentUnit, setResidentUnit] = useState(currentUser?.unitNumber || 'A-402');
  const [residentContact, setResidentContact] = useState(currentUser?.contactNumber || '+91 98765 43210');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories: { label: ComplaintCategory; icon: any }[] = [
    { label: 'Plumbing', icon: Droplets },
    { label: 'Electrical', icon: Zap },
    { label: 'Elevator', icon: Building },
    { label: 'Water', icon: Droplets },
    { label: 'Carpentry', icon: Hammer },
    { label: 'HVAC', icon: Wind },
    { label: 'Common Area', icon: Building },
    { label: 'Security', icon: Shield },
    { label: 'Pest Control', icon: Bug },
    { label: 'Other', icon: HelpCircle }
  ];

  // Preset sample photos for fast testing
  const samplePhotos = [
    { label: 'Pipe Leak', url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80' },
    { label: 'Circuit Box', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80' },
    { label: 'Elevator Panel', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f7?w=600&auto=format&fit=crop&q=80' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        residentId: currentUser?.id || 'u-res-1',
        residentName: currentUser?.name || 'Resident',
        residentUnit: residentUnit || 'A-402',
        residentContact: residentContact || '+91 98765 43210',
        category,
        title,
        description,
        photoUrl: photoUrl || undefined,
        priority
      });
      // reset form
      setTitle('');
      setDescription('');
      setPhotoUrl('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Raise Maintenance Ticket</h2>
              <p className="text-xs text-slate-400">Submit a repair request to the society maintenance desk</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Category Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.label;
                return (
                  <button
                    type="button"
                    key={cat.label}
                    onClick={() => setCategory(cat.label)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Issue Summary / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Master bathroom tap dripping constantly"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Urgency / Priority *
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400"
              >
                <option value="LOW">Low (Routine)</option>
                <option value="MEDIUM">Medium (Normal)</option>
                <option value="HIGH">High (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe the problem, exact location in the flat, and any specific times you are available for technician entry..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-slate-500 leading-relaxed"
            />
          </div>

          {/* Unit & Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Apartment / Unit Number *
              </label>
              <input
                type="text"
                required
                value={residentUnit}
                onChange={(e) => setResidentUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contact Number *
              </label>
              <input
                type="text"
                required
                value={residentContact}
                onChange={(e) => setResidentContact(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Photo Attachment (Drag & Drop + Preset Quick Pick) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Attach Photo Evidence (Optional)</span>
              <span className="text-[10px] text-slate-500">Max 5MB (PNG, JPG)</span>
            </label>

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/15 max-h-48 bg-black/40 flex items-center justify-center group">
                <img src={photoUrl} alt="Preview" className="max-h-44 object-contain" referrerPolicy="no-referrer" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-medium text-white">
                  Drag & drop image here, or <span className="text-blue-400 underline">browse files</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Supports PNG, JPG, GIF</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {/* Fast Preset Samples */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500">Sample Photos:</span>
              {samplePhotos.map((s) => (
                <button
                  type="button"
                  key={s.label}
                  onClick={() => setPhotoUrl(s.url)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-[10px] text-slate-400 hover:text-white border border-white/5 transition"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 border border-blue-400/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering Ticket...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
