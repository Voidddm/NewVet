export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function modeLabel(value: string): string {
  if (value === 'online') return 'Teleconsulta';
  if (value === 'home') return 'Domicilio';
  if (value === 'surgery') return 'Cirugia';
  return value;
}
