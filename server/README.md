# Wadaq API — مصادقة PostgreSQL + JWT

## التشغيل السريع

```bash
cd server
cp .env.example .env
# اضبط DATABASE_URL و JWT_SECRET و GOOGLE_CLIENT_ID و CORS_ORIGINS
npm install
```

تهيئة قاعدة البيانات (مرة واحدة):

```bash
# من جهاز يصل إلى PostgreSQL
psql "$DATABASE_URL" -f migrations/001_init.sql
```

أو من داخل حاوية Docker:

```bash
docker exec -i wadaq-postgres psql -U wadaq -d wadaq < migrations/001_init.sql
```

التشغيل:

```bash
npm start
```

التحقق: `GET http://localhost:8787/api/health`

## نقاط النهاية

| الطريقة | المسار | الوصف |
|--------|--------|--------|
| POST | `/api/auth/signup` | بريد + كلمة مرور (bcrypt) |
| POST | `/api/auth/login` | تسجيل دخول |
| POST | `/api/auth/google` | `{ "credential": "<JWT من Google One Tap>" }` |
| GET | `/api/auth/me` | `Authorization: Bearer <JWT>` |
| PATCH | `/api/auth/me` | تحديث حقول مسموحة للمستخدم الحالي |

## الأمان

- لا تضع `JWT_SECRET` أو `DATABASE_URL` في متغيرات `VITE_*`.
- استخدم HTTPS أمام Nginx/Caddy على السيرفر العام.
