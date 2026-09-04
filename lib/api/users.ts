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
      return [
        { id: 'dst-01', name: 'Indore', divisionId: 'div-02', divisionName: 'Indore Division' },
        { id: 'dst-02', name: 'Bhopal', divisionId: 'div-01', divisionName: 'Bhopal Division' },
        { id: 'dst-03', name: 'Jabalpur', divisionId: 'div-03', divisionName: 'Jabalpur Division' },
        { id: 'dst-04', name: 'Ujjain', divisionId: 'div-07', divisionName: 'Ujjain Division' },
        { id: 'dst-05', name: 'Gwalior', divisionId: 'div-04', divisionName: 'Gwalior Division' },
        { id: 'dst-06', name: 'Sagar', divisionId: 'div-06', divisionName: 'Sagar Division' },
      ].filter(d => !divisionId || d.divisionId === divisionId);
    }
  },

  getBlocks: async (districtId?: string): Promise<Block[]> => {
    try {
      return await get<Block[]>('/locations/blocks', districtId ? { districtId } : undefined);
    } catch {
      return [
        { id: 'blk-01', name: 'Ujjain Urban', districtId: 'dst-04', districtName: 'Ujjain' },
        { id: 'blk-02', name: 'Gwalior Block A', districtId: 'dst-05', districtName: 'Gwalior' },
        { id: 'blk-03', name: 'Sagar Rural', districtId: 'dst-06', districtName: 'Sagar' },
        { id: 'blk-04', name: 'Indore North', districtId: 'dst-01', districtName: 'Indore' },
        { id: 'blk-05', name: 'Bhopal Central', districtId: 'dst-02', districtName: 'Bhopal' },
        { id: 'blk-06', name: 'Phanda', districtId: 'dst-02', districtName: 'Bhopal' },
      ].filter(b => !districtId || b.districtId === districtId);
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
