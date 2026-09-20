import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';

export function startBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.warn('BOT_TOKEN is not set; Telegram bot is disabled.');
    return null;
  }

  const bot = new Telegraf(token);
  const webAppUrl = process.env.WEBAPP_URL || 'https://example.com';

  bot.start((ctx) => {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 فتح التطبيق', webAppUrl)],
    ]);

    return ctx.reply(
      '🚀 أهلاً بك في ArabStarsSMM\n\nمنصتك العربية لخدمات السوشيال ميديا ✨\n\n👥 متابعين\n❤️ إعجابات\n👁️ مشاهدات\n💬 تعليقات\n🔥 تفاعلات\n🎯 مهام ومكافآت\n👥 نظام إحالة\n\nابدأ الآن واستكشف المنصة 👇',
      keyboard
    );
  });

  bot.catch((err) => console.error('Telegram bot error:', err));

  bot.launch({ dropPendingUpdates: true })
    .then(() => console.log('Telegram bot started successfully'))
    .catch((error) => console.error('Telegram bot failed to start:', error.message));

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}
