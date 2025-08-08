import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models import db, User, Request, PDFFile, Appointment, Consultation
from src.routes.user import user_bp
from src.routes.request import request_bp
from src.routes.pdf import pdf_bp
from src.routes.admin import admin_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'sehhaty_secret_key_2025_secure'

# تمكين CORS للسماح بالطلبات من الواجهة الأمامية
CORS(app)

# تسجيل المسارات
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(request_bp, url_prefix='/api')
app.register_blueprint(pdf_bp, url_prefix='/api/pdf')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# إعداد قاعدة البيانات لـ PostgreSQL
database_url = os.environ.get('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url or \
    f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# إعداد مجلد رفع الملفات
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

db.init_app(app)

# إنشاء الجداول
with app.app_context():
    db.create_all()
    
    # إنشاء مستخدم إداري افتراضي إذا لم يكن موجوداً
    admin_user = User.query.filter_by(national_id='admin').first()
    if not admin_user:
        admin_user = User(
            full_name='مدير النظام',
            national_id='admin',
            email='admin@sehhaty.com',
            phone='0000000000',
            status='active'
        )
        admin_user.set_password('SehhatyAdmin2025!') # كلمة مرور قوية جديدة
        db.session.add(admin_user)
        db.session.commit()
        print("تم إنشاء حساب المدير الافتراضي")

@app.route('/', defaults={'path': ''}) 
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

# إزالة هذا الجزء لأن Gunicorn سيتولى تشغيل التطبيق
# if __name__ == '__main__':
#     port = int(os.environ.get('PORT', 5001))
#     app.run(host='0.0.0.0', port=port, debug=False)





