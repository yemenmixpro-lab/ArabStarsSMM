# ArabStarsSMM

نسخة تجريبية بسيطة من Telegram Mini App عربية RTL، تتضمن عرض خدمات SMMCPAN، حساب السعر تلقائيًا بإضافة نسبة الربح، إنشاء الطلبات، المهام التجريبية، وبوت Telegram.

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env`.
2. ضع `BOT_TOKEN` و`SMMCPAN_API_KEY` و`ADMIN_ID` و`WEBAPP_URL`.
3. ثبّت وشغّل:

```bash
npm install
npm start
```

للتجربة من متصفح عادي فقط، اضبط `ALLOW_DEV_AUTH=true` (لا تستخدمه في الإنتاج). لاختبار إنشاء الطلب يجب أن يكون رصيد المستخدم موجودًا في قاعدة البيانات؛ النسخة التجريبية لا تحتوي بوابة دفع وهمية.

## النشر على Railway

1. أنشئ مشروعًا جديدًا من هذا المستودع.
2. سيكتشف Railway `Dockerfile` تلقائيًا.
3. أضف المتغيرات التالية من تبويب Variables: `BOT_TOKEN`, `ADMIN_ID`, `WEBAPP_URL`, `SMMCPAN_API_URL`, `SMMCPAN_API_KEY`, `PROFIT_PERCENT`, `DATABASE_PATH`.
4. اجعل `WEBAPP_URL` رابط Railway العام عبر HTTPS، مثل `https://your-app.up.railway.app`، ثم اضبطه في BotFather كزر Mini App.
5. أضف Volume دائمًا واربطه على `/app/data`، واجعل `DATABASE_PATH=/app/data/arabstars.sqlite` حتى لا تضيع قاعدة SQLite عند إعادة النشر.
6. بعد النشر اختبر `https://your-domain/health`، ثم أرسل `/start` للبوت.

## ملاحظات مهمة

- مفتاح SMMCPAN لا يصل إلى المتصفح؛ كل طلب API يتم من الخادم.
- السعر المعروض والمحسوب = سعر API × (1 + `PROFIT_PERCENT` / 100)، والقيمة الافتراضية 10%.
- Telegram `initData` يتم التحقق منه على الخادم.
- لا تمنح المهام نقاطًا بمجرد الضغط على التحقق؛ endpoint التحقق الحالي يرفض المكافأة إلى أن تُضاف آلية تحقق حقيقية.
- هذه نسخة تجريبية: لا توجد بوابة دفع وهمية، والإدارة تعرض الإحصائيات عبر `/api/admin/stats` بعد المصادقة من Telegram Admin.
