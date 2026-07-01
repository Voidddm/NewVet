import { useEffect, useState } from 'react';
import { ArrowLeft, Bone, Check, MessageCircle, ShieldCheck, Video, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ChatPanel } from '../../components/Chat/ChatPanel';
import { FileUploadPanel } from '../../components/FileUpload/FileUploadPanel';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import {
  approveSurgery,
  finalizeTeleconsultation,
  getAppointment,
  patchAppointment,
  startTeleconsultation,
  updateAppointmentStatus,
} from '../../services/api';
import type { Appointment, User } from '../../types';
import { petAvatar, petLabel } from '../../utils/appointmentDisplay';
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
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [messagingBusy, setMessagingBusy] = useState(false);

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

  useEffect(() => {
    if (!appointment) {
      setNotesDraft('');
      return;
    }
    setNotesDraft(appointment.client_case_notes ?? '');
  }, [appointment?.id, appointment?.client_case_notes]);

  async function handleAction(action: 'accept' | 'reject' | 'cancel' | 'complete') {
    setAppointment(await updateAppointmentStatus(appointmentId, action));
  }

  async function handleStartTeleconsultation() {
    setAppointment(await startTeleconsultation(appointmentId));
  }

  async function handleFinalizeTeleconsultation() {
    setAppointment(await finalizeTeleconsultation(appointmentId));
  }

  async function handleApproveSurgery() {
    setAppointment(await approveSurgery(appointmentId));
  }

  async function handleSaveCaseNotes() {
    if (!appointment) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      setAppointment(await patchAppointment(appointment.id, { client_case_notes: notesDraft }));
    } catch {
      setNotesError('No se pudieron guardar las notas.');
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleToggleMessaging(next: boolean) {
    if (!appointment) return;
    setMessagingBusy(true);
    try {
      setAppointment(await patchAppointment(appointment.id, { messaging_enabled: next }));
    } finally {
      setMessagingBusy(false);
    }
  }

  if (loading) {
    return <p className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-500">Cargando cita</p>;
  }

  if (error || !appointment) {
    return <p className="rounded-md bg-rose-50 p-4 text-sm text-rose-700">{error ?? 'Cita no encontrada.'}</p>;
  }

  const isVeterinarian = appointment.veterinarian === user.id;
  const isClient = appointment.client === user.id;
  const canUpload = appointment.status === 'pending' || appointment.status === 'accepted';
  const canEditCaseNotes =
    isClient && (appointment.status === 'pending' || appointment.status === 'accepted');
  const chatActive =
    (appointment.status === 'accepted' || appointment.status === 'in_progress') && appointment.messaging_enabled;
  const chatPlaceholder =
    appointment.status !== 'accepted'
      ? undefined
      : !appointment.messaging_enabled
        ? isVeterinarian
          ? 'Habilita el chat arriba para enviar mensajes al tutor.'
          : 'El veterinario aun no ha habilitado el chat para esta cita.'
        : undefined;

  return (
    <div className="space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink" to="/appointments">
        <ArrowLeft size={18} aria-hidden="true" />
        Volver a citas
      </Link>

      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
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
              {formatDate(appointment.date)} - {appointment.time.slice(0, 5)}
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-md border border-slate-100 bg-mist/60 p-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-white text-teal ring-1 ring-slate-200">
                {petAvatar(appointment) ? (
                  <img alt="" className="h-full w-full object-cover" src={petAvatar(appointment)} />
                ) : (
                  <Bone size={24} aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Mascota</span>
                <span className="block truncate font-semibold text-ink">{petLabel(appointment)}</span>
              </span>
            </div>
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
            {isVeterinarian && appointment.mode === 'online' && appointment.status === 'accepted' && (
              <button className="rounded-md bg-lavender px-3 py-2 text-sm font-semibold text-white" onClick={() => void handleStartTeleconsultation()} type="button">
                Iniciar teleconsulta
              </button>
            )}
            {isVeterinarian && appointment.mode === 'online' && appointment.status === 'in_progress' && (
              <button className="rounded-md bg-mauve px-3 py-2 text-sm font-semibold text-white" onClick={() => void handleFinalizeTeleconsultation()} type="button">
                Finalizar teleconsulta
              </button>
            )}
            {appointment.status !== 'cancelled' && appointment.status !== 'completed' && appointment.status !== 'finalized' && (
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
        <div className="space-y-4">
          {appointment.mode === 'online' && appointment.teleconsulta_link && (
            <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <Video className="text-lavender" size={20} aria-hidden="true" />
                <h2 className="font-semibold text-ink">Teleconsulta</h2>
              </div>
              <p className="text-sm text-slate-600">
                La sala usa un enlace privado asociado a esta cita.
              </p>
              <Link
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-lavender px-4 py-2 text-sm font-semibold text-white hover:bg-lavender/90"
                to={`/teleconsulta/${appointment.teleconsulta_link}`}
              >
                <Video size={17} aria-hidden="true" />
                Entrar a la consulta
              </Link>
            </section>
          )}
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <MessageCircle className="text-teal" size={20} aria-hidden="true" />
              <h2 className="font-semibold text-ink">Comunicacion y descripcion del caso</h2>
            </div>
            <p className="text-sm text-slate-600">
              El chat con el veterinario solo funciona cuando la cita esta aceptada y el profesional habilita expresamente
              ese canal, para coordinar la atencion sin mensajes no deseados.
            </p>

            {(canEditCaseNotes || (isVeterinarian && appointment.client_case_notes.trim())) && (
              <div className="mt-4 rounded-md border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-ink">Descripcion del caso (tutor)</p>
                <p className="mt-1 text-xs text-slate-500">
                  Alergias, conducta, antecedentes o cualquier detalle que deba conocer el veterinario antes o durante la
                  visita.
                </p>
                {canEditCaseNotes ? (
                  <>
                    <textarea
                      className="mt-3 min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      onChange={(e) => setNotesDraft(e.target.value)}
                      value={notesDraft}
                    />
                    {notesError && <p className="mt-2 text-sm text-rose-700">{notesError}</p>}
                    <button
                      className="mt-3 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                      disabled={notesSaving}
                      onClick={() => void handleSaveCaseNotes()}
                      type="button"
                    >
                      Guardar descripcion
                    </button>
                  </>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{appointment.client_case_notes}</p>
                )}
              </div>
            )}

            {isVeterinarian && appointment.status === 'accepted' && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-md border border-teal-100 bg-teal-50/60 p-4">
                <input
                  checked={appointment.messaging_enabled}
                  className="mt-1 h-4 w-4"
                  disabled={messagingBusy}
                  onChange={(e) => void handleToggleMessaging(e.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm text-ink">
                  <span className="font-semibold">Permitir mensajes del tutor por chat</span>
                  <span className="mt-1 block text-slate-600">
                    Desactiva esta opcion si prefieres no recibir insistencias por mensaje; el tutor vera que el chat no
                    esta disponible hasta que lo vuelvas a activar.
                  </span>
                </span>
              </label>
            )}

            {(appointment.status === 'accepted' || appointment.status === 'in_progress') && !appointment.messaging_enabled && isClient && (
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-ink">Mensajes con el veterinario</p>
                <p className="mt-1">
                  Por ahora el chat no esta habilitado. Cuando el veterinario lo active para esta cita, podras escribir
                  aqui mismo.
                </p>
              </div>
            )}

            {(appointment.status === 'accepted' || appointment.status === 'in_progress') && (
              <div className="mt-4">
                <ChatPanel
                  appointmentId={appointment.id}
                  currentUser={user}
                  disabled={!chatActive}
                  inputPlaceholder={chatPlaceholder}
                  messages={appointment.messages ?? []}
                  onMessageSent={loadAppointment}
                />
              </div>
            )}
          </section>
        </div>
        <FileUploadPanel
          appointmentId={appointment.id}
          canUpload={canUpload}
          files={appointment.medical_files ?? []}
          onUploaded={loadAppointment}
        />
      </div>
    </div>
  );
}
