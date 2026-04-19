# نشر PostgreSQL على STC Cloud (مثال: `95.177.164.96`)

> **تنبيه أمني:** لا ترفع `WadaqSecret.pem` إلى Git (موجود في `.gitignore`). احفظه محلياً بصلاحيات مقيدة.

## 1) الاتصال بالسيرفر عبر SSH

من جهازك (Linux/macOS/WSL أو PowerShell مع `ssh`):

```bash
chmod 600 /path/to/WadaqSecret.pem
ssh -i /path/to/WadaqSecret.pem ubuntu@95.177.164.96
```

> استبدل `ubuntu` باسم المستخدم الذي يزودك به STC إن اختلف (مثل `debian`, `ec2-user`).

## 2) تثبيت Docker و Docker Compose (Ubuntu)

```bash
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
# سجّل خروجاً وادخل مجدداً لتفعيل مجموعة docker
```

## 3) رفع ملفات `docker-compose` وتهيئة البيئة

انسخ من المشروع المجلد `infra/stc-cloud/` إلى السيرفر (مثلاً `scp -i WadaqSecret.pem -r infra/stc-cloud ubuntu@95.177.164.96:~/wadaq-db/`).

على السيرفر:

```bash
cd ~/wadaq-db
cp env.example .env
nano .env   # عيّن POSTGRES_PASSWORD واسم القاعدة
docker compose up -d
docker compose ps
```

PostgreSQL يصبح متاحاً على `localhost:5432` داخل السيرفر. للوصول من التطبيق على نفس الشبكة استخدم IP السيرفر وفتح المنفذ في جدار الحماية **فقط لعناوين موثوقة** (يفضّل عدم فتح 5432 للعامة؛ استخدم VPN أو خادم API على نفس الجهاز).

## 4) نقل البيانات من Supabase إلى السيرفر

### أ) أخذ نسخة (من جهة لديها `pg_dump` واتصال بـ Supabase)

من لوحة Supabase: **Project Settings → Database → Connection string (URI)**  
أو استخدم **Connection pooling** إن لزم.

```bash
export SUPABASE_DB_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres"
pg_dump "$SUPABASE_DB_URL" -Fc -f supabase.dump
```

### ب) رفع الملف إلى STC واستعادته

```bash
scp -i WadaqSecret.pem supabase.dump ubuntu@95.177.164.96:~/
ssh -i WadaqSecret.pem ubuntu@95.177.164.96
docker cp supabase.dump wadaq-postgres:/tmp/supabase.dump
docker exec -it wadaq-postgres pg_restore -U wadaq -d wadaq --no-owner --verbose /tmp/supabase.dump
```

> إذا كانت أسماء المخططات/المستخدمين تختلف، راجع أخطاء `pg_restore` واضبط الأدوار (`GRANT`) أو استخدم `--no-acl` حسب الحاجة.

### ج) بديل: SQL فقط

```bash
pg_dump "$SUPABASE_DB_URL" --schema-only -f schema.sql
pg_dump "$SUPABASE_DB_URL" --data-only -f data.sql
# ثم استيراد بترتيب على السيرفر الجديد
```

## 5) خادم API (هذا المستودع: مجلد `server/`)

على نفس السيرفر أو على خادم تطبيق منفصل:

```bash
cd server
cp .env.example .env
# اضبط DATABASE_URL و JWT_SECRET و GOOGLE_CLIENT_ID
npm install
npm run migrate   # إن وُجدت سكربتات ترحيل
node src/index.js
```

يُفضّل تشغيله خلف **Nginx** مع HTTPS و`proxy_pass` إلى `127.0.0.1:8787`.

## 6) الواجهة (Vite)

في `.env` المحلي أو على Vercel:

```env
VITE_WADAQ_API_URL=https://api.yourdomain.com
```

بدون هذا المتغير يبقى التطبيق يعمل بالوضع الحالي (تخزين محلي في المتصفح).

---

## ملاحظات سيادة البيانات

- البيانات تُخزَّن على قرص السيرفر داخل المملكة عند استضافة STC داخل السعودية.
- لا تضع مفتاح قاعدة البيانات في `VITE_*`؛ يبقى على الخادم فقط.
