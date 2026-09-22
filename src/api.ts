import type { NewsItem, QueueSector, QueueTicket, Room, User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campus_token');
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || 'Erro ao comunicar com a API.');
  }

  return payload as T;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (username: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: async (name: string, email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  me: async () => apiFetch<User>('/me'),
};

export const adminApi = {
  listProfessors: async () => apiFetch<User[]>('/admin/professors'),
  createProfessor: async (data: { name: string; email: string; password: string }) =>
    apiFetch<User>('/admin/professors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const subjectApi = {
  list: async () => apiFetch<any[]>('/subjects'),
};

export const gradeApi = {
  list: async () => apiFetch<any[]>('/grades'),
  update: async (id: string, data: Record<string, any>) =>
    apiFetch<any>(`/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  create: async (data: Record<string, any>) =>
    apiFetch<any>('/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const newsApi = {
  list: async () => apiFetch<NewsItem[]>('/news'),
  create: async (data: Omit<NewsItem, 'id'>) =>
    apiFetch<NewsItem>('/news', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (id: string, data: Partial<NewsItem>) =>
    apiFetch<NewsItem>(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: async (id: string) =>
    apiFetch<{ message: string }>(`/news/${id}`, {
      method: 'DELETE',
    }),
};

export const roomApi = {
  list: async () => apiFetch<Room[]>('/rooms'),
  create: async (data: Omit<Room, 'id'>) =>
    apiFetch<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: async (id: string, data: Partial<Room>) =>
    apiFetch<Room>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: async (id: string) =>
    apiFetch<{ message: string }>(`/rooms/${id}`, {
      method: 'DELETE',
    }),
};

export const queueApi = {
  list: async () => apiFetch<QueueSector[]>('/sectors'),
  enter: async (sectorId: string) => apiFetch<QueueTicket>('/queues/enter', {
    method: 'POST',
    body: JSON.stringify({ sectorId }),
  }),
};
