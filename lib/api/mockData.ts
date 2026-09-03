/**
 * CMYP Portal — Centralized mock/demo data
 * Used as fallback when the backend API is not available (local development/demo)
 */

import type {
  User, Task, AttendanceRecord, LeaveApplication, LeaveBalance,
  ExitRequest, Survey, Meeting,
} from '@/types/models';

interface PaginatedItems<T> { items: T[]; total: number; page: number; limit: number; }


// ─── Users ───────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'u-admin-01', name: 'Rajesh', middleName: 'Kumar', email: 'admin@cmyp.mp.gov.in',
    role: 'admin', status: 'active', profileComplete: true, createdAt: '2026-01-01T00:00:00Z',
    lastName: 'Sharma', category: 'general', gender: 'male', fatherName: 'Mohan Lal Sharma',
    address: '14 Shyamla Hills, Bhopal, Madhya Pradesh', samagraId: '100200300401',
    qualification: 'post_graduate',
  },
  {
    id: 'u-pc-01', name: 'Anjali', middleName: 'Singh', email: 'pc.bhopal@cmyp.mp.gov.in',
    role: 'pc', status: 'active',
    division: { id: 'div-01', name: 'Bhopal Division', code: 'BPL' },
    profileComplete: true, createdAt: '2026-01-05T00:00:00Z',
    lastName: 'Verma', category: 'obc', gender: 'female', fatherName: 'Rakesh Verma',
    address: 'MIG-22, Arera Colony, Bhopal, Madhya Pradesh', samagraId: '100200300402',
    qualification: 'post_graduate',
  },
  {
    id: 'u-pc-02', name: 'Suresh', middleName: '', email: 'pc.indore@cmyp.mp.gov.in',
    role: 'pc', status: 'active',
    division: { id: 'div-02', name: 'Indore Division', code: 'IDR' },
    profileComplete: true, createdAt: '2026-01-05T00:00:00Z',
    lastName: 'Tiwari', category: 'general', gender: 'male', fatherName: 'Ramesh Tiwari',
    address: '7 Race Course Road, Indore, Madhya Pradesh', samagraId: '100200300403',
    qualification: 'graduate',
  },
  {
    id: 'u-fellow-01', name: 'Vikram Singh', email: 'fellow.indore@cmyp.mp.gov.in',
    role: 'fellow', status: 'active',
    district: { id: 'dst-01', name: 'Indore', divisionId: 'div-02', divisionName: 'Indore Division' },
    profileComplete: true, createdAt: '2026-01-10T00:00:00Z',
    lastName: 'Singh', gender: 'male', fatherName: 'Bhupendra Singh',
    address: 'Vijay Nagar, Indore, Madhya Pradesh', samagraId: '100200300404',
    qualification: 'post_graduate',
  },
  {
    id: 'u-fellow-02', name: 'Kavita Patel', email: 'fellow.bhopal@cmyp.mp.gov.in',
    role: 'fellow', status: 'active',
    district: { id: 'dst-02', name: 'Bhopal', divisionId: 'div-01', divisionName: 'Bhopal Division' },
    profileComplete: true, createdAt: '2026-01-10T00:00:00Z',
    lastName: 'Patel', gender: 'female', fatherName: 'Naresh Patel',
    address: 'Kolar Road, Bhopal, Madhya Pradesh', samagraId: '100200300405',
    qualification: 'graduate',
  },
  {
    id: 'u-fellow-03', name: 'Amit Mishra', email: 'fellow.jabalpur@cmyp.mp.gov.in',
    role: 'fellow', status: 'inactive',
    district: { id: 'dst-03', name: 'Jabalpur', divisionId: 'div-03', divisionName: 'Jabalpur Division' },
    profileComplete: true, createdAt: '2026-01-10T00:00:00Z',
    lastName: 'Mishra', gender: 'male', fatherName: 'Girish Mishra',
    address: 'Napier Town, Jabalpur, Madhya Pradesh', samagraId: '100200300406',
    qualification: 'post_graduate',
  },
  {
    id: 'u-intern-01', name: 'Priya Patel', email: 'intern.ujjain@cmyp.mp.gov.in',
    role: 'intern', status: 'active',
    block: { id: 'blk-01', name: 'Ujjain Urban', districtId: 'dst-04', districtName: 'Ujjain' },
    gramPanchayat: { id: 'gp-01', name: 'Bharkhedi', blockId: 'blk-01', blockName: 'Ujjain Urban' },
    village: { id: 'vlg-01', name: 'Bharkhedi Kalan', gramPanchayatId: 'gp-01', gramPanchayatName: 'Bharkhedi' },
    profileComplete: true, createdAt: '2026-01-15T00:00:00Z',
    lastName: 'Patel', gender: 'female', fatherName: 'Dinesh Patel',
    address: 'Bharkhedi Kalan, Ujjain Urban, Ujjain, Madhya Pradesh', samagraId: '100200300407',
    qualification: 'graduate',
  },
  {
    id: 'u-intern-02', name: 'Rohit Yadav', email: 'intern.gwalior@cmyp.mp.gov.in',
    role: 'intern', status: 'active',
    block: { id: 'blk-02', name: 'Gwalior Block A', districtId: 'dst-05', districtName: 'Gwalior' },
    gramPanchayat: { id: 'gp-03', name: 'Bhitarwar', blockId: 'blk-02', blockName: 'Gwalior Block A' },
    village: { id: 'vlg-05', name: 'Bhitarwar Khurd', gramPanchayatId: 'gp-03', gramPanchayatName: 'Bhitarwar' },
    profileComplete: false, createdAt: '2026-01-15T00:00:00Z',
    lastName: 'Yadav', gender: 'male', fatherName: 'Satendra Yadav',
    address: 'Bhitarwar Khurd, Gwalior Block A, Gwalior, Madhya Pradesh', samagraId: '100200300408',
    qualification: '12th',
  },
  {
    id: 'u-intern-03', name: 'Sunita Rajput', email: 'intern.sagar@cmyp.mp.gov.in',
    role: 'intern', status: 'active',
    block: { id: 'blk-03', name: 'Sagar Rural', districtId: 'dst-06', districtName: 'Sagar' },
    gramPanchayat: { id: 'gp-05', name: 'Rahatgarh', blockId: 'blk-03', blockName: 'Sagar Rural' },
    village: { id: 'vlg-09', name: 'Rahatgarh Khurd', gramPanchayatId: 'gp-05', gramPanchayatName: 'Rahatgarh' },
    profileComplete: true, createdAt: '2026-01-15T00:00:00Z',
    lastName: 'Rajput', gender: 'female', fatherName: 'Uday Singh Rajput',
    address: 'Rahatgarh Khurd, Sagar Rural, Sagar, Madhya Pradesh', samagraId: '100200300409',
    qualification: 'iti_diploma',
  },
];

