import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Clock, Video } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import {
  finalizeTeleconsultation,
  getTeleconsultation,
  startTeleconsultation,
} from '../../services/api';
import type { Appointment, User } from '../../types';
import { formatDate } from '../../utils/format';

interface TeleconsultationPageProps {
  user: User;
}

export function TeleconsultationPage({ user }: TeleconsultationPageProps) {
  const { uuid } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    try {
      setAppointment(await getTeleconsultation(uuid));
    } catch {
      setError('No se pudo cargar la teleconsulta.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [uuid]);

  const startsAt = useMemo(() => {
    if (!appointment) return null;
    return new Date(`${appointment.date}T${appointment.time}`);
  }, [appointment]);

  async function handleStart() {
    if (!appointment) return;
    setBusy(true);
    try {
      setAppointment(await startTeleconsultation(appointment.id));
    } finally {
      setBusy(false);
    }
  }

  async function handleFinalize() {
    if (!appointment) return;
    setBusy(true);
    try {
      setAppointment(await finalizeTeleconsultation(appointment.id));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="rounded-md border border-blush bg-white p-5 text-sm text-slate-500">Cargando teleconsulta</p>;
  }

  if (error || !appointment || !startsAt) {
    return <p className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">{error ?? 'Teleconsulta no encontrada.'}</p>;
  }

  const isVeterinarian = appointment.veterinarian === user.id;
  const isBefore = Date.now() < startsAt.getTime();
  const roomName = `NewVet-${appointment.teleconsulta_link}`;
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}#config.prejoinPageEnabled=false`;

  return (
    <div className="space-y-5">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink" to={`/appointments/${appointment.id}`}>
        <ArrowLeft size={18} aria-hidden="true" />
        Volver a la cita
      </Link>

      <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={appointment.status} />
              <span className="rounded-md bg-blush px-2.5 py-1 text-xs font-semibold text-ink">Teleconsulta</span>
            </div>
            <h1 className="text-2xl font-semibold text-ink">Sala de teleconsulta</h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(appointment.date)} - {appointment.time.slice(0, 5)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isVeterinarian && appointment.status === 'accepted' && !isBefore && (
              <button
                className="rounded-md bg-lavender px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={busy}
                onClick={() => void handleStart()}
                type="button"
              >
                Iniciar consulta
              </button>
            )}
            {isVeterinarian && appointment.status === 'in_progress' && (
              <button
                className="rounded-md bg-mauve px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={busy}
                onClick={() => void handleFinalize()}
                type="button"
              >
                Finalizar consulta
              </button>
            )}
          </div>
        </div>
      </section>

      {isBefore ? (
        <section className="rounded-md border border-blush bg-white p-8 text-center shadow-soft">
          <Clock className="mx-auto text-lavender" size={34} aria-hidden="true" />
          <h2 className="mt-3 text-xl font-semibold text-ink">La consulta aun no comienza</h2>
          <p className="mt-2 text-sm text-slate-600">La sala se habilitara a la hora agendada.</p>
        </section>
      ) : appointment.status === 'accepted' ? (
        <section className="rounded-md border border-blush bg-white p-8 text-center shadow-soft">
          <Video className="mx-auto text-lavender" size={34} aria-hidden="true" />
          <h2 className="mt-3 text-xl font-semibold text-ink">Sala de espera</h2>
          <p className="mt-2 text-sm text-slate-600">
            La teleconsulta esta lista. El profesional debe iniciar la llamada para abrir el video.
          </p>
        </section>
      ) : appointment.status === 'in_progress' ? (
        <section className="overflow-hidden rounded-md border border-blush bg-white shadow-soft">
          <iframe
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="h-[72vh] w-full"
            src={jitsiUrl}
            title="Videollamada NewVet"
          />
        </section>
      ) : appointment.status === 'finalized' || appointment.status === 'completed' ? (
        <section className="rounded-md border border-blush bg-white p-8 text-center shadow-soft">
          <h2 className="text-xl font-semibold text-ink">Teleconsulta finalizada</h2>
          <p className="mt-2 text-sm text-slate-600">La videollamada de esta cita ya fue cerrada.</p>
        </section>
      ) : (
        <section className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center shadow-soft">
          <h2 className="text-xl font-semibold text-slate-600">Teleconsulta no disponible</h2>
          <p className="mt-2 text-sm text-slate-500">Esta cita no esta aceptada o fue cancelada.</p>
        </section>
      )}
    </div>
  );
}
