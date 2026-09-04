import { get, post, postFormData } from './client';
import type { Survey, SurveyResponse, StakeholderDetails } from '@/types/models';
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
      const newSurvey: Survey = {
        id: `survey-${Date.now()}`,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        participantsRequired: data.participantsRequired || 50,
        responsesCount: 0,
        status: data.status || 'active',
        questions: data.questions,
        documents: data.documents,
        createdBy: { id: 'u-admin-01', name: 'Admin', role: 'admin' },
        isAllocatedAsTask: false,
        createdAt: new Date().toISOString(),
      };
      MOCK_SURVEYS.unshift(newSurvey);
      MOCK_PAGINATED_SURVEYS.total = MOCK_SURVEYS.length;
      return newSurvey;
    }
  },


  submitResponse: async (
    surveyId: string,
    data: { stakeholder: StakeholderDetails; answers: Record<string, string | string[] | number> } | FormData
  ): Promise<SurveyResponse> => {
    try {
      if (data instanceof FormData) {
        return await postFormData<SurveyResponse>(`/surveys/${surveyId}/respond`, data);
      }
      return await post<SurveyResponse>(`/surveys/${surveyId}/respond`, data);
    } catch {
      // Mock fallback
      const survey = MOCK_SURVEYS.find(s => s.id === surveyId);
      if (survey) {
        survey.responsesCount = (survey.responsesCount || 0) + 1;
      }
      const isFormData = data instanceof FormData;
      const stakeholder: StakeholderDetails = isFormData ? {
        fullName: data.get('stakeholderFullName')?.toString() || 'Respondent',
        contactInfo: data.get('stakeholderContactInfo')?.toString() || undefined,
      } : data.stakeholder;

      const answers = isFormData ? {} : data.answers;

      return {
        id: `resp-${Date.now()}`,
        surveyId,
        respondent: { id: 'u-curr-01', name: 'Field Officer', role: 'intern' },
        stakeholder,
        answers,
        submittedAt: new Date().toISOString(),
      };
    }
  },

  getResponses: (surveyId: string, params?: { respondentId?: string; page?: number }) =>
    get<{ items: SurveyResponse[]; total: number }>(`/surveys/${surveyId}/responses`, params as Record<string, unknown>),
};
