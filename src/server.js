import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { db, upsertUser } from './db.js';
import { validateInitData } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '../public')));

const profit = () => Number(process.env.PROFIT_PERCENT || 10);

async function smm(action, payload = {}) {
  const url = process.env.SMMCPAN_API_URL || 'https://smmcpan.com/api/v2';
  const key = process.env.SMMCPAN_API_KEY || '';
  const body = new URLSearchParams({ key, action, ...payload });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('استجابة غير صالحة من مزود الخدمات');
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || `SMMCPAN HTTP ${response.status}`);
  }

  return data;
}

function log(operation, ok, message) {
  db.prepare('INSERT INTO api_logs(operation,ok,message) VALUES (?,?,?)').run(
    operation,
    ok ? 1 : 0,
    String(message).slice(0, 500)
  );
}

function auth(req, res, next) {
  const user = validateInitData(req.get('x-telegram-init-data'), process.env.BOT_TOKEN);
  if (!user && process.env.ALLOW_DEV_AUTH !== 'true') {
    return res.status(401).json({ error: 'افتح التطبيق من Telegram' });
  }

  req.user = user || { id: 'dev-user', first_name: 'مستخدم تجريبي', username: '' };
  upsertUser(req.user);
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ArabStarsSMM', bot: Boolean(process.env.BOT_TOKEN) });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: db.prepare('SELECT * FROM users WHERE telegram_id=?').get(String(req.user.id)) });
});

app.get('/api/services', auth, async (_req, res) => {
  try {
    const data = await smm('services');
    log('services', true, 'ok');
    res.json({
      services: data.map((service) => ({
        ...service,
        user_rate: Number(service.rate || 0) * (1 + profit() / 100),
      })),
    });
  } catch (error) {
    log('services', false, error.message);
    res.status(502).json({ error: error.message });
  }
});

app.get('/api/tasks', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, c.completed_at
    FROM tasks t
    LEFT JOIN task_completions c ON c.task_id = t.id AND c.telegram_id = ?
    WHERE t.active = 1
    ORDER BY t.id DESC
  `).all(String(req.user.id));

  res.json({ tasks: rows });
});

app.post('/api/tasks/:id/complete', auth, (_req, res) => {
  res.status(409).json({ error: 'لا يتم منح النقاط تلقائيًا. سيتم تفعيل التحقق الحقيقي لاحقًا.' });
});

app.post('/api/orders', auth, async (req, res) => {
  const { service, link, quantity } = req.body || {};
  const item = service || {};
  const qty = Number(quantity);

  if (!item.service || !link || !Number.isInteger(qty) || qty < Number(item.min || 0) || qty > Number(item.max || Infinity)) {
    return res.status(400).json({ error: 'بيانات الطلب غير صحيحة' });
  }

  try {
    const apiRate = Number(item.rate || 0);
    const userPrice = apiRate * qty * (1 + profit() / 100);

    const user = db.prepare('SELECT * FROM users WHERE telegram_id=?').get(String(req.user.id));
    if (!user || Number(user.balance || 0) < userPrice) {
      return res.status(400).json({ error: 'الرصيد غير كافٍ. الشحن غير متاح في النسخة التجريبية.' });
    }

    const result = await smm('add', {
      service: String(item.service),
      link,
      quantity: String(qty),
    });

    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance - ? WHERE telegram_id = ? AND balance >= ?').run(userPrice, String(req.user.id), userPrice);
      db.prepare('INSERT INTO orders (telegram_order_id,telegram_id,service_id,service_name,link,quantity,api_price,user_price,status) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(String(result.order || ''), String(req.user.id), String(item.service), String(item.name || item.service), link, qty, apiRate * qty, userPrice, 'submitted');
    });

    tx();
    log('add', true, `order ${result.order || ''}`);
    res.json({ ok: true, order: result.order, price: userPrice });
  } catch (error) {
    log('add', false, error.message);
    res.status(502).json({ error: error.message });
  }
});

app.get('/api/orders', auth, (req, res) => {
  res.json({
    orders: db.prepare('SELECT * FROM orders WHERE telegram_id=? ORDER BY id DESC').all(String(req.user.id)),
  });
});

app.get('/api/admin/stats', auth, (req, res) => {
  if (String(req.user.id) !== String(process.env.ADMIN_ID)) {
    return res.sendStatus(403);
  }

  res.json({
    users: db.prepare('SELECT COUNT(*) c FROM users').get().c,
    orders: db.prepare('SELECT COUNT(*) c FROM orders').get().c,
    sales: db.prepare('SELECT COALESCE(SUM(user_price),0) s FROM orders').get().s,
    tasks: db.prepare('SELECT COUNT(*) c FROM tasks').get().c,
    logs: db.prepare('SELECT * FROM api_logs ORDER BY id DESC LIMIT 30').all(),
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

export function startServer() {
  const port = Number(process.env.PORT || 3000);
  return app.listen(port, () => {
    console.log(`ArabStarsSMM server listening on http://localhost:${port}`);
    if (!process.env.BOT_TOKEN) {
      console.warn('BOT_TOKEN is not configured. The web app is running, but Telegram bot is disabled.');
    }
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  startServer();
}
