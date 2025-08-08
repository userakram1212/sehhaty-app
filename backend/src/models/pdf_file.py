from src.models.user import db
from datetime import datetime
import os

class PDFFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('request.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # بالبايت
    mime_type = db.Column(db.String(100), default='application/pdf')
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.String(50), default='admin')  # admin, system, user
    notes = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<PDFFile {self.filename}>'

    def get_file_size_formatted(self):
        """إرجاع حجم الملف بصيغة مقروءة"""
        size = self.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"

    def file_exists(self):
        """التحقق من وجود الملف على القرص"""
        return os.path.exists(self.file_path)

    def delete_file(self):
        """حذف الملف من القرص"""
        try:
            if self.file_exists():
                os.remove(self.file_path)
                return True
        except Exception as e:
            print(f"Error deleting file {self.file_path}: {e}")
        return False

    def to_dict(self):
        return {
            'id': self.id,
            'request_id': self.request_id,
            'filename': self.filename,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'file_size_formatted': self.get_file_size_formatted(),
            'mime_type': self.mime_type,
            'upload_date': self.upload_date.isoformat() if self.upload_date else None,
            'uploaded_by': self.uploaded_by,
            'notes': self.notes,
            'is_active': self.is_active,
            'file_exists': self.file_exists()
        }

