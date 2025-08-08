from src.models.user import db
from datetime import datetime
import json

class Request(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # appointment, consultation, medical_request
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled
    data = db.Column(db.Text, nullable=False)  # JSON data for request details
    processed_data = db.Column(db.Text, nullable=True)  # JSON data for processed results
    created_date = db.Column(db.DateTime, default=datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    notes = db.Column(db.Text, nullable=True)
    
    # العلاقات
    pdf_files = db.relationship('PDFFile', backref='request', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Request {self.id} - {self.type}>'

    def set_data(self, data_dict):
        """تحويل البيانات إلى JSON وحفظها"""
        self.data = json.dumps(data_dict, ensure_ascii=False)

    def get_data(self):
        """استرجاع البيانات من JSON"""
        try:
            return json.loads(self.data) if self.data else {}
        except json.JSONDecodeError:
            return {}

    def set_processed_data(self, data_dict):
        """تحويل البيانات المعالجة إلى JSON وحفظها"""
        self.processed_data = json.dumps(data_dict, ensure_ascii=False)

    def get_processed_data(self):
        """استرجاع البيانات المعالجة من JSON"""
        try:
            return json.loads(self.processed_data) if self.processed_data else {}
        except json.JSONDecodeError:
            return {}

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'status': self.status,
            'data': self.get_data(),
            'processed_data': self.get_processed_data(),
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
            'notes': self.notes,
            'pdf_files': [pdf.to_dict() for pdf in self.pdf_files] if self.pdf_files else []
        }

    def to_dict_with_user(self):
        """إرجاع البيانات مع معلومات المستخدم"""
        result = self.to_dict()
        if self.user:
            result['user'] = self.user.to_dict_safe()
        return result

    @staticmethod
    def get_type_text(request_type):
        """إرجاع النص العربي لنوع الطلب"""
        types = {
            'appointment': 'حجز موعد',
            'consultation': 'استشارة طبية',
            'medical_request': 'طلب تقرير طبي',
            'medical_excuse': 'عذر طبي (سكليف)',
            'review_certificate': 'مشهد مراجعة',
            'patient_companion_report': 'تقرير مرافق مريض'
        }
        return types.get(request_type, request_type)
    @staticmethod
    def get_status_text(status):
        """إرجاع النص العربي لحالة الطلب"""
        statuses = {
            'pending': 'قيد المراجعة',
            'in_progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        }
        return statuses.get(status, status)

