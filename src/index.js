import 'dotenv/config';
import { startBot } from './bot.js';
import { startServer } from './server.js';

startServer();

if (process.env.BOT_TOKEN) {
  startBot();
} else {
  console.warn('BOT_TOKEN is not set; Telegram bot is disabled. Add BOT_TOKEN to .env to enable /start.');
}
