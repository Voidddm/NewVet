import { FormEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { sendMessage } from '../../services/api';
import type { Message, User } from '../../types';
import { formatDateTime } from '../../utils/format';

interface ChatPanelProps {
  appointmentId: number;
  currentUser: User;
  messages: Message[];
  disabled: boolean;
  inputPlaceholder?: string;
  onMessageSent: () => Promise<void>;
}

export function ChatPanel({
  appointmentId,
  currentUser,
  messages,
  disabled,
  inputPlaceholder,
  onMessageSent,
}: ChatPanelProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await sendMessage(appointmentId, content);
      setContent('');
      await onMessageSent();
    } catch {
      setError('No se pudo enviar el mensaje.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-ink">Mensajes</h2>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Sin mensajes todavia.</p>
        ) : (
          messages.map((message) => {
            const mine = message.sender === currentUser.id;
            return (
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`} key={message.id}>
                <div className={`max-w-[78%] rounded-md px-3 py-2 ${mine ? 'bg-teal text-white' : 'bg-slate-100 text-ink'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`mt-1 text-xs ${mine ? 'text-teal-50' : 'text-slate-500'}`}>
                    {formatDateTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form className="border-t border-slate-100 p-4" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <input
            className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-3 disabled:bg-slate-100"
            disabled={disabled || submitting}
            onChange={(event) => setContent(event.target.value)}
            placeholder={
              inputPlaceholder ?? (disabled ? 'Disponible cuando la cita este aceptada' : 'Escribir mensaje')
            }
            required
            value={content}
          />
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-teal px-4 text-white hover:bg-teal-700 disabled:opacity-60"
            disabled={disabled || submitting}
            title="Enviar mensaje"
            type="submit"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      </form>
    </section>
  );
}
