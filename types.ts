export type Role = 'resident' | 'admin';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ComplaintCategory = 
  | 'Plumbing' 
  | 'Electrical' 
  | 'Elevator' 
  | 'Water' 
  | 'Carpentry' 
  | 'HVAC' 
  | 'Common Area' 
  | 'Security' 
  | 'Pest Control' 
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  unitNumber: string;
  contactNumber: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface ComplaintHistoryItem {
  id: string;
  complaintId: string;
  previousStatus: ComplaintStatus;
  newStatus: ComplaintStatus;
  actorId: string;
  actorName: string;
  actorRole: Role;
  note?: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  code: string; // e.g. "CMP-1042"
  residentId: string;
  residentName: string;
  residentUnit: string;
  residentContact: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  photoUrl?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  isOverdue?: boolean;
  ageDays?: number;
  history?: ComplaintHistoryItem[];
}

export type NoticeCategory = 'IMPORTANT' | 'MAINTENANCE' | 'EVENT' | 'LIFESTYLE' | 'GENERAL';

export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  important: boolean;
  authorId: string;
  authorName: string;
  authorRole: Role;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettings {
  overdueThresholdDays: number;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  autoAssignCategory: boolean;
  societyName: string;
  workingHours: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  to: string;
  recipientName: string;
  subject: string;
  body: string;
  type: 'COMPLAINT_CREATED' | 'STATUS_UPDATED' | 'PRIORITY_CHANGED' | 'NOTICE_BROADCAST' | 'OVERDUE_ALERT';
  referenceId?: string;
  sentAt: string;
}

export interface DashboardStats {
  totalOpen: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  totalComplaints: number;
  resolutionRatePercent: number;
  openToday: number;
  categoryDistribution: { category: ComplaintCategory; count: number }[];
  statusDistribution: { status: ComplaintStatus; count: number }[];
  priorityDistribution: { priority: ComplaintPriority; count: number }[];
}
