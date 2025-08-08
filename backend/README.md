# موقع صحتي - الواجهة الخلفية

## نظرة عامة
الواجهة الخلفية لموقع صحتي مبنية باستخدام Flask وتدعم PostgreSQL لقاعدة البيانات.

## الميزات
- نظام مصادقة آمن للمستخدمين
- إدارة الطلبات الطبية (مواعيد، استشارات، تقارير)
- رفع وإدارة ملفات PDF
- لوحة تحكم إدارية شاملة
- دعم CORS للواجهة الأمامية
- قاعدة بيانات PostgreSQL

## متطلبات النظام
- Python 3.11+
- PostgreSQL 12+
- Flask 3.1+

## التثبيت المحلي

### 1. تثبيت المتطلبات
```bash
pip install -r requirements.txt
```

### 2. إعداد متغيرات البيئة
```bash
export DATABASE_URL="postgresql://username:password@localhost/sehhaty"
export SECRET_KEY="your-secret-key-here"
```

### 3. تهيئة قاعدة البيانات
```bash
python init_db.py
```

### 4. تشغيل الخادم
```bash
python -m src.main
```

## النشر على Render

### 1. إنشاء خدمة ويب جديدة
- اختر "Web Service"
- اربط مستودع GitHub
- اختر فرع main

### 2. إعدادات البناء
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn src.main:app --workers 4 --bind 0.0.0.0:$PORT`
- **Environment**: Python 3

### 3. إنشاء قاعدة بيانات PostgreSQL
- اختر "PostgreSQL"
- اختر الخطة المجانية
- احفظ رابط الاتصال

### 4. متغيرات البيئة
```
DATABASE_URL=<postgresql-connection-string>
SECRET_KEY=sehhaty_secret_key_2025_secure
PYTHON_VERSION=3.11.0
```

### 5. تهيئة قاعدة البيانات
بعد النشر الأول، قم بتشغيل:
```bash
python init_db.py
```

## API Endpoints

### المصادقة
- `POST /api/register` - تسجيل مستخدم جديد
- `POST /api/login` - تسجيل الدخول
- `POST /api/logout` - تسجيل الخروج
- `GET /api/check-session` - فحص الجلسة

### الطلبات
- `POST /api/requests` - إنشاء طلب جديد
- `GET /api/requests` - جلب طلبات المستخدم
- `PUT /api/requests/<id>` - تحديث طلب

### الإدارة
- `GET /api/admin/dashboard/stats` - إحصائيات لوحة التحكم
- `GET /api/admin/requests` - جميع الطلبات
- `PUT /api/admin/requests/<id>` - تحديث حالة الطلب
- `GET /api/admin/users/search` - البحث عن المستخدمين

### ملفات PDF
- `POST /api/pdf/upload` - رفع ملف PDF
- `GET /api/pdf/<id>` - تحميل ملف PDF
- `DELETE /api/pdf/<id>` - حذف ملف PDF

## هيكل المشروع
```
src/
├── main.py              # التطبيق الرئيسي
├── models/              # نماذج قاعدة البيانات
│   ├── user.py         # نموذج المستخدم
│   ├── request.py      # نموذج الطلبات
│   ├── pdf_file.py     # نموذج ملفات PDF
│   ├── appointment.py  # نموذج المواعيد
│   └── consultation.py # نموذج الاستشارات
├── routes/              # مسارات API
│   ├── user.py         # مسارات المستخدمين
│   ├── request.py      # مسارات الطلبات
│   ├── pdf.py          # مسارات ملفات PDF
│   └── admin.py        # مسارات الإدارة
└── static/              # الملفات الثابتة
```

## الأمان
- تشفير كلمات المرور باستخدام Werkzeug
- جلسات آمنة مع Flask sessions
- التحقق من الصلاحيات لكل endpoint
- حماية من CSRF
- تحديد حجم الملفات المرفوعة

## المراقبة والصيانة
- مراجعة logs بانتظام
- مراقبة استخدام قاعدة البيانات
- النسخ الاحتياطي الدوري
- تحديث المتطلبات الأمنية

## الدعم الفني
للمساعدة أو الإبلاغ عن مشاكل، يرجى إنشاء issue في المستودع.

