import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthPage } from './pages/Auth/AuthPage';
import { AppointmentDetailPage } from './pages/AppointmentDetail/AppointmentDetailPage';
import { AppointmentsPage } from './pages/Appointments/AppointmentsPage';
import { ReserveAppointmentPage } from './pages/ReserveAppointment/ReserveAppointmentPage';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const auth = useAuth();

  if (auth.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist text-ink">
        <div className="rounded-md border border-slate-200 bg-white px-5 py-4 shadow-soft">
          Cargando NewVet
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage onLogin={auth.reloadUser} />} />
      </Routes>
    );
  }

  return (
    <AppShell user={auth.user} onLogout={auth.logout}>
      <Routes>
        <Route path="/" element={<AppointmentsPage user={auth.user} />} />
        <Route path="/appointments" element={<AppointmentsPage user={auth.user} />} />
        <Route path="/appointments/:id" element={<AppointmentDetailPage user={auth.user} />} />
        <Route path="/reserve" element={<ReserveAppointmentPage user={auth.user} />} />
        <Route path="/check-appointment" element={<PlaceholderPage title="Consulta de Hora" />} />
        <Route path="/cancel-appointment" element={<PlaceholderPage title="Anular hora" />} />
        <Route path="/change-appointment" element={<PlaceholderPage title="Cambiar Hora" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">Modulo pendiente para la siguiente iteracion.</p>
    </section>
  );
}
