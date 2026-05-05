import type { AppointmentStatus } from '../../types';
import { trafficToneForStatus } from '../../utils/appointmentDisplay';

const toneStyles: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-500 shadow-emerald-500/40',
  yellow: 'bg-amber-400 shadow-amber-400/40',
  red: 'bg-rose-500 shadow-rose-500/40',
};

const titles: Record<'green' | 'yellow' | 'red', string> = {
  green: 'Estado favorable (aceptada o completada)',
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
