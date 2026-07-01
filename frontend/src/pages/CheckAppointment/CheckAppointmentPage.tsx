import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Filter, RotateCcw, XCircle } from 'lucide-react';
import { AppointmentListRow } from '../../components/appointments/AppointmentListRow';
import {
  getAppointments,
  getServices,
  rescheduleAppointment,
  updateAppointmentStatus,
} from '../../services/api';
import type { Appointment, AppointmentListParams, AppointmentStatus, User } from '../../types';

interface CheckAppointmentPageProps {
  user: User;
}

const ALL_STATUSES: AppointmentStatus[] = [
  'pending',
  'accepted',
  'in_progress',
  'finalized',
  'cancelled',
  'rejected',
  'completed',
];

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  in_progress: 'En curso',
  finalized: 'Finalizada',
  cancelled: 'Cancelada',
  rejected: 'Rechazada',
  completed: 'Completada',
};

export function CheckAppointmentPage({ user }: CheckAppointmentPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [serviceMap, setServiceMap] = useState<Map<number, string>>(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateMode, setDateMode] = useState<'none' | 'day' | 'range'>('none');
  const [day, setDay] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilters, setStatusFilters] = useState<AppointmentStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-date');

  const [cancelId, setCancelId] = useState<number | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const buildParams = useCallback((): AppointmentListParams => {
    const p: AppointmentListParams = { ordering };
    if (search.trim()) p.search = search.trim();
    if (statusFilters.length > 0) {
      p.status = statusFilters.join(',');
    }
    if (typeFilter) p.tipo = typeFilter;
    if (dateMode === 'day' && day) {
      p.date = day;
    } else if (dateMode === 'range') {
      if (dateFrom) p.date_from = dateFrom;
      if (dateTo) p.date_to = dateTo;
    }
    return p;
  }, [ordering, search, statusFilters, typeFilter, dateMode, day, dateFrom, dateTo]);

  const load = useCallback(async () => {
    if (user.role !== 'client' && user.role !== 'veterinarian') {
      setAppointments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointments(user.role, buildParams());
      setAppointments(data);
    } catch {
      setError('No se pudieron cargar las citas.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user.role, buildParams]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void getServices().then((list) => {
      setServiceMap(new Map(list.map((s) => [s.id, s.name])));
    });
  }, []);

  function toggleStatus(st: AppointmentStatus) {
    setStatusFilters((prev) =>
      prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st],
    );
  }

  function resetFilters() {
    setDateMode('none');
    setDay('');
    setDateFrom('');
    setDateTo('');
    setStatusFilters([]);
    setTypeFilter('');
    setSearch('');
    setOrdering('-date');
  }

  function partyMeta(appointment: Appointment) {
    if (user.role === 'veterinarian') {
      return {
        partyLabel: 'Cliente',
        partyName: appointment.client_name ?? `Cliente #${appointment.client}`,
      };
    }
    return {
      partyLabel: 'Veterinario',
      partyName: appointment.veterinarian_name ?? `Vet #${appointment.veterinarian}`,
    };
  }

  function orderingOptions(): { value: string; label: string }[] {
    const partySort =
      user.role === 'veterinarian'
        ? [
            { value: 'client_name', label: 'Cliente (A-Z)' },
            { value: '-client_name', label: 'Cliente (Z-A)' },
          ]
        : [
            { value: 'veterinarian_name', label: 'Veterinario (A-Z)' },
            { value: '-veterinarian_name', label: 'Veterinario (Z-A)' },
          ];
    return [
      { value: '-date', label: 'Fecha (mas reciente)' },
      { value: 'date', label: 'Fecha (mas antigua)' },
      { value: 'status', label: 'Estado (A-Z)' },
      { value: '-status', label: 'Estado (Z-A)' },
      ...partySort,
    ];
  }

  const pendingCount = appointments.filter((appointment) => appointment.status === 'pending').length;
  const actionableCount = appointments.filter((appointment) =>
    appointment.status === 'pending' || appointment.status === 'accepted',
  ).length;

  async function confirmCancel() {
    if (cancelId === null) return;
    setActionBusy(true);
    setError(null);
    try {
      await updateAppointmentStatus(cancelId, 'cancel');
      setCancelId(null);
      await load();
    } catch {
      setError('No se pudo anular la cita.');
    } finally {
      setActionBusy(false);
    }
  }

  function openReschedule(a: Appointment) {
    setRescheduleTarget(a);
    setRescheduleDate(a.date);
    setRescheduleTime(a.time.slice(0, 5));
  }

  async function confirmReschedule() {
    if (!rescheduleTarget) return;
    setActionBusy(true);
    setError(null);
    try {
      await rescheduleAppointment(rescheduleTarget.id, {
        date: rescheduleDate,
        time: rescheduleTime.length === 5 ? `${rescheduleTime}:00` : rescheduleTime,
      });
      setRescheduleTarget(null);
      await load();
    } catch {
      setError('No se pudo cambiar la hora. Verifica que el nuevo horario este libre.');
    } finally {
      setActionBusy(false);
    }
  }

  if (user.role !== 'client' && user.role !== 'veterinarian') {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Consulta de hora</h1>
        <p className="mt-2 text-sm text-slate-600">Esta vista esta disponible para tutores y veterinarios.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-ink">Consulta de hora</h1>
        <p className="mt-1 text-sm text-slate-500">
          Revisa tus citas, cambia una hora o anula una atencion pendiente desde el mismo listado.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-coral/60 bg-coral/25 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{pendingCount}</p>
          </div>
          <div className="rounded-md border border-lavender/30 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-lavender">Con acciones</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{actionableCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Filter className="text-teal" size={20} aria-hidden="true" />
          <h2 className="text-lg font-semibold text-ink">Filtros</h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-md border border-blush/70 bg-mist/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</p>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={dateMode === 'none'}
                  name="dateMode"
                  onChange={() => setDateMode('none')}
                  type="radio"
                />
                Cualquier fecha
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={dateMode === 'day'}
                  name="dateMode"
                  onChange={() => setDateMode('day')}
                  type="radio"
                />
                Dia
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={dateMode === 'range'}
                  name="dateMode"
                  onChange={() => setDateMode('range')}
                  type="radio"
                />
                Rango
              </label>
            </div>
            {dateMode === 'day' && (
              <input
                className="mt-3 h-10 rounded-md border border-slate-300 px-3 text-sm"
                onChange={(e) => setDay(e.target.value)}
                type="date"
                value={day}
              />
            )}
            {dateMode === 'range' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(e) => setDateFrom(e.target.value)}
                  type="date"
                  value={dateFrom}
                />
                <span className="self-center text-sm text-slate-500">hasta</span>
                <input
                  className="h-10 rounded-md border border-slate-300 px-3 text-sm"
                  onChange={(e) => setDateTo(e.target.value)}
                  type="date"
                  value={dateTo}
                />
              </div>
            )}
          </div>

          <div className="rounded-md border border-blush/70 bg-mist/50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Buscar (nombre, mascota o notas)
            </label>
            <input
              className="h-10 w-full max-w-md rounded-md border border-slate-300 px-3 text-sm"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Luna, dermatitis..."
              type="search"
              value={search}
            />
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tipo
              <select
                className="mt-2 h-10 w-full max-w-md rounded-md border border-slate-300 px-3 text-sm normal-case tracking-normal"
                onChange={(e) => setTypeFilter(e.target.value)}
                value={typeFilter}
              >
                <option value="">Todas</option>
                <option value="teleconsulta">Teleconsulta</option>
                <option value="presencial">Presencial</option>
              </select>
            </label>
          </div>
          <div className="rounded-md border border-blush/70 bg-mist/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</p>
            <div className="flex flex-wrap gap-3">
              {ALL_STATUSES.map((st) => (
                <label className="flex items-center gap-2 text-sm" key={st}>
                  <input
                    checked={statusFilters.includes(st)}
                    onChange={() => toggleStatus(st)}
                    type="checkbox"
                  />
                  {STATUS_LABEL[st]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Sin ninguno marcado se muestran todos los estados.</p>
          </div>

          <div className="rounded-md border border-blush/70 bg-mist/50 p-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ordenar por
              </span>
              <select
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                onChange={(e) => setOrdering(e.target.value)}
                value={ordering}
              >
                {orderingOptions().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-lavender/30 bg-white px-3 text-sm font-semibold text-lavender hover:bg-blush/40"
              onClick={() => resetFilters()}
              type="button"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <section>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">Citas</h2>
          <span className="text-sm text-slate-500">{appointments.length} resultado(s)</span>
        </div>

        <div className="overflow-hidden rounded-md border border-blush bg-white shadow-soft">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Cargando citas</p>
          ) : appointments.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No hay citas que coincidan con los filtros.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {appointments.map((appointment) => {
                const meta = partyMeta(appointment);
                return (
                  <AppointmentListRow
                    appointment={appointment}
                    key={appointment.id}
                    onCancel={(id) => setCancelId(id)}
                    onReschedule={openReschedule}
                    partyLabel={meta.partyLabel}
                    partyName={meta.partyName}
                    serviceName={serviceMap.get(appointment.service) ?? `Servicio #${appointment.service}`}
                    showActions
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {cancelId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-lg" role="dialog">
            <div className="flex items-center gap-2">
              <XCircle className="text-rose-600" size={20} aria-hidden="true" />
              <h3 className="text-lg font-semibold text-ink">Anular cita</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              La cita pasara a estado cancelada. Esta accion queda registrada.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                disabled={actionBusy}
                onClick={() => setCancelId(null)}
                type="button"
              >
                Volver
              </button>
              <button
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                disabled={actionBusy}
                onClick={() => void confirmCancel()}
                type="button"
              >
                Confirmar anulacion
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-lg" role="dialog">
            <div className="flex items-center gap-2">
              <CalendarClock className="text-teal" size={20} aria-hidden="true" />
              <h3 className="text-lg font-semibold text-ink">Cambiar hora</h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">Elige nueva fecha y hora para la cita #{rescheduleTarget.id}.</p>
            <div className="mt-4 grid gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Fecha
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  type="date"
                  value={rescheduleDate}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Hora
                <input
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  type="time"
                  value={rescheduleTime}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                disabled={actionBusy}
                onClick={() => setRescheduleTarget(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                disabled={actionBusy}
                onClick={() => void confirmReschedule()}
                type="button"
              >
                Guardar cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
