import { CalendarDays, CalendarPlus, Clock, LogOut, RotateCcw, Stethoscope, UserRound, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { User } from '../types';

interface AppShellProps {
  user: User;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShell({ user, onLogout, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white">
              <Stethoscope size={21} aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold leading-tight text-ink">NewVet</p>
              <p className="text-sm text-slate-500">{user.name} · {roleLabel(user.role)}</p>
            </div>
          </div>
          <nav className="flex max-w-full items-center gap-1 overflow-x-auto">
            <ShellLink icon={<CalendarDays size={18} aria-hidden="true" />} label="Inicio" to="/" />
            <ShellLink icon={<UserRound size={18} aria-hidden="true" />} label="Perfil y mascotas" to="/profiles" />
            {user.role === 'client' && (
              <ShellLink icon={<CalendarPlus size={18} aria-hidden="true" />} label="Reservar hora" to="/reserve" />
            )}
            <ShellLink icon={<Clock size={18} aria-hidden="true" />} label="Consulta de Hora" to="/check-appointment" />
            <ShellLink icon={<XCircle size={18} aria-hidden="true" />} label="Anular hora" to="/cancel-appointment" />
            <ShellLink icon={<RotateCcw size={18} aria-hidden="true" />} label="Cambiar Hora" to="/change-appointment" />
            <button
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              onClick={onLogout}
              title="Cerrar sesion"
              type="button"
            >
              <LogOut size={18} aria-hidden="true" />
              Salir
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

function ShellLink({ icon, label, to }: { icon: ReactNode; label: string; to: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        `inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium ${
          isActive ? 'bg-slate-100 text-ink' : 'text-slate-600 hover:bg-slate-50'
        }`
      }
      end={to === '/'}
      to={to}
    >
      {icon}
      {label}
    </NavLink>
  );
}

function roleLabel(role: User['role']) {
  if (role === 'veterinarian') return 'Veterinario';
  if (role === 'admin') return 'Admin';
  return 'Tutor';
}
