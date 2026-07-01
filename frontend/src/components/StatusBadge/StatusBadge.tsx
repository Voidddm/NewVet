import type { AppointmentStatus } from '../../types';

const styles: Record<AppointmentStatus, string> = {
  pending: 'bg-coral/35 text-ink ring-coral',
  accepted: 'bg-lavender/15 text-ink ring-lavender/40',
  in_progress: 'bg-lavender text-white ring-lavender',
  finalized: 'bg-white text-ink ring-mauve',
  rejected: 'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
  completed: 'bg-white text-ink ring-mauve',
};

const labels: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  in_progress: 'En curso',
  finalized: 'Finalizada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Completada',
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
