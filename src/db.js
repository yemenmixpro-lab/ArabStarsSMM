import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const location = process.env.DATABASE_PATH || './data/arabstars.sqlite';
fs.mkdirSync(path.dirname(location), { recursive: true });
export const db = new Database(location);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (telegram_id TEXT PRIMARY KEY, username TEXT, first_name TEXT, balance REAL NOT NULL DEFAULT 0, points INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, telegram_order_id TEXT, telegram_id TEXT NOT NULL, service_id TEXT NOT NULL, service_name TEXT, link TEXT NOT NULL, quantity INTEGER NOT NULL, api_price REAL NOT NULL, user_price REAL NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, type TEXT NOT NULL, url TEXT, reward INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS task_completions (task_id INTEGER NOT NULL, telegram_id TEXT NOT NULL, completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(task_id, telegram_id));
CREATE TABLE IF NOT EXISTS api_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, operation TEXT, ok INTEGER, message TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
`);
const count = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
if (!count) db.prepare('INSERT INTO tasks (title,type,url,reward) VALUES (?,?,?,?)').run('إعجاب بمنشور تجريبي','like','https://telegram.org',10);
export function upsertUser(user) {
  db.prepare(`INSERT INTO users (telegram_id, username, first_name) VALUES (@id,@username,@first_name)
    ON CONFLICT(telegram_id) DO UPDATE SET username=@username, first_name=@first_name`).run({id:String(user.id), username:user.username || '', first_name:user.first_name || ''});
  return db.prepare('SELECT * FROM users WHERE telegram_id=?').get(String(user.id));
}
