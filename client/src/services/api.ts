import axios from 'axios';

// Dev (vite): pakai VITE_API_URL (default localhost:4000).
// Prod (di-serve backend yang sama): same-origin agar tak perlu config tambahan.
// Deploy frontend terpisah: isi VITE_API_URL saat build.
const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin);

export const api = axios.create({ baseURL: `${API_BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyhub_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Course {
  id: number;
  course_name: string;
  lecturer_name?: string | null;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  color_code?: string | null;
  _count?: { tasks: number };
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  due_date: string;
  priority: string;
  is_completed: boolean;
  reminder_sent: boolean;
  reminder_stage: number;
  last_reminded_at?: string | null;
  course_id?: number | null;
  course?: Course | null;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: number; name: string; email: string } }>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<{ token: string; user: { id: number; name: string; email: string } }>('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
};

export const courseApi = {
  list: () => api.get<Course[]>('/courses').then((r) => r.data),
  create: (data: Partial<Course>) => api.post<Course>('/courses', data).then((r) => r.data),
  remove: (id: number) => api.delete(`/courses/${id}`),
};

export const taskApi = {
  list: (params?: { completed?: boolean; due_soon?: boolean }) =>
    api.get<Task[]>('/tasks', { params }).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post<Task>('/tasks', data).then((r) => r.data),
  complete: (id: number) => api.patch<Task>(`/tasks/${id}/complete`).then((r) => r.data),
  remove: (id: number) => api.delete(`/tasks/${id}`),
};

export const telegramApi = {
  status: () =>
    api
      .get<{
        linked: boolean;
        telegram_chat_id: string | null;
        bot_username: string;
        bot_configured: boolean;
        pending_token: { link_token: string; url: string } | null;
      }>('/telegram/status')
      .then((r) => r.data),
  linkToken: () =>
    api.get<{ link_token: string; url: string; bot_username: string }>('/telegram/link-token').then((r) => r.data),
  unlink: () => api.post('/telegram/unlink').then((r) => r.data),
};
