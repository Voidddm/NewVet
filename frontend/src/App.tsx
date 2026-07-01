import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AuthPage } from './pages/Auth/AuthPage';
import { AppointmentDetailPage } from './pages/AppointmentDetail/AppointmentDetailPage';
import { AppointmentsPage } from './pages/Appointments/AppointmentsPage';
import { CheckAppointmentPage } from './pages/CheckAppointment/CheckAppointmentPage';
import { ProfilesPage } from './pages/Profiles/ProfilesPage';
import { ReserveAppointmentPage } from './pages/ReserveAppointment/ReserveAppointmentPage';
import { TeleconsultationPage } from './pages/Teleconsultation/TeleconsultationPage';
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
        <Route path="/profiles" element={<ProfilesPage user={auth.user} onUserUpdated={auth.reloadUser} />} />
        <Route path="/reserve" element={<ReserveAppointmentPage user={auth.user} />} />
        <Route path="/check-appointment" element={<CheckAppointmentPage user={auth.user} />} />
        <Route path="/teleconsulta/:uuid" element={<TeleconsultationPage user={auth.user} />} />
        <Route path="/cancel-appointment" element={<Navigate replace to="/check-appointment" />} />
        <Route path="/change-appointment" element={<Navigate replace to="/check-appointment" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
