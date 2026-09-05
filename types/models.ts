// ═══════════════════════════════════════════════════════════
// CMYP Portal — Domain Models
// Mirrors the backend API response shapes
// ═══════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'pc' | 'fellow' | 'intern' | 'pmu';
export type UserStatus = 'pending' | 'active' | 'inactive';  // pending = self-registered, awaiting admin allocation
export type Gender = 'male' | 'female' | 'other';
export type Category = 'general' | 'obc' | 'sc' | 'st' | 'other';
export type Qualification = '10th' | '12th' | 'iti_diploma' | 'graduate' | 'post_graduate' | 'other';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type TaskPriority = 'high' | 'medium' | 'low';
export type LeaveType = 'casual' | 'earned' | 'medical' | 'special';
export type LeaveStatus = 'applied' | 'approved' | 'rejected';
export type ExitStatus = 'pending' | 'approved' | 'rejected' | 'force_approved';

// ── Location hierarchy ──────────────────────────────────────

export interface Division {
  id: string;
  name: string;
  code?: string;
}

export interface District {
  id: string;
  name: string;
  divisionId: string;
  divisionName: string;
}

export interface Block {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  divisionId?: string;
}

export interface GramPanchayat {
  id: string;
  name: string;
  blockId: string;
  blockName: string;
}

export interface Village {
  id: string;
  name: string;
  gramPanchayatId: string;
  gramPanchayatName: string;
  blockId?: string;
  blockName?: string;
}

// ── Auth ────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  division?: Division;
  district?: District & { divisionName: string };
  block?: Block & { districtName: string };
  gramPanchayat?: GramPanchayat;
  village?: Village;
  pmuDesignation?: 'chief_program_manager' | 'senior_program_manager' | 'program_manager';
  profileComplete: boolean;
  createdAt: string;
  avatarUrl?: string;

  // ── Personal details (admin-managed; not user-editable) ──
  middleName?: string;
  lastName?: string;
  category?: Category;
  gender?: Gender;
  fatherName?: string;
  address?: string;
  samagraId?: string;

  // ── Educational qualification ──
  qualification?: Qualification;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  token?: string;    // JWT; may be in httpOnly cookie instead
  expiresAt?: string;
}

// ── User (admin view) ───────────────────────────────────────

export type User = AuthUser; // Same shape

// ── Task ────────────────────────────────────────────────────

export interface AssigneeRef {
  id: string;
  name: string;
  role: UserRole;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;    // ISO date
  endDate: string;      // ISO date
  createdBy: AssigneeRef;
  assignedTo: AssigneeRef[];
  assignedByPc?: boolean;  // Client-side flag to denote PC-created tasks
  isSurveyTask?: boolean;
  surveyId?: string;
  targetAudience?: 'all_interns' | 'all_fellows' | 'all_pcs' | 'all' | 'selective';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  assignedToIds: string[];
  isSurveyTask?: boolean;
  surveyId?: string;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  comment?: string;
}

// ── Attendance ──────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  markedAt: string;     // HH:MM format
  latitude: number;
  longitude: number;
  status: 'present' | 'absent';
  district?: Pick<District, 'id' | 'name'>;
  block?: Pick<Block, 'id' | 'name'>;
}

export interface AttendanceReportRow {
  userId: string;
  userName: string;
  presentDays: number;
  absentDays: number;
  totalDays: number;
}

// ── Leave ───────────────────────────────────────────────────

export interface LeaveApplication {
  id: string;
  applicant: AssigneeRef;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: AssigneeRef;
  approverComment?: string;
}

export interface LeaveBalance {
  casual: number;
  casualUsed: number;
  earned: number;
  earnedUsed: number;
  medical: number;
  medicalUsed: number;
  special: number;
  specialUsed: number;
}

// ── Exit ────────────────────────────────────────────────────

export interface ExitRequest {
  id: string;
  applicant: AssigneeRef;
  reason?: string;
  status: ExitStatus;
  appliedAt: string;
  incompleteTasks: number;
  approvedBy?: AssigneeRef;
  approverComment?: string;
  certificateUrl?: string;
}

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'likert_scale'
  | 'rating_scale'
  | 'dichotomous'
  | 'descriptive';

export interface LikertConfig {
  points: number;
  lowLabel?: string;
  highLabel?: string;
  midLabel?: string;
  labels?: string[];
}

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  likertConfig?: LikertConfig;
  dichotomousLabels?: [string, string];
  placeholder?: string;
  required?: boolean;
  allowVoice?: boolean;
  allowVideo?: boolean;
  allowImage?: boolean;
}

export interface SurveyDocument {
  id: string;
  name: string;
  size: string;
  type?: string;
  url?: string;
  uploadedAt?: string;
}

export type SurveySubmissionStatus =
  | 'draft'
  | 'submitted_by_intern'
  | 'submitted_by_fellow'
  | 'submitted_by_pc'
  | 'approved';

export interface SurveyFeedback {
  id: string;
  surveyId: string;
  submittedBy: AssigneeRef;
  role: 'intern' | 'fellow' | 'pc';
  submittedToRole: 'fellow' | 'pc' | 'spm_cpm';
  feedbackText: string;
  challengesFaced?: string;
  recommendations?: string;
  stakeholdersInterviewedCount: number;
  createdAt: string;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  participantsRequired?: number;
  responsesCount?: number;
  status?: 'draft' | 'active' | 'closed';
  submissionStatus?: SurveySubmissionStatus;
  feedbacks?: SurveyFeedback[];
  questions?: SurveyQuestion[];
  documents?: SurveyDocument[];
  createdBy: AssigneeRef;
  isAllocatedAsTask: boolean;
  createdAt: string;
}

export interface StakeholderDetails {
  fullName: string;
  contactInfo?: string;
  district?: string;
  notes?: string;
}

export interface QuestionMediaAnswer {
  voiceUrl?: string;
  voiceName?: string;
  videoUrl?: string;
  videoName?: string;
  imageUrl?: string;
  imageName?: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondent: AssigneeRef;
  stakeholder?: StakeholderDetails;
  answers: Record<string, string | string[] | number>;
  mediaAnswers?: Record<string, QuestionMediaAnswer>;
  submittedAt: string;
  fileUrls?: string[];
}

// ── Training / Meeting ──────────────────────────────────────

export interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  duration: number;       // Minutes
  organizer: AssigneeRef;
  invitees: AssigneeRef[];
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  agenda?: string;
  documentUrl?: string;
  createdAt: string;
}

// ── Dashboard Stats ─────────────────────────────────────────

export interface AdminDashboardStats {
  totalFellows: number;
  totalInterns: number;
  totalPCs: number;
  activeTasks: number;
  completedTasks: number;
  pendingLeaveRequests: number;
  pendingExitRequests: number;
  attendanceToday: number;
  attendanceRate: number;
  divisionsCount: number;
  districtsCount: number;
  blocksCount: number;
}

export interface PCDashboardStats {
  fellowsInDivision: number;
  internsInDivision: number;
  activeTasks: number;
  completedTasks: number;
  pendingLeaveApprovals: number;
  pendingExitApprovals: number;
  attendanceToday: number;
}

export interface FellowDashboardStats {
  myActiveTasks: number;
  myCompletedTasks: number;
  internsUnderMe: number;
  myPendingLeave: number;
  pendingInternApprovals: number;
  attendanceThisMonth: number;
}

export interface InternDashboardStats {
  myActiveTasks: number;
  myCompletedTasks: number;
  leaveBalance: LeaveBalance;
  upcomingMeetings: number;
  attendanceThisMonth: number;
}
