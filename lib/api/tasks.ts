import { get, post, patch, del } from './client';
import type { Task, CreateTaskRequest, UpdateTaskStatusRequest, TaskStatus, TaskPriority, UserRole } from '@/types/models';
import { MOCK_PAGINATED_TASKS, MOCK_TASKS, MOCK_USERS } from './mockData';

export interface TasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToRole?: UserRole;
  assignedToId?: string;
  divisionId?: string;
  districtId?: string;
  blockId?: string;
  createdById?: string;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTasks {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}

function applyFilters(query?: TasksQuery): PaginatedTasks {
  let items = [...MOCK_TASKS];
  if (query?.status) items = items.filter(t => t.status === query.status);
  if (query?.priority) items = items.filter(t => t.priority === query.priority);
  if (query?.assignedToRole) items = items.filter(t => t.assignedTo.some(a => a.role === query.assignedToRole));
  return { items, total: items.length, page: query?.page ?? 1, limit: query?.limit ?? 20 };
}

export const tasksApi = {
  list: async (params?: TasksQuery): Promise<PaginatedTasks> => {
    try {
      return await get<PaginatedTasks>('/tasks', params as Record<string, unknown>);
    } catch {
      return applyFilters(params);
    }
  },

  getById: async (id: string): Promise<Task> => {
    try {
      return await get<Task>(`/tasks/${id}`);
    } catch {
      const found = MOCK_TASKS.find(t => t.id === id);
      if (found) return found;
      throw new Error('Task not found');
    }
  },

  create: async (data: CreateTaskRequest): Promise<Task> => {
    try {
      return await post<Task>('/tasks', data);
    } catch {
      // Demo fallback — resolve assigned users and save task into mock state
      const assignedToUsers = (data.assignedToIds ?? []).map(id => {
        const found = MOCK_USERS.find(u => u.id === id);
        return found ? { id: found.id, name: found.name, role: found.role } : { id, name: 'User', role: 'intern' as const };
      });

      const newTask: Task = {
        id: `task-new-${Date.now()}`,
        name: data.name,
        description: data.description,
        priority: data.priority,
        status: 'pending',
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: { id: 'u-admin-01', name: 'Rajesh Sharma', role: 'admin' },
        assignedTo: assignedToUsers,
        isSurveyTask: data.isSurveyTask,
        surveyId: data.surveyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      MOCK_TASKS.unshift(newTask);
      return newTask;
    }
  },

  updateStatus: async (id: string, data: UpdateTaskStatusRequest): Promise<Task> => {
    try {
      return await patch<Task>(`/tasks/${id}/status`, data);
    } catch {
      const found = MOCK_TASKS.find(t => t.id === id);
      return { ...(found ?? MOCK_TASKS[0]), status: data.status };
    }
  },

  getAssignedByPc: async (params?: TasksQuery): Promise<PaginatedTasks> => {
    try {
      return await get<PaginatedTasks>('/tasks/assigned-by-pc', params as Record<string, unknown>);
    } catch {
      const items = MOCK_TASKS.filter(t => t.assignedByPc);
      return { items, total: items.length, page: 1, limit: 20 };
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await del(`/tasks/${id}`);
    } catch {
      const idx = MOCK_TASKS.findIndex(t => t.id === id);
      if (idx !== -1) MOCK_TASKS.splice(idx, 1);
    }
  },
};
