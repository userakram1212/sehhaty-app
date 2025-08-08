#!/usr/bin/env python3
"""
سكريبت تهيئة قاعدة البيانات لموقع صحتي
يقوم بإنشاء الجداول والفهارس والبيانات الأولية
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.main import app
from src.models import db, User, Request, PDFFile
from datetime import datetime

def init_database():
    """تهيئة قاعدة البيانات"""
    with app.app_context():
        print("🔄 بدء تهيئة قاعدة البيانات...")
        
        # إنشاء الجداول
        print("📋 إنشاء الجداول...")
        db.create_all()
        
        # إنشاء المدير الافتراضي
        print("👤 إنشاء حساب المدير...")
        admin_user = User.query.filter_by(national_id='admin').first()
        if not admin_user:
            admin_user = User(
                full_name='مدير النظام',
                national_id='admin',
                email='admin@sehhaty.com',
                phone='0000000000',
                status='active'
            )
            admin_user.set_password('SehhatyAdmin2025!')
            db.session.add(admin_user)
            print("✅ تم إنشاء حساب المدير بنجاح")
        else:
            print("ℹ️ حساب المدير موجود مسبقاً")
        
        # إنشاء مستخدم تجريبي
        print("👥 إنشاء مستخدم تجريبي...")
        test_user = User.query.filter_by(national_id='1234567890').first()
        if not test_user:
            test_user = User(
                full_name='أحمد محمد السعودي',
                national_id='1234567890',
                email='ahmed@example.com',
                phone='0501234567',
                status='active'
            )
            db.session.add(test_user)
            print("✅ تم إنشاء المستخدم التجريبي بنجاح")
        else:
            print("ℹ️ المستخدم التجريبي موجود مسبقاً")
        
        # حفظ التغييرات
        try:
            db.session.commit()
            print("💾 تم حفظ جميع التغييرات بنجاح")
        except Exception as e:
            db.session.rollback()
            print(f"❌ خطأ في حفظ البيانات: {e}")
            return False
        
        # إنشاء طلبات تجريبية
        print("📝 إنشاء طلبات تجريبية...")
        create_sample_requests()
        
        print("🎉 تم إكمال تهيئة قاعدة البيانات بنجاح!")
        return True

def create_sample_requests():
    """إنشاء طلبات تجريبية"""
    test_user = User.query.filter_by(national_id='1234567890').first()
    if not test_user:
        print("❌ لم يتم العثور على المستخدم التجريبي")
        return
    
    # طلب حجز موعد
    appointment_request = Request.query.filter_by(
        user_id=test_user.id, 
        type='appointment'
    ).first()
    
    if not appointment_request:
        appointment_request = Request(
            user_id=test_user.id,
            type='appointment',
            status='completed'
        )
        appointment_request.set_data({
            'specialty': 'طب الأسرة',
            'preferred_date': '2025-08-15',
            'preferred_time': 'morning',
            'notes': 'كشف دوري'
        })
        appointment_request.set_processed_data({
            'doctor_name': 'د. سارة أحمد',
            'hospital_name': 'مستشفى الملك فهد',
            'appointment_date': '2025-08-15',
            'appointment_time': '10:00',
            'confirmation_number': 'APT-2025-001'
        })
        db.session.add(appointment_request)
        print("✅ تم إنشاء طلب حجز موعد تجريبي")
    
    # طلب استشارة
    consultation_request = Request.query.filter_by(
        user_id=test_user.id, 
        type='consultation'
    ).first()
    
    if not consultation_request:
        consultation_request = Request(
            user_id=test_user.id,
            type='consultation',
            status='in_progress'
        )
        consultation_request.set_data({
            'specialty': 'طب الباطنة',
            'symptoms': 'صداع مستمر',
            'urgency': 'medium'
        })
        consultation_request.set_processed_data({
            'doctor_name': 'د. محمد علي',
            'whatsapp_number': '+966501234567',
            'scheduled_time': '2025-08-08 14:00:00'
        })
        db.session.add(consultation_request)
        print("✅ تم إنشاء طلب استشارة تجريبي")
    
    # طلب تقرير طبي
    medical_request = Request.query.filter_by(
        user_id=test_user.id, 
        type='medical_request'
    ).first()
    
    if not medical_request:
        medical_request = Request(
            user_id=test_user.id,
            type='medical_request',
            status='completed'
        )
        medical_request.set_data({
            'request_type': 'medical_excuse',
            'duration_days': '3',
            'reason': 'إنفلونزا حادة'
        })
        medical_request.set_processed_data({
            'report_number': 'MED-2025-001',
            'issue_date': '2025-08-07',
            'valid_until': '2025-08-10'
        })
        db.session.add(medical_request)
        print("✅ تم إنشاء طلب تقرير طبي تجريبي")
    
    try:
        db.session.commit()
        print("💾 تم حفظ الطلبات التجريبية بنجاح")
    except Exception as e:
        db.session.rollback()
        print(f"❌ خطأ في حفظ الطلبات التجريبية: {e}")

def create_indexes():
    """إنشاء الفهارس لتحسين الأداء"""
    with app.app_context():
        print("🔍 إنشاء الفهارس...")
        
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_national_id ON user(national_id);",
            "CREATE INDEX IF NOT EXISTS idx_users_email ON user(email);",
            "CREATE INDEX IF NOT EXISTS idx_users_status ON user(status);",
            "CREATE INDEX IF NOT EXISTS idx_requests_user_id ON request(user_id);",
            "CREATE INDEX IF NOT EXISTS idx_requests_type ON request(type);",
            "CREATE INDEX IF NOT EXISTS idx_requests_status ON request(status);",
            "CREATE INDEX IF NOT EXISTS idx_requests_created_date ON request(created_date);",
            "CREATE INDEX IF NOT EXISTS idx_pdf_files_request_id ON pdf_file(request_id);"
        ]
        
        for index_sql in indexes:
            try:
                db.session.execute(index_sql)
                print(f"✅ تم إنشاء الفهرس: {index_sql.split()[5]}")
            except Exception as e:
                print(f"⚠️ تحذير في إنشاء الفهرس: {e}")
        
        try:
            db.session.commit()
            print("💾 تم حفظ جميع الفهارس بنجاح")
        except Exception as e:
            db.session.rollback()
            print(f"❌ خطأ في حفظ الفهارس: {e}")

def check_database_health():
    """فحص صحة قاعدة البيانات"""
    with app.app_context():
        print("🏥 فحص صحة قاعدة البيانات...")
        
        try:
            # فحص الجداول
            users_count = User.query.count()
            requests_count = Request.query.count()
            pdf_files_count = PDFFile.query.count()
            
            print(f"👥 عدد المستخدمين: {users_count}")
            print(f"📝 عدد الطلبات: {requests_count}")
            print(f"📄 عدد ملفات PDF: {pdf_files_count}")
            
            # فحص المدير
            admin_user = User.query.filter_by(national_id='admin').first()
            if admin_user:
                print("✅ حساب المدير متاح")
            else:
                print("❌ حساب المدير غير موجود")
            
            print("✅ قاعدة البيانات تعمل بشكل صحيح")
            return True
            
        except Exception as e:
            print(f"❌ خطأ في فحص قاعدة البيانات: {e}")
            return False

if __name__ == '__main__':
    print("🚀 بدء تهيئة قاعدة البيانات لموقع صحتي")
    print("=" * 50)
    
    # تهيئة قاعدة البيانات
    if init_database():
        # إنشاء الفهارس
        create_indexes()
        
        # فحص صحة قاعدة البيانات
        check_database_health()
        
        print("=" * 50)
        print("🎉 تم إكمال جميع العمليات بنجاح!")
        print("📋 معلومات تسجيل الدخول:")
        print("   المدير: admin / SehhatyAdmin2025!")
        print("   مستخدم تجريبي: 1234567890")
    else:
        print("❌ فشل في تهيئة قاعدة البيانات")
        sys.exit(1)

