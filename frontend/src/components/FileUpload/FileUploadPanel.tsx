import { FormEvent, useState } from 'react';
import { FileUp, Paperclip } from 'lucide-react';
import { uploadMedicalFile } from '../../services/api';
import type { FileType, MedicalFile } from '../../types';
import { formatDateTime } from '../../utils/format';

interface FileUploadPanelProps {
  appointmentId: number;
  files: MedicalFile[];
  canUpload: boolean;
  onUploaded: () => Promise<void>;
}

export function FileUploadPanel({ appointmentId, files, canUpload, onUploaded }: FileUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('pdf');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setError(null);
    try {
      await uploadMedicalFile(appointmentId, { file, file_type: fileType, description });
      setFile(null);
      setDescription('');
      await onUploaded();
    } catch {
      setError('No se pudo subir el archivo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-ink">Archivos clinicos</h2>
      </div>
      <div className="space-y-3 px-5 py-4">
        {files.length === 0 ? (
          <p className="text-sm text-slate-500">Sin archivos cargados.</p>
        ) : (
          files.map((item) => (
            <a
              className="flex items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
              href={item.file}
              key={item.id}
              rel="noreferrer"
              target="_blank"
            >
              <Paperclip size={18} className="mt-0.5 text-teal" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">{item.description || item.file_type}</p>
                <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
              </div>
            </a>
          ))
        )}
      </div>
      <form className="space-y-3 border-t border-slate-100 p-4" onSubmit={handleSubmit}>
        <input
          accept="image/*,application/pdf,audio/*"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          disabled={!canUpload || submitting}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
          type="file"
        />
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <select
            className="h-10 rounded-md border border-slate-300 px-3 disabled:bg-slate-100"
            disabled={!canUpload || submitting}
            onChange={(event) => setFileType(event.target.value as FileType)}
            value={fileType}
          >
            <option value="pdf">PDF</option>
            <option value="image">Imagen</option>
            <option value="audio">Audio</option>
            <option value="other">Otro</option>
          </select>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 disabled:bg-slate-100"
            disabled={!canUpload || submitting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripcion"
            value={description}
          />
        </div>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <button
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal px-4 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          disabled={!canUpload || submitting}
          type="submit"
        >
          <FileUp size={18} aria-hidden="true" />
          Subir archivo
        </button>
      </form>
    </section>
  );
}
