import type { AssignmentRecord, AssignmentSubmissionFile, AssignmentSubmissionNotice, AttendanceStatus, ClassAttendanceRecord, CourseSubject, NewsItem, QueueSector, QueueTicket, Room, SubjectAssessmentRecord, User } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  me: async () => apiFetch<User>('/me'),
};

export const adminApi = {
  listStudents: async () => apiFetch<User[]>('/admin/students'),
  createStudent: async (data: { name: string; email: string; password: string }) =>
    apiFetch<User>('/admin/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listProfessors: async () => apiFetch<User[]>('/admin/professors'),
  createProfessor: async (data: { name: string; email: string; password: string }) =>
    apiFetch<User>('/admin/professors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const subjectApi = {
  list: async () => apiFetch<CourseSubject[]>('/subjects'),
};

export const assignmentApi = {
  list: () => apiFetch<AssignmentRecord[]>('/assignments'),
  create: (data: Pick<AssignmentRecord, 'subjectId' | 'title' | 'description' | 'dueAt'>) =>
    apiFetch<AssignmentRecord>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  setCompleted: (id: string, completed: boolean) =>
    apiFetch<AssignmentRecord>(`/assignments/${encodeURIComponent(id)}/completion`, { method: 'PUT', body: JSON.stringify({ completed }) }),
  uploadSubmission: (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return apiFetch<AssignmentSubmissionFile[]>(`/assignments/${encodeURIComponent(id)}/submissions`, {
      method: 'POST',
      body: formData,
    });
  },
  listSubmissions: () => apiFetch<AssignmentSubmissionNotice[]>('/assignments/submissions'),
  getSubmissionFileUrl: (assignmentId: string, fileId: string) =>
    apiFetch<{ url: string }>(`/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(fileId)}/download`),
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

export const academicApi = {
  listStudents: () => apiFetch<User[]>('/attendance/students'),
  listAssessments: () => apiFetch<SubjectAssessmentRecord[]>('/subject-assessments'),
  saveAssessment: (data: Pick<SubjectAssessmentRecord, 'studentId' | 'subjectId' | 'assessmentType' | 'period' | 'value'>) =>
    apiFetch<SubjectAssessmentRecord>('/subject-assessments', { method: 'PUT', body: JSON.stringify(data) }),
  listClassAttendance: (subjectId: string) => apiFetch<ClassAttendanceRecord[]>(`/attendance/class/${encodeURIComponent(subjectId)}`),
  saveClassAttendance: (data: { subjectId: string; date: string; records: { studentId: string; status: AttendanceStatus }[] }) =>
    apiFetch<ClassAttendanceRecord[]>('/attendance/session', { method: 'POST', body: JSON.stringify(data) }),
  listMyAttendance: () => apiFetch<ClassAttendanceRecord[]>('/attendance/student-history'),
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
