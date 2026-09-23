import { FormEvent, useEffect, useState } from 'react';
import { ClipboardCheck, LockKeyhole, Save } from 'lucide-react';
import { saveClinicalRecord } from '../../services/api';
import type { Appointment, ClinicalRecord, ClinicalRecordPayload, User } from '../../types';
import { formatDateTime } from '../../utils/format';

interface ClinicalRecordPanelProps {
  appointment: Appointment;
  currentUser: User;
  onSaved: (record: ClinicalRecord) => void;
}

const emptyForm: ClinicalRecordPayload = {
  consultation_reason: '',
  anamnesis: '',
  clinical_exam: '',
  diagnosis: '',
  weight_kg: '',
  temperature_c: '',
  heart_rate_bpm: '',
  respiratory_rate_rpm: '',
  mucous_membranes: '',
  capillary_refill_time: '',
  prescription: '',
};

export function ClinicalRecordPanel({ appointment, currentUser, onSaved }: ClinicalRecordPanelProps) {
  const record = appointment.clinical_record ?? null;
  const isVeterinarian = currentUser.id === appointment.veterinarian && currentUser.role === 'veterinarian';
  const canEdit =
    isVeterinarian &&
    record?.status !== 'closed' &&
    ['accepted', 'in_progress', 'completed', 'finalized'].includes(appointment.status);
  const canRead = isVeterinarian || record?.status === 'closed';
  const [form, setForm] = useState<ClinicalRecordPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!record) {
      setForm(emptyForm);
      return;
    }
    setForm({
      consultation_reason: record.consultation_reason ?? '',
      anamnesis: record.anamnesis ?? '',
      clinical_exam: record.clinical_exam ?? '',
      diagnosis: record.diagnosis ?? '',
      weight_kg: record.weight_kg ?? '',
      temperature_c: record.temperature_c ?? '',
      heart_rate_bpm: record.heart_rate_bpm === null ? '' : String(record.heart_rate_bpm),
      respiratory_rate_rpm: record.respiratory_rate_rpm === null ? '' : String(record.respiratory_rate_rpm),
      mucous_membranes: record.mucous_membranes ?? '',
      capillary_refill_time: record.capillary_refill_time ?? '',
      prescription: record.prescription ?? '',
    });
  }, [record?.id, record?.updated_at]);

  async function submit(event: FormEvent<HTMLFormElement>, close: boolean) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = normalizePayload(form, close);
      const saved = await saveClinicalRecord(appointment.id, payload, Boolean(record));
      onSaved(saved);
    } catch {
      setError('No se pudo guardar la ficha. Revisa anamnesis, diagnostico y peso.');
    } finally {
      setSaving(false);
    }
  }

  if (!canRead && !canEdit) {
    return (
      <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
        <PanelHeader closed={false} />
        <p className="mt-3 text-sm text-slate-600">La ficha clinica aun no esta disponible para el tutor.</p>
      </section>
    );
  }

  if (!canEdit) {
    return (
      <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
        <PanelHeader closed={record?.status === 'closed'} />
        {record ? (
          <div className="mt-4 grid gap-4">
            <div className="rounded-md border border-blush/70 bg-mist/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostico</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{record.diagnosis}</p>
            </div>
            <ReadGrid record={record} />
            {record.closed_at && (
              <p className="text-xs text-slate-500">Cerrada el {formatDateTime(record.closed_at)}</p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Aun no existe ficha clinica para esta cita.</p>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-md border border-blush bg-white p-5 shadow-soft">
      <PanelHeader closed={false} />
      <form className="mt-4 grid gap-4" onSubmit={(event) => void submit(event, false)}>
        <TextArea label="Motivo de consulta" value={form.consultation_reason} onChange={(value) => set('consultation_reason', value)} />
        <TextArea label="Anamnesis" required value={form.anamnesis} onChange={(value) => set('anamnesis', value)} />
        <TextArea label="Examen clinico" value={form.clinical_exam} onChange={(value) => set('clinical_exam', value)} />
        <TextArea label="Diagnostico" required value={form.diagnosis} onChange={(value) => set('diagnosis', value)} />
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Peso (kg)" required type="number" step="0.01" value={form.weight_kg} onChange={(value) => set('weight_kg', value)} />
          <Input label="Temperatura (C)" type="number" step="0.1" value={form.temperature_c ?? ''} onChange={(value) => set('temperature_c', value)} />
          <Input label="Frecuencia cardiaca" type="number" value={form.heart_rate_bpm ?? ''} onChange={(value) => set('heart_rate_bpm', value)} />
          <Input label="Frecuencia respiratoria" type="number" value={form.respiratory_rate_rpm ?? ''} onChange={(value) => set('respiratory_rate_rpm', value)} />
          <Input label="Mucosas" value={form.mucous_membranes} onChange={(value) => set('mucous_membranes', value)} />
          <Input label="TLLC" value={form.capillary_refill_time} onChange={(value) => set('capillary_refill_time', value)} />
        </div>
        <TextArea label="Receta medica" value={form.prescription} onChange={(value) => set('prescription', value)} />

        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md border border-lavender/30 bg-white px-4 py-2 text-sm font-semibold text-lavender hover:bg-mist disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            <Save size={16} aria-hidden="true" />
            Guardar borrador
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-lavender px-4 py-2 text-sm font-semibold text-white hover:bg-lavender/90 disabled:opacity-50"
            disabled={saving}
            onClick={(event) => void submit(event as unknown as FormEvent<HTMLFormElement>, true)}
            type="button"
          >
            <LockKeyhole size={16} aria-hidden="true" />
            Guardar y cerrar ficha
          </button>
        </div>
      </form>
    </section>
  );

  function set(key: keyof ClinicalRecordPayload, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function normalizePayload(form: ClinicalRecordPayload, close: boolean): ClinicalRecordPayload {
  return {
    ...form,
    temperature_c: form.temperature_c || undefined,
    heart_rate_bpm: form.heart_rate_bpm || undefined,
    respiratory_rate_rpm: form.respiratory_rate_rpm || undefined,
    close,
  };
}

function PanelHeader({ closed }: { closed: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="text-lavender" size={20} aria-hidden="true" />
        <h2 className="font-semibold text-ink">Ficha clinica</h2>
      </div>
      {closed && (
        <span className="inline-flex items-center gap-1 rounded-md bg-blush px-2.5 py-1 text-xs font-semibold text-ink">
          <LockKeyhole size={13} aria-hidden="true" />
          Inmutable
        </span>
      )}
    </div>
  );
}

function ReadGrid({ record }: { record: ClinicalRecord }) {
  const rows = [
    ['Motivo', record.consultation_reason],
    ['Anamnesis', record.anamnesis],
    ['Examen clinico', record.clinical_exam],
    ['Peso', `${record.weight_kg} kg`],
    ['Temperatura', record.temperature_c ? `${record.temperature_c} C` : 'No indicada'],
    ['Frec. cardiaca', record.heart_rate_bpm ? `${record.heart_rate_bpm} lpm` : 'No indicada'],
    ['Frec. respiratoria', record.respiratory_rate_rpm ? `${record.respiratory_rate_rpm} rpm` : 'No indicada'],
    ['Mucosas', record.mucous_membranes],
    ['TLLC', record.capillary_refill_time],
    ['Receta', record.prescription],
  ];
  return (
    <dl className="grid gap-3 md:grid-cols-2">
      {rows.map(([label, value]) => (
        <div className="rounded-md border border-blush/70 bg-white p-3" key={label}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-ink">{value || 'Sin registrar'}</dd>
        </div>
      ))}
    </dl>
  );
}

function Input({
  label,
  value,
  onChange,
  required,
  type = 'text',
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  step?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 h-10 w-full rounded-md border border-slate-300 px-3"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="mt-2 min-h-[92px] w-full rounded-md border border-slate-300 px-3 py-2"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      />
    </label>
  );
}
