import { format } from 'date-fns';
import { BellRing, CheckCircle2, Trash2 } from 'lucide-react';
import type { Task } from '../services/api';

const TOTAL_STAGES = 10;

function reminderBadge(t: Task): string | null {
  if (t.is_completed) return null;
  const remainingMin = (new Date(t.due_date).getTime() - Date.now()) / 60000;
  if (remainingMin < 0) return `⚠️ lewat deadline • pengingat ke-${t.reminder_stage ?? 0}/${TOTAL_STAGES}`;
  if ((t.reminder_stage ?? 0) === 0) return '🔕 pengingat mulai H-24j';
  return `🔔 pengingat ke-${t.reminder_stage}/${TOTAL_STAGES}`;
}

export function TaskList({
  tasks,
  onComplete,
  onDelete,
}: {
  tasks: Task[];
  onComplete: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  if (tasks.length === 0) return <p className="text-sm opacity-60">Belum ada tugas 🎉</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li
          key={t.id}
          className={`rounded-lg border p-3 bg-white dark:bg-slate-950 flex items-start gap-3 ${t.is_completed ? 'opacity-60 line-through' : ''}`}
        >
          <div className="flex-1">
            <p className="font-medium">{t.title}</p>
            <p className="text-xs opacity-70">
              {t.course?.course_name ?? 'Tanpa matkul'} • {format(new Date(t.due_date), 'dd MMM yyyy HH:mm')} • {t.priority}
            </p>
            {t.description && <p className="text-sm mt-1">{t.description}</p>}
            {reminderBadge(t) && (
              <p className="text-xs mt-1 flex items-center gap-1 opacity-80">
                <BellRing size={12} /> {reminderBadge(t)}
              </p>
            )}
          </div>
          {!t.is_completed && (
            <button title="Selesai" onClick={() => onComplete(t.id)} className="text-green-600">
              <CheckCircle2 size={18} />
            </button>
          )}
          <button title="Hapus" onClick={() => onDelete(t.id)} className="text-red-500">
            <Trash2 size={18} />
          </button>
        </li>
      ))}
    </ul>
  );
}
