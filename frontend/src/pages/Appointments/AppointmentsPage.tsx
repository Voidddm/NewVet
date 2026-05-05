import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppointmentListRow } from '../../components/appointments/AppointmentListRow';
import { getAppointments, getServices, getVeterinarians } from '../../services/api';
import type { Appointment, Service, User } from '../../types';

interface AppointmentsPageProps {
  user: User;
}

export function AppointmentsPage({ user }: AppointmentsPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [veterinarians, setVeterinarians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [appointmentData, serviceData, vetData] = await Promise.all([
          getAppointments(user.role),
          getServices(),
          getVeterinarians(),
        ]);
        setAppointments(appointmentData);
        setServices(serviceData);
        setVeterinarians(vetData);
      } catch {
        setError('No se pudieron cargar las citas.');
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [user.role]);

  const latestAppointments = appointments.slice(0, 3);
  const servicesById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);
  const vetsById = useMemo(() => new Map(veterinarians.map((vet) => [vet.id, vet])), [veterinarians]);

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Inicio</h1>
            <p className="mt-1 text-sm text-slate-500">Resumen de actividad clinica y accesos principales.</p>
          </div>
          {user.role === 'client' && (
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white hover:bg-teal-700"
              to="/reserve"
            >
              <CalendarPlus size={18} aria-hidden="true" />
              Reservar hora
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Ultimas citas</h2>
            <p className="text-sm text-slate-500">Se muestran las 3 citas mas recientes.</p>
          </div>
          {appointments.length > 3 && (
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-teal" to="/check-appointment">
              Ver mas
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </div>

        {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Cargando citas</p>
          ) : latestAppointments.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No hay citas registradas.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {latestAppointments.map((appointment) => {
                const service = servicesById.get(appointment.service);
                const vet = vetsById.get(appointment.veterinarian);
                const partyLabel = user.role === 'veterinarian' ? 'Cliente' : 'Veterinario';
                const partyName =
                  user.role === 'veterinarian'
                    ? appointment.client_name ?? vet?.name ?? `Cliente #${appointment.client}`
                    : appointment.veterinarian_name ?? vet?.name ?? `Vet #${appointment.veterinarian}`;
                return (
                  <AppointmentListRow
                    appointment={appointment}
                    key={appointment.id}
                    partyLabel={partyLabel}
                    partyName={partyName}
                    serviceName={service?.name ?? `Servicio #${appointment.service}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
