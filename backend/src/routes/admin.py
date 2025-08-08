from flask import Blueprint, jsonify, request, session
from src.models import db, User, Request, PDFFile, Appointment, Consultation
from datetime import datetime, timedelta
from sqlalchemy import func, desc

admin_bp = Blueprint('admin', __name__)

def require_admin():
    """التحقق من صلاحيات الإدارة"""
    if 'user_id' not in session:
        return jsonify({'error': 'يجب تسجيل الدخول أولاً'}), 401
    
    user = User.query.get(session['user_id'])
    if not user or user.national_id != 'admin':
        return jsonify({'error': 'غير مصرح لك بالوصول'}), 403
    
    return user

@admin_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """الحصول على إحصائيات لوحة التحكم"""
    admin_user = require_admin()
    if isinstance(admin_user, tuple):
        return admin_user
    
    try:
        # إحصائيات عامة
        total_users = User.query.filter(User.national_id != 'admin').count()
        total_requests = Request.query.count()
        pending_requests = Request.query.filter_by(status='pending').count()
        completed_requests = Request.query.filter_by(status='completed').count()
        
        # إحصائيات الطلبات حسب النوع
        request_types = db.session.query(
            Request.type,
            func.count(Request.id).label('count')
        ).group_by(Request.type).all()
        
        # إحصائيات الطلبات الأخيرة (آخر 7 أيام)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_requests = Request.query.filter(
            Request.created_date >= week_ago
        ).count()
        
        # المستخدمين الجدد (آخر 30 يوم)
        month_ago = datetime.utcnow() - timedelta(days=30)
        new_users = User.query.filter(
            User.registration_date >= month_ago,
            User.national_id != 'admin'
        ).count()
        
        # إحصائيات الحالة
        status_stats = db.session.query(
            Request.status,
            func.count(Request.id).label('count')
        ).group_by(Request.status).all()
        
        return jsonify({
            'general_stats': {
                'total_users': total_users,
                'total_requests': total_requests,
                'pending_requests': pending_requests,
                'completed_requests': completed_requests,
                'recent_requests': recent_requests,
                'new_users': new_users
            },
            'request_types': [
                {
                    'type': rt.type,
                    'type_text': Request.get_type_text(rt.type),
                    'count': rt.count
                } for rt in request_types
            ],
            'status_stats': [
                {
                    'status': ss.status,
                    'status_text': Request.get_status_text(ss.status),
                    'count': ss.count
                } for ss in status_stats
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الإحصائيات'}), 500

@admin_bp.route('/requests', methods=['GET'])
def get_all_requests():
    """الحصول على جميع الطلبات للإدارة"""
    admin_user = require_admin()
    if isinstance(admin_user, tuple):
        return admin_user
    
    try:
        # معاملات البحث والفلترة
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status_filter = request.args.get('status')
        type_filter = request.args.get('type')
        search_query = request.args.get('search')
        
        # بناء الاستعلام
        query = Request.query
        
        if status_filter:
            query = query.filter(Request.status == status_filter)
        
        if type_filter:
            query = query.filter(Request.type == type_filter)
        
        if search_query:
            # البحث في بيانات المستخدم
            query = query.join(User).filter(
                User.full_name.contains(search_query) |
                User.national_id.contains(search_query) |
                User.email.contains(search_query)
            )
        
        # ترتيب حسب التاريخ (الأحدث أولاً)
        query = query.order_by(desc(Request.created_date))
        
        # تطبيق التصفح
        requests = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'requests': [req.to_dict_with_user() for req in requests.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': requests.total,
                'pages': requests.pages,
                'has_next': requests.has_next,
                'has_prev': requests.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في جلب الطلبات'}), 500

@admin_bp.route('/requests/<int:request_id>', methods=['PUT'])
def update_request_status():
    """تحديث حالة الطلب"""
    admin_user = require_admin()
    if isinstance(admin_user, tuple):
        return admin_user
    
    try:
        req = Request.query.get_or_404(request_id)
        data = request.json
        
        # تحديث الحالة
        if 'status' in data:
            if data['status'] not in ['pending', 'in_progress', 'completed', 'cancelled']:
                return jsonify({'error': 'حالة غير صحيحة'}), 400
            req.status = data['status']
        
        # تحديث الملاحظات
        if 'notes' in data:
            req.notes = data['notes']
        
        # تحديث البيانات المعالجة
        if 'processed_data' in data:
            req.set_processed_data(data['processed_data'])
        
        req.updated_date = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'تم تحديث الطلب بنجاح',
            'request': req.to_dict_with_user()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'حدث خطأ في تحديث الطلب'}), 500

@admin_bp.route('/users/search', methods=['GET'])
def search_users():
    """البحث عن المستخدمين"""
    admin_user = require_admin()
    if isinstance(admin_user, tuple):
        return admin_user
    
    try:
        search_query = request.args.get('q', '').strip()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        if not search_query:
            return jsonify({'users': [], 'pagination': {}}), 200
        
        # البحث في الاسم ورقم الهوية والبريد الإلكتروني
        query = User.query.filter(
            User.national_id != 'admin'
        ).filter(
            User.full_name.contains(search_query) |
            User.national_id.contains(search_query) |
            User.email.contains(search_query) |
            User.phone.contains(search_query)
        ).order_by(User.registration_date.desc())
        
        users = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في البحث'}), 500

@admin_bp.route('/export/requests', methods=['GET'])
def export_requests():
    """تصدير جميع الطلبات"""
    admin_user = require_admin()
    if isinstance(admin_user, tuple):
        return admin_user
    
    try:
        # جلب جميع الطلبات مع بيانات المستخدمين
        requests = Request.query.join(User).order_by(
            Request.created_date.desc()
        ).all()
        
        export_data = []
        for req in requests:
            export_data.append({
                'request_id': req.id,
                'user_name': req.user.full_name,
                'user_national_id': req.user.national_id,
                'user_email': req.user.email,
                'user_phone': req.user.phone,
                'request_type': req.type,
                'request_type_text': Request.get_type_text(req.type),
                'status': req.status,
                'status_text': Request.get_status_text(req.status),
                'created_date': req.created_date.isoformat() if req.created_date else None,
                'updated_date': req.updated_date.isoformat() if req.updated_date else None,
                'data': req.get_data(),
                'processed_data': req.get_processed_data(),
                'notes': req.notes
            })
        
        return jsonify({
            'export_date': datetime.utcnow().isoformat(),
            'total_records': len(export_data),
            'data': export_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'حدث خطأ في تصدير البيانات'}), 500

