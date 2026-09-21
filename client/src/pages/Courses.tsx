import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CourseCard } from '../components/CourseCard';
import { courseApi } from '../services/api';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const inputCls = 'border rounded px-2 py-1 bg-white dark:bg-slate-950 w-full text-sm';

export function Courses() {
  const qc = useQueryClient();
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: courseApi.list });
  const [name, setName] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [day, setDay] = useState('Senin');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [color, setColor] = useState('#6366F1');

  const reset = () => {
    setName('');
    setLecturer('');
    setDay('Senin');
    setStart('');
    setEnd('');
    setColor('#6366F1');
  };

  const create = useMutation({
    mutationFn: () =>
      courseApi.create({
        course_name: name,
        lecturer_name: lecturer || undefined,
        day_of_week: day,
        start_time: start || undefined,
        end_time: end || undefined,
        color_code: color,
      }),
    onSuccess: () => {
      reset();
      qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => courseApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kelola Jadwal Kuliah</h1>
      <div className="rounded border p-4 bg-white dark:bg-slate-950 grid gap-2 md:grid-cols-3">
        <label className="text-xs space-y-1">
          <span className="opacity-70">Nama mata kuliah *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Pemrograman Web 1" className={inputCls} />
        </label>
        <label className="text-xs space-y-1">
          <span className="opacity-70">Nama dosen</span>
          <input value={lecturer} onChange={(e) => setLecturer(e.target.value)} placeholder="cth: Dr. Budi" className={inputCls} />
        </label>
        <label className="text-xs space-y-1">
          <span className="opacity-70">Hari</span>
          <select value={day} onChange={(e) => setDay(e.target.value)} className={inputCls}>
            {DAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <label className="text-xs space-y-1">
          <span className="opacity-70">Jam mulai</span>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
        </label>
        <label className="text-xs space-y-1">
          <span className="opacity-70">Jam selesai</span>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
        </label>
        <label className="text-xs space-y-1">
          <span className="opacity-70">Warna label</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-full cursor-pointer rounded border bg-transparent" />
        </label>
        <div className="md:col-span-3">
          <button
            disabled={!name || create.isPending}
            onClick={() => create.mutate()}
            className="rounded bg-indigo-600 text-white px-4 py-1.5 text-sm disabled:opacity-50"
          >
            {create.isPending ? 'Menyimpan…' : 'Tambah jadwal'}
          </button>
          {create.isError && <p className="text-red-500 text-xs mt-1">Gagal menyimpan jadwal.</p>}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {courses.map((c) => (
          <CourseCard key={c.id} course={c} onDelete={(id) => remove.mutate(id)} />
        ))}
      </div>
    </div>
  );
}
