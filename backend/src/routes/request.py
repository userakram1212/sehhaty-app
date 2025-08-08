from flask import Blueprint, jsonify, request, session
from src.models import db, User, Request, Appointment, Consultation
from datetime import datetime

request_bp = Blueprint('request', __name__)

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

@request_bp.route('/requests', methods=['POST'])
def create_request():
    """إنشاء طلب جديد"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        data = request.json
        
        # التحقق من نوع الطلب
        request_type = data.get('type')
        if request_type not in ['appointment', 'consultation', 'medical_request', 'medical_excuse', 'review_certificate', 'patient_companion_report']:
            return jsonify({'error': 'نوع الطلب غير صحيح'}), 400
        
        # التحقق من البيانات المطلوبة حسب نوع الطلب
        request_data = data.get('data', {})
        
        if request_type == 'appointment':
            required_fields = ['specialty', 'city', 'preferredDate', 'preferredTime']
            for field in required_fields:
                if not request_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب للمواعيد'}), 400
        
        elif request_type == 'consultation':
            required_fields = ['consultationType', 'description']
            for field in required_fields:
                if not request_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب للاستشارات'}), 400
        
        elif request_type == 'medical_request':
            required_fields = ['reportType', 'purpose']
            for field in required_fields:
                if not request_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب للتقارير الطبية'}), 400
        
        elif request_type == 'medical_excuse':
            required_fields = ['startDate', 'endDate', 'region', 'workplace']
            for field in required_fields:
                if not request_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب للعذر الطبي'}), 400
        
        elif request_type == 'review_certificate':
            required_fields = ['reviewDate', 'region', 'workplace']
            for field in required_fields:
                if not request_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب لمشهد المراجعة'}), 400
        
        elif request_type == 'patient_companion_report':
            required_fields = ['patientName', 'patientNationalId', 'hospitalEntryDate', 'hospitalExitDate', 'medicalCondition', 'region', 'companionName', 'companionNationalId', 'relationship']
            for field in required_fields:
                if not request_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب لتقرير مرافق المريض'}), 400
        
        # إنشاء الطلب
        new_request = Request(
            user_id=user.id,
            type=request_type,
            status='pending'
        )
        new_request.set_data(request_data)
        
        db.session.add(new_request)
        db.session.commit()
        
        return jsonify({
            'message': 'تم إنشاء الطلب بنجاح',
            'request': new_request.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في إنشاء الطلب'}), 500

@request_bp.route('/requests', methods=['GET'])
def get_user_requests():
    """الحصول على طلبات المستخدم"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        user_requests = Request.query.filter_by(user_id=user.id).order_by(Request.created_date.desc()).all()
        return jsonify([req.to_dict() for req in user_requests]), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الطلبات'}), 500