export const MOCK_PAGINATED_USERS = {
  items: MOCK_USERS,
  total: MOCK_USERS.length,
  page: 1,
  limit: 20,
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

const me = { id: 'u-pc-01', name: 'Anjali Verma', role: 'pc' as const };
const fellow1 = { id: 'u-fellow-01', name: 'Vikram Singh', role: 'fellow' as const };
const intern1 = { id: 'u-intern-01', name: 'Priya Patel', role: 'intern' as const };

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-01', name: 'Conduct Block Health Survey — Ujjain Urban',
    description: 'Visit all PHCs in Ujjain Urban block and complete health facility assessment forms.',
    priority: 'high', status: 'in_progress',
    startDate: '2026-08-15', endDate: '2026-09-15',
    createdBy: me, assignedTo: [intern1],
    targetAudience: 'all_interns',
    isSurveyTask: true,
    surveyId: 'surv-01',
    createdAt: '2026-08-10T00:00:00Z', updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'task-02', name: 'Monthly District Report — August',
    description: 'Compile attendance, leave, and task completion data for August monthly review.',
    priority: 'high', status: 'pending',
    startDate: '2026-09-01', endDate: '2026-09-05',
    createdBy: me, assignedTo: [fellow1],
    targetAudience: 'all_fellows',
    createdAt: '2026-08-28T00:00:00Z', updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'task-03', name: 'Rural Infrastructure Assessment',
    description: 'Document road and connectivity infrastructure conditions in assigned blocks.',
    priority: 'medium', status: 'completed',
    startDate: '2026-07-01', endDate: '2026-07-31',
    createdBy: fellow1, assignedTo: [intern1],
    targetAudience: 'all_interns',
    isSurveyTask: true,
    surveyId: 'surv-02',
    createdAt: '2026-06-28T00:00:00Z', updatedAt: '2026-07-31T00:00:00Z',
  },
  {
    id: 'task-04', name: 'Community Feedback Collection',
    description: 'Gather community satisfaction feedback on government scheme delivery.',
    priority: 'medium', status: 'pending',
    startDate: '2026-09-05', endDate: '2026-09-20',
    createdBy: me, assignedTo: [intern1],
    targetAudience: 'all_interns',
    isSurveyTask: true,
    surveyId: 'surv-03',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'task-05', name: 'Digital Literacy Workshop — Sagar',
    description: 'Conduct 2-day digital literacy awareness session at gram panchayat level.',
    priority: 'low', status: 'overdue',
    startDate: '2026-08-01', endDate: '2026-08-25',
    createdBy: me, assignedTo: [intern1],
    targetAudience: 'selective',
    assignedByPc: true,
    createdAt: '2026-07-30T00:00:00Z', updatedAt: '2026-08-26T00:00:00Z',
  },
  {
    id: 'task-06', name: 'Divisional Review & Orientation Drive',
    description: 'Coordinate with all district Fellows for quarterly performance review and intern orientation.',
    priority: 'high', status: 'in_progress',
    startDate: '2026-09-01', endDate: '2026-09-18',
    createdBy: { id: 'u-admin-01', name: 'State Admin', role: 'admin' as const },
    assignedTo: [me],
    targetAudience: 'all_pcs',
    createdAt: '2026-08-25T00:00:00Z', updatedAt: '2026-08-25T00:00:00Z',
  },
];

