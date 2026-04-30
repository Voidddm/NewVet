import { FormEvent, useState } from 'react';
import { Eye, LogIn, UserPlus } from 'lucide-react';
import { login, register } from '../../services/api';

interface AuthPageProps {
  onLogin: () => Promise<void>;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('ana.torres@newvet.demo');
  const [password, setPassword] = useState('Demo12345');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'veterinarian'>('client');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'register') {
        await register({ name, email, password, role });
      }
      await login(email, password);
      await onLogin();
    } catch {
      setError('No se pudo iniciar sesion con esos datos.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-mist px-4 py-8 text-ink lg:grid-cols-[1fr_480px]">
      <section className="flex items-center">
        <div className="mx-auto max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal">NewVet MVP</p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Gestion clinica centrada en cada cita
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Agenda, documentacion y comunicacion en un unico panel operativo para tutores y veterinarios.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {['Teleconsulta', 'Domicilio', 'Cirugia'].map((item) => (
              <div key={item} className="rounded-md border border-slate-200 bg-white p-4 shadow-soft">
                <p className="text-sm font-semibold text-ink">{item}</p>
                <p className="mt-1 text-sm text-slate-500">Flujo comun de estados y panel clinico.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center">
        <form className="w-full rounded-md border border-slate-200 bg-white p-6 shadow-soft" onSubmit={handleSubmit}>
          <div className="mb-6 flex rounded-md bg-slate-100 p-1">
            <button
              className={`h-10 flex-1 rounded-md text-sm font-semibold ${mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`h-10 flex-1 rounded-md text-sm font-semibold ${mode === 'register' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
              onClick={() => setMode('register')}
              type="button"
            >
              Registro
            </button>
          </div>

          {mode === 'register' && (
            <>
              <label className="mb-4 block text-sm font-medium text-slate-700">
                Nombre
                <input
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3"
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <label className="mb-4 block text-sm font-medium text-slate-700">
                Rol
                <select
                  className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3"
                  onChange={(event) => setRole(event.target.value as 'client' | 'veterinarian')}
                  value={role}
                >
                  <option value="client">Tutor</option>
                  <option value="veterinarian">Veterinario</option>
                </select>
              </label>
            </>
          )}

          <label className="mb-4 block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="mb-4 block text-sm font-medium text-slate-700">
            Contrasena
            <div className="mt-2 flex h-11 items-center rounded-md border border-slate-300 px-3">
              <input
                className="min-w-0 flex-1 border-0 p-0 outline-none"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <Eye size={18} className="text-slate-400" aria-hidden="true" />
            </div>
          </label>

          {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {submitting ? 'Procesando' : mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
          </button>
        </form>
      </section>
    </div>
  );
}
