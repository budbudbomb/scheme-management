/**
 * CMYP Portal — Centralized mock/demo data
 * Used as fallback when the backend API is not available (local development/demo)
 */

import type {
  User, Task, AttendanceRecord, LeaveApplication, LeaveBalance,
  ExitRequest, Survey, Meeting, Complaint,
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
  {
    id: 'u-intern-04', name: 'Deepak Sharma', email: 'intern.phanda@cmyp.mp.gov.in',
    role: 'intern', status: 'active',
    district: { id: 'dst-02', name: 'Bhopal', divisionId: 'div-01', divisionName: 'Bhopal Division' },
    block: { id: 'blk-06', name: 'Phanda', districtId: 'dst-02', districtName: 'Bhopal' },
    gramPanchayat: { id: 'gp-07', name: 'Phanda Kalan', blockId: 'blk-06', blockName: 'Phanda' },
    village: { id: 'vlg-13', name: 'Phanda Gram', gramPanchayatId: 'gp-07', gramPanchayatName: 'Phanda Kalan' },
    profileComplete: true, createdAt: '2026-01-20T00:00:00Z',
    lastName: 'Sharma', gender: 'male', fatherName: 'Ramakant Sharma',
    address: 'Phanda Kalan, Phanda, Bhopal, Madhya Pradesh', samagraId: '100200300410',
    qualification: 'graduate',
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
const intern2 = { id: 'u-intern-02', name: 'Rohit Yadav', role: 'intern' as const };

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-01', name: 'Conduct Block Health Survey — Ujjain Urban',
    description: 'Visit all PHCs in Ujjain Urban block and complete health facility assessment forms.',
    priority: 'high', status: 'in_progress',
    startDate: '2026-08-15', endDate: '2026-09-15',
    createdBy: me, assignedTo: [intern1],
    targetAudience: 'all_interns',
    isSurveyTask: true,
    surveyId: 'survey-01',
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
    surveyId: 'survey-02',
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
    surveyId: 'survey-03',
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

const FELLOW_PROFILES = [
  { id: 'u-fellow-sehore', name: 'Vikramaditya Singh', district: { id: 'dst-sehore', name: 'Sehore' }, location: 'District Collectorate, Sehore' },
  { id: 'u-fellow-02', name: 'Kavita Patel', district: { id: 'dst-02', name: 'Bhopal' }, location: 'Zila Panchayat Office, Bhopal' },
  { id: 'u-fellow-raisen', name: 'Rajesh Chouhan', district: { id: 'dst-raisen', name: 'Raisen' }, location: 'District Collectorate, Raisen' },
  { id: 'u-fellow-rajgarh', name: 'Sunita Malviya', district: { id: 'dst-rajgarh', name: 'Rajgarh' }, location: 'District Administrative Complex, Rajgarh' },
  { id: 'u-fellow-vidisha', name: 'Deepak Sharma', district: { id: 'dst-vidisha', name: 'Vidisha' }, location: 'District Collectorate, Vidisha' },
];

const INTERN_PROFILES = [
  // Sehore Interns
  { id: 'int-seh-01', name: 'Aakash Verma', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-01', name: 'Ashta' }, panchayat: 'Kothri', location: 'Gram Panchayat Bhawan, Kothri' },
  { id: 'int-seh-02', name: 'Pooja Sharma', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-01', name: 'Ashta' }, panchayat: 'Kothri Kalan', location: 'Panchayat Seva Kendra, Kothri Kalan' },
  { id: 'int-seh-03', name: 'Rahul Meena', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-01', name: 'Ashta' }, panchayat: 'Metwada', location: 'Anganwadi Centre, Metwada' },
  { id: 'int-seh-04', name: 'Neha Gupta', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-01', name: 'Ashta' }, panchayat: 'Khachrod', location: 'PHC Campus, Khachrod' },
  { id: 'int-seh-05', name: 'Suresh Solanki', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-02', name: 'Ichhawar' }, panchayat: 'Diwadia', location: 'GP Office, Diwadia' },
  { id: 'int-seh-06', name: 'Priya Verma', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-02', name: 'Ichhawar' }, panchayat: 'Brijisnagar', location: 'Sub-Health Centre, Brijisnagar' },
  { id: 'int-seh-07', name: 'Manish Tiwari', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-03', name: 'Budhni' }, panchayat: 'Shahganj', location: 'Community Hall, Shahganj' },
  { id: 'int-seh-08', name: 'Jyoti Rathore', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-03', name: 'Budhni' }, panchayat: 'Bakhtra', location: 'Panchayat Bhavan, Bakhtra' },
  { id: 'int-seh-09', name: 'Ajay Sen', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-04', name: 'Sehore Rural' }, panchayat: 'Bilkisganj', location: 'Bilkisganj Main Chowk' },
  { id: 'int-seh-10', name: 'Ritu Parmar', district: { id: 'dst-sehore', name: 'Sehore' }, block: { id: 'blk-seh-04', name: 'Sehore Rural' }, panchayat: 'Mandi', location: 'Gram Seva Kendra, Mandi' },
  // Bhopal Interns
  { id: 'int-bhp-01', name: 'Deepak Sharma', district: { id: 'dst-02', name: 'Bhopal' }, block: { id: 'blk-bhp-01', name: 'Phanda' }, panchayat: 'Phanda Kalan', location: 'Block Development Office, Phanda' },
  { id: 'int-bhp-02', name: 'Aarti Kushwaha', district: { id: 'dst-02', name: 'Bhopal' }, block: { id: 'blk-bhp-01', name: 'Phanda' }, panchayat: 'Tara Sewaniya', location: 'Gram Panchayat Tara Sewaniya' },
  { id: 'int-bhp-03', name: 'Manoj Sen', district: { id: 'dst-02', name: 'Bhopal' }, block: { id: 'blk-bhp-01', name: 'Phanda' }, panchayat: 'Khajuri Sadak', location: 'Health Post Khajuri' },
  { id: 'int-bhp-04', name: 'Sangeeta Lodhi', district: { id: 'dst-02', name: 'Bhopal' }, block: { id: 'blk-bhp-02', name: 'Berasia' }, panchayat: 'Gunga', location: 'Panchayat Samiti Gunga' },
  { id: 'int-bhp-05', name: 'Vikas Yadav', district: { id: 'dst-02', name: 'Bhopal' }, block: { id: 'blk-bhp-02', name: 'Berasia' }, panchayat: 'Lalariya', location: 'Govt School Campus, Lalariya' },
  // Raisen Interns
  { id: 'int-rsn-01', name: 'Anil Malviya', district: { id: 'dst-raisen', name: 'Raisen' }, block: { id: 'blk-rsn-01', name: 'Sanchi' }, panchayat: 'Salammatpur', location: 'Gram Panchayat Salammatpur' },
  { id: 'int-rsn-02', name: 'Rekha Sen', district: { id: 'dst-raisen', name: 'Raisen' }, block: { id: 'blk-rsn-02', name: 'Gairatganj' }, panchayat: 'Garhi', location: 'Panchayat Bhavan Garhi' },
  // Rajgarh Interns
  { id: 'int-rjg-01', name: 'Govind Rajput', district: { id: 'dst-rajgarh', name: 'Rajgarh' }, block: { id: 'blk-rjg-01', name: 'Biaora' }, panchayat: 'Karanwas', location: 'Karanwas Seva Kendra' },
  { id: 'int-rjg-02', name: 'Mamta Sahu', district: { id: 'dst-rajgarh', name: 'Rajgarh' }, block: { id: 'blk-rjg-02', name: 'Khilchipur' }, panchayat: 'Chhapiheda', location: 'Sub-Centre Chhapiheda' },
  // Vidisha Interns
  { id: 'int-vds-01', name: 'Nitin Jain', district: { id: 'dst-vidisha', name: 'Vidisha' }, block: { id: 'blk-vds-01', name: 'Basoda' }, panchayat: 'Tyonda', location: 'GP Office Tyonda' },
  { id: 'int-vds-02', name: 'Meena Raghuwanshi', district: { id: 'dst-vidisha', name: 'Vidisha' }, block: { id: 'blk-vds-02', name: 'Kurwai' }, panchayat: 'Mandi Bamora', location: 'Kurwai Block Office' },
];

function generateTeamAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const dates = [
    '2026-09-06', '2026-09-05', '2026-09-04', '2026-09-03', '2026-09-02', '2026-09-01',
    '2026-08-31', '2026-08-30', '2026-08-29', '2026-08-28', '2026-08-27', '2026-08-26',
    '2026-08-25', '2026-08-24', '2026-08-23', '2026-08-22', '2026-08-21', '2026-08-20',
  ];

  // 1. Fellow Records
  dates.forEach((date, dIdx) => {
    FELLOW_PROFILES.forEach((f, fIdx) => {
      // Create varied realistic statuses
      const hash = (dIdx * 7 + fIdx * 13) % 20;
      let status: AttendanceRecord['status'] = 'present';
      let markedAt = `09:${String(10 + (hash % 35)).padStart(2, '0')} AM`;
      if (hash === 3) {
        status = 'on_leave';
        markedAt = '—';
      } else if (hash === 7) {
        status = 'half_day';
        markedAt = '09:20 AM (Half Day)';
      } else if (hash === 11) {
        status = 'absent';
        markedAt = '—';
      }

      records.push({
        id: `att-flw-${f.id}-${date}`,
        userId: f.id,
        userName: f.name,
        role: 'fellow',
        date,
        markedAt,
        latitude: 23.2599 + (fIdx * 0.05),
        longitude: 77.4126 + (fIdx * 0.05),
        status,
        district: f.district,
        locationAddress: f.location,
      });
    });
  });

  // 2. Intern Records
  dates.forEach((date, dIdx) => {
    INTERN_PROFILES.forEach((int, iIdx) => {
      const hash = (dIdx * 11 + iIdx * 17) % 20;
      let status: AttendanceRecord['status'] = 'present';
      let markedAt = `09:${String(5 + (hash % 40)).padStart(2, '0')} AM`;
      if (hash === 2 || hash === 14) {
        status = 'absent';
        markedAt = '—';
      } else if (hash === 6) {
        status = 'on_leave';
        markedAt = '—';
      } else if (hash === 18) {
        status = 'half_day';
        markedAt = '09:45 AM (Half Day)';
      }

      records.push({
        id: `att-int-${int.id}-${date}`,
        userId: int.id,
        userName: int.name,
        role: 'intern',
        date,
        markedAt,
        latitude: 23.0123 + (iIdx * 0.02),
        longitude: 76.9876 + (iIdx * 0.02),
        status,
        district: int.district,
        block: int.block,
        panchayatName: int.panchayat,
        locationAddress: int.location,
      });
    });
  });

  return records;
}

export const MOCK_TEAM_ATTENDANCE: AttendanceRecord[] = generateTeamAttendanceRecords();

function makeSelfAttendanceRecord(day: number, present: boolean): AttendanceRecord {
  const date = `2026-08-${String(day).padStart(2, '0')}`;
  return {
    id: `att-self-${day}`,
    userId: 'u-pc-01',
    userName: 'Anjali Singh Verma',
    role: 'pc',
    date,
    markedAt: present ? '09:12 AM' : '—',
    latitude: 23.2599,
    longitude: 77.4126,
    status: present ? 'present' : 'absent',
    district: { id: 'dst-02', name: 'Bhopal' },
    locationAddress: 'Bhopal Division HQ, Arera Hills, Bhopal',
  };
}

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  ...Array.from({ length: 31 }, (_, i) => makeSelfAttendanceRecord(i + 1, [6, 7, 13, 14, 20, 21, 27, 28].indexOf(i + 1) === -1)),
];

export const MOCK_PAGINATED_ATTENDANCE = {
  items: MOCK_TEAM_ATTENDANCE,
  total: MOCK_TEAM_ATTENDANCE.length,
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
    submissionStatus: 'submitted_by_pc',
    createdBy: me,
    isAllocatedAsTask: true,
    createdAt: '2026-08-01T00:00:00Z',
    feedbacks: [
      {
        id: 'fb-01',
        surveyId: 'survey-01',
        submittedBy: intern1,
        role: 'intern',
        submittedToRole: 'fellow',
        feedbackText: 'High participation from self-help group members. Many households requested dedicated training on poultry farming and tailoring.',
        challengesFaced: 'Network connectivity was weak in 3 remote gram panchayats.',
        recommendations: 'Provide offline sync capability and distribute regional flyers.',
        stakeholdersInterviewedCount: 45,
        createdAt: '2026-08-25T14:30:00Z',
      },
      {
        id: 'fb-02',
        surveyId: 'survey-01',
        submittedBy: fellow1,
        role: 'fellow',
        submittedToRole: 'pc',
        feedbackText: 'Reviewed field responses across Ujjain district. Data quality is verified. Interns showed strong community engagement.',
        challengesFaced: 'Heavy monsoon rains delayed visits to 2 panchayats.',
        recommendations: 'Recommend coordinating with Block Development Officer for SHG linkage.',
        stakeholdersInterviewedCount: 88,
        createdAt: '2026-08-28T16:00:00Z',
      },
      {
        id: 'fb-03',
        surveyId: 'survey-01',
        submittedBy: me,
        role: 'pc',
        submittedToRole: 'spm_cpm',
        feedbackText: 'Divisional compilation complete with 112 verified responses. Key livelihood trends highlighted for policy team review.',
        challengesFaced: 'None at divisional level; cross-verified with district data.',
        recommendations: 'Fast-track scheme allocation for SHG enterprise loans in Q4.',
        stakeholdersInterviewedCount: 112,
        createdAt: '2026-09-02T11:00:00Z',
      },
    ],
    questions: [
      { id: 'q1', type: 'single_choice', question: 'What is the primary source of household income?', options: ['Agriculture', 'Daily Wage Labor', 'Small Business / Shop', 'Government / Private Job'], required: true, allowImage: true },
      { id: 'q2', type: 'likert_scale', question: 'How satisfied is the community with current road connectivity?', likertConfig: { points: 5, lowLabel: 'Very Dissatisfied', highLabel: 'Very Satisfied', midLabel: 'Neutral' }, required: true },
      { id: 'q3', type: 'dichotomous', question: 'Does the household have access to piped drinking water?', dichotomousLabels: ['Yes', 'No'], required: true, allowImage: true },
      { id: 'q4', type: 'multiple_choice', question: 'Which welfare schemes does the household benefit from?', options: ['PM Kisan', 'Ladli Behna Yojana', 'Ayushman Bharat', 'Ration (PDS)', 'None'], required: true },
      { id: 'q5', type: 'descriptive', question: 'What are the main development challenges reported by the village head?', placeholder: 'Enter key observations, grievances, or community suggestions…', required: false, allowVoice: true, allowVideo: true },
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
    submissionStatus: 'submitted_by_fellow',
    createdBy: me,
    isAllocatedAsTask: true,
    createdAt: '2026-08-15T00:00:00Z',
    feedbacks: [
      {
        id: 'fb-04',
        surveyId: 'survey-02',
        submittedBy: intern2,
        role: 'intern',
        submittedToRole: 'fellow',
        feedbackText: 'Interviewed 84 youth across 6 colleges and youth clubs. High appetite for coding and digital marketing training.',
        challengesFaced: 'Access to computer labs was limited in 2 colleges.',
        recommendations: 'Establish mobile digital literacy vans.',
        stakeholdersInterviewedCount: 84,
        createdAt: '2026-09-01T15:00:00Z',
      },
      {
        id: 'fb-05',
        surveyId: 'survey-02',
        submittedBy: fellow1,
        role: 'fellow',
        submittedToRole: 'pc',
        feedbackText: 'Validated youth responses. 72% expressed interest in state government digital certificate courses.',
        challengesFaced: 'Need coordination with Technical Education department.',
        recommendations: 'Align curriculum with MP Rozgar portal requirements.',
        stakeholdersInterviewedCount: 84,
        createdAt: '2026-09-03T17:30:00Z',
      },
    ],
    questions: [
      { id: 'q1', type: 'dichotomous', question: 'Does the candidate have personal access to a smartphone or computer?', dichotomousLabels: ['Yes', 'No'], required: true, allowImage: true },
      { id: 'q2', type: 'multiple_choice', question: 'Which digital skills are you interested in learning?', options: ['Basic Computer Operations', 'Digital Payments & Banking', 'Graphic Design & Media', 'Online Government Services (MP e-District)', 'Coding & Programming'], required: true },
      { id: 'q3', type: 'likert_scale', question: 'How confident are you in using digital payment apps (UPI, DBT)?', likertConfig: { points: 5, lowLabel: 'Not Confident', highLabel: 'Extremely Confident', midLabel: 'Moderate' }, required: true },
      { id: 'q4', type: 'descriptive', question: 'Describe your educational background and career aspiration.', placeholder: 'Write a brief description…', required: true, allowVoice: true },
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
    submissionStatus: 'draft',
    createdBy: fellow1,
    isAllocatedAsTask: true,
    createdAt: '2026-09-01T00:00:00Z',
    feedbacks: [],
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
  {
    id: 'meet-04', title: 'District Field Sync & Debrief',
    scheduledAt: '2026-09-06T15:30:00Z', duration: 45,
    organizer: me, invitees: [intern1, fellow1],
    agenda: 'Check-in on ongoing block health survey and stakeholder interviews.',
    zoomJoinUrl: 'https://zoom.us/j/demo-sync-meeting',
    createdAt: '2026-09-03T00:00:00Z',
  },
  {
    id: 'meet-05', title: 'Block Health Survey Protocol Review',
    scheduledAt: '2026-09-08T11:00:00Z', duration: 60,
    organizer: me, invitees: [intern1],
    agenda: 'Guidance on PHC assessment forms, digital validation, and media notes.',
    zoomJoinUrl: 'https://zoom.us/j/demo-survey-protocol',
    createdAt: '2026-09-04T00:00:00Z',
  },
];

export const MOCK_PAGINATED_MEETINGS = {
  items: MOCK_MEETINGS,
  total: MOCK_MEETINGS.length,
  page: 1,
  limit: 20,
};

// ─── Complaints ───────────────────────────────────────────────────────────────

export const MOCK_COMPLAINTS: Complaint[] = [
  // ── Intern -> Fellow ──
  {
    id: 'cmp-01',
    ticketNumber: 'CMP-2026-0101',
    applicantId: 'u-intern-01',
    applicantName: 'Priya Patel',
    applicantRole: 'intern',
    assignedLocation: 'Ujjain Urban (Ujjain)',
    category: 'field_travel',
    priority: 'high',
    subject: 'Delay in reimbursement of village travel allowance',
    description: 'Field visits conducted across 4 remote Gram Panchayats between 18-22 August. Travel expense bills submitted with original fuel receipts, awaiting approval.',
    incidentDate: '2026-08-22',
    documentName: 'Travel_Expense_Vouchers.pdf',
    voiceNoteUrl: '#voice-note',
    voiceNoteName: 'Travel_Clarification.m4a',
    voiceNoteDuration: 14,
    status: 'pending',
    appliedAt: '2026-09-02T10:30:00Z',
    targetRole: 'fellow',
  },
  {
    id: 'cmp-02',
    ticketNumber: 'CMP-2026-0102',
    applicantId: 'u-intern-02',
    applicantName: 'Rohit Yadav',
    applicantRole: 'intern',
    assignedLocation: 'Indore Block A (Indore)',
    category: 'infrastructure',
    priority: 'urgent',
    subject: 'Mobile survey portal crashing during offline sync',
    description: 'Survey app version 2.1 fails to sync cached household survey responses when reconnected to mobile network. Data loss risk is high.',
    incidentDate: '2026-09-01',
    documentName: 'App_Crash_Screenshot.png',
    status: 'resolved',
    appliedAt: '2026-09-01T09:00:00Z',
    targetRole: 'fellow',
    reviewedBy: 'Vikram Singh',
    reviewerRole: 'fellow',
    reviewerComment: 'Technical patch applied; cache reset instructions shared. Verified that offline sync is functioning normally.',
    reviewedAt: '2026-09-02T16:00:00Z',
  },
  {
    id: 'cmp-03',
    ticketNumber: 'CMP-2026-0103',
    applicantId: 'u-intern-03',
    applicantName: 'Divya Sharma',
    applicantRole: 'intern',
    assignedLocation: 'Sanwer Block (Indore)',
    category: 'workload_tasks',
    priority: 'medium',
    subject: 'Overlapping survey schedule with university semester exams',
    description: 'Final semester practical exams scheduled between Sept 10 and Sept 14. Requesting temporary re-allocation of PHC physical verification duties.',
    incidentDate: '2026-09-03',
    documentName: 'Exam_Schedule_Affidavit.pdf',
    status: 'pending',
    appliedAt: '2026-09-03T11:45:00Z',
    targetRole: 'fellow',
  },
  {
    id: 'cmp-04',
    ticketNumber: 'CMP-2026-0104',
    applicantId: 'u-intern-04',
    applicantName: 'Karan Malhotra',
    applicantRole: 'intern',
    assignedLocation: 'Depalpur Block (Indore)',
    category: 'stipend',
    priority: 'medium',
    subject: 'Discrepancy in attendance days vs August stipend credit',
    description: 'Three field survey days in August were recorded as unpaid leaves on the portal, reducing the disbursed stipend.',
    incidentDate: '2026-08-31',
    status: 'rejected',
    appliedAt: '2026-08-31T14:20:00Z',
    targetRole: 'fellow',
    reviewedBy: 'Vikram Singh',
    reviewerRole: 'fellow',
    reviewerComment: 'Geo-fence logs indicate check-ins were outside designated block boundaries without prior BDO permission.',
    reviewedAt: '2026-09-01T11:30:00Z',
  },

  // ── Fellow -> PC ──
  {
    id: 'cmp-05',
    ticketNumber: 'CMP-2026-0201',
    applicantId: 'u-fellow-01',
    applicantName: 'Vikram Singh',
    applicantRole: 'fellow',
    assignedLocation: 'Indore District',
    category: 'infrastructure',
    priority: 'urgent',
    subject: 'SIM cards connectivity failure in 3 remote panchayats',
    description: 'The BSNL SIM cards provided for biometric devices have zero signal reception in Depalpur and interior Mhow villages. Requesting porting or replacement with Jio/Airtel.',
    incidentDate: '2026-09-01',
    documentName: 'Signal_Strength_Log.pdf',
    voiceNoteUrl: '#voice-note',
    voiceNoteName: 'Depalpur_Signal_VoiceNote.m4a',
    voiceNoteDuration: 22,
    status: 'pending',
    appliedAt: '2026-09-02T12:00:00Z',
    targetRole: 'pc',
  },
  {
    id: 'cmp-06',
    ticketNumber: 'CMP-2026-0202',
    applicantId: 'u-fellow-02',
    applicantName: 'Kavita Patel',
    applicantRole: 'fellow',
    assignedLocation: 'Bhopal District',
    category: 'field_travel',
    priority: 'high',
    subject: 'Zila Panchayat meeting hall access denial for orientation workshop',
    description: 'District nodal officer declined access to Hall 2 for the scheduled intern training batch citing internal departmental meetings without prior notification.',
    incidentDate: '2026-09-02',
    videoNoteUrl: '#video-clip',
    videoNoteName: 'Hall_Access_Video.mp4',
    status: 'resolved',
    appliedAt: '2026-09-02T15:00:00Z',
    targetRole: 'pc',
    reviewedBy: 'Anjali Verma',
    reviewerRole: 'pc',
    reviewerComment: 'Liaised with CEO Zila Panchayat; alternate Collectorate Auditorium has been booked and keys handed over for training.',
    reviewedAt: '2026-09-03T14:20:00Z',
  },
  {
    id: 'cmp-07',
    ticketNumber: 'CMP-2026-0203',
    applicantId: 'u-fellow-03',
    applicantName: 'Anita Deshmukh',
    applicantRole: 'fellow',
    assignedLocation: 'Ujjain District',
    category: 'workload_tasks',
    priority: 'medium',
    subject: 'Urgent intern reassignment needed for pending block health surveys',
    description: 'Two interns have exited the program early; current remaining field strength is insufficient to complete the required 150 household interviews by month end.',
    incidentDate: '2026-09-04',
    status: 'pending',
    appliedAt: '2026-09-04T10:15:00Z',
    targetRole: 'pc',
  },

  // ── PC -> SPM/CPM ──
  {
    id: 'cmp-08',
    ticketNumber: 'CMP-2026-0301',
    applicantId: 'u-pc-01',
    applicantName: 'Anjali Verma',
    applicantRole: 'pc',
    assignedLocation: 'Bhopal Division',
    category: 'stipend',
    priority: 'urgent',
    subject: 'Quarterly field allowance disbursement pending from State Treasury',
    description: 'Divisional accounts branch has not received sanction clearance for August field allowances for 18 district fellows. Requires PMU intervention with finance department.',
    incidentDate: '2026-09-01',
    documentName: 'Treasury_Pending_Token_List.pdf',
    status: 'pending',
    appliedAt: '2026-09-02T11:00:00Z',
    targetRole: 'spm_cpm',
  },
  {
    id: 'cmp-09',
    ticketNumber: 'CMP-2026-0302',
    applicantId: 'u-pc-02',
    applicantName: 'Suresh Tiwari',
    applicantRole: 'pc',
    assignedLocation: 'Indore Division',
    category: 'infrastructure',
    priority: 'high',
    subject: 'Tablets allocation pending for newly onboarded fellows in tribal blocks',
    description: '12 newly recruited fellows in Dhar and Khargone blocks require GPS-enabled enterprise tablets for survey geo-tagging. Inventory request submitted 3 weeks ago.',
    incidentDate: '2026-08-28',
    status: 'pending',
    appliedAt: '2026-09-01T16:30:00Z',
    targetRole: 'spm_cpm',
  },
  {
    id: 'cmp-10',
    ticketNumber: 'CMP-2026-0303',
    applicantId: 'u-pc-03',
    applicantName: 'Amit Saxena',
    applicantRole: 'pc',
    assignedLocation: 'Gwalior Division',
    category: 'field_travel',
    priority: 'medium',
    subject: 'Inter-district transport reimbursement rate revision request',
    description: 'Public bus and diesel tariff in northern districts increased by 14%. Requesting PMU approval to apply revised per-km travel allowance formula.',
    incidentDate: '2026-08-25',
    status: 'resolved',
    appliedAt: '2026-08-26T09:30:00Z',
    targetRole: 'spm_cpm',
    reviewedBy: 'Dr. Rajesh Verma',
    reviewerRole: 'spm_cpm',
    reviewerComment: 'Approved in State PMU Finance Committee meeting. Circular No. 442/CMYP/2026 released with new reimbursement ceilings.',
    reviewedAt: '2026-08-29T10:00:00Z',
  },
];

export const MOCK_PAGINATED_COMPLAINTS = {
  items: MOCK_COMPLAINTS,
  total: MOCK_COMPLAINTS.length,
  page: 1,
  limit: 20,
};

