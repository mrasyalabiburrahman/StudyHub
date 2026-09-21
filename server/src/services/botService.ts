// Fase 2: Telegram Bot via Telegraf — Blueprint §3.1 (Linking)
// Alur: Web GET /api/telegram/link-token -> t.me/<bot>?start=LINK_xxx
//       -> user klik /start di Telegram -> bot simpan telegram_chat_id
import { Telegraf } from 'telegraf';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';

let bot: Telegraf | null = null;

export function buildDeepLink(linkToken: string): string {
  return `https://t.me/${env.botUsername}?start=${linkToken}`;
}

export function getBot(): Telegraf | null {
  return bot;
}

export async function sendTelegramMessage(chatId: string, html: string): Promise<boolean> {
  const b = getBot();
  if (!b) {
    console.log(`[bot:mock] -> chat ${chatId}:\n${html}`);
    return false;
  }
  try {
    await b.telegram.sendMessage(chatId, html, { parse_mode: 'HTML' });
    return true;
  } catch (e) {
    console.error('[bot] sendMessage gagal:', e);
    return false;
  }
}

export function initBot(): Telegraf | null {
  if (!env.botToken) {
    console.log('[bot] BOT_TOKEN kosong → mock mode (link-token & cron dry-run tetap jalan)');
    return null;
  }
  if (bot) return bot;

  bot = new Telegraf(env.botToken);

  bot.start(async (ctx) => {
    // Telegraf v4: payload deep-link ada di ctx.payload
    const payload = (ctx as unknown as { payload?: string }).payload ?? '';
    const chatId = String(ctx.chat.id);

    if (!payload) {
      await ctx.reply(
        'Halo! 👋\nUntuk menghubungkan akun, buka StudyHub → Settings → "Hubungkan Telegram" untuk dapat link khusus.',
      );
      return;
    }

    const user = await prisma.user.findUnique({ where: { link_token: payload } });
    if (!user) {
      await ctx.reply('❌ Token tidak valid / sudah dipakai. Buat token baru di Settings StudyHub lalu klik link-nya lagi.');
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { telegram_chat_id: chatId, link_token: null },
    });
    console.log(`[bot] linked user ${user.email} <-> chat ${chatId}`);
    await ctx.reply(`Akun StudyHub <b>${user.name}</b> berhasil terhubung! 🎉\nKamu akan menerima pengingat deadline H-2 jam di sini.`);
  });

  bot.command('unlink', async (ctx) => {
    const chatId = String(ctx.chat.id);
    const user = await prisma.user.findFirst({ where: { telegram_chat_id: chatId } });
    if (!user) {
      await ctx.reply('Akun Telegram ini belum terhubung ke StudyHub.');
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { telegram_chat_id: null } });
    await ctx.reply('🔌 Akun StudyHub dilepas dari Telegram ini. Kirim /start dengan link baru untuk menghubungkan lagi.');
  });

  bot.command('help', async (ctx) => {
    await ctx.reply('StudyHub Bot 📚\n/start <token> — hubungkan akun\n/unlink — lepas akun\n/help — bantuan');
  });

  bot.launch().then(
    () => console.log('[bot] polling jalan'),
    (e) => console.error('[bot] launch gagal:', e),
  );

  const stop = () => {
    bot?.stop('SIGTERM');
    bot = null;
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  return bot;
}
