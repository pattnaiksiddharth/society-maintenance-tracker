import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Lock,
  Mail,
  User, 
  Building,
  Phone,
  ShieldCheck, 
  CheckCircle2,
  Wrench,
  Bell,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isForced?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isForced = false }) => {
  const { registerUser, login } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState<'resident' | 'admin'>('resident');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      if (mode === 'register') {
        if (!name || !unitNumber) {
          alert('Name and Unit Number are required for registration.');
          setIsSubmitting(false);
          return;
        }
        await registerUser({
          name,
          email,
          unitNumber,
          contactNumber,
          role,
          password
        });
      } else {
        await login(email, password);
      }
      // Reset form fields on success
      setName('');
      setEmail('');
      setPassword('');
      setUnitNumber('');
      setContactNumber('');
      onClose();
    } catch (err: any) {
      alert(err.message || (mode === 'register' ? 'Registration failed' : 'Login failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto transition-opacity duration-300">
      <div 
        className="relative w-full max-w-4xl rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl overflow-hidden flex flex-col md:flex-row my-auto transition-all duration-500 ease-out transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Branding / Product Intro Column */}
        <div className="w-full md:w-1/2 p-6 md:p-8 bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-950 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 relative overflow-hidden">
          {/* Ambient Lighting Accents */}
          <div className="absolute -top-16 -left-16 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Building className="w-3.5 h-3.5" />
              <span>Society Maintenance Tracker</span>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug transition-all duration-300">
                {mode === 'login' ? (
                  <>
                    Manage Your Society.<br />
                    <span className="text-blue-400">Simplify Everyday Living.</span>
                  </>
                ) : (
                  <>
                    Join Your Society<br />
                    <span className="text-blue-400">Community</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed transition-all duration-300">
                {mode === 'login' 
                  ? "A smarter way to manage complaints, maintenance requests and society updates — all in one place."
                  : "Create your account and stay connected with your society's complaints, maintenance and updates."}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Complaint Tracking</h4>
                  <p className="text-[11px] text-slate-400">Raise and track complaints easily</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Maintenance Management</h4>
                  <p className="text-[11px] text-slate-400">Stay updated with society maintenance</p>
                </div>
              </div>

              <div className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Community Updates</h4>
                  <p className="text-[11px] text-slate-400">Never miss important notices</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Form Card */}
        <div className="w-full md:w-1/2 p-6 md:p-8 space-y-5 flex flex-col justify-center">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {mode === 'login' ? 'Account Login' : 'Register Account'}
                </h3>
                <p className="text-xs text-slate-400">
                  {mode === 'login' ? 'Sign in to access your dashboard' : 'Add a new resident to the society database'}
                </p>
              </div>
            </div>
            {!isForced && (
              <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 hover:rotate-90">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

        {/* Tab Buttons with Smooth Indicator */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5 relative">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 relative z-10 ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all duration-200 relative z-10 ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Meera Patel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-slate-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. meera@society.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-400 placeholder-slate-500"
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit / Flat No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E-504"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-blue-400 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 11223"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-blue-400 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-white text-xs focus:outline-none focus:border-blue-400"
                >
                  <option value="resident">Resident</option>
                  <option value="admin">Admin / Facility Staff</option>
                </select>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              {isSubmitting 
                ? (mode === 'login' ? 'Logging in...' : 'Registering...') 
                : (mode === 'login' ? 'Login' : 'Register Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
