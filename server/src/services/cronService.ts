// Pengingat deadline advance — eskalasi H-24j → 5 menit, berhenti saat tugas dikonfirmasi.
// Jadwal = 24 jam dibagi 2 berturut-turut sampai 5 menit:
//   H-24j, H-12j, H-6j, H-3j, H-90m, H-45m, H-22m, H-11m, H-5m, lalu saat tenggat.
// Setelah lewat deadline dan belum selesai: ulangi tiap 60 menit sampai dikonfirmasi.
// Cron jalan tiap 1 menit agar presisi di tahap akhir (11m / 5m).
import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { sendTelegramMessage } from './botService.js';

/** Ambang tiap tahap dalam menit sebelum deadline (index+1 = nomor tahap). */
export const REMINDER_STAGES_MIN = [1440, 720, 360, 180, 90, 45, 22, 11, 5, 0] as const;
export const OVERDUE_REPEAT_MIN = 60;

export interface ReminderResult {
  checked: number;
  sent: number;
  dryRun: number;
  escalated: number;
  overdueRepeat: number;
  skipped: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function humanRemaining(min: number): string {
  if (min < 0) {
    const o = Math.round(-min);
    if (o < 60) return `lewat ${o} mnt`;
    const h = Math.floor(o / 60);
    if (h < 24) return `lewat ${h} jam${o % 60 ? ` ${o % 60} mnt` : ''}`;
    return `lewat ${Math.floor(h / 24)} hari ${h % 24} jam`;
  }
  if (min < 60) return `${Math.max(1, Math.round(min))} menit lagi`;
  const h = Math.floor(min / 60);
  if (h < 24) {
    const m = Math.round(min % 60);
    return `${h} jam${m ? ` ${m} mnt` : ''} lagi`;
  }
  const d = Math.floor(h / 24);
  return `${d} hari ${h % 24} jam lagi`;
}

/** Tahap tertinggi yang sudah jatuh tempo untuk sisa waktu tertentu (0 = belum waktunya). */
export function stageForRemaining(remainingMin: number): number {
  let stage = 0;
  for (let i = 0; i < REMINDER_STAGES_MIN.length; i++) {
    if (remainingMin <= REMINDER_STAGES_MIN[i]) stage = i + 1;
  }
  return stage;
}

export function formatReminder(
  task: {
    title: string;
    due_date: Date;
    priority: string;
    description?: string | null;
    course?: { course_name: string } | null;
  },
  stage: number,
  totalStages = REMINDER_STAGES_MIN.length,
  overdueRepeat = false,
): string {
  const now = new Date();
  const remainingMin = (task.due_date.getTime() - now.getTime()) / 60000;
  const due = task.due_date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  const matkul = task.course?.course_name ?? 'Tanpa matkul';
  const head = overdueRepeat
    ? `⚠️ <b>LEWAT DEADLINE — belum dikonfirmasi</b>`
    : remainingMin <= 0
      ? `🚨 <b>Tenggat tiba!</b>`
      : `🚨 <b>Pengingat Deadline (${humanRemaining(remainingMin)})</b>`;
  const lines = [
    head,
    `🔔 Pengingat ke-${stage}/${totalStages}`,
    ``,
    `📌 <b>${escapeHtml(task.title)}</b>`,
    `📚 ${escapeHtml(matkul)} • ⚡ ${escapeHtml(task.priority)}`,
    `⏰ ${escapeHtml(due)}`,
  ];
  if (task.description) lines.push(`📝 ${escapeHtml(task.description)}`);
  lines.push(``, overdueRepeat ? `Tugas ini sudah lewat deadline. Tandai selesai di StudyHub untuk berhenti diingatkan. 🙏` : `Tandai selesai di StudyHub untuk berhenti diingatkan. 💪`);
  return lines.join('\n');
}

export async function checkAndSendReminders(): Promise<ReminderResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 24 * 3600 * 1000);
  const result: ReminderResult = { checked: 0, sent: 0, dryRun: 0, escalated: 0, overdueRepeat: 0, skipped: 0 };

  // Kandidat: belum selesai + telegram terhubung + deadline sudah masuk jendela
  // 24 jam (termasuk yang sudah lewat deadline).
  const tasks = await prisma.task.findMany({
    where: {
      is_completed: false,
      due_date: { lte: windowStart },
      user: { telegram_chat_id: { not: null } },
    },
    include: { user: true, course: true },
  });
  result.checked = tasks.length;

  for (const t of tasks) {
    const chatId = t.user.telegram_chat_id;
    if (!chatId) {
      result.skipped++;
      continue;
    }
    const remainingMin = (t.due_date.getTime() - now.getTime()) / 60000;
    const targetStage = stageForRemaining(remainingMin);
    const currentStage = t.reminder_stage ?? 0;

    // Kasus 1: ada tahap baru yang jatuh tempo → eskalasi.
    if (targetStage > currentStage && targetStage > 0) {
      const html = formatReminder(t, targetStage);
      const ok = await sendTelegramMessage(chatId, html);
      if (ok) {
        await prisma.task.update({
          where: { id: t.id },
          data: { reminder_stage: targetStage, reminder_sent: true, last_reminded_at: now },
        });
        result.sent++;
        result.escalated++;
      } else {
        result.dryRun++;
      }
      continue;
    }

    // Kasus 2: lewat deadline, semua tahap habis, ulangi tiap 60 mnt sampai dikonfirmasi.
    if (remainingMin < 0 && currentStage >= REMINDER_STAGES_MIN.length) {
      const last = t.last_reminded_at?.getTime() ?? 0;
      if (now.getTime() - last >= OVERDUE_REPEAT_MIN * 60000) {
        const html = formatReminder(t, currentStage, REMINDER_STAGES_MIN.length, true);
        const ok = await sendTelegramMessage(chatId, html);
        if (ok) {
          await prisma.task.update({ where: { id: t.id }, data: { last_reminded_at: now } });
          result.sent++;
          result.overdueRepeat++;
        } else {
          result.dryRun++;
        }
      } else {
        result.skipped++;
      }
      continue;
    }

    result.skipped++;
  }

  console.log(
    `[cron] cek ${result.checked} tugas → terkirim ${result.sent} (eskalasi ${result.escalated}, overdue ${result.overdueRepeat}), dry-run ${result.dryRun}, skip ${result.skipped}`,
  );
  return result;
}

export function initCron() {
  cron.schedule('* * * * *', () => {
    checkAndSendReminders().catch((e) => console.error('[cron] gagal:', e));
  });
  console.log('[cron] pengingat eskalasi H-24j→5m aktif (tiap 1 menit)');
}