export const MOCK_PAGINATED_TASKS = {
  items: MOCK_TASKS,
  total: MOCK_TASKS.length,
  page: 1,
  limit: 20,
};

// ─── Attendance ───────────────────────────────────────────────────────────────

function makeAttendanceRecord(day: number, present: boolean): AttendanceRecord {
  const date = `2026-08-${String(day).padStart(2, '0')}`;
  return {
    id: `att-${day}`, userId: 'u-intern-01', userName: 'Priya Patel',
    date, markedAt: present ? '09:15' : '—',
    latitude: 23.1765, longitude: 75.7885,
    status: present ? 'present' : 'absent',
    block: { id: 'blk-01', name: 'Ujjain Urban' },
  };
}

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  ...Array.from({ length: 31 }, (_, i) => makeAttendanceRecord(i + 1, [6, 7, 13, 14, 20, 21, 27, 28].indexOf(i + 1) === -1)),
];

export const MOCK_PAGINATED_ATTENDANCE = {
  items: MOCK_ATTENDANCE_RECORDS,
  total: MOCK_ATTENDANCE_RECORDS.length,
  page: 1,
  limit: 50,
};

// ─── Leave ───────────────────────────────────────────────────────────────────

export const MOCK_LEAVE_APPLICATIONS: LeaveApplication[] = [
  {
    id: 'leave-01', applicant: { id: 'u-intern-01', name: 'Priya Patel', role: 'intern' },
    leaveType: 'casual', startDate: '2026-09-10', endDate: '2026-09-11',
    reason: 'Family function in home town',
    status: 'applied', appliedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'leave-02', applicant: { id: 'u-fellow-01', name: 'Vikram Singh', role: 'fellow' },
    leaveType: 'medical', startDate: '2026-08-20', endDate: '2026-08-22',
    reason: 'Fever and doctor prescribed rest',
    status: 'approved', appliedAt: '2026-08-19T09:00:00Z',
    approvedBy: { id: 'u-pc-01', name: 'Anjali Verma', role: 'pc' },
    approverComment: 'Approved. Get well soon.',
  },
  {
    id: 'leave-03', applicant: { id: 'u-intern-02', name: 'Rohit Yadav', role: 'intern' },
    leaveType: 'casual', startDate: '2026-09-05', endDate: '2026-09-05',
    reason: 'Personal work',
    status: 'rejected', appliedAt: '2026-09-01T08:00:00Z',
    approvedBy: { id: 'u-fellow-01', name: 'Vikram Singh', role: 'fellow' },
    approverComment: 'Critical fieldwork scheduled that day.',
  },
];

