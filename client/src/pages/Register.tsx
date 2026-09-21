import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  return (
    <div className="mx-auto max-w-sm mt-16 rounded border p-6 bg-white dark:bg-slate-950">
      <h1 className="text-xl font-bold mb-4">Registrasi</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="nama" className="border rounded px-2 py-1 w-full mb-2 bg-transparent" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="border rounded px-2 py-1 w-full mb-2 bg-transparent" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="border rounded px-2 py-1 w-full mb-2 bg-transparent" />
      {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
      <button
        onClick={() => register(name, email, password).catch(() => setErr('Registrasi gagal'))}
        className="w-full rounded bg-indigo-600 text-white py-1.5"
      >
        Daftar
      </button>
      <p className="text-sm mt-3">Sudah punya akun? <Link to="/login" className="underline">Login</Link></p>
    </div>
  );
}
