import { Calendar, ChevronRight, FileText, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { StatusTrafficLight } from './StatusTrafficLight';
import type { Appointment } from '../../types';
import { formatDate, modeLabel } from '../../utils/format';
import { medicalFilesCount, petLabel } from '../../utils/appointmentDisplay';

export interface AppointmentListRowProps {
  appointment: Appointment;
  serviceName: string;
  partyLabel: string;
  partyName: string;
  showActions?: boolean;
  onCancel?: (id: number) => void;
  onReschedule?: (appointment: Appointment) => void;
}

export function AppointmentListRow({
  appointment,
  serviceName,
  partyLabel,
  partyName,
  showActions = false,
  onCancel,
  onReschedule,
}: AppointmentListRowProps) {
  const files = medicalFilesCount(appointment);
  const canAct =
    showActions && (appointment.status === 'pending' || appointment.status === 'accepted');

  return (
    <div className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <StatusTrafficLight status={appointment.status} />
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-slate-100 text-teal">
          <Calendar size={20} aria-hidden="true" />
        </div>
      </div>

      <Link className="min-w-0 hover:bg-slate-50 sm:rounded-md sm:px-2 sm:py-1" to={`/appointments/${appointment.id}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          <span className="text-sm font-medium text-slate-600">{modeLabel(appointment.mode)}</span>
        </div>
        <p className="font-semibold text-ink">{serviceName}</p>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(appointment.date)} · {appointment.time.slice(0, 5)}
        </p>
        <dl className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{partyLabel}</dt>
            <dd className="font-medium text-ink">{partyName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Mascota</dt>
            <dd className="font-medium text-ink">{petLabel(appointment)}</dd>
          </div>
        </dl>
      </Link>

      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <FileText size={16} aria-hidden="true" />
            {files} archivos
          </span>
          <ChevronRight className="hidden text-slate-300 sm:block" size={18} aria-hidden="true" />
        </div>
        {showActions && canAct && (
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReschedule?.(appointment);
              }}
              type="button"
            >
              Cambiar hora
            </button>
            <button
              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel?.(appointment.id);
              }}
              type="button"
            >
              Anular hora
            </button>
          </div>
        )}
        {showActions && !canAct && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400">
            <MoreHorizontal size={14} aria-hidden="true" />
            Sin acciones disponibles
          </span>
        )}
      </div>
    </div>
  );
}
