import api from './api';

export interface LearningModule {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration_minutes: number;
  tags?: string[];
  grades?: number[];
  subjects?: string[];
  is_featured: boolean;
  view_count: number;
  completion_count: number;
  rating_avg: number;
  rating_count: number;
  user_progress?: {
    completion_percentage: number;
    is_completed: boolean;
    is_bookmarked: boolean;
    rating?: number;
  };
}

export interface ModuleDetail extends LearningModule {
  content: any;
  prerequisites?: number[];
  related_modules?: number[];
  resources?: any[];
  user_progress?: {
    completion_percentage: number;
    time_spent_minutes: number;
    is_completed: boolean;
    is_bookmarked: boolean;
    rating?: number;
    started_at?: string;
  };
}

export interface ScenarioTemplate {
  id: number;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  grades?: number[];
  subjects?: string[];
  is_featured: boolean;
  view_count: number;
  usage_count: number;
  helpful_count: number;
}

export interface ScenarioDetail extends ScenarioTemplate {
  situation: string;
  context?: any;
  solution_framework: any;
  expert_tips?: string[];
  common_mistakes?: string[];
  related_modules?: number[];
  related_resources?: any[];
}

export const getLearningModules = async (params?: {
  category?: string;
  difficulty?: string;
  search?: string;
  featured_only?: boolean;
}): Promise<LearningModule[]> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.featured_only) queryParams.append('featured_only', 'true');
  
  const response = await api.get(`/learning/modules?${queryParams}`);
  return response.data;
};

export const getModuleDetail = async (moduleId: number): Promise<ModuleDetail> => {
  const response = await api.get(`/learning/modules/${moduleId}`);
  return response.data;
};

export const updateModuleProgress = async (moduleId: number, data: {
  completion_percentage?: number;
  time_spent_minutes?: number;
  is_completed?: boolean;
  rating?: number;
  feedback?: string;
  is_bookmarked?: boolean;
}): Promise<void> => {
  await api.post(`/learning/modules/${moduleId}/progress`, data);
};

export const getScenarios = async (params?: {
  category?: string;
  search?: string;
  featured_only?: boolean;
}): Promise<ScenarioTemplate[]> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.featured_only) queryParams.append('featured_only', 'true');
  
  const response = await api.get(`/learning/scenarios?${queryParams}`);
  return response.data;
};

export const getScenarioDetail = async (scenarioId: number): Promise<ScenarioDetail> => {
  const response = await api.get(`/learning/scenarios/${scenarioId}`);
  return response.data;
};

export const applyScenario = async (scenarioId: number): Promise<void> => {
  await api.post(`/learning/scenarios/${scenarioId}/apply`);
};

export const markScenarioHelpful = async (scenarioId: number): Promise<void> => {
  await api.post(`/learning/scenarios/${scenarioId}/helpful`);
};
