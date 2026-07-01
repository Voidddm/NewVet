import type { Appointment, AppointmentStatus } from '../types';

/** Verde: aceptada/en curso/finalizada; amarillo: pendiente; rojo: cancelada o rechazada. */
export type TrafficTone = 'green' | 'yellow' | 'red';

export function trafficToneForStatus(status: AppointmentStatus): TrafficTone {
  if (status === 'accepted' || status === 'in_progress' || status === 'finalized' || status === 'completed') {
    return 'green';
  }
  if (status === 'pending') return 'yellow';
  if (status === 'cancelled' || status === 'rejected') return 'red';
  return 'yellow';
}

export function petLabel(appointment: Pick<Appointment, 'pet_name'>): string {
  const n = appointment.pet_name?.trim();
  return n || 'Sin indicar';
}

export function petAvatar(appointment: Pick<Appointment, 'pet_avatar_data_url'>): string | undefined {
  const value = appointment.pet_avatar_data_url?.trim();
  return value || undefined;
}

export function medicalFilesCount(appointment: Appointment): number {
  if (typeof appointment.medical_files_count === 'number') {
    return appointment.medical_files_count;
  }
  return appointment.medical_files?.length ?? 0;
}

export function canCancelOrReschedule(appointment: Appointment): boolean {
  return appointment.status === 'pending' || appointment.status === 'accepted';
}
