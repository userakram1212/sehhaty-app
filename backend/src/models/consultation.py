from src.models.user import db
from datetime import datetime

class Consultation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('request.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    whatsapp_number = db.Column(db.String(20), nullable=False)
    consultation_type = db.Column(db.String(50), nullable=False)  # immediate, scheduled
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled
    scheduled_time = db.Column(db.DateTime, nullable=True)
    duration_minutes = db.Column(db.Integer, default=30)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Consultation {self.id} - {self.doctor_name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'user_id': self.user_id,
            'doctor_name': self.doctor_name,
            'specialty': self.specialty,
            'whatsapp_number': self.whatsapp_number,
            'consultation_type': self.consultation_type,
            'status': self.status,
            'scheduled_time': self.scheduled_time.isoformat() if self.scheduled_time else None,
            'duration_minutes': self.duration_minutes,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def get_status_text(status):
        """إرجاع النص العربي لحالة الاستشارة"""
        statuses = {
            'pending': 'في الانتظار',
            'in_progress': 'جارية',
            'completed': 'مكتملة',
            'cancelled': 'ملغية'
        }
        return statuses.get(status, status)

    @staticmethod
    def get_type_text(consultation_type):
        """إرجاع النص العربي لنوع الاستشارة"""
        types = {
            'immediate': 'فورية',
            'scheduled': 'مجدولة'
        }
        return types.get(consultation_type, consultation_type)

