import { useQuery } from '@tanstack/react-query';
import { Calendar } from '../components/Calendar';
import { courseApi, taskApi } from '../services/api';

export function Dashboard() {
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: courseApi.list });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => taskApi.list() });
  const upcoming = tasks.filter((t) => !t.is_completed).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border p-4 bg-white dark:bg-slate-950"><p className="text-xs">Matkul</p><p className="text-2xl font-bold">{courses.length}</p></div>
        <div className="rounded border p-4 bg-white dark:bg-slate-950"><p className="text-xs">Tugas aktif</p><p className="text-2xl font-bold">{tasks.filter((t) => !t.is_completed).length}</p></div>
        <div className="rounded border p-4 bg-white dark:bg-slate-950"><p className="text-xs">Selesai</p><p className="text-2xl font-bold">{tasks.filter((t) => t.is_completed).length}</p></div>
      </div>
      <section>
        <h2 className="font-bold mb-2">Kalender Mingguan</h2>
        <Calendar courses={courses} tasks={tasks} />
      </section>
      <section>
        <h2 className="font-bold mb-2">Tugas terdekat</h2>
        <ul className="text-sm space-y-1">
          {upcoming.map((t) => (
            <li key={t.id}>⏰ {t.title} — {new Date(t.due_date).toLocaleString()}</li>
          ))}
          {upcoming.length === 0 && <li className="opacity-60">Tidak ada tugas aktif</li>}
        </ul>
      </section>
    </div>
  );
}
