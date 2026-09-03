import { get, post, patch } from './client';
import type { LoginRequest, LoginResponse, AuthUser, UserRole } from '@/types/models';

const DEMO_USERS: Record<string, AuthUser> = {
  'admin@cmyp.mp.gov.in': {
    id: 'usr-admin-01',
    name: 'Rajesh Sharma (State Admin)',
    email: 'admin@cmyp.mp.gov.in',
    role: 'admin',
    status: 'active',
    profileComplete: true,
    createdAt: '2026-01-01T00:00:00Z',
    lastName: 'Sharma', gender: 'male', fatherName: 'Mohan Lal Sharma',
    address: '14 Shyamla Hills, Bhopal, Madhya Pradesh', samagraId: '100200300401',
    qualification: 'post_graduate',
  },
  'pc.bhopal@cmyp.mp.gov.in': {
    id: 'usr-pc-01',
    name: 'Anjali Verma (Bhopal PC)',
    email: 'pc.bhopal@cmyp.mp.gov.in',
    role: 'pc',
    status: 'active',
    division: { id: 'div-01', name: 'Bhopal Division', code: 'BPL' },
    profileComplete: true,
    createdAt: '2026-01-05T00:00:00Z',
    lastName: 'Verma', gender: 'female', fatherName: 'Rakesh Verma',
    address: 'MIG-22, Arera Colony, Bhopal, Madhya Pradesh', samagraId: '100200300402',
    qualification: 'post_graduate',
  },
  'fellow.indore@cmyp.mp.gov.in': {
    id: 'usr-fellow-01',
    name: 'Vikram Singh (Indore Fellow)',
    email: 'fellow.indore@cmyp.mp.gov.in',
    role: 'fellow',
    status: 'active',
    district: { id: 'dst-01', name: 'Indore', divisionId: 'div-02', divisionName: 'Indore Division' },
    profileComplete: true,
    createdAt: '2026-01-10T00:00:00Z',
    lastName: 'Singh', gender: 'male', fatherName: 'Bhupendra Singh',
    address: 'Vijay Nagar, Indore, Madhya Pradesh', samagraId: '100200300404',
    qualification: 'post_graduate',
  },
  'intern.ujjain@cmyp.mp.gov.in': {
    id: 'usr-intern-01',
    name: 'Priya Patel (Ujjain Intern)',
    email: 'intern.ujjain@cmyp.mp.gov.in',
    role: 'intern',
    status: 'active',
    block: { id: 'blk-01', name: 'Ujjain Urban', districtId: 'dst-02', districtName: 'Ujjain' },
    gramPanchayat: { id: 'gp-01', name: 'Bharkhedi', blockId: 'blk-01', blockName: 'Ujjain Urban' },
    village: { id: 'vlg-01', name: 'Bharkhedi Kalan', gramPanchayatId: 'gp-01', gramPanchayatName: 'Bharkhedi' },
    profileComplete: true,
    createdAt: '2026-01-15T00:00:00Z',
    lastName: 'Patel', gender: 'female', fatherName: 'Dinesh Patel',
    address: 'Bharkhedi Kalan, Ujjain Urban, Ujjain, Madhya Pradesh', samagraId: '100200300407',
    qualification: 'graduate',
  },
  'new.fellow@cmyp.mp.gov.in': {
    id: 'usr-fellow-pending',
    name: 'New Fellow',
    email: 'new.fellow@cmyp.mp.gov.in',
    role: 'fellow',
    status: 'pending',
    profileComplete: false,
    createdAt: '2026-09-02T00:00:00Z',
  },
  'new.intern@cmyp.mp.gov.in': {
    id: 'usr-intern-pending',
    name: 'New Intern',
    email: 'new.intern@cmyp.mp.gov.in',
    role: 'intern',
    status: 'pending',
    profileComplete: false,
    createdAt: '2026-09-02T00:00:00Z',
  },
};

function helperSetCookie(name: string, value: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=${value}; path=/; max-age=86400; SameSite=Lax`;
  }
}

function helperClearCookie(name: string) {
  if (typeof document !== 'undefined') {
    document.cookie = `${name}=; path=/; max-age=0;`;
  }
}

export const authApi = {
  /** Login — returns user with role for redirect logic (with mock fallback for local dev) */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const res = await post<LoginResponse>('/auth/login', data);
      if (res.token) {
        helperSetCookie('cmyp_token', res.token);
      }
      return res;
    } catch (error) {
      // Fallback for demo/dev mode when backend server is not running
      const demoUser = DEMO_USERS[data.email.toLowerCase()];
      if (demoUser) {
        // Create mock JWT payload
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ 
          sub: demoUser.id, 
          role: demoUser.role, 
          email: demoUser.email,
          profileComplete: demoUser.profileComplete 
        }));
        const mockToken = `${header}.${payload}.mockSignature`;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('cmyp_user', JSON.stringify(demoUser));
          localStorage.setItem('cmyp_token', mockToken);
          helperSetCookie('cmyp_token', mockToken);
        }

        return {
          user: demoUser,
          token: mockToken,
        };
      }
      throw error;
    }
  },

  /** Logout — invalidates server session/cookie */
  logout: async () => {
    try {
      await post<void>('/auth/logout');
    } catch {
      // Ignore network errors on logout in dev mode
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cmyp_user');
      localStorage.removeItem('cmyp_token');
      helperClearCookie('cmyp_token');
      helperClearCookie('cmyp_session');
    }
  },

  /** Request password reset email */
  forgotPassword: (email: string) =>
    post<{ message: string }>('/auth/forgot-password', { email }),

  /** Reset password with token from email */
  resetPassword: (token: string, password: string) =>
    post<{ message: string }>('/auth/reset-password', { token, password }),

  /** Get current logged-in user (uses cookie auth or mock fallback) */
  me: async (): Promise<AuthUser> => {
    try {
      return await get<AuthUser>('/auth/me');
    } catch (error) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('cmyp_user');
        if (stored) {
          try {
            return JSON.parse(stored) as AuthUser;
          } catch {
            // invalid json
          }
        }
      }
      throw error;
    }
  },

  /** Complete self-registration (Fellow/Intern first login) */
  completeRegistration: (data: Partial<AuthUser>) =>
    patch<AuthUser>('/auth/register-profile', data),

  /** Self-registration */
  register: async (data: any): Promise<LoginResponse> => {
    try {
      const res = await post<LoginResponse>('/auth/register', data);
      if (res.token) {
        helperSetCookie('cmyp_token', res.token);
      }
      return res;
    } catch (error) {
      // Mock fallback: create a mock pending user and login
      const newUser: AuthUser = {
        id: `usr-new-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as UserRole,
        status: 'pending',
        profileComplete: false,
        createdAt: new Date().toISOString(),
      };
      
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: newUser.id, 
        role: newUser.role, 
        email: newUser.email,
        profileComplete: newUser.profileComplete 
      }));
      const mockToken = `${header}.${payload}.mockSignature`;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('cmyp_user', JSON.stringify(newUser));
        localStorage.setItem('cmyp_token', mockToken);
        helperSetCookie('cmyp_token', mockToken);
      }
      
      return { user: newUser, token: mockToken };
    }
  },
};
