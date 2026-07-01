import type { AppointmentStatus } from '../../types';
import { trafficToneForStatus } from '../../utils/appointmentDisplay';

const toneStyles: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-lavender shadow-lavender/40',
  yellow: 'bg-coral shadow-coral/40',
  red: 'bg-slate-400 shadow-slate-400/40',
};

const titles: Record<'green' | 'yellow' | 'red', string> = {
  green: 'Aceptada, en curso o finalizada',
  yellow: 'Pendiente de confirmacion',
  red: 'Cancelada o rechazada',
};

export function StatusTrafficLight({ status }: { status: AppointmentStatus }) {
  const tone = trafficToneForStatus(status);
  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 rounded-full shadow-md ring-2 ring-white ${toneStyles[tone]}`}
      title={titles[tone]}
      aria-label={titles[tone]}
    />
  );
}
