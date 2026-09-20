import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
if (process.env.BOT_TOKEN) {
  const bot = new Telegraf(process.env.BOT_TOKEN);
  bot.start(ctx => ctx.reply('🚀 أهلاً بك في ArabStarsSMM\n\nمنصتك العربية لخدمات السوشيال ميديا ✨\n\nابدأ الآن واستكشف المنصة 👇', Markup.inlineKeyboard([Markup.button.webApp('🚀 فتح التطبيق', process.env.WEBAPP_URL || '')])));
  bot.catch(err => console.error('Telegram bot error', err));
  bot.launch().then(()=>console.log('Telegram bot started')).catch(console.error);
  process.once('SIGINT',()=>bot.stop('SIGINT')); process.once('SIGTERM',()=>bot.stop('SIGTERM'));
} else console.warn('BOT_TOKEN is not set; Telegram bot is disabled.');
