import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { telegramApi } from '../services/api';

export function Settings() {
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const { data: status, isLoading } = useQuery({ queryKey: ['telegram-status'], queryFn: telegramApi.status });

  const genLink = useMutation({
    mutationFn: telegramApi.linkToken,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-status'] }),
  });
  const unlink = useMutation({
    mutationFn: telegramApi.unlink,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram-status'] }),
  });

  const pending = status?.pending_token;
  const linkUrl = pending?.url ?? (genLink.data?.url as string | undefined);

  const copy = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      <div className="rounded border p-4 bg-white dark:bg-slate-950 space-y-3">
        <h2 className="font-semibold">Telegram — Hubungkan Akun</h2>
        {!status?.bot_configured && (
          <p className="text-xs rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1">
            BOT_TOKEN belum diisi di server — mode mock. Linking tetap bisa dicoba, tapi pesan tidak benar-benar terkirim
            sampai token diisi.
          </p>
        )}
        {isLoading ? (
          <p className="text-sm opacity-60">Memuat status…</p>
        ) : status?.linked ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600">✅ Terhubung (chat_id: <code>{status.telegram_chat_id}</code>)</p>
            <p className="text-xs opacity-70">
              Pengingat eskalasi aktif: H-24j → H-12j → H-6j → H-3j → H-90m → H-45m → H-22m → H-11m → H-5m → tenggat,
              lalu tiap 60 menit jika lewat deadline — berhenti setelah tugas ditandai selesai ✅.
            </p>
            <button
              onClick={() => unlink.mutate()}
              disabled={unlink.isPending}
              className="rounded bg-red-600 text-white px-3 py-1 text-sm"
            >
              {unlink.isPending ? 'Melepas…' : 'Lepas Telegram'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm opacity-70">
              1. Klik “Buat Link” → 2. Buka link <code>t.me/...</code> → 3. Klik <code>/start</code> di bot → akun terhubung otomatis.
            </p>
            <button
              onClick={() => genLink.mutate()}
              disabled={genLink.isPending}
              className="rounded bg-indigo-600 text-white px-3 py-1 text-sm"
            >
              {genLink.isPending ? 'Membuat…' : 'Buat Link Telegram'}
            </button>
            {linkUrl && (
              <div className="rounded bg-slate-100 dark:bg-slate-900 p-3 text-sm space-y-2">
                <a href={linkUrl} target="_blank" rel="noreferrer" className="text-indigo-600 underline break-all">
                  {linkUrl}
                </a>
                <div className="flex gap-2">
                  <button onClick={copy} className="rounded border px-2 py-1 text-xs">
                    {copied ? 'Disalin! ✓' : 'Salin link'}
                  </button>
                  <button
                    onClick={() => qc.invalidateQueries({ queryKey: ['telegram-status'] })}
                    className="rounded border px-2 py-1 text-xs"
                  >
                    Refresh status
                  </button>
                </div>
                {genLink.isError && <p className="text-red-500 text-xs">Gagal membuat link.</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded border p-4 bg-white dark:bg-slate-950">
        <h2 className="font-semibold">🔔 Jadwal Pengingat Deadline</h2>
        <ul className="text-xs opacity-80 space-y-1 mt-2">
          <li>1. H-24 jam • 2. H-12 jam • 3. H-6 jam • 4. H-3 jam • 5. H-90 mnt</li>
          <li>6. H-45 mnt • 7. H-22 mnt • 8. H-11 mnt • 9. H-5 mnt • 10. Tenggat</li>
          <li>Lewat deadline + belum selesai → diingatkan tiap 60 menit sampai dikonfirmasi ✅</li>
          <li>Mengubah tanggal deadline / membuka ulang tugas → eskalasi dimulai dari awal.</li>
        </ul>
      </div>

      <div className="rounded border p-4 bg-white dark:bg-slate-950">
        <h2 className="font-semibold">Ekspor iCal (Fase 3)</h2>
        <p className="text-sm opacity-70">Tombol generate .ics akan ada di sini.</p>
      </div>
    </div>
  );
}
