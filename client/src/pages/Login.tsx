import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@studyhub.test');
  const [password, setPassword] = useState('demo1234');
  const [err, setErr] = useState('');

  return (
    <div className="mx-auto max-w-sm mt-16 rounded border p-6 bg-white dark:bg-slate-950">
      <h1 className="text-xl font-bold mb-4">Login StudyHub</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" className="border rounded px-2 py-1 w-full mb-2 bg-transparent" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" className="border rounded px-2 py-1 w-full mb-2 bg-transparent" />
      {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
      <button
        onClick={() => login(email, password).catch(() => setErr('Login gagal, cek email/password'))}
        className="w-full rounded bg-indigo-600 text-white py-1.5"
      >
        Masuk
      </button>
      <p className="text-sm mt-3">Belum punya akun? <Link to="/register" className="underline">Daftar</Link></p>
    </div>
  );
}
