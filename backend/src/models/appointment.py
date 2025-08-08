from src.models.user import db
from datetime import datetime, date, time

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('request.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    doctor_name = db.Column(db.String(100), nullable=False)
    specialty = db.Column(db.String(100), nullable=False)
    hospital_name = db.Column(db.String(200), nullable=False)
    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(20), default='scheduled')  # scheduled, completed, cancelled, rescheduled
    confirmation_number = db.Column(db.String(50), unique=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Appointment {self.id} - {self.doctor_name}>'

    def generate_confirmation_number(self):
        """توليد رقم تأكيد فريد"""
        import uuid
        self.confirmation_number = f"APT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'user_id': self.user_id,
            'doctor_name': self.doctor_name,
            'specialty': self.specialty,
            'hospital_name': self.hospital_name,
            'appointment_date': self.appointment_date.isoformat() if self.appointment_date else None,
            'appointment_time': self.appointment_time.strftime('%H:%M') if self.appointment_time else None,
            'status': self.status,
            'confirmation_number': self.confirmation_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def get_status_text(status):
        """إرجاع النص العربي لحالة الموعد"""
        statuses = {
            'scheduled': 'مجدول',
            'completed': 'مكتمل',
            'cancelled': 'ملغي',
            'rescheduled': 'معاد جدولته'
        }
        return statuses.get(status, status)

