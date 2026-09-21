import { useMemo } from 'react';
import type { Course, Task } from '../services/api';

// Kalender sederhana MVP (Fase 3 akan diganti @schedule-x/react full)
export function Calendar({ courses, tasks }: { courses: Course[]; tasks: Task[] }) {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const byDay = useMemo(() => {
    const map: Record<string, Course[]> = {};
    for (const d of days) map[d] = [];
    for (const c of courses) {
      if (c.day_of_week && map[c.day_of_week]) map[c.day_of_week].push(c);
    }
    return map;
  }, [courses]);

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div key={d} className="rounded border p-2 bg-white dark:bg-slate-950 min-h-24">
            <p className="text-xs font-bold mb-1">{d}</p>
            {(byDay[d] ?? []).map((c) => (
              <p key={c.id} className="text-xs rounded px-1 py-0.5 mb-1 text-white" style={{ background: c.color_code ?? '#6366F1' }}>
                {c.course_name}
              </p>
            ))}
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-sm mb-1">Deadline terdekat</h3>
        <ul className="text-sm space-y-1">
          {tasks.slice(0, 5).map((t) => (
            <li key={t.id}>📌 {t.title} — {new Date(t.due_date).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
