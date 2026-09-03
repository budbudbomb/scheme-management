import { get, post, postFormData } from './client';
import type { Survey, SurveyResponse } from '@/types/models';
import { MOCK_PAGINATED_SURVEYS, MOCK_SURVEYS } from './mockData';

export interface SurveysQuery {
  createdById?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSurveys {
  items: Survey[];
  total: number;
  page: number;
  limit: number;
}

export const surveysApi = {
  list: async (params?: SurveysQuery): Promise<PaginatedSurveys> => {
    try {
      return await get<PaginatedSurveys>('/surveys', params as Record<string, unknown>);
    } catch {
      return MOCK_PAGINATED_SURVEYS;
    }
  },

  getById: async (id: string): Promise<Survey> => {
    try {
      return await get<Survey>(`/surveys/${id}`);
    } catch {
      const found = MOCK_SURVEYS.find(s => s.id === id);
      if (found) return found;
      throw new Error('Survey not found');
    }
  },

  create: async (data: Omit<Survey, 'id' | 'createdBy' | 'isAllocatedAsTask' | 'createdAt'>): Promise<Survey> => {
    try {
      return await post<Survey>('/surveys', data);
    } catch {
      return {
        id: `survey-new-${Date.now()}`,
        title: data.title,
        description: data.description,
        questions: data.questions,
        createdBy: { id: 'u-pc-01', name: 'You', role: 'pc' },
        isAllocatedAsTask: false,
        createdAt: new Date().toISOString(),
      };
    }
  },


  submitResponse: (surveyId: string, formData: FormData) =>
    postFormData<SurveyResponse>(`/surveys/${surveyId}/respond`, formData),

  getResponses: (surveyId: string, params?: { respondentId?: string; page?: number }) =>
    get<{ items: SurveyResponse[]; total: number }>(`/surveys/${surveyId}/responses`, params as Record<string, unknown>),
};
