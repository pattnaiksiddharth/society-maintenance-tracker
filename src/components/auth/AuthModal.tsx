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
  CheckCircle2 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl p-6 md:p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
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
            <button onClick={onClose} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition ${
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
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition ${
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
  );
};
