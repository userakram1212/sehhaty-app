from flask import Blueprint, jsonify, request, session, send_file, current_app
from src.models import db, User, Request, PDFFile
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime

pdf_bp = Blueprint('pdf', __name__)

ALLOWED_EXTENSIONS = {'pdf'}

def allowed_file(filename):
    """التحقق من امتداد الملف"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def require_login():
    """التحقق من تسجيل الدخول"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    user = User.query.get(session['user_id'])
    if not user or user.status != 'active':
        session.clear()
        return jsonify({'error': 'الحساب غير نشط'}), 401
    
    return user

def require_admin():
    """التحقق من صلاحيات الإدارة"""
    user = require_login()
    if isinstance(user, tuple):  # إذا كان هناك خطأ
        return user
    
    if user.national_id != 'admin':
        return jsonify({'error': 'غير مصرح لك بالوصول'}), 403
    
    return user

@pdf_bp.route('/upload/<int:request_id>', methods=['POST'])
def upload_pdf(request_id):
    """رفع ملف PDF لطلب محدد (للإدارة فقط)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        # التحقق من وجود الطلب
        req = Request.query.get_or_404(request_id)
        
        if req.type != 'medical_request':
            return jsonify({'error': 'يمكن رفع ملفات PDF للتقارير الطبية فقط'}), 400
        
        # التحقق من وجود الملف
        if 'file' not in request.files:
            return jsonify({'error': 'لم يتم اختيار ملف'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'لم يتم اختيار ملف'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'نوع الملف غير مدعوم. يجب أن يكون PDF'}), 400
        
        # إنشاء اسم ملف فريد
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        
        # حفظ الملف
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        # الحصول على حجم الملف
        file_size = os.path.getsize(file_path)
        
        # إنشاء سجل في قاعدة البيانات
        pdf_file = PDFFile(
            request_id=request_id,
            filename=unique_filename,
            original_filename=original_filename,
            file_path=file_path,
            file_size=file_size,
            uploaded_by='admin',
            notes=request.form.get('notes', '')
        )
        
        db.session.add(pdf_file)
        
        # تحديث حالة الطلب
        req.status = 'completed'
        req.updated_date = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم رفع الملف بنجاح',
            'file': pdf_file.to_dict(),
            'request': req.to_dict_with_user()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        # حذف الملف إذا تم رفعه ولكن فشل في حفظ البيانات
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({'error': 'حدث خطأ في رفع الملف'}), 500

@pdf_bp.route('/download/<int:file_id>', methods=['GET'])
def download_pdf(file_id):
    """تحميل ملف PDF"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        pdf_file = PDFFile.query.get_or_404(file_id)
        
        # التحقق من الصلاحيات
        if user.national_id != 'admin':
            # المستخدم العادي يمكنه تحميل ملفاته فقط
            if pdf_file.request.user_id != user.id:
                return jsonify({'error': 'غير مصرح لك بتحميل هذا الملف'}), 403
        
        # التحقق من وجود الملف
        if not pdf_file.file_exists():
            return jsonify({'error': 'الملف غير موجود على الخادم'}), 404
        
        if not pdf_file.is_active:
            return jsonify({'error': 'الملف غير متاح'}), 404
        
        return send_file(
            pdf_file.file_path,
            as_attachment=True,
            download_name=pdf_file.original_filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في تحميل الملف'}), 500

@pdf_bp.route('/view/<int:file_id>', methods=['GET'])
def view_pdf(file_id):
    """عرض ملف PDF في المتصفح"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        pdf_file = PDFFile.query.get_or_404(file_id)
        
        # التحقق من الصلاحيات
        if user.national_id != 'admin':
            # المستخدم العادي يمكنه عرض ملفاته فقط
            if pdf_file.request.user_id != user.id:
                return jsonify({'error': 'غير مصرح لك بعرض هذا الملف'}), 403
        
        # التحقق من وجود الملف
        if not pdf_file.file_exists():
            return jsonify({'error': 'الملف غير موجود على الخادم'}), 404
        
        if not pdf_file.is_active:
            return jsonify({'error': 'الملف غير متاح'}), 404
        
        return send_file(
            pdf_file.file_path,
            as_attachment=False,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في عرض الملف'}), 500

@pdf_bp.route('/user-files', methods=['GET'])
def get_user_files():
    """الحصول على ملفات المستخدم"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        # الحصول على جميع الطلبات التي تحتوي على ملفات PDF
        user_requests = Request.query.filter_by(user_id=user.id).all()
        files = []
        
        for req in user_requests:
            for pdf_file in req.pdf_files:
                if pdf_file.is_active:
                    file_data = pdf_file.to_dict()
                    file_data['request_type'] = req.type
                    file_data['request_data'] = req.get_data()
                    files.append(file_data)
        
        return jsonify(files), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الملفات'}), 500

# مسارات الإدارة
@pdf_bp.route('/admin/files', methods=['GET'])
def admin_get_files():
    """الحصول على جميع الملفات (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        files = PDFFile.query.order_by(PDFFile.upload_date.desc()).all()
        result = []
        
        for pdf_file in files:
            file_data = pdf_file.to_dict()
            file_data['request'] = pdf_file.request.to_dict_with_user()
            result.append(file_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الملفات'}), 500

@pdf_bp.route('/admin/files/<int:file_id>', methods=['DELETE'])
def admin_delete_file(file_id):
    """حذف ملف PDF (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        pdf_file = PDFFile.query.get_or_404(file_id)
        
        # حذف الملف من القرص
        if pdf_file.delete_file():
            # حذف السجل من قاعدة البيانات
            db.session.delete(pdf_file)
            db.session.commit()
            
            return jsonify({'message': 'تم حذف الملف بنجاح'}), 200
        else:
            # إذا فشل حذف الملف من القرص، قم بتعطيله فقط
            pdf_file.is_active = False
            db.session.commit()
            
            return jsonify({'message': 'تم تعطيل الملف (لم يتم حذفه من القرص)'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في حذف الملف'}), 500

@pdf_bp.route('/admin/files/<int:file_id>/toggle', methods=['POST'])
def admin_toggle_file(file_id):
    """تفعيل/تعطيل ملف PDF (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        pdf_file = PDFFile.query.get_or_404(file_id)
        pdf_file.is_active = not pdf_file.is_active
        db.session.commit()
        
        status = 'تم تفعيل' if pdf_file.is_active else 'تم تعطيل'
        return jsonify({'message': f'{status} الملف بنجاح'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في تحديث حالة الملف'}), 500