@request_bp.route('/requests/<int:request_id>', methods=['GET'])
def get_request(request_id):
    """الحصول على تفاصيل طلب محدد"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        req = Request.query.filter_by(id=request_id, user_id=user.id).first()
        if not req:
            return jsonify({'error': 'الطلب غير موجود'}), 404
        
        return jsonify(req.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الطلب'}), 500

@request_bp.route('/requests/<int:request_id>/cancel', methods=['POST'])
def cancel_request(request_id):
    """إلغاء طلب"""
    user = require_login()
    if isinstance(user, tuple):
        return user
    
    try:
        req = Request.query.filter_by(id=request_id, user_id=user.id).first()
        if not req:
            return jsonify({'error': 'الطلب غير موجود'}), 404
        
        if req.status in ['completed', 'cancelled']:
            return jsonify({'error': 'لا يمكن إلغاء هذا الطلب'}), 400
        
        req.status = 'cancelled'
        req.updated_date = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'تم إلغاء الطلب بنجاح'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في إلغاء الطلب'}), 500

# مسارات الإدارة
@request_bp.route('/admin/requests', methods=['GET'])
def admin_get_requests():
    """الحصول على جميع الطلبات (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        # فلترة حسب النوع أو الحالة إذا تم تمريرها
        request_type = request.args.get('type')
        status = request.args.get('status')
        
        query = Request.query
        
        if request_type:
            query = query.filter_by(type=request_type)
        
        if status:
            query = query.filter_by(status=status)
        
        requests = query.order_by(Request.created_date.desc()).all()
        return jsonify([req.to_dict_with_user() for req in requests]), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الطلبات'}), 500

@request_bp.route('/admin/requests/<int:request_id>', methods=['GET'])
def admin_get_request(request_id):
    """الحصول على تفاصيل طلب محدد (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        req = Request.query.get_or_404(request_id)
        return jsonify(req.to_dict_with_user()), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الطلب'}), 500

@request_bp.route('/admin/requests/<int:request_id>/status', methods=['PUT'])
def admin_update_request_status(request_id):
    """تحديث حالة الطلب (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        req = Request.query.get_or_404(request_id)
        data = request.json
        
        new_status = data.get('status')
        if new_status not in ['pending', 'in_progress', 'completed', 'cancelled']:
            return jsonify({'error': 'حالة غير صحيحة'}), 400
        
        req.status = new_status
        req.updated_date = datetime.utcnow()
        
        # إضافة البيانات المعالجة إذا تم تمريرها
        if 'processed_data' in data:
            req.set_processed_data(data['processed_data'])
        
        # إضافة ملاحظات إذا تم تمريرها
        if 'notes' in data:
            req.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم تحديث حالة الطلب بنجاح',
            'request': req.to_dict_with_user()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في تحديث الطلب'}), 500

@request_bp.route('/admin/requests/<int:request_id>/process', methods=['POST'])
def admin_process_request(request_id):
    """معالجة طلب (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        req = Request.query.get_or_404(request_id)
        data = request.json
        
        if req.type == 'appointment':
            # معالجة طلب الموعد
            processed_data = {
                'hospitalName': data.get('hospitalName'),
                'doctorName': data.get('doctorName'),
                'doctorSpecialty': data.get('doctorSpecialty'),
                'doctorPhone': data.get('doctorPhone'),
                'appointmentDate': data.get('appointmentDate'),
                'appointmentTime': data.get('appointmentTime')
            }
            
            # التحقق من البيانات المطلوبة
            required_fields = ['hospitalName', 'doctorName', 'doctorSpecialty', 'doctorPhone', 'appointmentDate', 'appointmentTime']
            for field in required_fields:
                if not processed_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب'}), 400
            
            req.set_processed_data(processed_data)
            req.status = 'completed'
            
        elif req.type == 'consultation':
            # معالجة طلب الاستشارة
            processed_data = {
                'doctorName': data.get('doctorName'),
                'doctorSpecialty': data.get('doctorSpecialty'),
                'doctorPhone': data.get('doctorPhone')
            }
            
            # التحقق من البيانات المطلوبة
            required_fields = ['doctorName', 'doctorSpecialty', 'doctorPhone']
            for field in required_fields:
                if not processed_data.get(field):
                    return jsonify({'error': f'الحقل {field} مطلوب'}), 400
            
            req.set_processed_data(processed_data)
            req.status = 'completed'
        
        else:
            return jsonify({'error': 'نوع الطلب لا يدعم هذه العملية'}), 400
        
        req.updated_date = datetime.utcnow()
        if 'notes' in data:
            req.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'تم معالجة الطلب بنجاح',
            'request': req.to_dict_with_user()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في معالجة الطلب'}), 500

@request_bp.route('/admin/statistics', methods=['GET'])
def admin_get_statistics():
    """الحصول على إحصائيات الطلبات (للإدارة)"""
    admin = require_admin()
    if isinstance(admin, tuple):
        return admin
    
    try:
        total_requests = Request.query.count()
        pending_requests = Request.query.filter_by(status='pending').count()
        completed_requests = Request.query.filter_by(status='completed').count()
        cancelled_requests = Request.query.filter_by(status='cancelled').count()
        
        # طلبات اليوم
        today = datetime.utcnow().date()
        today_requests = Request.query.filter(
            db.func.date(Request.created_date) == today
        ).count()
        
        # إحصائيات حسب النوع
        appointment_requests = Request.query.filter_by(type='appointment').count()
        consultation_requests = Request.query.filter_by(type='consultation').count()
        medical_requests = Request.query.filter_by(type='medical_request').count()
        
        return jsonify({
            'total_requests': total_requests,
            'pending_requests': pending_requests,
            'completed_requests': completed_requests,
            'cancelled_requests': cancelled_requests,
            'today_requests': today_requests,
            'appointment_requests': appointment_requests,
            'consultation_requests': consultation_requests,
            'medical_requests': medical_requests
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الإحصائيات'}), 500

