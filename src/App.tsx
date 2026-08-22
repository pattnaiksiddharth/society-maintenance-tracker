import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ResidentDashboard } from './components/dashboard/ResidentDashboard';
import { ComplaintList } from './components/complaints/ComplaintList';
import { NoticeBoard } from './components/notices/NoticeBoard';
import { ComplaintDetailsModal } from './components/complaints/ComplaintDetailsModal';
import { RaiseComplaintModal } from './components/complaints/RaiseComplaintModal';
import { StatusUpdateModal } from './components/complaints/StatusUpdateModal';
import { SettingsModal } from './components/admin/SettingsModal';
import { EmailActivityDrawer } from './components/admin/EmailActivityDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { ToastContainer, type ToastMessage } from './components/common/Toast';
import { api } from './services/api';
import type { 
  Complaint, 
  Notice, 
  DashboardStats, 
  SystemSettings, 
  EmailLog, 
  ComplaintStatus, 
  ComplaintPriority,
  NoticeCategory
} from './types';

function MainLayout() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Application Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals & Drawers States
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState<boolean>(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<Complaint | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isEmailDrawerOpen, setIsEmailDrawerOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random(),
      type,
      title,
      message
    };
    setToasts(prev => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch all data
  const loadAllData = useCallback(async () => {
    if (!currentUser) return; // Do not fetch data if not logged in
    try {
      const [statsData, complaintsData, noticesData, settingsData, emailsData] = await Promise.all([
        api.getStats().catch(() => null),
        api.getComplaints().catch(() => []),
        api.getNotices().catch(() => []),
        api.getSettings().catch(() => null),
        api.getEmails().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      setComplaints(complaintsData);
      setNotices(noticesData);
      if (settingsData) setSettings(settingsData);
      setEmails(emailsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, currentUser]);

  // Loading indicator for session restoration
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Force login if no session is active
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(at_top_right,rgba(29,78,216,0.15),transparent),radial-gradient(at_bottom_left,rgba(30,58,138,0.2),transparent)] flex items-center justify-center p-4">
        <AuthModal isOpen={true} onClose={() => {}} isForced={true} />
      </div>
    );
  }

  // Handlers
  const handleRaiseComplaint = async (data: any) => {
    try {
      const created = await api.createComplaint(data);
      addToast('success', 'Ticket Registered Successfully', `${created.code} has been assigned.`);
      await loadAllData();
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.message || 'Could not register ticket.');
      throw err;
    }
  };

  const handleUpdateStatus = async (
    id: string, 
    payload: {
      newStatus: ComplaintStatus;
      actorId: string;
      actorName: string;
      actorRole: string;
      note?: string;
      assignedTo?: string;
      priority?: ComplaintPriority;
    }
  ) => {
    try {
      const updated = await api.updateComplaintStatus(id, payload);
      addToast('success', 'Status Updated', `${updated.code} is now ${updated.status}. Notification sent.`);
      await loadAllData();
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(updated);
      }
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
      throw err;
    }
  };

  const handleCreateNotice = async (data: {
    title: string;
    content: string;
    category: NoticeCategory;
    important: boolean;
  }) => {
    try {
      await api.createNotice({
        ...data,
        authorId: currentUser?.id || 'u-admin-1',
        authorName: currentUser?.name || 'Admin',
        authorRole: currentUser?.role || 'admin'
      });
      addToast('success', 'Notice Published', data.important ? 'Broadcasted to all residents.' : 'Posted to Pin Board.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', 'Publish Failed', err.message);
      throw err;
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await api.deleteNotice(id);
      addToast('info', 'Notice Deleted', 'Removed from society pin board.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', 'Deletion Failed', err.message);
    }
  };

  const handleSaveSettings = async (data: Partial<SystemSettings>) => {
    try {
      const updated = await api.updateSettings(data);
      setSettings(updated);
      addToast('success', 'Settings Saved', `SLA Overdue Target set to ${updated.overdueThresholdDays} days.`);
      await loadAllData();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
      throw err;
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemo();
      addToast('info', 'Demo Reset', 'Default society data restored.');
      await loadAllData();
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.message);
    }
  };

  // Header texts based on tab
  const getHeaderInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: isAdmin ? 'Maintenance Dashboard' : 'Resident Helpdesk',
          subtitle: isAdmin 
            ? `Real-time SLA tracking for ${settings?.societyName || 'Silver Oaks Residency'}`
            : `Track unit requests, emergency contacts, and active notices`
        };
      case 'complaints':
        return {
          title: isAdmin ? 'All Complaints & Queue' : 'My Complaints & History',
          subtitle: 'Search, filter, and inspect ticket audit logs'
        };
      case 'notices':
        return {
          title: 'Society Notice Board',
          subtitle: 'Official announcements, maintenance schedules, and AGM circulars'
        };
      default:
        return {
          title: 'Society Maintenance Tracker',
          subtitle: 'Real-time property management'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(at_top_right,rgba(29,78,216,0.15),transparent),radial-gradient(at_bottom_left,rgba(30,58,138,0.2),transparent)] flex flex-row font-sans text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
      {/* Frosted Glass Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        settings={settings}
        onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenEmailDrawer={() => setIsEmailDrawerOpen(true)}
        emailCount={emails.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-6 md:p-8 min-w-0 max-h-screen overflow-y-auto">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          settings={settings}
          onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenEmailDrawer={() => setIsEmailDrawerOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          emailCount={emails.length}
        />

        {/* Tab Views */}
        <div className="flex-1 min-h-0 pb-12">
          {currentTab === 'dashboard' && (
            isAdmin ? (
              <AdminDashboard
                stats={stats}
                complaints={complaints}
                notices={notices}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onViewAllComplaints={() => setCurrentTab('complaints')}
                onOpenCreateNoticeModal={() => setCurrentTab('notices')}
                onQuickUpdateStatus={(c) => setStatusUpdateTarget(c)}
              />
            ) : (
              <ResidentDashboard
                complaints={complaints}
                notices={notices}
                onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
                onSelectComplaint={(c) => setSelectedComplaint(c)}
                onViewAllComplaints={() => setCurrentTab('complaints')}
              />
            )
          )}

          {currentTab === 'complaints' && (
            <ComplaintList
              complaints={complaints}
              onSelectComplaint={(c) => setSelectedComplaint(c)}
              onOpenRaiseModal={() => setIsRaiseModalOpen(true)}
              onQuickUpdateStatus={(c) => setStatusUpdateTarget(c)}
            />
          )}

          {currentTab === 'notices' && (
            <NoticeBoard
              notices={notices}
              onCreateNotice={handleCreateNotice}
              onDeleteNotice={handleDeleteNotice}
            />
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <RaiseComplaintModal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        onSubmit={handleRaiseComplaint}
      />

      <StatusUpdateModal
        complaint={statusUpdateTarget}
        isOpen={Boolean(statusUpdateTarget)}
        onClose={() => setStatusUpdateTarget(null)}
        onUpdate={handleUpdateStatus}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetDemo={handleResetDemo}
      />

      <EmailActivityDrawer
        isOpen={isEmailDrawerOpen}
        onClose={() => setIsEmailDrawerOpen(false)}
        emails={emails}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
