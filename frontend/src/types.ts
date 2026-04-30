export type UserRole = 'admin' | 'veterinarian' | 'client';

export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export type AppointmentMode = 'online' | 'home' | 'surgery';

export type FileType = 'image' | 'pdf' | 'audio' | 'other';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_staff: boolean;
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  service_type: 'clinic' | 'home' | 'online' | 'surgery';
  price: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SurgeryRoom {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  is_active: boolean;
}

export interface MedicalFile {
  id: number;
  appointment: number;
  uploaded_by: number;
  file: string;
  file_type: FileType;
  description: string;
  created_at: string;
}

export interface Message {
  id: number;
  appointment: number;
  sender: number;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface Appointment {
  id: number;
  client: number;
  veterinarian: number;
  service: number;
  date: string;
  time: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  surgery_room: number | null;
  referral_file: string | null;
  is_surgery_approved: boolean;
  created_at: string;
  accepted_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  medical_files: MedicalFile[];
  messages: Message[];
}

export interface AppointmentCreatePayload {
  veterinarian: number;
  service: number;
  date: string;
  time: string;
  mode: AppointmentMode;
  surgery_room?: number;
  referral_file?: File;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
