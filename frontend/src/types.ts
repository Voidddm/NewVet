export type UserRole = 'admin' | 'veterinarian' | 'client';

export type AppointmentStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'finalized'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export type AppointmentMode = 'online' | 'home' | 'surgery';

export type FileType = 'image' | 'pdf' | 'audio' | 'other';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  commune: string;
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
  tipo?: 'presencial' | 'teleconsulta';
  client: number;
  veterinarian: number;
  /** Presente en respuestas de listado y detalle cuando el backend lo incluye. */
  client_name?: string;
  veterinarian_name?: string;
  /** Nombre de mascota indicado al reservar o editado por el tutor. */
  pet_name?: string;
  pet_avatar_data_url?: string;
  teleconsulta_link?: string | null;
  service: number;
  date: string;
  time: string;
  mode: AppointmentMode;
  status: AppointmentStatus;
  surgery_room: number | null;
  referral_file: string | null;
  is_surgery_approved: boolean;
  messaging_enabled: boolean;
  client_case_notes: string;
  created_at: string;
  accepted_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  started_at: string | null;
  finalized_at: string | null;
  /** En listados resumidos; en detalle vienen los archivos completos. */
  medical_files_count?: number;
  medical_files?: MedicalFile[];
  messages?: Message[];
}

export interface AppointmentCreatePayload {
  veterinarian: number;
  service: number;
  date: string;
  time: string;
  mode: AppointmentMode;
  surgery_room?: number;
  referral_file?: File;
  pet_name?: string;
  pet_avatar_data_url?: string;
}

/** Query params soportados por GET /appointments/client/ y /veterinarian/ */
export interface AppointmentListParams {
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  tipo?: string;
  type?: string;
  mode?: string;
  search?: string;
  ordering?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}
