import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DatePicker, { registerLocale } from 'react-datepicker';
import { id } from 'date-fns/locale/id';
import 'react-datepicker/dist/react-datepicker.css';
import { TaskList } from '../components/TaskList';
import { courseApi, taskApi } from '../services/api';

registerLocale('id', id);

export function Tasks() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => taskApi.list() });
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: courseApi.list });
  const [title, setTitle] = useState('');
  const [due, setDue] = useState<Date | null>(null);
  const [courseId, setCourseId] = useState('');

  const refresh = () => qc.invalidateQueries({ queryKey: ['tasks'] });

  const create = useMutation({
    mutationFn: () =>
      taskApi.create({
        title,
        due_date: (due ?? new Date()).toISOString(),
        course_id: courseId ? Number(courseId) : undefined,
      }),
    onSuccess: () => {
      setTitle('');
      setDue(null);
      refresh();
    },
  });
  const complete = useMutation({ mutationFn: (id: number) => taskApi.complete(id), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id: number) => taskApi.remove(id), onSuccess: refresh });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kelola Tugas & Deadline</h1>
      <div className="grid gap-2 md:grid-cols-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul tugas" className="border rounded px-2 py-1 bg-white dark:bg-slate-950" />
        <DatePicker
          selected={due}
          onChange={(d: Date | null) => setDue(d)}
          locale="id"
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="dd MMM yyyy HH:mm"
          placeholderText="📅 Pilih tanggal & jam"
          minDate={new Date()}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          isClearable
          className="border rounded px-2 py-1 bg-white dark:bg-slate-950 w-full"
          wrapperClassName="w-full"
        />
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="border rounded px-2 py-1 bg-white dark:bg-slate-950">
          <option value="">Tanpa matkul</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.course_name}</option>
          ))}
        </select>
        <button disabled={!title || !due || create.isPending} onClick={() => create.mutate()} className="rounded bg-indigo-600 text-white px-3 py-1 text-sm disabled:opacity-50">
          Tambah tugas
        </button>
      </div>
      <TaskList tasks={tasks} onComplete={(id) => complete.mutate(id)} onDelete={(id) => remove.mutate(id)} />
    </div>
  );
}