export const MOCK_PAGINATED_LEAVE = {
  items: MOCK_LEAVE_APPLICATIONS,
  total: MOCK_LEAVE_APPLICATIONS.length,
  page: 1,
  limit: 20,
};

export const MOCK_LEAVE_BALANCE: LeaveBalance = {
  casual: 12, casualUsed: 3,
  earned: 15, earnedUsed: 2,
  medical: 10, medicalUsed: 1,
  special: 5, specialUsed: 0,
};

// ─── Exit ─────────────────────────────────────────────────────────────────────

export const MOCK_EXIT_REQUESTS: ExitRequest[] = [
  {
    id: 'exit-01',
    applicant: { id: 'u-intern-02', name: 'Rohit Yadav', role: 'intern' },
    reason: 'Completed program tenure and pursuing higher education',
    status: 'pending', appliedAt: '2026-09-01T00:00:00Z',
    incompleteTasks: 1,
  },
  {
    id: 'exit-02',
    applicant: { id: 'u-fellow-03', name: 'Amit Mishra', role: 'fellow' },
    reason: 'Program period complete',
    status: 'approved', appliedAt: '2026-08-15T00:00:00Z',
    incompleteTasks: 0,
    approvedBy: { id: 'u-pc-01', name: 'Anjali Verma', role: 'pc' },
    approverComment: 'All tasks complete. Certificate issued.',
  },
];

export const MOCK_PAGINATED_EXIT = {
  items: MOCK_EXIT_REQUESTS,
  total: MOCK_EXIT_REQUESTS.length,
  page: 1,
  limit: 20,
};

// ─── Surveys ──────────────────────────────────────────────────────────────────

