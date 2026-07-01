import { Bone, Calendar, ChevronRight, FileText, MoreHorizontal, RotateCcw, Video, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../StatusBadge/StatusBadge';
import { StatusTrafficLight } from './StatusTrafficLight';
import type { Appointment } from '../../types';
import { formatDate, modeLabel } from '../../utils/format';
import { medicalFilesCount, petAvatar, petLabel } from '../../utils/appointmentDisplay';

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
  const avatar = petAvatar(appointment);
  const canAct =
    showActions && (appointment.status === 'pending' || appointment.status === 'accepted');
  const canEnterTeleconsultation =
    appointment.mode === 'online' &&
    Boolean(appointment.teleconsulta_link) &&
    (appointment.status === 'accepted' || appointment.status === 'in_progress');
  const rowTone = rowToneForStatus(appointment.status);

  return (
    <div
      className={`grid gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
        rowTone
      }`}
    >
      <div className="flex items-center gap-3">
        <StatusTrafficLight status={appointment.status} />
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-lavender ring-1 ring-blush">
          <Calendar size={20} aria-hidden="true" />
        </div>
      </div>

      <Link className="min-w-0 hover:bg-white/70 sm:rounded-md sm:px-2 sm:py-1" to={`/appointments/${appointment.id}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={appointment.status} />
          <span className="text-sm font-medium text-slate-600">{modeLabel(appointment.mode)}</span>
        </div>
        <p className="font-semibold text-ink">{serviceName}</p>
        <p className="mt-1 text-sm text-slate-500">
          {formatDate(appointment.date)} - {appointment.time.slice(0, 5)}
        </p>
        <dl className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{partyLabel}</dt>
            <dd className="font-medium text-ink">{partyName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Mascota</dt>
            <dd className="mt-1 flex items-center gap-2 font-medium text-ink">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md bg-white text-lavender ring-1 ring-blush">
                {avatar ? (
                  <img alt="" className="h-full w-full object-cover" src={avatar} />
                ) : (
                  <Bone size={17} aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 truncate">{petLabel(appointment)}</span>
            </dd>
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
              className="inline-flex items-center gap-1 rounded-md border border-lavender/30 bg-white px-3 py-1.5 text-xs font-semibold text-lavender hover:bg-mist"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReschedule?.(appointment);
              }}
              type="button"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Cambiar hora
            </button>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel?.(appointment.id);
              }}
              type="button"
            >
              <XCircle size={14} aria-hidden="true" />
              Anular hora
            </button>
          </div>
        )}
        {canEnterTeleconsultation && (
          <Link
            className="inline-flex items-center gap-1 rounded-md bg-lavender px-3 py-1.5 text-xs font-semibold text-white hover:bg-lavender/90"
            to={`/teleconsulta/${appointment.teleconsulta_link}`}
          >
            <Video size={14} aria-hidden="true" />
            Entrar
          </Link>
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

function rowToneForStatus(status: Appointment['status']): string {
  if (status === 'pending') {
    return 'border-coral/50 bg-coral/25';
  }
  if (status === 'accepted') {
    return 'border-lavender/30 bg-white';
  }
  if (status === 'in_progress') {
    return 'border-lavender/60 bg-lavender/10';
  }
  if (status === 'finalized' || status === 'completed') {
    return 'border-mauve/40 bg-mist/60';
  }
  return 'border-slate-200 bg-slate-50 text-slate-500';
}
