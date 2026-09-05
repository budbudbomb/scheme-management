import { get, post, patch } from './client';
import type { User, UserRole, Division, District, Block, GramPanchayat, Village } from '@/types/models';
import {
  MOCK_PAGINATED_USERS,
} from './mockData';

export interface UsersQuery {
  role?: UserRole;
  status?: 'active' | 'inactive' | 'pending';
  divisionId?: string;
  districtId?: string;
  blockId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

function applyFilters(query?: UsersQuery): PaginatedUsers {
  let items = [...MOCK_PAGINATED_USERS.items];
  if (query?.role) items = items.filter(u => u.role === query.role);
  if (query?.status) items = items.filter(u => u.status === query.status);
  if (query?.search) {
    const q = query.search.toLowerCase();
    items = items.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }
  return { items, total: items.length, page: query?.page ?? 1, limit: query?.limit ?? 20 };
}

export const usersApi = {
  list: async (params?: UsersQuery): Promise<PaginatedUsers> => {
    try {
      return await get<PaginatedUsers>('/users', params as Record<string, unknown>);
    } catch {
      return applyFilters(params);
    }
  },

  getById: async (id: string): Promise<User> => {
    try {
      return await get<User>(`/users/${id}`);
    } catch {
      const found = MOCK_PAGINATED_USERS.items.find(u => u.id === id);
      if (found) return found;
      throw new Error('User not found');
    }
  },

  create: async (data: Partial<User> & { password?: string }): Promise<User> => {
    try {
      return await post<User>('/users', data);
    } catch {
      // Demo fallback — simulate a successful creation
      const now = new Date().toISOString();
      return {
        id: `u-new-${Date.now()}`,
        name: data.name ?? 'New User',
        email: data.email ?? '',
        role: (data.role as User['role']) ?? 'intern',
        status: 'active',
        profileComplete: false,
        createdAt: now,
        lastName: data.lastName,
        gender: data.gender,
        fatherName: data.fatherName,
        address: data.address,
        phone: data.phone,
        samagraId: data.samagraId,
        qualification: data.qualification,
        ...(data.role === 'pc' && data.division ? { division: data.division } : {}),
        ...(data.role === 'fellow' && data.district ? { district: data.district } : {}),
        ...(data.role === 'intern' && data.block ? { block: data.block } : {}),
        ...(data.role === 'intern' && data.gramPanchayat ? { gramPanchayat: data.gramPanchayat } : {}),
        ...(data.role === 'intern' && data.village ? { village: data.village } : {}),
      } as User;
    }
  },

  createMany: async (
    users: (Partial<User> & { password?: string })[]
  ): Promise<{ created: User[]; failed: { row: number; error: string }[] }> => {
    try {
      return await post<{ created: User[]; failed: { row: number; error: string }[] }>('/users/bulk', { users });
    } catch {
      // Demo fallback — sequentially create via the same mock path as single create
      const created: User[] = [];
      const failed: { row: number; error: string }[] = [];
      for (let i = 0; i < users.length; i++) {
        try {
          created.push(await usersApi.create(users[i]));
        } catch (err: unknown) {
          failed.push({ row: i + 1, error: err instanceof Error ? err.message : 'Failed to create user' });
        }
      }
      return { created, failed };
    }
  },


  update: async (id: string, data: Partial<User>): Promise<User> => {
    try {
      return await patch<User>(`/users/${id}`, data);
    } catch {
      const found = MOCK_PAGINATED_USERS.items.find(u => u.id === id);
      return { ...(found ?? MOCK_PAGINATED_USERS.items[0]), ...data } as User;
    }
  },

  allocate: async (id: string, data: { districtId?: string; blockId?: string }): Promise<User> => {
    try {
      return await patch<User>(`/users/${id}/allocate`, data);
    } catch {
      const found = MOCK_PAGINATED_USERS.items.find(u => u.id === id);
      if (!found) throw new Error('User not found');
      
      const district = data.districtId ? { id: data.districtId, name: 'Assigned District', divisionId: 'div-01', divisionName: 'Division' } : found.district;
      const block = data.blockId ? { id: data.blockId, name: 'Assigned Block', districtId: data.districtId || 'dst-01', districtName: 'District' } : found.block;
      
      return { 
        ...found, 
        district, 
        block, 
        status: 'active', 
        profileComplete: true 
      } as User;
    }
  },

  deactivate: (id: string) =>
    patch<User>(`/users/${id}/deactivate`),

  reactivate: (id: string) =>
    patch<User>(`/users/${id}/activate`),

  getDivisions: async (): Promise<Division[]> => {
    try {
      return await get<Division[]>('/locations/divisions');
    } catch {
      return [
        { id: 'div-01', name: 'Bhopal Division', code: 'BPL' },
        { id: 'div-02', name: 'Indore Division', code: 'IDR' },
        { id: 'div-03', name: 'Jabalpur Division', code: 'JBL' },
        { id: 'div-04', name: 'Gwalior Division', code: 'GWL' },
        { id: 'div-05', name: 'Rewa Division', code: 'RWA' },
        { id: 'div-06', name: 'Sagar Division', code: 'SGR' },
        { id: 'div-07', name: 'Ujjain Division', code: 'UJN' },
        { id: 'div-08', name: 'Chambal Division', code: 'CHM' },
        { id: 'div-09', name: 'Narmadapuram Division', code: 'NRM' },
        { id: 'div-10', name: 'Shahdol Division', code: 'SHD' },
      ];
    }
  },

  getDistricts: async (divisionId?: string): Promise<District[]> => {
    try {
      return await get<District[]>('/locations/districts', divisionId ? { divisionId } : undefined);
    } catch {
      const allDistricts: District[] = [
        // div-01: Bhopal Division
        { id: 'dst-02', name: 'Bhopal', divisionId: 'div-01', divisionName: 'Bhopal Division' },
        { id: 'dst-07', name: 'Sehore', divisionId: 'div-01', divisionName: 'Bhopal Division' },
        { id: 'dst-08', name: 'Raisen', divisionId: 'div-01', divisionName: 'Bhopal Division' },
        { id: 'dst-09', name: 'Rajgarh', divisionId: 'div-01', divisionName: 'Bhopal Division' },
        { id: 'dst-10', name: 'Vidisha', divisionId: 'div-01', divisionName: 'Bhopal Division' },

        // div-02: Indore Division
        { id: 'dst-01', name: 'Indore', divisionId: 'div-02', divisionName: 'Indore Division' },
        { id: 'dst-11', name: 'Dhar', divisionId: 'div-02', divisionName: 'Indore Division' },
        { id: 'dst-12', name: 'Khargone', divisionId: 'div-02', divisionName: 'Indore Division' },
        { id: 'dst-13', name: 'Khandwa', divisionId: 'div-02', divisionName: 'Indore Division' },
        { id: 'dst-38', name: 'Barwani', divisionId: 'div-02', divisionName: 'Indore Division' },

        // div-03: Jabalpur Division
        { id: 'dst-03', name: 'Jabalpur', divisionId: 'div-03', divisionName: 'Jabalpur Division' },
        { id: 'dst-14', name: 'Katni', divisionId: 'div-03', divisionName: 'Jabalpur Division' },
        { id: 'dst-15', name: 'Mandla', divisionId: 'div-03', divisionName: 'Jabalpur Division' },
        { id: 'dst-16', name: 'Chhindwara', divisionId: 'div-03', divisionName: 'Jabalpur Division' },
        { id: 'dst-39', name: 'Seoni', divisionId: 'div-03', divisionName: 'Jabalpur Division' },

        // div-04: Gwalior Division
        { id: 'dst-05', name: 'Gwalior', divisionId: 'div-04', divisionName: 'Gwalior Division' },
        { id: 'dst-17', name: 'Shivpuri', divisionId: 'div-04', divisionName: 'Gwalior Division' },
        { id: 'dst-18', name: 'Guna', divisionId: 'div-04', divisionName: 'Gwalior Division' },
        { id: 'dst-40', name: 'Datia', divisionId: 'div-04', divisionName: 'Gwalior Division' },

        // div-05: Rewa Division
        { id: 'dst-19', name: 'Rewa', divisionId: 'div-05', divisionName: 'Rewa Division' },
        { id: 'dst-20', name: 'Satna', divisionId: 'div-05', divisionName: 'Rewa Division' },
        { id: 'dst-21', name: 'Sidhi', divisionId: 'div-05', divisionName: 'Rewa Division' },
        { id: 'dst-22', name: 'Singrauli', divisionId: 'div-05', divisionName: 'Rewa Division' },

        // div-06: Sagar Division
        { id: 'dst-06', name: 'Sagar', divisionId: 'div-06', divisionName: 'Sagar Division' },
        { id: 'dst-23', name: 'Damoh', divisionId: 'div-06', divisionName: 'Sagar Division' },
        { id: 'dst-24', name: 'Chhatarpur', divisionId: 'div-06', divisionName: 'Sagar Division' },
        { id: 'dst-25', name: 'Panna', divisionId: 'div-06', divisionName: 'Sagar Division' },
        { id: 'dst-41', name: 'Tikamgarh', divisionId: 'div-06', divisionName: 'Sagar Division' },

        // div-07: Ujjain Division
        { id: 'dst-04', name: 'Ujjain', divisionId: 'div-07', divisionName: 'Ujjain Division' },
        { id: 'dst-26', name: 'Dewas', divisionId: 'div-07', divisionName: 'Ujjain Division' },
        { id: 'dst-27', name: 'Ratlam', divisionId: 'div-07', divisionName: 'Ujjain Division' },
        { id: 'dst-28', name: 'Mandsaur', divisionId: 'div-07', divisionName: 'Ujjain Division' },
        { id: 'dst-42', name: 'Neemuch', divisionId: 'div-07', divisionName: 'Ujjain Division' },

        // div-08: Chambal Division
        { id: 'dst-29', name: 'Morena', divisionId: 'div-08', divisionName: 'Chambal Division' },
        { id: 'dst-30', name: 'Bhind', divisionId: 'div-08', divisionName: 'Chambal Division' },
        { id: 'dst-31', name: 'Sheopur', divisionId: 'div-08', divisionName: 'Chambal Division' },

        // div-09: Narmadapuram Division
        { id: 'dst-32', name: 'Narmadapuram', divisionId: 'div-09', divisionName: 'Narmadapuram Division' },
        { id: 'dst-33', name: 'Betul', divisionId: 'div-09', divisionName: 'Narmadapuram Division' },
        { id: 'dst-34', name: 'Harda', divisionId: 'div-09', divisionName: 'Narmadapuram Division' },

        // div-10: Shahdol Division
        { id: 'dst-35', name: 'Shahdol', divisionId: 'div-10', divisionName: 'Shahdol Division' },
        { id: 'dst-36', name: 'Umaria', divisionId: 'div-10', divisionName: 'Shahdol Division' },
        { id: 'dst-37', name: 'Anuppur', divisionId: 'div-10', divisionName: 'Shahdol Division' },
      ];
      return allDistricts.filter(d => !divisionId || d.divisionId === divisionId);
    }
  },

  getBlocks: async (districtId?: string): Promise<Block[]> => {
    try {
      return await get<Block[]>('/locations/blocks', districtId ? { districtId } : undefined);
    } catch {
      const allBlocks: Block[] = [
        // dst-02: Bhopal
        { id: 'blk-05', name: 'Bhopal Central', districtId: 'dst-02', districtName: 'Bhopal', divisionId: 'div-01' },
        { id: 'blk-06', name: 'Phanda', districtId: 'dst-02', districtName: 'Bhopal', divisionId: 'div-01' },
        { id: 'blk-07', name: 'Berasia', districtId: 'dst-02', districtName: 'Bhopal', divisionId: 'div-01' },
        { id: 'blk-88', name: 'Kolar', districtId: 'dst-02', districtName: 'Bhopal', divisionId: 'div-01' },

        // dst-07: Sehore
        { id: 'blk-08', name: 'Ashta', districtId: 'dst-07', districtName: 'Sehore', divisionId: 'div-01' },
        { id: 'blk-09', name: 'Budhni', districtId: 'dst-07', districtName: 'Sehore', divisionId: 'div-01' },
        { id: 'blk-10', name: 'Ichhawar', districtId: 'dst-07', districtName: 'Sehore', divisionId: 'div-01' },
        { id: 'blk-89', name: 'Sehore Urban', districtId: 'dst-07', districtName: 'Sehore', divisionId: 'div-01' },

        // dst-08: Raisen
        { id: 'blk-11', name: 'Sanchi', districtId: 'dst-08', districtName: 'Raisen', divisionId: 'div-01' },
        { id: 'blk-12', name: 'Raisen Block', districtId: 'dst-08', districtName: 'Raisen', divisionId: 'div-01' },
        { id: 'blk-90', name: 'Bareli', districtId: 'dst-08', districtName: 'Raisen', divisionId: 'div-01' },

        // dst-09: Rajgarh
        { id: 'blk-13', name: 'Rajgarh Block', districtId: 'dst-09', districtName: 'Rajgarh', divisionId: 'div-01' },
        { id: 'blk-14', name: 'Biaora', districtId: 'dst-09', districtName: 'Rajgarh', divisionId: 'div-01' },
        { id: 'blk-91', name: 'Sarangpur', districtId: 'dst-09', districtName: 'Rajgarh', divisionId: 'div-01' },

        // dst-10: Vidisha
        { id: 'blk-15', name: 'Vidisha Block', districtId: 'dst-10', districtName: 'Vidisha', divisionId: 'div-01' },
        { id: 'blk-92', name: 'Basoda', districtId: 'dst-10', districtName: 'Vidisha', divisionId: 'div-01' },
        { id: 'blk-93', name: 'Kurwai', districtId: 'dst-10', districtName: 'Vidisha', divisionId: 'div-01' },

        // dst-01: Indore
        { id: 'blk-04', name: 'Indore North', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02' },
        { id: 'blk-16', name: 'Indore South', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02' },
        { id: 'blk-17', name: 'Depalpur', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02' },
        { id: 'blk-18', name: 'Sanwer', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02' },
        { id: 'blk-19', name: 'Mhow', districtId: 'dst-01', districtName: 'Indore', divisionId: 'div-02' },

        // dst-11: Dhar
        { id: 'blk-20', name: 'Dhar Block', districtId: 'dst-11', districtName: 'Dhar', divisionId: 'div-02' },
        { id: 'blk-21', name: 'Badnawar', districtId: 'dst-11', districtName: 'Dhar', divisionId: 'div-02' },
        { id: 'blk-94', name: 'Sardarpur', districtId: 'dst-11', districtName: 'Dhar', divisionId: 'div-02' },

        // dst-12: Khargone
        { id: 'blk-22', name: 'Khargone Block', districtId: 'dst-12', districtName: 'Khargone', divisionId: 'div-02' },
        { id: 'blk-23', name: 'Barwaha', districtId: 'dst-12', districtName: 'Khargone', divisionId: 'div-02' },
        { id: 'blk-95', name: 'Kasrawad', districtId: 'dst-12', districtName: 'Khargone', divisionId: 'div-02' },

        // dst-13: Khandwa
        { id: 'blk-24', name: 'Khandwa Block', districtId: 'dst-13', districtName: 'Khandwa', divisionId: 'div-02' },
        { id: 'blk-25', name: 'Punasa', districtId: 'dst-13', districtName: 'Khandwa', divisionId: 'div-02' },

        // dst-38: Barwani
        { id: 'blk-96', name: 'Barwani Block', districtId: 'dst-38', districtName: 'Barwani', divisionId: 'div-02' },
        { id: 'blk-97', name: 'Sendhwa', districtId: 'dst-38', districtName: 'Barwani', divisionId: 'div-02' },

        // dst-03: Jabalpur
        { id: 'blk-26', name: 'Jabalpur Urban', districtId: 'dst-03', districtName: 'Jabalpur', divisionId: 'div-03' },
        { id: 'blk-27', name: 'Panagar', districtId: 'dst-03', districtName: 'Jabalpur', divisionId: 'div-03' },
        { id: 'blk-28', name: 'Sihora', districtId: 'dst-03', districtName: 'Jabalpur', divisionId: 'div-03' },
        { id: 'blk-29', name: 'Patan', districtId: 'dst-03', districtName: 'Jabalpur', divisionId: 'div-03' },

        // dst-14: Katni
        { id: 'blk-30', name: 'Murwara', districtId: 'dst-14', districtName: 'Katni', divisionId: 'div-03' },
        { id: 'blk-31', name: 'Katni Block', districtId: 'dst-14', districtName: 'Katni', divisionId: 'div-03' },
        { id: 'blk-98', name: 'Rithi', districtId: 'dst-14', districtName: 'Katni', divisionId: 'div-03' },

        // dst-15: Mandla
        { id: 'blk-32', name: 'Mandla Block', districtId: 'dst-15', districtName: 'Mandla', divisionId: 'div-03' },
        { id: 'blk-33', name: 'Nainpur', districtId: 'dst-15', districtName: 'Mandla', divisionId: 'div-03' },

        // dst-16: Chhindwara
        { id: 'blk-34', name: 'Chhindwara Block', districtId: 'dst-16', districtName: 'Chhindwara', divisionId: 'div-03' },
        { id: 'blk-35', name: 'Sausar', districtId: 'dst-16', districtName: 'Chhindwara', divisionId: 'div-03' },
        { id: 'blk-99', name: 'Parasia', districtId: 'dst-16', districtName: 'Chhindwara', divisionId: 'div-03' },

        // dst-39: Seoni
        { id: 'blk-100', name: 'Seoni Block', districtId: 'dst-39', districtName: 'Seoni', divisionId: 'div-03' },
        { id: 'blk-101', name: 'Lakhnadon', districtId: 'dst-39', districtName: 'Seoni', divisionId: 'div-03' },

        // dst-05: Gwalior
        { id: 'blk-02', name: 'Gwalior Block A', districtId: 'dst-05', districtName: 'Gwalior', divisionId: 'div-04' },
        { id: 'blk-36', name: 'Morar', districtId: 'dst-05', districtName: 'Gwalior', divisionId: 'div-04' },
        { id: 'blk-37', name: 'Dabra', districtId: 'dst-05', districtName: 'Gwalior', divisionId: 'div-04' },

        // dst-17: Shivpuri
        { id: 'blk-38', name: 'Shivpuri Block', districtId: 'dst-17', districtName: 'Shivpuri', divisionId: 'div-04' },
        { id: 'blk-39', name: 'Kolaras', districtId: 'dst-17', districtName: 'Shivpuri', divisionId: 'div-04' },

        // dst-18: Guna
        { id: 'blk-40', name: 'Guna Block', districtId: 'dst-18', districtName: 'Guna', divisionId: 'div-04' },
        { id: 'blk-41', name: 'Raghogarh', districtId: 'dst-18', districtName: 'Guna', divisionId: 'div-04' },

        // dst-40: Datia
        { id: 'blk-102', name: 'Datia Block', districtId: 'dst-40', districtName: 'Datia', divisionId: 'div-04' },
        { id: 'blk-103', name: 'Seondha', districtId: 'dst-40', districtName: 'Datia', divisionId: 'div-04' },

        // dst-19: Rewa
        { id: 'blk-42', name: 'Rewa Block', districtId: 'dst-19', districtName: 'Rewa', divisionId: 'div-05' },
        { id: 'blk-43', name: 'Raipur Karchuliyan', districtId: 'dst-19', districtName: 'Rewa', divisionId: 'div-05' },

        // dst-20: Satna
        { id: 'blk-44', name: 'Satna Block', districtId: 'dst-20', districtName: 'Satna', divisionId: 'div-05' },
        { id: 'blk-45', name: 'Maihar', districtId: 'dst-20', districtName: 'Satna', divisionId: 'div-05' },

        // dst-21: Sidhi
        { id: 'blk-46', name: 'Sidhi Block', districtId: 'dst-21', districtName: 'Sidhi', divisionId: 'div-05' },
        { id: 'blk-47', name: 'Sihawal', districtId: 'dst-21', districtName: 'Sidhi', divisionId: 'div-05' },

        // dst-22: Singrauli
        { id: 'blk-48', name: 'Waidhan', districtId: 'dst-22', districtName: 'Singrauli', divisionId: 'div-05' },
        { id: 'blk-49', name: 'Deosar', districtId: 'dst-22', districtName: 'Singrauli', divisionId: 'div-05' },

        // dst-06: Sagar
        { id: 'blk-03', name: 'Sagar Rural', districtId: 'dst-06', districtName: 'Sagar', divisionId: 'div-06' },
        { id: 'blk-50', name: 'Sagar Urban', districtId: 'dst-06', districtName: 'Sagar', divisionId: 'div-06' },
        { id: 'blk-51', name: 'Bina', districtId: 'dst-06', districtName: 'Sagar', divisionId: 'div-06' },
        { id: 'blk-52', name: 'Khurai', districtId: 'dst-06', districtName: 'Sagar', divisionId: 'div-06' },

        // dst-23: Damoh
        { id: 'blk-53', name: 'Damoh Block', districtId: 'dst-23', districtName: 'Damoh', divisionId: 'div-06' },
        { id: 'blk-54', name: 'Hatta', districtId: 'dst-23', districtName: 'Damoh', divisionId: 'div-06' },

        // dst-24: Chhatarpur
        { id: 'blk-55', name: 'Chhatarpur Block', districtId: 'dst-24', districtName: 'Chhatarpur', divisionId: 'div-06' },
        { id: 'blk-56', name: 'Rajnagar', districtId: 'dst-24', districtName: 'Chhatarpur', divisionId: 'div-06' },

        // dst-25: Panna
        { id: 'blk-57', name: 'Panna Block', districtId: 'dst-25', districtName: 'Panna', divisionId: 'div-06' },
        { id: 'blk-58', name: 'Ajaigarh', districtId: 'dst-25', districtName: 'Panna', divisionId: 'div-06' },

        // dst-41: Tikamgarh
        { id: 'blk-104', name: 'Tikamgarh Block', districtId: 'dst-41', districtName: 'Tikamgarh', divisionId: 'div-06' },
        { id: 'blk-105', name: 'Jatara', districtId: 'dst-41', districtName: 'Tikamgarh', divisionId: 'div-06' },

        // dst-04: Ujjain
        { id: 'blk-01', name: 'Ujjain Urban', districtId: 'dst-04', districtName: 'Ujjain', divisionId: 'div-07' },
        { id: 'blk-59', name: 'Mahidpur', districtId: 'dst-04', districtName: 'Ujjain', divisionId: 'div-07' },
        { id: 'blk-60', name: 'Tarana', districtId: 'dst-04', districtName: 'Ujjain', divisionId: 'div-07' },
        { id: 'blk-61', name: 'Badnagar', districtId: 'dst-04', districtName: 'Ujjain', divisionId: 'div-07' },

        // dst-26: Dewas
        { id: 'blk-62', name: 'Dewas Block', districtId: 'dst-26', districtName: 'Dewas', divisionId: 'div-07' },
        { id: 'blk-63', name: 'Sonkatch', districtId: 'dst-26', districtName: 'Dewas', divisionId: 'div-07' },

        // dst-27: Ratlam
        { id: 'blk-64', name: 'Ratlam Block', districtId: 'dst-27', districtName: 'Ratlam', divisionId: 'div-07' },
        { id: 'blk-65', name: 'Jaora', districtId: 'dst-27', districtName: 'Ratlam', divisionId: 'div-07' },

        // dst-28: Mandsaur
        { id: 'blk-66', name: 'Mandsaur Block', districtId: 'dst-28', districtName: 'Mandsaur', divisionId: 'div-07' },
        { id: 'blk-67', name: 'Malhargarh', districtId: 'dst-28', districtName: 'Mandsaur', divisionId: 'div-07' },

        // dst-42: Neemuch
        { id: 'blk-106', name: 'Neemuch Block', districtId: 'dst-42', districtName: 'Neemuch', divisionId: 'div-07' },
        { id: 'blk-107', name: 'Manasa', districtId: 'dst-42', districtName: 'Neemuch', divisionId: 'div-07' },

        // dst-29: Morena
        { id: 'blk-68', name: 'Morena Block', districtId: 'dst-29', districtName: 'Morena', divisionId: 'div-08' },
        { id: 'blk-69', name: 'Ambah', districtId: 'dst-29', districtName: 'Morena', divisionId: 'div-08' },
        { id: 'blk-70', name: 'Joura', districtId: 'dst-29', districtName: 'Morena', divisionId: 'div-08' },

        // dst-30: Bhind
        { id: 'blk-71', name: 'Bhind Block', districtId: 'dst-30', districtName: 'Bhind', divisionId: 'div-08' },
        { id: 'blk-72', name: 'Gohad', districtId: 'dst-30', districtName: 'Bhind', divisionId: 'div-08' },

        // dst-31: Sheopur
        { id: 'blk-73', name: 'Sheopur Block', districtId: 'dst-31', districtName: 'Sheopur', divisionId: 'div-08' },
        { id: 'blk-74', name: 'Vijaypur', districtId: 'dst-31', districtName: 'Sheopur', divisionId: 'div-08' },

        // dst-32: Narmadapuram
        { id: 'blk-75', name: 'Narmadapuram Block', districtId: 'dst-32', districtName: 'Narmadapuram', divisionId: 'div-09' },
        { id: 'blk-76', name: 'Itarsi', districtId: 'dst-32', districtName: 'Narmadapuram', divisionId: 'div-09' },
        { id: 'blk-77', name: 'Pipariya', districtId: 'dst-32', districtName: 'Narmadapuram', divisionId: 'div-09' },

        // dst-33: Betul
        { id: 'blk-78', name: 'Betul Block', districtId: 'dst-33', districtName: 'Betul', divisionId: 'div-09' },
        { id: 'blk-79', name: 'Multai', districtId: 'dst-33', districtName: 'Betul', divisionId: 'div-09' },

        // dst-34: Harda
        { id: 'blk-80', name: 'Harda Block', districtId: 'dst-34', districtName: 'Harda', divisionId: 'div-09' },
        { id: 'blk-81', name: 'Timarni', districtId: 'dst-34', districtName: 'Harda', divisionId: 'div-09' },

        // dst-35: Shahdol
        { id: 'blk-82', name: 'Shahdol Block', districtId: 'dst-35', districtName: 'Shahdol', divisionId: 'div-10' },
        { id: 'blk-83', name: 'Beohari', districtId: 'dst-35', districtName: 'Shahdol', divisionId: 'div-10' },

        // dst-36: Umaria
        { id: 'blk-84', name: 'Umaria Block', districtId: 'dst-36', districtName: 'Umaria', divisionId: 'div-10' },
        { id: 'blk-85', name: 'Manpur', districtId: 'dst-36', districtName: 'Umaria', divisionId: 'div-10' },

        // dst-37: Anuppur
        { id: 'blk-86', name: 'Anuppur Block', districtId: 'dst-37', districtName: 'Anuppur', divisionId: 'div-10' },
        { id: 'blk-87', name: 'Kotma', districtId: 'dst-37', districtName: 'Anuppur', divisionId: 'div-10' },
      ];
      return allBlocks.filter(b => !districtId || b.districtId === districtId);
    }
  },

  getGramPanchayats: async (blockId?: string): Promise<GramPanchayat[]> => {
    try {
      return await get<GramPanchayat[]>('/locations/gram-panchayats', blockId ? { blockId } : undefined);
    } catch {
      return [
        { id: 'gp-01', name: 'Bharkhedi', blockId: 'blk-01', blockName: 'Ujjain Urban' },
        { id: 'gp-02', name: 'Tarana Road', blockId: 'blk-01', blockName: 'Ujjain Urban' },
        { id: 'gp-03', name: 'Bhitarwar', blockId: 'blk-02', blockName: 'Gwalior Block A' },
        { id: 'gp-04', name: 'Dabra Road', blockId: 'blk-02', blockName: 'Gwalior Block A' },
        { id: 'gp-05', name: 'Rahatgarh', blockId: 'blk-03', blockName: 'Sagar Rural' },
        { id: 'gp-06', name: 'Banda', blockId: 'blk-03', blockName: 'Sagar Rural' },
        { id: 'gp-07', name: 'Phanda Kalan', blockId: 'blk-06', blockName: 'Phanda' },
        { id: 'gp-08', name: 'Khajuri Sadak', blockId: 'blk-06', blockName: 'Phanda' },
      ].filter(gp => !blockId || gp.blockId === blockId);
    }
  },

  getVillages: async (gramPanchayatId?: string): Promise<Village[]> => {
    try {
      return await get<Village[]>('/locations/villages', gramPanchayatId ? { gramPanchayatId } : undefined);
    } catch {
      return [
        { id: 'vlg-01', name: 'Bharkhedi Kalan', gramPanchayatId: 'gp-01', gramPanchayatName: 'Bharkhedi' },
        { id: 'vlg-02', name: 'Bharkhedi Khurd', gramPanchayatId: 'gp-01', gramPanchayatName: 'Bharkhedi' },
        { id: 'vlg-03', name: 'Tarana Road Village', gramPanchayatId: 'gp-02', gramPanchayatName: 'Tarana Road' },
        { id: 'vlg-04', name: 'Nagda Basti', gramPanchayatId: 'gp-02', gramPanchayatName: 'Tarana Road' },
        { id: 'vlg-05', name: 'Bhitarwar Khurd', gramPanchayatId: 'gp-03', gramPanchayatName: 'Bhitarwar' },
        { id: 'vlg-06', name: 'Bhitarwar Kalan', gramPanchayatId: 'gp-03', gramPanchayatName: 'Bhitarwar' },
        { id: 'vlg-07', name: 'Dabra Road Village', gramPanchayatId: 'gp-04', gramPanchayatName: 'Dabra Road' },
        { id: 'vlg-08', name: 'Semra', gramPanchayatId: 'gp-04', gramPanchayatName: 'Dabra Road' },
        { id: 'vlg-09', name: 'Rahatgarh Khurd', gramPanchayatId: 'gp-05', gramPanchayatName: 'Rahatgarh' },
        { id: 'vlg-10', name: 'Rahatgarh Kalan', gramPanchayatId: 'gp-05', gramPanchayatName: 'Rahatgarh' },
        { id: 'vlg-11', name: 'Banda Basti', gramPanchayatId: 'gp-06', gramPanchayatName: 'Banda' },
        { id: 'vlg-12', name: 'Banda Purwa', gramPanchayatId: 'gp-06', gramPanchayatName: 'Banda' },
        { id: 'vlg-13', name: 'Phanda Gram', gramPanchayatId: 'gp-07', gramPanchayatName: 'Phanda Kalan' },
        { id: 'vlg-14', name: 'Kalan Purwa', gramPanchayatId: 'gp-07', gramPanchayatName: 'Phanda Kalan' },
        { id: 'vlg-15', name: 'Khajuri Gaon', gramPanchayatId: 'gp-08', gramPanchayatName: 'Khajuri Sadak' },
      ].filter(v => !gramPanchayatId || v.gramPanchayatId === gramPanchayatId);
    }
  },
};