export const MOCK_SURVEYS: Survey[] = [
  {
    id: 'survey-01',
    title: 'Block Livelihood Survey — Q3 2026',
    description: 'Quarterly survey to assess household livelihood and employment conditions across all blocks.',
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    participantsRequired: 150,
    responsesCount: 112,
    status: 'active',
    createdBy: me,
    isAllocatedAsTask: true,
    createdAt: '2026-08-01T00:00:00Z',
    questions: [
      { id: 'q1', type: 'single_choice', question: 'What is the primary source of household income?', options: ['Agriculture', 'Daily Wage Labor', 'Small Business / Shop', 'Government / Private Job'], required: true },
      { id: 'q2', type: 'likert_scale', question: 'How satisfied is the community with current road connectivity?', likertConfig: { points: 5, lowLabel: 'Very Dissatisfied', highLabel: 'Very Satisfied', midLabel: 'Neutral' }, required: true },
      { id: 'q3', type: 'dichotomous', question: 'Does the household have access to piped drinking water?', dichotomousLabels: ['Yes', 'No'], required: true },
      { id: 'q4', type: 'multiple_choice', question: 'Which welfare schemes does the household benefit from?', options: ['PM Kisan', 'Ladli Behna Yojana', 'Ayushman Bharat', 'Ration (PDS)', 'None'], required: true },
      { id: 'q5', type: 'descriptive', question: 'What are the main development challenges reported by the village head?', placeholder: 'Enter key observations, grievances, or community suggestions…', required: false },
    ],
  },
  {
    id: 'survey-02',
    title: 'Youth Digital Literacy & Employment Assessment',
    description: 'Assess digital skills, smartphone accessibility, and career training requirements for rural youth.',
    startDate: '2026-08-15',
    endDate: '2026-10-15',
    participantsRequired: 200,
    responsesCount: 84,
    status: 'active',
    createdBy: me,
    isAllocatedAsTask: true,
    createdAt: '2026-08-15T00:00:00Z',
    questions: [
      { id: 'q1', type: 'dichotomous', question: 'Does the candidate have personal access to a smartphone or computer?', dichotomousLabels: ['Yes', 'No'], required: true },
      { id: 'q2', type: 'multiple_choice', question: 'Which digital skills are you interested in learning?', options: ['Basic Computer Operations', 'Digital Payments & Banking', 'Graphic Design & Media', 'Online Government Services (MP e-District)', 'Coding & Programming'], required: true },
      { id: 'q3', type: 'likert_scale', question: 'How confident are you in using digital payment apps (UPI, DBT)?', likertConfig: { points: 5, lowLabel: 'Not Confident', highLabel: 'Extremely Confident', midLabel: 'Moderate' }, required: true },
      { id: 'q4', type: 'descriptive', question: 'Describe your educational background and career aspiration.', placeholder: 'Write a brief description…', required: true },
    ],
  },
  {
    id: 'survey-03',
    title: 'Primary Healthcare Center Accessibility Audit',
    description: 'Evaluating medicine availability, doctor attendance, and ambulance response time in rural PHCs.',
    startDate: '2026-09-01',
    endDate: '2026-09-25',
    participantsRequired: 75,
    responsesCount: 29,
    status: 'active',
    createdBy: fellow1,
    isAllocatedAsTask: true,
    createdAt: '2026-09-01T00:00:00Z',
    questions: [
      { id: 'q1', type: 'single_choice', question: 'Distance of the village from the nearest PHC / CHC?', options: ['Under 2 km', '2–5 km', '5–10 km', 'More than 10 km'], required: true },
      { id: 'q2', type: 'likert_scale', question: 'Quality of service received during the last visit to the health center:', likertConfig: { points: 5, lowLabel: 'Very Poor', highLabel: 'Excellent', midLabel: 'Average' }, required: true },
      { id: 'q3', type: 'dichotomous', question: 'Are essential generic medicines available free of cost at the center?', dichotomousLabels: ['Yes', 'No'], required: true },
    ],
  },
];

export const MOCK_PAGINATED_SURVEYS = {
  items: MOCK_SURVEYS,
  total: MOCK_SURVEYS.length,
  page: 1,
  limit: 20,
};

// ─── Meetings / Training ───────────────────────────────────────────────────────

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'meet-01', title: 'Monthly Division Review — September',
    scheduledAt: '2026-09-10T10:00:00Z', duration: 90,
    organizer: me, invitees: [fellow1, intern1],
    agenda: 'Review monthly KPIs, discuss challenges, plan October activities.',
    zoomJoinUrl: '#demo-meeting',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'meet-02', title: 'Survey Training Session',
    scheduledAt: '2026-09-05T14:00:00Z', duration: 60,
    organizer: me, invitees: [intern1],
    agenda: 'Training on Block Livelihood Survey methodology and data collection.',
    zoomJoinUrl: '#demo-meeting',
    createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'meet-03', title: 'State Program Coordinator Huddle',
    scheduledAt: '2026-09-15T11:00:00Z', duration: 120,
    organizer: { id: 'u-admin-01', name: 'Rajesh Sharma', role: 'admin' },
    invitees: [me],
    agenda: 'State-wide progress review and Q4 planning.',
    zoomJoinUrl: '#demo-meeting',
    createdAt: '2026-09-02T00:00:00Z',
  },
];

export const MOCK_PAGINATED_MEETINGS = {
  items: MOCK_MEETINGS,
  total: MOCK_MEETINGS.length,
  page: 1,
  limit: 20,
};
