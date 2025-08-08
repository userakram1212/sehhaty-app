from flask import Blueprint, jsonify, request, session
from src.models import db, User
from datetime import datetime
import re

user_bp = Blueprint('user', __name__)

def validate_email(email):
    """التحقق من صحة البريد الإلكتروني"""
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

def validate_national_id(national_id):
    """التحقق من صحة رقم الهوية"""
    return len(national_id) >= 10 and national_id.isdigit()

def validate_phone(phone):
    """التحقق من صحة رقم الجوال"""
    return len(phone) >= 10 and phone.replace('+', '').replace('-', '').replace(' ', '').isdigit()

@user_bp.route('/register', methods=['POST'])
def register():
    """تسجيل مستخدم جديد"""
    try:
        data = request.json
        
        # التحقق من وجود البيانات المطلوبة
        required_fields = ['full_name', 'national_id', 'email', 'phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'الحقل {field} مطلوب'}), 400
        
        # التحقق من صحة البيانات
        if not validate_email(data['email']):
            return jsonify({'error': 'البريد الإلكتروني غير صحيح'}), 400
        
        if not validate_national_id(data['national_id']):
            return jsonify({'error': 'رقم الهوية غير صحيح'}), 400
        
        if not validate_phone(data['phone']):
            return jsonify({'error': 'رقم الجوال غير صحيح'}), 400
        
        # التحقق من عدم وجود مستخدم بنفس رقم الهوية أو البريد الإلكتروني
        existing_user = User.query.filter(
            (User.national_id == data['national_id']) | 
            (User.email == data['email'])
        ).first()
        
        if existing_user:
            if existing_user.national_id == data['national_id']:
                return jsonify({'error': 'رقم الهوية مسجل مسبقاً'}), 400
            else:
                return jsonify({'error': 'البريد الإلكتروني مسجل مسبقاً'}), 400
        
        # إنشاء المستخدم الجديد
        user = User(
            full_name=data['full_name'],
            national_id=data['national_id'],
            email=data['email'],
            phone=data['phone'],
            status='active'
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء الحساب بنجاح',
            'user': user.to_dict_safe()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في إنشاء الحساب'}), 500

@user_bp.route('/login', methods=['POST'])
def login():
    """تسجيل دخول المستخدم"""
    try:
        data = request.json
        
        if not data.get('national_id'):
            return jsonify({'error': 'رقم الهوية مطلوب'}), 400
        
        # البحث عن المستخدم
        user = User.query.filter_by(national_id=data['national_id']).first()
        
        if not user:
            return jsonify({'error': 'رقم الهوية غير مسجل'}), 404
        
        if user.status == 'blocked':
            return jsonify({'error': 'الحساب محظور. يرجى التواصل مع الإدارة'}), 403
        
        # تحديث آخر تسجيل دخول
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # حفظ معلومات المستخدم في الجلسة
        session['user_id'] = user.id
        session['user_national_id'] = user.national_id
        
        return jsonify({
            'message': 'تم تسجيل الدخول بنجاح',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في تسجيل الدخول'}), 500

@user_bp.route('/logout', methods=['POST'])
def logout():
    """تسجيل خروج المستخدم"""
    session.clear()
    return jsonify({'message': 'تم تسجيل الخروج بنجاح'}), 200

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    """الحصول على ملف المستخدم الشخصي"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'error': 'المستخدم غير موجود'}), 404
    
    return jsonify(user.to_dict()), 200

@user_bp.route('/profile', methods=['PUT'])
def update_profile():
    """تحديث ملف المستخدم الشخصي"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    try:
        user = User.query.get(session['user_id'])
        if not user:
            return jsonify({'error': 'المستخدم غير موجود'}), 404
        
        data = request.json
        
        # تحديث البيانات المسموح بتحديثها
        if 'full_name' in data:
            user.full_name = data['full_name']
        
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({'error': 'البريد الإلكتروني غير صحيح'}), 400
            
            # التحقق من عدم وجود مستخدم آخر بنفس البريد الإلكتروني
            existing_user = User.query.filter(
                (User.email == data['email']) & (User.id != user.id)
            ).first()
            
            if existing_user:
                return jsonify({'error': 'البريد الإلكتروني مسجل مسبقاً'}), 400
            
            user.email = data['email']
        
        if 'phone' in data:
            if not validate_phone(data['phone']):
                return jsonify({'error': 'رقم الجوال غير صحيح'}), 400
            user.phone = data['phone']
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم تحديث الملف الشخصي بنجاح',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في تحديث الملف الشخصي'}), 500

@user_bp.route('/check-session', methods=['GET'])
def check_session():
    """التحقق من حالة الجلسة"""
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user and user.status == 'active':
            return jsonify({
                'logged_in': True,
                'user': user.to_dict()
            }), 200
        else:
            session.clear()
    
    return jsonify({'logged_in': False}), 200

# مسارات الإدارة (محمية)
@user_bp.route('/admin/users', methods=['GET'])
def admin_get_users():
    """الحصول على جميع المستخدمين (للإدارة فقط)"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    admin_user = User.query.get(session['user_id'])
    if not admin_user or admin_user.national_id != 'admin':
        return jsonify({'error': 'غير مصرح لك بالوصول'}), 403
    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@user_bp.route('/admin/users/<int:user_id>/block', methods=['POST'])
def admin_block_user(user_id):
    """حظر مستخدم (للإدارة فقط)"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    admin_user = User.query.get(session['user_id'])
    if not admin_user or admin_user.national_id != 'admin':
        return jsonify({'error': 'غير مصرح لك بالوصول'}), 403
    
    try:
        user = User.query.get_or_404(user_id)
        if user.national_id == 'admin':
            return jsonify({'error': 'لا يمكن حظر حساب المدير'}), 400
        
        user.status = 'blocked'
        db.session.commit()
        
        return jsonify({'message': f'تم حظر المستخدم {user.full_name}'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في حظر المستخدم'}), 500

@user_bp.route('/admin/users/<int:user_id>/unblock', methods=['POST'])
def admin_unblock_user(user_id):
    """إلغاء حظر مستخدم (للإدارة فقط)"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    admin_user = User.query.get(session['user_id'])
    if not admin_user or admin_user.national_id != 'admin':
        return jsonify({'error': 'غير مصرح لك بالوصول'}), 403
    
    try:
        user = User.query.get_or_404(user_id)
        user.status = 'active'
        db.session.commit()
        
        return jsonify({'message': f'تم إلغاء حظر المستخدم {user.full_name}'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في إلغاء حظر المستخدم'}), 500

@user_bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    """حذف مستخدم (للإدارة فقط)"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    admin_user = User.query.get(session['user_id'])
    if not admin_user or admin_user.national_id != 'admin':
        return jsonify({'error': 'غير مصرح لك بالوصول'}), 403
    
    try:
        user = User.query.get_or_404(user_id)
        if user.national_id == 'admin':
            return jsonify({'error': 'لا يمكن حذف حساب المدير'}), 400
        
        user_name = user.full_name
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': f'تم حذف المستخدم {user_name}'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في حذف المستخدم'}), 500
