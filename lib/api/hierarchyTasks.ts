import type { TaskStatus } from '@/types/models';

export interface InternTaskItem {
  internId: string;
  internName: string;
  internEmail: string;
  internPhone: string;
  avatarUrl?: string;
  blockId: string;
  blockName: string;
  districtId: string;
  districtName: string;
  divisionId: string;
  panchayatName: string;
  villageName: string;
  taskId: string;
  taskName: string;
  isSurveyTask: boolean;
  surveyTitle?: string;
  assignedBy: string;
  assignedDate: string;
  dueDate: string;
  status: TaskStatus;
  submissionsCount: number;
  targetSubmissions: number;
  lastActiveDate: string;
}

export interface BlockProgress {
  blockId: string;
  blockName: string;
  districtId: string;
  districtName: string;
  divisionId: string;
  interns: InternTaskItem[];
  totalInterns: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface DistrictProgress {
  districtId: string;
  districtName: string;
  divisionId: string;
  divisionName: string;
  fellowName: string;
  fellowEmail: string;
  fellowPhone: string;
  blocks: BlockProgress[];
  totalInterns: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface DivisionProgress {
  divisionId: string;
  divisionName: string;
  pcName: string;
  districts: DistrictProgress[];
  totalDistricts: number;
  totalBlocks: number;
  totalInterns: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

// ── Raw Mock Data Generator for MP Divisions ─────────────────────────────────

export const MOCK_DIVISION_TASKS: Record<string, DivisionProgress> = {
  'div-01': {
    divisionId: 'div-01',
    divisionName: 'Bhopal Division',
    pcName: 'Anjali Singh Verma',
    totalDistricts: 5,
    totalBlocks: 19,
    totalInterns: 94,
    completedTasks: 67,
    inProgressTasks: 18,
    pendingTasks: 4,
    overdueTasks: 5,
    completionRate: 71,
    districts: [
      {
        districtId: 'dst-sehore',
        districtName: 'Sehore',
        divisionId: 'div-01',
        divisionName: 'Bhopal Division',
        fellowName: 'Vikramaditya Singh',
        fellowEmail: 'fellow.sehore@cmyp.mp.gov.in',
        fellowPhone: '+91 98260 11223',
        totalInterns: 26,
        completedTasks: 18,
        inProgressTasks: 6,
        pendingTasks: 1,
        overdueTasks: 1,
        completionRate: 69,
        blocks: [
          {
            blockId: 'blk-seh-01',
            blockName: 'Ashta',
            districtId: 'dst-sehore',
            districtName: 'Sehore',
            divisionId: 'div-01',
            totalInterns: 6,
            completedTasks: 5,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 83,
            interns: [
              {
                internId: 'int-seh-01', internName: 'Aakash Verma', internEmail: 'aakash.v@cmyp.mp.gov.in', internPhone: '+91 98931 00101',
                blockId: 'blk-seh-01', blockName: 'Ashta', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Kothri', villageName: 'Kothri Kalan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:20 PM'
              },
              {
                internId: 'int-seh-02', internName: 'Pooja Malviya', internEmail: 'pooja.m@cmyp.mp.gov.in', internPhone: '+91 98931 00102',
                blockId: 'blk-seh-01', blockName: 'Ashta', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Mungawali', villageName: 'Mungawali Khurd', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 11:30 AM'
              },
              {
                internId: 'int-seh-03', internName: 'Rohit Mewada', internEmail: 'rohit.m@cmyp.mp.gov.in', internPhone: '+91 98931 00103',
                blockId: 'blk-seh-01', blockName: 'Ashta', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Jawar', villageName: 'Jawar', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 3:15 PM'
              },
              {
                internId: 'int-seh-04', internName: 'Sanjay Parmar', internEmail: 'sanjay.p@cmyp.mp.gov.in', internPhone: '+91 98931 00104',
                blockId: 'blk-seh-01', blockName: 'Ashta', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Metwada', villageName: 'Metwada', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 9, targetSubmissions: 15, lastActiveDate: 'Today, 2:45 PM'
              },
              {
                internId: 'int-seh-05', internName: 'Deepika Rathore', internEmail: 'deepika.r@cmyp.mp.gov.in', internPhone: '+91 98931 00105',
                blockId: 'blk-seh-01', blockName: 'Ashta', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Khajuria', villageName: 'Khajuria Kalan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 5:00 PM'
              },
              {
                internId: 'int-seh-06', internName: 'Manoj Thakur', internEmail: 'manoj.t@cmyp.mp.gov.in', internPhone: '+91 98931 00106',
                blockId: 'blk-seh-01', blockName: 'Ashta', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Kannod Road', villageName: 'Bhanpura', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 1, 1:10 PM'
              },
            ]
          },
          {
            blockId: 'blk-seh-02',
            blockName: 'Budhni',
            districtId: 'dst-sehore',
            districtName: 'Sehore',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 2,
            inProgressTasks: 2,
            pendingTasks: 0,
            overdueTasks: 1,
            completionRate: 40,
            interns: [
              {
                internId: 'int-seh-07', internName: 'Kunal Sharma', internEmail: 'kunal.s@cmyp.mp.gov.in', internPhone: '+91 98931 00107',
                blockId: 'blk-seh-02', blockName: 'Budhni', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Shahganj', villageName: 'Shahganj Ward 4', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-02', status: 'overdue', submissionsCount: 4, targetSubmissions: 15, lastActiveDate: '3 days ago'
              },
              {
                internId: 'int-seh-08', internName: 'Preeti Chouhan', internEmail: 'preeti.c@cmyp.mp.gov.in', internPhone: '+91 98931 00108',
                blockId: 'blk-seh-02', blockName: 'Budhni', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Baktara', villageName: 'Baktara', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:15 AM'
              },
              {
                internId: 'int-seh-09', internName: 'Nitin Solanki', internEmail: 'nitin.s@cmyp.mp.gov.in', internPhone: '+91 98931 00109',
                blockId: 'blk-seh-02', blockName: 'Budhni', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Joshipur', villageName: 'Joshipur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 8, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:00 PM'
              },
              {
                internId: 'int-seh-10', internName: 'Monika Yadav', internEmail: 'monika.y@cmyp.mp.gov.in', internPhone: '+91 98931 00110',
                blockId: 'blk-seh-02', blockName: 'Budhni', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Midghat', villageName: 'Midghat', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 6, targetSubmissions: 15, lastActiveDate: 'Yesterday, 11:00 AM'
              },
              {
                internId: 'int-seh-11', internName: 'Tarun Saxena', internEmail: 'tarun.s@cmyp.mp.gov.in', internPhone: '+91 98931 00111',
                blockId: 'blk-seh-02', blockName: 'Budhni', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Barkhedi', villageName: 'Barkhedi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 2:30 PM'
              },
            ]
          },
          {
            blockId: 'blk-seh-03',
            blockName: 'Ichhawar',
            districtId: 'dst-sehore',
            districtName: 'Sehore',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-seh-12', internName: 'Divya Gour', internEmail: 'divya.g@cmyp.mp.gov.in', internPhone: '+91 98931 00112',
                blockId: 'blk-seh-03', blockName: 'Ichhawar', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Diwadia', villageName: 'Diwadia', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 1:15 PM'
              },
              {
                internId: 'int-seh-13', internName: 'Gaurav Sen', internEmail: 'gaurav.s@cmyp.mp.gov.in', internPhone: '+91 98931 00113',
                blockId: 'blk-seh-03', blockName: 'Ichhawar', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Brijisnagar', villageName: 'Brijisnagar', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 4:00 PM'
              },
              {
                internId: 'int-seh-14', internName: 'Aarti Rajput', internEmail: 'aarti.r@cmyp.mp.gov.in', internPhone: '+91 98931 00114',
                blockId: 'blk-seh-03', blockName: 'Ichhawar', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Ghanakhedi', villageName: 'Ghanakhedi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 10:20 AM'
              },
              {
                internId: 'int-seh-15', internName: 'Vinod Meena', internEmail: 'vinod.m@cmyp.mp.gov.in', internPhone: '+91 98931 00115',
                blockId: 'blk-seh-03', blockName: 'Ichhawar', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Nipania', villageName: 'Nipania Kalan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 11, targetSubmissions: 15, lastActiveDate: 'Today, 12:00 PM'
              },
              {
                internId: 'int-seh-16', internName: 'Megha Joshi', internEmail: 'megha.j@cmyp.mp.gov.in', internPhone: '+91 98931 00116',
                blockId: 'blk-seh-03', blockName: 'Ichhawar', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Arya', villageName: 'Arya', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 5:30 PM'
              },
            ]
          },
          {
            blockId: 'blk-seh-04',
            blockName: 'Sehore Rural',
            districtId: 'dst-sehore',
            districtName: 'Sehore',
            divisionId: 'div-01',
            totalInterns: 6,
            completedTasks: 5,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 83,
            interns: [
              {
                internId: 'int-seh-17', internName: 'Harish Lodhi', internEmail: 'harish.l@cmyp.mp.gov.in', internPhone: '+91 98931 00117',
                blockId: 'blk-seh-04', blockName: 'Sehore Rural', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Bijori', villageName: 'Bijori', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 9:30 AM'
              },
              {
                internId: 'int-seh-18', internName: 'Rani Kushwah', internEmail: 'rani.k@cmyp.mp.gov.in', internPhone: '+91 98931 00118',
                blockId: 'blk-seh-04', blockName: 'Sehore Rural', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Shampur', villageName: 'Shampur Ward 2', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:10 PM'
              },
              {
                internId: 'int-seh-19', internName: 'Praveen Chourasia', internEmail: 'praveen.c@cmyp.mp.gov.in', internPhone: '+91 98931 00119',
                blockId: 'blk-seh-04', blockName: 'Sehore Rural', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Dhamanda', villageName: 'Dhamanda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 12, targetSubmissions: 15, lastActiveDate: 'Today, 1:40 PM'
              },
              {
                internId: 'int-seh-20', internName: 'Kajal Vishwakarma', internEmail: 'kajal.v@cmyp.mp.gov.in', internPhone: '+91 98931 00120',
                blockId: 'blk-seh-04', blockName: 'Sehore Rural', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Bildi', villageName: 'Bildi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 11:20 AM'
              },
              {
                internId: 'int-seh-21', internName: 'Anil Dhakad', internEmail: 'anil.d@cmyp.mp.gov.in', internPhone: '+91 98931 00121',
                blockId: 'blk-seh-04', blockName: 'Sehore Rural', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Barkheda Hasan', villageName: 'Barkheda Hasan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 4:50 PM'
              },
              {
                internId: 'int-seh-22', internName: 'Shalini Baghel', internEmail: 'shalini.b@cmyp.mp.gov.in', internPhone: '+91 98931 00122',
                blockId: 'blk-seh-04', blockName: 'Sehore Rural', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Mograram', villageName: 'Mograram', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 1, 3:15 PM'
              },
            ]
          },
          {
            blockId: 'blk-seh-05',
            blockName: 'Nasrullaganj (Bherunda)',
            districtId: 'dst-sehore',
            districtName: 'Sehore',
            divisionId: 'div-01',
            totalInterns: 4,
            completedTasks: 2,
            inProgressTasks: 1,
            pendingTasks: 1,
            overdueTasks: 0,
            completionRate: 50,
            interns: [
              {
                internId: 'int-seh-23', internName: 'Vikas Kushwaha', internEmail: 'vikas.k@cmyp.mp.gov.in', internPhone: '+91 98931 00123',
                blockId: 'blk-seh-05', blockName: 'Nasrullaganj (Bherunda)', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Ladhwi', villageName: 'Ladhwi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:00 AM'
              },
              {
                internId: 'int-seh-24', internName: 'Nisha Ahirwar', internEmail: 'nisha.a@cmyp.mp.gov.in', internPhone: '+91 98931 00124',
                blockId: 'blk-seh-05', blockName: 'Nasrullaganj (Bherunda)', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Chhipaner', villageName: 'Chhipaner', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 2:30 PM'
              },
              {
                internId: 'int-seh-25', internName: 'Mohit Bairagi', internEmail: 'mohit.b@cmyp.mp.gov.in', internPhone: '+91 98931 00125',
                blockId: 'blk-seh-05', blockName: 'Nasrullaganj (Bherunda)', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Gillaur', villageName: 'Gillaur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 7, targetSubmissions: 15, lastActiveDate: 'Yesterday, 1:00 PM'
              },
              {
                internId: 'int-seh-26', internName: 'Swati Jain', internEmail: 'swati.j@cmyp.mp.gov.in', internPhone: '+91 98931 00126',
                blockId: 'blk-seh-05', blockName: 'Nasrullaganj (Bherunda)', districtId: 'dst-sehore', districtName: 'Sehore', divisionId: 'div-01',
                panchayatName: 'Rehti', villageName: 'Rehti Ward 1', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'pending', submissionsCount: 0, targetSubmissions: 15, lastActiveDate: '4 days ago'
              },
            ]
          },
        ]
      },
      {
        districtId: 'dst-bhopal',
        districtName: 'Bhopal',
        divisionId: 'div-01',
        divisionName: 'Bhopal Division',
        fellowName: 'Kavita Patel',
        fellowEmail: 'fellow.bhopal@cmyp.mp.gov.in',
        fellowPhone: '+91 98260 22334',
        totalInterns: 18,
        completedTasks: 14,
        inProgressTasks: 3,
        pendingTasks: 0,
        overdueTasks: 1,
        completionRate: 78,
        blocks: [
          {
            blockId: 'blk-bhp-01',
            blockName: 'Berasia',
            districtId: 'dst-bhopal',
            districtName: 'Bhopal',
            divisionId: 'div-01',
            totalInterns: 6,
            completedTasks: 4,
            inProgressTasks: 2,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 67,
            interns: [
              {
                internId: 'int-bhp-01', internName: 'Rahul Kushwah', internEmail: 'rahul.k@cmyp.mp.gov.in', internPhone: '+91 98932 00201',
                blockId: 'blk-bhp-01', blockName: 'Berasia', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Nazirabad', villageName: 'Nazirabad', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 11:00 AM'
              },
              {
                internId: 'int-bhp-02', internName: 'Rashmi Ahirwar', internEmail: 'rashmi.a@cmyp.mp.gov.in', internPhone: '+91 98932 00202',
                blockId: 'blk-bhp-01', blockName: 'Berasia', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Damila', villageName: 'Damila', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:30 PM'
              },
              {
                internId: 'int-bhp-03', internName: 'Hemant Soni', internEmail: 'hemant.s@cmyp.mp.gov.in', internPhone: '+91 98932 00203',
                blockId: 'blk-bhp-01', blockName: 'Berasia', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Gunga', villageName: 'Gunga', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 10, targetSubmissions: 15, lastActiveDate: 'Today, 2:15 PM'
              },
              {
                internId: 'int-bhp-04', internName: 'Varsha Lodhi', internEmail: 'varsha.l@cmyp.mp.gov.in', internPhone: '+91 98932 00204',
                blockId: 'blk-bhp-01', blockName: 'Berasia', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Runaha', villageName: 'Runaha', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 4:20 PM'
              },
              {
                internId: 'int-bhp-05', internName: 'Sourabh Saxena', internEmail: 'sourabh.s@cmyp.mp.gov.in', internPhone: '+91 98932 00205',
                blockId: 'blk-bhp-01', blockName: 'Berasia', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Lalariya', villageName: 'Lalariya', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 8, targetSubmissions: 15, lastActiveDate: 'Yesterday, 1:40 PM'
              },
              {
                internId: 'int-bhp-06', internName: 'Ritu Vishwakarma', internEmail: 'ritu.v@cmyp.mp.gov.in', internPhone: '+91 98932 00206',
                blockId: 'blk-bhp-01', blockName: 'Berasia', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Manpura', villageName: 'Manpura', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 10:00 AM'
              },
            ]
          },
          {
            blockId: 'blk-bhp-02',
            blockName: 'Phanda Rural',
            districtId: 'dst-bhopal',
            districtName: 'Bhopal',
            divisionId: 'div-01',
            totalInterns: 6,
            completedTasks: 5,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 83,
            interns: [
              {
                internId: 'int-bhp-07', internName: 'Naveen Chouhan', internEmail: 'naveen.c@cmyp.mp.gov.in', internPhone: '+91 98932 00207',
                blockId: 'blk-bhp-02', blockName: 'Phanda Rural', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Tumda', villageName: 'Tumda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:45 AM'
              },
              {
                internId: 'int-bhp-08', internName: 'Ankita Tiwari', internEmail: 'ankita.t@cmyp.mp.gov.in', internPhone: '+91 98932 00208',
                blockId: 'blk-bhp-02', blockName: 'Phanda Rural', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Ratibad', villageName: 'Ratibad', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 3:00 PM'
              },
              {
                internId: 'int-bhp-09', internName: 'Aditya Rajput', internEmail: 'aditya.r@cmyp.mp.gov.in', internPhone: '+91 98932 00209',
                blockId: 'blk-bhp-02', blockName: 'Phanda Rural', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Kolar Gram', villageName: 'Kolar Kalan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 11, targetSubmissions: 15, lastActiveDate: 'Today, 1:20 PM'
              },
              {
                internId: 'int-bhp-10', internName: 'Payal Sen', internEmail: 'payal.s@cmyp.mp.gov.in', internPhone: '+91 98932 00210',
                blockId: 'blk-bhp-02', blockName: 'Phanda Rural', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Bagroda', villageName: 'Bagroda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 5:10 PM'
              },
              {
                internId: 'int-bhp-11', internName: 'Chetan Mehra', internEmail: 'chetan.m@cmyp.mp.gov.in', internPhone: '+91 98932 00211',
                blockId: 'blk-bhp-02', blockName: 'Phanda Rural', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Khadampur', villageName: 'Khadampur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 1, 11:30 AM'
              },
              {
                internId: 'int-bhp-12', internName: 'Mamta Dhakad', internEmail: 'mamta.d@cmyp.mp.gov.in', internPhone: '+91 98932 00212',
                blockId: 'blk-bhp-02', blockName: 'Phanda Rural', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Barkheda Bondar', villageName: 'Barkheda Bondar', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-bhp-03',
            blockName: 'Phanda Urban',
            districtId: 'dst-bhopal',
            districtName: 'Bhopal',
            divisionId: 'div-01',
            totalInterns: 6,
            completedTasks: 5,
            inProgressTasks: 0,
            pendingTasks: 0,
            overdueTasks: 1,
            completionRate: 83,
            interns: [
              {
                internId: 'int-bhp-13', internName: 'Rohit Agrawal', internEmail: 'rohit.a@cmyp.mp.gov.in', internPhone: '+91 98932 00213',
                blockId: 'blk-bhp-03', blockName: 'Phanda Urban', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Govindpura Ward 58', villageName: 'Govindpura', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 12:40 PM'
              },
              {
                internId: 'int-bhp-14', internName: 'Shivani Jain', internEmail: 'shivani.j@cmyp.mp.gov.in', internPhone: '+91 98932 00214',
                blockId: 'blk-bhp-03', blockName: 'Phanda Urban', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Bairagarh Ward 03', villageName: 'Bairagarh', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-03', status: 'overdue', submissionsCount: 6, targetSubmissions: 15, lastActiveDate: '3 days ago'
              },
              {
                internId: 'int-bhp-15', internName: 'Aman Patel', internEmail: 'aman.p@cmyp.mp.gov.in', internPhone: '+91 98932 00215',
                blockId: 'blk-bhp-03', blockName: 'Phanda Urban', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Karond Ward 72', villageName: 'Karond', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 2:30 PM'
              },
              {
                internId: 'int-bhp-16', internName: 'Pooja Vishwakarma', internEmail: 'pooja.v@cmyp.mp.gov.in', internPhone: '+91 98932 00216',
                blockId: 'blk-bhp-03', blockName: 'Phanda Urban', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Kolar Urban Ward 82', villageName: 'Kolar', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 4:50 PM'
              },
              {
                internId: 'int-bhp-17', internName: 'Vivek Sharma', internEmail: 'vivek.s@cmyp.mp.gov.in', internPhone: '+91 98932 00217',
                blockId: 'blk-bhp-03', blockName: 'Phanda Urban', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Ayodhya Bypass Ward 64', villageName: 'Ayodhya Nagar', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 11:15 AM'
              },
              {
                internId: 'int-bhp-18', internName: 'Neha Rajput', internEmail: 'neha.r@cmyp.mp.gov.in', internPhone: '+91 98932 00218',
                blockId: 'blk-bhp-03', blockName: 'Phanda Urban', districtId: 'dst-bhopal', districtName: 'Bhopal', divisionId: 'div-01',
                panchayatName: 'Shahpura Ward 52', villageName: 'Shahpura', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 5:00 PM'
              },
            ]
          }
        ]
      },
      {
        districtId: 'dst-raisen',
        districtName: 'Raisen',
        divisionId: 'div-01',
        divisionName: 'Bhopal Division',
        fellowName: 'Amitesh Chouhan',
        fellowEmail: 'fellow.raisen@cmyp.mp.gov.in',
        fellowPhone: '+91 98260 33445',
        totalInterns: 18,
        completedTasks: 13,
        inProgressTasks: 3,
        pendingTasks: 1,
        overdueTasks: 1,
        completionRate: 72,
        blocks: [
          {
            blockId: 'blk-rsn-01',
            blockName: 'Sanchi',
            districtId: 'dst-raisen',
            districtName: 'Raisen',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 3,
            inProgressTasks: 2,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 60,
            interns: [
              {
                internId: 'int-rsn-01', internName: 'Dheeraj Gour', internEmail: 'dheeraj.g@cmyp.mp.gov.in', internPhone: '+91 98933 00301',
                blockId: 'blk-rsn-01', blockName: 'Sanchi', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Salamtpur', villageName: 'Salamtpur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 1:20 PM'
              },
              {
                internId: 'int-rsn-02', internName: 'Anita Malviya', internEmail: 'anita.m@cmyp.mp.gov.in', internPhone: '+91 98933 00302',
                blockId: 'blk-rsn-01', blockName: 'Sanchi', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Gulgaon', villageName: 'Gulgaon', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:00 PM'
              },
              {
                internId: 'int-rsn-03', internName: 'Kailash Meena', internEmail: 'kailash.m@cmyp.mp.gov.in', internPhone: '+91 98933 00303',
                blockId: 'blk-rsn-01', blockName: 'Sanchi', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Diwanganj', villageName: 'Diwanganj', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 4:40 PM'
              },
              {
                internId: 'int-rsn-04', internName: 'Pooja Kushwaha', internEmail: 'pooja.k2@cmyp.mp.gov.in', internPhone: '+91 98933 00304',
                blockId: 'blk-rsn-01', blockName: 'Sanchi', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Kharwai', villageName: 'Kharwai', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 9, targetSubmissions: 15, lastActiveDate: 'Today, 11:10 AM'
              },
              {
                internId: 'int-rsn-05', internName: 'Yogesh Sharma', internEmail: 'yogesh.s@cmyp.mp.gov.in', internPhone: '+91 98933 00305',
                blockId: 'blk-rsn-01', blockName: 'Sanchi', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Amrawad', villageName: 'Amrawad', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 7, targetSubmissions: 15, lastActiveDate: 'Yesterday, 2:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-rsn-02',
            blockName: 'Silwani',
            districtId: 'dst-raisen',
            districtName: 'Raisen',
            divisionId: 'div-01',
            totalInterns: 4,
            completedTasks: 2,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 1,
            completionRate: 50,
            interns: [
              {
                internId: 'int-rsn-06', internName: 'Babulal Lodhi', internEmail: 'babulal.l@cmyp.mp.gov.in', internPhone: '+91 98933 00306',
                blockId: 'blk-rsn-02', blockName: 'Silwani', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Bamhori', villageName: 'Bamhori Kalan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 2:00 PM'
              },
              {
                internId: 'int-rsn-07', internName: 'Kavita Dhakad', internEmail: 'kavita.d@cmyp.mp.gov.in', internPhone: '+91 98933 00307',
                blockId: 'blk-rsn-02', blockName: 'Silwani', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Kunda', villageName: 'Kunda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 11:30 AM'
              },
              {
                internId: 'int-rsn-08', internName: 'Sunil Ahirwar', internEmail: 'sunil.a@cmyp.mp.gov.in', internPhone: '+91 98933 00308',
                blockId: 'blk-rsn-02', blockName: 'Silwani', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Sultanpur', villageName: 'Sultanpur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-02', status: 'overdue', submissionsCount: 5, targetSubmissions: 15, lastActiveDate: '4 days ago'
              },
              {
                internId: 'int-rsn-09', internName: 'Madhu Rajput', internEmail: 'madhu.r@cmyp.mp.gov.in', internPhone: '+91 98933 00309',
                blockId: 'blk-rsn-02', blockName: 'Silwani', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Padariya', villageName: 'Padariya', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 8, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-rsn-03',
            blockName: 'Bareli',
            districtId: 'dst-raisen',
            districtName: 'Raisen',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 0,
            pendingTasks: 1,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-rsn-10', internName: 'Naveen Thakur', internEmail: 'naveen.t@cmyp.mp.gov.in', internPhone: '+91 98933 00310',
                blockId: 'blk-rsn-03', blockName: 'Bareli', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Aliganj', villageName: 'Aliganj', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:30 AM'
              },
              {
                internId: 'int-rsn-11', internName: 'Pooja Tiwari', internEmail: 'pooja.t2@cmyp.mp.gov.in', internPhone: '+91 98933 00311',
                blockId: 'blk-rsn-03', blockName: 'Bareli', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Bhagdehi', villageName: 'Bhagdehi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 1:15 PM'
              },
              {
                internId: 'int-rsn-12', internName: 'Girish Sen', internEmail: 'girish.s@cmyp.mp.gov.in', internPhone: '+91 98933 00312',
                blockId: 'blk-rsn-03', blockName: 'Bareli', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Badi', villageName: 'Badi Ward 2', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 5:10 PM'
              },
              {
                internId: 'int-rsn-13', internName: 'Sarita Parmar', internEmail: 'sarita.p@cmyp.mp.gov.in', internPhone: '+91 98933 00313',
                blockId: 'blk-rsn-03', blockName: 'Bareli', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Jamgarh', villageName: 'Jamgarh', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 11:45 AM'
              },
              {
                internId: 'int-rsn-14', internName: 'Kunal Sharma', internEmail: 'kunal.s2@cmyp.mp.gov.in', internPhone: '+91 98933 00314',
                blockId: 'blk-rsn-03', blockName: 'Bareli', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Piparia', villageName: 'Piparia', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'pending', submissionsCount: 0, targetSubmissions: 15, lastActiveDate: '3 days ago'
              },
            ]
          },
          {
            blockId: 'blk-rsn-04',
            blockName: 'Gairatganj',
            districtId: 'dst-raisen',
            districtName: 'Raisen',
            divisionId: 'div-01',
            totalInterns: 4,
            completedTasks: 4,
            inProgressTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 100,
            interns: [
              {
                internId: 'int-rsn-15', internName: 'Bharti Sahu', internEmail: 'bharti.s@cmyp.mp.gov.in', internPhone: '+91 98933 00315',
                blockId: 'blk-rsn-04', blockName: 'Gairatganj', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Gairatganj Ward 3', villageName: 'Gairatganj', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:20 AM'
              },
              {
                internId: 'int-rsn-16', internName: 'Nilesh Lodhi', internEmail: 'nilesh.l@cmyp.mp.gov.in', internPhone: '+91 98933 00316',
                blockId: 'blk-rsn-04', blockName: 'Gairatganj', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Mahuakheda', villageName: 'Mahuakheda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:10 PM'
              },
              {
                internId: 'int-rsn-17', internName: 'Roshni Malviya', internEmail: 'roshni.m@cmyp.mp.gov.in', internPhone: '+91 98933 00317',
                blockId: 'blk-rsn-04', blockName: 'Gairatganj', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Sewani', villageName: 'Sewani', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 12:00 PM'
              },
              {
                internId: 'int-rsn-18', internName: 'Ashok Patel', internEmail: 'ashok.p@cmyp.mp.gov.in', internPhone: '+91 98933 00318',
                blockId: 'blk-rsn-04', blockName: 'Gairatganj', districtId: 'dst-raisen', districtName: 'Raisen', divisionId: 'div-01',
                panchayatName: 'Gadhi', villageName: 'Gadhi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 2:40 PM'
              },
            ]
          }
        ]
      },
      {
        districtId: 'dst-rajgarh',
        districtName: 'Rajgarh',
        divisionId: 'div-01',
        divisionName: 'Bhopal Division',
        fellowName: 'Neha Malviya',
        fellowEmail: 'fellow.rajgarh@cmyp.mp.gov.in',
        fellowPhone: '+91 98260 44556',
        totalInterns: 14,
        completedTasks: 8,
        inProgressTasks: 3,
        pendingTasks: 1,
        overdueTasks: 2,
        completionRate: 57,
        blocks: [
          {
            blockId: 'blk-rjg-01',
            blockName: 'Biaora',
            districtId: 'dst-rajgarh',
            districtName: 'Rajgarh',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-rjg-01', internName: 'Deepak Sharma', internEmail: 'deepak.s2@cmyp.mp.gov.in', internPhone: '+91 98934 00401',
                blockId: 'blk-rjg-01', blockName: 'Biaora', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Karanwas', villageName: 'Karanwas', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 11:30 AM'
              },
              {
                internId: 'int-rjg-02', internName: 'Poonam Verma', internEmail: 'poonam.v@cmyp.mp.gov.in', internPhone: '+91 98934 00402',
                blockId: 'blk-rjg-01', blockName: 'Biaora', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Padalia', villageName: 'Padalia', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:45 PM'
              },
              {
                internId: 'int-rjg-03', internName: 'Amit Soni', internEmail: 'amit.s2@cmyp.mp.gov.in', internPhone: '+91 98934 00403',
                blockId: 'blk-rjg-01', blockName: 'Biaora', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Malawar', villageName: 'Malawar', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 4:00 PM'
              },
              {
                internId: 'int-rjg-04', internName: 'Kavita Kushwah', internEmail: 'kavita.k2@cmyp.mp.gov.in', internPhone: '+91 98934 00404',
                blockId: 'blk-rjg-01', blockName: 'Biaora', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Borkheda', villageName: 'Borkheda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 1, 1:20 PM'
              },
              {
                internId: 'int-rjg-05', internName: 'Rajesh Dangi', internEmail: 'rajesh.d@cmyp.mp.gov.in', internPhone: '+91 98934 00405',
                blockId: 'blk-rjg-01', blockName: 'Biaora', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Bhatkheda', villageName: 'Bhatkheda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 10, targetSubmissions: 15, lastActiveDate: 'Today, 12:15 PM'
              },
            ]
          },
          {
            blockId: 'blk-rjg-02',
            blockName: 'Narsinghgarh',
            districtId: 'dst-rajgarh',
            districtName: 'Rajgarh',
            divisionId: 'div-01',
            totalInterns: 4,
            completedTasks: 2,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 1,
            completionRate: 50,
            interns: [
              {
                internId: 'int-rjg-06', internName: 'Vandana Sen', internEmail: 'vandana.s@cmyp.mp.gov.in', internPhone: '+91 98934 00406',
                blockId: 'blk-rjg-02', blockName: 'Narsinghgarh', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Kotra', villageName: 'Kotra', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 2:30 PM'
              },
              {
                internId: 'int-rjg-07', internName: 'Sunil Yadav', internEmail: 'sunil.y2@cmyp.mp.gov.in', internPhone: '+91 98934 00407',
                blockId: 'blk-rjg-02', blockName: 'Narsinghgarh', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Boda Ward 4', villageName: 'Boda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 11:20 AM'
              },
              {
                internId: 'int-rjg-08', internName: 'Gaurav Parmar', internEmail: 'gaurav.p2@cmyp.mp.gov.in', internPhone: '+91 98934 00408',
                blockId: 'blk-rjg-02', blockName: 'Narsinghgarh', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Talen', villageName: 'Talen Ward 2', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-03', status: 'overdue', submissionsCount: 3, targetSubmissions: 15, lastActiveDate: '4 days ago'
              },
              {
                internId: 'int-rjg-09', internName: 'Archana Joshi', internEmail: 'archana.j@cmyp.mp.gov.in', internPhone: '+91 98934 00409',
                blockId: 'blk-rjg-02', blockName: 'Narsinghgarh', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Jamuniya', villageName: 'Jamuniya', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 9, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:45 PM'
              },
            ]
          },
          {
            blockId: 'blk-rjg-03',
            blockName: 'Khilchipur',
            districtId: 'dst-rajgarh',
            districtName: 'Rajgarh',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 2,
            inProgressTasks: 1,
            pendingTasks: 1,
            overdueTasks: 1,
            completionRate: 40,
            interns: [
              {
                internId: 'int-rjg-10', internName: 'Narendra Singh', internEmail: 'narendra.s@cmyp.mp.gov.in', internPhone: '+91 98934 00410',
                blockId: 'blk-rjg-03', blockName: 'Khilchipur', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Chhapiheda', villageName: 'Chhapiheda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 1:15 PM'
              },
              {
                internId: 'int-rjg-11', internName: 'Seema Dangi', internEmail: 'seema.d@cmyp.mp.gov.in', internPhone: '+91 98934 00411',
                blockId: 'blk-rjg-03', blockName: 'Khilchipur', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Pachore', villageName: 'Pachore Ward 5', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 3:30 PM'
              },
              {
                internId: 'int-rjg-12', internName: 'Ravi Meena', internEmail: 'ravi.m@cmyp.mp.gov.in', internPhone: '+91 98934 00412',
                blockId: 'blk-rjg-03', blockName: 'Khilchipur', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Machalpur', villageName: 'Machalpur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 6, targetSubmissions: 15, lastActiveDate: 'Yesterday, 12:00 PM'
              },
              {
                internId: 'int-rjg-13', internName: 'Komal Malviya', internEmail: 'komal.m@cmyp.mp.gov.in', internPhone: '+91 98934 00413',
                blockId: 'blk-rjg-03', blockName: 'Khilchipur', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Jirapur', villageName: 'Jirapur Ward 3', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'pending', submissionsCount: 0, targetSubmissions: 15, lastActiveDate: '5 days ago'
              },
              {
                internId: 'int-rjg-14', internName: 'Harshit Saxena', internEmail: 'harshit.s@cmyp.mp.gov.in', internPhone: '+91 98934 00414',
                blockId: 'blk-rjg-03', blockName: 'Khilchipur', districtId: 'dst-rajgarh', districtName: 'Rajgarh', divisionId: 'div-01',
                panchayatName: 'Bhojpur', villageName: 'Bhojpur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-01', status: 'overdue', submissionsCount: 4, targetSubmissions: 15, lastActiveDate: '3 days ago'
              },
            ]
          }
        ]
      },
      {
        districtId: 'dst-vidisha',
        districtName: 'Vidisha',
        divisionId: 'div-01',
        divisionName: 'Bhopal Division',
        fellowName: 'Rakesh Solanki',
        fellowEmail: 'fellow.vidisha@cmyp.mp.gov.in',
        fellowPhone: '+91 98260 55667',
        totalInterns: 18,
        completedTasks: 14,
        inProgressTasks: 3,
        pendingTasks: 1,
        overdueTasks: 0,
        completionRate: 78,
        blocks: [
          {
            blockId: 'blk-vid-01',
            blockName: 'Basoda',
            districtId: 'dst-vidisha',
            districtName: 'Vidisha',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-vid-01', internName: 'Anurag Sharma', internEmail: 'anurag.s@cmyp.mp.gov.in', internPhone: '+91 98935 00501',
                blockId: 'blk-vid-01', blockName: 'Basoda', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Tyonda', villageName: 'Tyonda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 2:10 PM'
              },
              {
                internId: 'int-vid-02', internName: 'Preeti Vishwakarma', internEmail: 'preeti.v@cmyp.mp.gov.in', internPhone: '+91 98935 00502',
                blockId: 'blk-vid-01', blockName: 'Basoda', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Ganj Basoda Ward 12', villageName: 'Basoda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:20 PM'
              },
              {
                internId: 'int-vid-03', internName: 'Hemant Kushwah', internEmail: 'hemant.k2@cmyp.mp.gov.in', internPhone: '+91 98935 00503',
                blockId: 'blk-vid-01', blockName: 'Basoda', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Udaypur', villageName: 'Udaypur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 11:40 AM'
              },
              {
                internId: 'int-vid-04', internName: 'Monika Lodhi', internEmail: 'monika.l@cmyp.mp.gov.in', internPhone: '+91 98935 00504',
                blockId: 'blk-vid-01', blockName: 'Basoda', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Bareth', villageName: 'Bareth', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 3:30 PM'
              },
              {
                internId: 'int-vid-05', internName: 'Dinesh Dangi', internEmail: 'dinesh.d@cmyp.mp.gov.in', internPhone: '+91 98935 00505',
                blockId: 'blk-vid-01', blockName: 'Basoda', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Karahaiya', villageName: 'Karahaiya', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 9, targetSubmissions: 15, lastActiveDate: 'Today, 1:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-vid-02',
            blockName: 'Kurwai',
            districtId: 'dst-vidisha',
            districtName: 'Vidisha',
            divisionId: 'div-01',
            totalInterns: 4,
            completedTasks: 3,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 75,
            interns: [
              {
                internId: 'int-vid-06', internName: 'Sanjay Ahirwar', internEmail: 'sanjay.a2@cmyp.mp.gov.in', internPhone: '+91 98935 00506',
                blockId: 'blk-vid-02', blockName: 'Kurwai', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Mandwamata', villageName: 'Mandwamata', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:15 AM'
              },
              {
                internId: 'int-vid-07', internName: 'Radha Meena', internEmail: 'radha.m@cmyp.mp.gov.in', internPhone: '+91 98935 00507',
                blockId: 'blk-vid-02', blockName: 'Kurwai', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Pathari', villageName: 'Pathari', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 2:50 PM'
              },
              {
                internId: 'int-vid-08', internName: 'Praveen Soni', internEmail: 'praveen.s2@cmyp.mp.gov.in', internPhone: '+91 98935 00508',
                blockId: 'blk-vid-02', blockName: 'Kurwai', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Bhelsa', villageName: 'Bhelsa', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 11:30 AM'
              },
              {
                internId: 'int-vid-09', internName: 'Shilpa Sen', internEmail: 'shilpa.s@cmyp.mp.gov.in', internPhone: '+91 98935 00509',
                blockId: 'blk-vid-02', blockName: 'Kurwai', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Siravada', villageName: 'Siravada', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 11, targetSubmissions: 15, lastActiveDate: 'Today, 3:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-vid-03',
            blockName: 'Sironj',
            districtId: 'dst-vidisha',
            districtName: 'Vidisha',
            divisionId: 'div-01',
            totalInterns: 4,
            completedTasks: 3,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 75,
            interns: [
              {
                internId: 'int-vid-10', internName: 'Girish Dangi', internEmail: 'girish.d@cmyp.mp.gov.in', internPhone: '+91 98935 00510',
                blockId: 'blk-vid-03', blockName: 'Sironj', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Deepnakheda', villageName: 'Deepnakheda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 9:50 AM'
              },
              {
                internId: 'int-vid-11', internName: 'Priyanka Lodhi', internEmail: 'priyanka.l2@cmyp.mp.gov.in', internPhone: '+91 98935 00511',
                blockId: 'blk-vid-03', blockName: 'Sironj', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Mughalsarai', villageName: 'Mughalsarai', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:30 PM'
              },
              {
                internId: 'int-vid-12', internName: 'Mukesh Sharma', internEmail: 'mukesh.s2@cmyp.mp.gov.in', internPhone: '+91 98935 00512',
                blockId: 'blk-vid-03', blockName: 'Sironj', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Ghoghra', villageName: 'Ghoghra', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 1:40 PM'
              },
              {
                internId: 'int-vid-13', internName: 'Aarti Rajput', internEmail: 'aarti.r2@cmyp.mp.gov.in', internPhone: '+91 98935 00513',
                blockId: 'blk-vid-03', blockName: 'Sironj', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Kakra', villageName: 'Kakra', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 12, targetSubmissions: 15, lastActiveDate: 'Today, 2:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-vid-04',
            blockName: 'Vidisha Rural',
            districtId: 'dst-vidisha',
            districtName: 'Vidisha',
            divisionId: 'div-01',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 0,
            pendingTasks: 1,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-vid-14', internName: 'Satish Mehra', internEmail: 'satish.m@cmyp.mp.gov.in', internPhone: '+91 98935 00514',
                blockId: 'blk-vid-04', blockName: 'Vidisha Rural', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Khamkheda', villageName: 'Khamkheda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 11:20 AM'
              },
              {
                internId: 'int-vid-15', internName: 'Bhavna Malviya', internEmail: 'bhavna.m@cmyp.mp.gov.in', internPhone: '+91 98935 00515',
                blockId: 'blk-vid-04', blockName: 'Vidisha Rural', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Gulabganj', villageName: 'Gulabganj', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:15 PM'
              },
              {
                internId: 'int-vid-16', internName: 'Deepak Parmar', internEmail: 'deepak.p2@cmyp.mp.gov.in', internPhone: '+91 98935 00516',
                blockId: 'blk-vid-04', blockName: 'Vidisha Rural', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Rangai', villageName: 'Rangai', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 4:00 PM'
              },
              {
                internId: 'int-vid-17', internName: 'Seema Kushwah', internEmail: 'seema.k2@cmyp.mp.gov.in', internPhone: '+91 98935 00517',
                blockId: 'blk-vid-04', blockName: 'Vidisha Rural', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Sunpura', villageName: 'Sunpura', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 1, 10:15 AM'
              },
              {
                internId: 'int-vid-18', internName: 'Nitin Lodhi', internEmail: 'nitin.l2@cmyp.mp.gov.in', internPhone: '+91 98935 00518',
                blockId: 'blk-vid-04', blockName: 'Vidisha Rural', districtId: 'dst-vidisha', districtName: 'Vidisha', divisionId: 'div-01',
                panchayatName: 'Mahaneem', villageName: 'Mahaneem', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'pending', submissionsCount: 0, targetSubmissions: 15, lastActiveDate: '4 days ago'
              },
            ]
          }
        ]
      }
    ]
  },

  // Fallback for Indore Division
  'div-02': {
    divisionId: 'div-02',
    divisionName: 'Indore Division',
    pcName: 'Suresh Tiwari',
    totalDistricts: 4,
    totalBlocks: 14,
    totalInterns: 68,
    completedTasks: 51,
    inProgressTasks: 12,
    pendingTasks: 3,
    overdueTasks: 2,
    completionRate: 75,
    districts: [
      {
        districtId: 'dst-01',
        districtName: 'Indore',
        divisionId: 'div-02',
        divisionName: 'Indore Division',
        fellowName: 'Vikram Singh',
        fellowEmail: 'fellow.indore@cmyp.mp.gov.in',
        fellowPhone: '+91 98260 99887',
        totalInterns: 16,
        completedTasks: 13,
        inProgressTasks: 2,
        pendingTasks: 0,
        overdueTasks: 1,
        completionRate: 81,
        blocks: [
          {
            blockId: 'blk-ind-01',
            blockName: 'Sanwer',
            districtId: 'dst-01',
            districtName: 'Indore',
            divisionId: 'div-02',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-ind-01', internName: 'Aayush Choudhary', internEmail: 'aayush.c@cmyp.mp.gov.in', internPhone: '+91 98939 00101',
                blockId: 'blk-ind-01', blockName: 'Sanwer', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Kshipra', villageName: 'Kshipra Kalan', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 11:15 AM'
              },
              {
                internId: 'int-ind-02', internName: 'Neha Patidar', internEmail: 'neha.p@cmyp.mp.gov.in', internPhone: '+91 98939 00102',
                blockId: 'blk-ind-01', blockName: 'Sanwer', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Ajnod', villageName: 'Ajnod', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:30 PM'
              },
              {
                internId: 'int-ind-03', internName: 'Manish Verma', internEmail: 'manish.v@cmyp.mp.gov.in', internPhone: '+91 98939 00103',
                blockId: 'blk-ind-01', blockName: 'Sanwer', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Panod', villageName: 'Panod', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 4:10 PM'
              },
              {
                internId: 'int-ind-04', internName: 'Pratibha Joshi', internEmail: 'pratibha.j@cmyp.mp.gov.in', internPhone: '+91 98939 00104',
                blockId: 'blk-ind-01', blockName: 'Sanwer', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Dharmat', villageName: 'Dharmat', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 1, 1:00 PM'
              },
              {
                internId: 'int-ind-05', internName: 'Anil Rathore', internEmail: 'anil.r@cmyp.mp.gov.in', internPhone: '+91 98939 00105',
                blockId: 'blk-ind-01', blockName: 'Sanwer', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Barlai', villageName: 'Barlai Jagir', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 11, targetSubmissions: 15, lastActiveDate: 'Today, 2:00 PM'
              },
            ]
          },
          {
            blockId: 'blk-ind-02',
            blockName: 'Depalpur',
            districtId: 'dst-01',
            districtName: 'Indore',
            divisionId: 'div-02',
            totalInterns: 5,
            completedTasks: 4,
            inProgressTasks: 1,
            pendingTasks: 0,
            overdueTasks: 0,
            completionRate: 80,
            interns: [
              {
                internId: 'int-ind-06', internName: 'Kavita Solanki', internEmail: 'kavita.s@cmyp.mp.gov.in', internPhone: '+91 98939 00106',
                blockId: 'blk-ind-02', blockName: 'Depalpur', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Betma', villageName: 'Betma Ward 2', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 10:40 AM'
              },
              {
                internId: 'int-ind-07', internName: 'Nitin Parmar', internEmail: 'nitin.p@cmyp.mp.gov.in', internPhone: '+91 98939 00107',
                blockId: 'blk-ind-02', blockName: 'Depalpur', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Gautampura', villageName: 'Gautampura', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 4:10 PM'
              },
              {
                internId: 'int-ind-08', internName: 'Roshni Malviya', internEmail: 'roshni.m2@cmyp.mp.gov.in', internPhone: '+91 98939 00108',
                blockId: 'blk-ind-02', blockName: 'Depalpur', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Chander', villageName: 'Chander', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 2:30 PM'
              },
              {
                internId: 'int-ind-09', internName: 'Rupesh Dhakad', internEmail: 'rupesh.d@cmyp.mp.gov.in', internPhone: '+91 98939 00109',
                blockId: 'blk-ind-02', blockName: 'Depalpur', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Athedi', villageName: 'Athedi', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 11:20 AM'
              },
              {
                internId: 'int-ind-10', internName: 'Taruna Sen', internEmail: 'taruna.s@cmyp.mp.gov.in', internPhone: '+91 98939 00110',
                blockId: 'blk-ind-02', blockName: 'Depalpur', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Machal', villageName: 'Machal', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'in_progress', submissionsCount: 8, targetSubmissions: 15, lastActiveDate: 'Today, 1:15 PM'
              },
            ]
          },
          {
            blockId: 'blk-ind-03',
            blockName: 'Mhow (Dr. Ambedkar Nagar)',
            districtId: 'dst-01',
            districtName: 'Indore',
            divisionId: 'div-02',
            totalInterns: 6,
            completedTasks: 5,
            inProgressTasks: 0,
            pendingTasks: 0,
            overdueTasks: 1,
            completionRate: 83,
            interns: [
              {
                internId: 'int-ind-11', internName: 'Abhishek Gour', internEmail: 'abhishek.g@cmyp.mp.gov.in', internPhone: '+91 98939 00111',
                blockId: 'blk-ind-03', blockName: 'Mhow (Dr. Ambedkar Nagar)', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Hasalpur', villageName: 'Hasalpur', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Today, 11:30 AM'
              },
              {
                internId: 'int-ind-12', internName: 'Shruti Jain', internEmail: 'shruti.j@cmyp.mp.gov.in', internPhone: '+91 98939 00112',
                blockId: 'blk-ind-03', blockName: 'Mhow (Dr. Ambedkar Nagar)', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Dhamnod Naka', villageName: 'Mhow Ward 1', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 3:00 PM'
              },
              {
                internId: 'int-ind-13', internName: 'Deepak Yadav', internEmail: 'deepak.y2@cmyp.mp.gov.in', internPhone: '+91 98939 00113',
                blockId: 'blk-ind-03', blockName: 'Mhow (Dr. Ambedkar Nagar)', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Choral', villageName: 'Choral', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-02', status: 'overdue', submissionsCount: 4, targetSubmissions: 15, lastActiveDate: '4 days ago'
              },
              {
                internId: 'int-ind-14', internName: 'Meena Thakur', internEmail: 'meena.t@cmyp.mp.gov.in', internPhone: '+91 98939 00114',
                blockId: 'blk-ind-03', blockName: 'Mhow (Dr. Ambedkar Nagar)', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Manpur', villageName: 'Manpur Ward 3', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 3, 4:10 PM'
              },
              {
                internId: 'int-ind-15', internName: 'Kunal Parmar', internEmail: 'kunal.p2@cmyp.mp.gov.in', internPhone: '+91 98939 00115',
                blockId: 'blk-ind-03', blockName: 'Mhow (Dr. Ambedkar Nagar)', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Badgonda', villageName: 'Badgonda', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Sep 2, 10:45 AM'
              },
              {
                internId: 'int-ind-16', internName: 'Priyanka Sharma', internEmail: 'priyanka.s2@cmyp.mp.gov.in', internPhone: '+91 98939 00116',
                blockId: 'blk-ind-03', blockName: 'Mhow (Dr. Ambedkar Nagar)', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02',
                panchayatName: 'Gawli Palasia', villageName: 'Gawli Palasia', taskId: 'task-surv-01', taskName: 'Block Livelihood Survey — Q3 2026',
                isSurveyTask: true, surveyTitle: 'Block Livelihood Survey — Q3 2026', assignedBy: 'State Admin', assignedDate: '2026-08-20',
                dueDate: '2026-09-15', status: 'completed', submissionsCount: 15, targetSubmissions: 15, lastActiveDate: 'Yesterday, 1:20 PM'
              },
            ]
          }
        ]
      }
    ]
  }
};

/**
 * Helper to fetch division progress for PC
 */
export function getDivisionTaskProgress(divisionId?: string): DivisionProgress {
  if (divisionId && MOCK_DIVISION_TASKS[divisionId]) {
    return MOCK_DIVISION_TASKS[divisionId];
  }
  // default to Bhopal Division
  return MOCK_DIVISION_TASKS['div-01'];
}

/**
 * Helper to fetch district progress for Fellow
 */
export function getDistrictTaskProgress(districtId?: string, districtName?: string): DistrictProgress {
  // Search across all divisions for matching district
  for (const divKey of Object.keys(MOCK_DIVISION_TASKS)) {
    const div = MOCK_DIVISION_TASKS[divKey];
    if (districtId) {
      const found = div.districts.find(d => d.districtId === districtId);
      if (found) return found;
    }
    if (districtName) {
      const found = div.districts.find(d => d.districtName.toLowerCase() === districtName.toLowerCase());
      if (found) return found;
    }
  }

  // Default to Sehore District in Bhopal Division
  return MOCK_DIVISION_TASKS['div-01'].districts[0];
}
