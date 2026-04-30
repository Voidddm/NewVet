import { useEffect, useState } from 'react';
import { ArrowLeft, Check, ShieldCheck, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ChatPanel } from '../../components/Chat/ChatPanel';
import { FileUploadPanel } from '../../components/FileUpload/FileUploadPanel';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { approveSurgery, getAppointment, updateAppointmentStatus } from '../../services/api';
import type { Appointment, User } from '../../types';
import { formatDate, modeLabel } from '../../utils/format';

interface AppointmentDetailPageProps {
  user: User;
}

export function AppointmentDetailPage({ user }: AppointmentDetailPageProps) {
  const { id } = useParams();
  const appointmentId = Number(id);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAppointment() {
    setLoading(true);
    setError(null);
    try {
      setAppointment(await getAppointment(appointmentId));
    } catch {
      setError('No se pudo cargar la cita.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAppointment();
  }, [appointmentId]);

  async function handleAction(action: 'accept' | 'reject' | 'cancel' | 'complete') {
    setAppointment(await updateAppointmentStatus(appointmentId, action));
  }

  async function handleApproveSurgery() {
    setAppointment(await approveSurgery(appointmentId));
  }

  if (loading) {
    return <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando cita</p>;
  }

  if (error || !appointment) {
    return <p className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">{error ?? 'Cita no encontrada.'}</p>;
  }

  const isVeterinarian = appointment.veterinarian === user.id;
  const canUsePanel = appointment.status === 'accepted';
  const canUpload = appointment.status === 'pending' || appointment.status === 'accepted';

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink" to="/appointments">
        <ArrowLeft size={18} aria-hidden="true" />
        Volver a citas
      </Link>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={appointment.status} />
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {modeLabel(appointment.mode)}
              </span>
              {appointment.mode === 'surgery' && appointment.is_surgery_approved && (
                <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                  <ShieldCheck size={14} aria-hidden="true" />
                  Cirugia aprobada
                </span>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-ink">Cita #{appointment.id}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(appointment.date)} · {appointment.time.slice(0, 5)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isVeterinarian && appointment.status === 'pending' && (
              <>
                <button className="icon-action bg-teal text-white" onClick={() => void handleAction('accept')} title="Aceptar cita" type="button">
                  <Check size={18} aria-hidden="true" />
                </button>
                <button className="icon-action bg-rose-600 text-white" onClick={() => void handleAction('reject')} title="Rechazar cita" type="button">
                  <X size={18} aria-hidden="true" />
                </button>
              </>
            )}
            {appointment.status === 'accepted' && (
              <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => void handleAction('complete')} type="button">
                Completar
              </button>
            )}
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" onClick={() => void handleAction('cancel')} type="button">
                Cancelar
              </button>
            )}
            {isVeterinarian && appointment.mode === 'surgery' && !appointment.is_surgery_approved && (
              <button className="rounded-md bg-amber px-3 py-2 text-sm font-semibold text-white" onClick={() => void handleApproveSurgery()} type="button">
                Aprobar cirugia
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <ChatPanel
          appointmentId={appointment.id}
          currentUser={user}
          disabled={!canUsePanel}
          messages={appointment.messages}
          onMessageSent={loadAppointment}
        />
        <FileUploadPanel
          appointmentId={appointment.id}
          canUpload={canUpload}
          files={appointment.medical_files}
          onUploaded={loadAppointment}
        />
      </div>
    </div>
  );
}
