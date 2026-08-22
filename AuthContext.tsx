import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsUser: (user: User) => void;
  switchRole: (role: Role) => void;
  registerUser: (data: { name: string; email: string; unitNumber: string; contactNumber?: string; password?: string }) => Promise<void>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load the current user session (via httpOnly JWT cookie) on startup
  const restoreSession = async () => {
    try {
      const user = await api.me();
      setCurrentUser(user);
      
      // If the user is an admin, try loading all users for the switcher/admin view
      if (user.role === 'admin') {
        try {
          const users = await api.getUsers();
          setAllUsers(users);
        } catch (usersErr) {
          console.warn('Failed to load user list for admin:', usersErr);
        }
      }
    } catch (err) {
      // Not authenticated, this is expected for guests
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await api.login(email, password);
    setCurrentUser(user);

    // Load user list if admin
    if (user.role === 'admin') {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
      } catch (usersErr) {
        console.warn('Failed to load user list for admin:', usersErr);
      }
    }
  };

  const loginAsUser = async (user: User) => {
    // Development-only persona switcher bypass
    if (import.meta.env.DEV) {
      try {
        // Authenticate via backend using default password for seeded users
        const authenticatedUser = await api.login(user.email, 'password123');
        setCurrentUser(authenticatedUser);
      } catch (err: any) {
        console.warn('Quick login failed, attempting local fallback (dev-only):', err);
        // Only do local state change if server call failed in dev
        setCurrentUser(user);
      }
    } else {
      console.warn('loginAsUser is disabled in production.');
    }
  };

  const switchRole = (role: Role) => {
    if (import.meta.env.DEV) {
      const targetUser = allUsers.find(u => u.role === role);
      if (targetUser) {
        loginAsUser(targetUser);
      }
    } else {
      console.warn('switchRole is disabled in production.');
    }
  };

  const registerUser = async (data: { name: string; email: string; unitNumber: string; contactNumber?: string; password?: string }) => {
    const newUser = await api.register(data);
    setCurrentUser(newUser);
    
    if (newUser.role === 'admin') {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
      } catch (usersErr) {
        console.warn('Failed to load user list:', usersErr);
      }
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setCurrentUser(null);
      setAllUsers([]);
    }
  };

  const refreshUsers = async () => {
    if (currentUser?.role === 'admin') {
      try {
        const users = await api.getUsers();
        setAllUsers(users);
      } catch (err) {
        console.error('Failed to refresh users:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isLoading,
        login,
        loginAsUser,
        switchRole,
        registerUser,
        logout,
        refreshUsers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
