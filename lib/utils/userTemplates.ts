/**
 * Column definitions + Excel template generation/parsing for bulk user onboarding.
 * Single source of truth shared by the template download, the file parser, and row validation
 * so the three never drift out of sync.
 */
import ExcelJS from 'exceljs';
import type { Gender, Qualification, Category } from '@/types/models';
import { downloadBlob } from './formatters';

export type BulkUserRole = 'pc' | 'fellow' | 'intern';

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'obc', label: 'OBC' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'other', label: 'Other' },
];

export const QUALIFICATION_OPTIONS: { value: Qualification; label: string }[] = [
  { value: '10th', label: '10th Pass' },
  { value: '12th', label: '12th Pass' },
  { value: 'iti_diploma', label: 'ITI / Diploma' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'post_graduate', label: 'Post Graduate' },
  { value: 'other', label: 'Other' },
];

export interface BulkColumn {
  key: string;
  header: string;
  required: boolean;
  example: string;
}

const PERSONAL_COLUMNS: BulkColumn[] = [
  { key: 'name', header: 'First Name', required: true, example: 'Priya' },
  { key: 'middleName', header: 'Middle Name', required: false, example: 'Kumar' },
  { key: 'lastName', header: 'Last Name', required: true, example: 'Patel' },
  { key: 'category', header: 'Category (General/OBC/SC/ST/Other)', required: false, example: 'OBC' },
  { key: 'gender', header: 'Gender (Male/Female/Other)', required: true, example: 'Female' },
  { key: 'fatherName', header: "Father's Name", required: true, example: 'Dinesh Patel' },
  { key: 'address', header: 'Address', required: true, example: 'Bharkhedi Kalan, Ujjain, Madhya Pradesh' },
  { key: 'phone', header: 'Mobile No', required: true, example: '9876543210' },
  { key: 'email', header: 'Email', required: true, example: 'priya.patel@cmyp.mp.gov.in' },
  { key: 'samagraId', header: 'Samagra ID', required: true, example: '123456789' },
  {
    key: 'qualification',
    header: 'Qualification (10th/12th/ITI-Diploma/Graduate/Post Graduate/Other)',
    required: true,
    example: 'Graduate',
  },
];

export const BULK_COLUMNS: Record<BulkUserRole, BulkColumn[]> = {
  pc: [...PERSONAL_COLUMNS, { key: 'division', header: 'Division', required: true, example: 'Ujjain Division' }],
  fellow: [
    ...PERSONAL_COLUMNS,
    { key: 'division', header: 'Division', required: true, example: 'Ujjain Division' },
    { key: 'district', header: 'District', required: true, example: 'Ujjain' },
  ],
  intern: [
    ...PERSONAL_COLUMNS,
    { key: 'district', header: 'District', required: true, example: 'Ujjain' },
    { key: 'block', header: 'Block', required: true, example: 'Ujjain Urban' },
    { key: 'gramPanchayat', header: 'Gram Panchayat', required: true, example: 'Bharkhedi' },
    { key: 'village', header: 'Village', required: true, example: 'Bharkhedi Kalan' },
  ],
};

export const BULK_ROLE_LABEL: Record<BulkUserRole, string> = {
  pc: 'Project Coordinator',
  fellow: 'CM Fellow',
  intern: 'Intern',
};

/** Builds and downloads a .xlsx template with the header row + one example row for the given role. */
export async function downloadUserTemplate(role: BulkUserRole) {
  const columns = BULK_COLUMNS[role];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(BULK_ROLE_LABEL[role]);
  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: Math.max(18, c.header.length) }));
  sheet.addRow(Object.fromEntries(columns.map((c) => [c.key, c.example])));
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `cmyp-${role}-upload-template.xlsx`
  );
}

/** Reads the first worksheet of an uploaded .xlsx file into an array of header→value row objects. */
export async function parseUserWorkbook(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? '').trim();
  });

  const rows: Record<string, string>[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (row.cellCount === 0) continue;
    const obj: Record<string, string> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      const value = cell.value == null ? '' : String(cell.value).trim();
      if (value) hasValue = true;
      obj[header] = value;
    });
    if (hasValue) rows.push(obj);
  }
  return rows;
}

/** Generates a random temporary password for bulk-created accounts. */
export function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export interface CreatedCredential {
  name: string;
  email: string;
  password: string;
  role: BulkUserRole;
}

/** Builds and downloads a .xlsx summary of newly created accounts + their temporary passwords. */
export async function downloadCredentialsSheet(rows: CreatedCredential[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Credentials');
  sheet.columns = [
    { header: 'Name', key: 'name', width: 24 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Temporary Password', key: 'password', width: 20 },
    { header: 'Role', key: 'role', width: 18 },
  ];
  rows.forEach((r) => sheet.addRow({ ...r, role: BULK_ROLE_LABEL[r.role] }));
  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `cmyp-new-user-credentials-${Date.now()}.xlsx`
  );
}
