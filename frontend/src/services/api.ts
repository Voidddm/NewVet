import axios from 'axios';
import type {
  Appointment,
  AppointmentCreatePayload,
  AuthTokens,
  MedicalFile,
  Message,
  Service,
  SurgeryRoom,
  User,
} from '../types';

const ACCESS_TOKEN_KEY = 'newvet.access';
const REFRESH_TOKEN_KEY = 'newvet.refresh';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const response = await api.post<AuthTokens>('/users/login/', { email, password });
  saveTokens(response.data);
  return response.data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: 'client' | 'veterinarian';
}): Promise<User> {
  const response = await api.post<User>('/users/register/', payload);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>('/users/me/');
  return response.data;
}

export async function getVeterinarians(): Promise<User[]> {
  const response = await api.get<User[]>('/users/veterinarians/');
  return response.data;
}

export async function getServices(): Promise<Service[]> {
  const response = await api.get<Service[]>('/services/');
  return response.data;
}

export async function getSurgeryRooms(): Promise<SurgeryRoom[]> {
  const response = await api.get<SurgeryRoom[]>('/appointments/surgery-rooms/');
  return response.data;
}

export async function getAppointments(role: User['role']): Promise<Appointment[]> {
  const url = role === 'veterinarian' ? '/appointments/veterinarian/' : '/appointments/client/';
  const response = await api.get<Appointment[]>(url);
  return response.data;
}

export async function getAppointment(id: number): Promise<Appointment> {
  const response = await api.get<Appointment>(`/appointments/${id}/`);
  return response.data;
}

export async function createAppointment(payload: AppointmentCreatePayload): Promise<Appointment> {
  const formData = new FormData();
  formData.append('veterinarian', String(payload.veterinarian));
  formData.append('service', String(payload.service));
  formData.append('date', payload.date);
  formData.append('time', payload.time);
  formData.append('mode', payload.mode);
  if (payload.surgery_room) {
    formData.append('surgery_room', String(payload.surgery_room));
  }
  if (payload.referral_file) {
    formData.append('referral_file', payload.referral_file);
  }

  const response = await api.post<Appointment>('/appointments/', formData);
  return response.data;
}

export async function updateAppointmentStatus(
  id: number,
  action: 'accept' | 'reject' | 'cancel' | 'complete',
): Promise<Appointment> {
  const response = await api.post<Appointment>(`/appointments/${id}/${action}/`);
  return response.data;
}

export async function approveSurgery(id: number): Promise<Appointment> {
  const response = await api.post<Appointment>(`/appointments/${id}/approve-surgery/`);
  return response.data;
}

export async function sendMessage(appointmentId: number, content: string): Promise<Message> {
  const response = await api.post<Message>(`/appointments/${appointmentId}/messages/`, { content });
  return response.data;
}

export async function uploadMedicalFile(
  appointmentId: number,
  payload: { file: File; file_type: MedicalFile['file_type']; description: string },
): Promise<MedicalFile> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('file_type', payload.file_type);
  formData.append('description', payload.description);
  const response = await api.post<MedicalFile>(`/appointments/${appointmentId}/files/`, formData);
  return response.data;
}
