// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Show specific modals
function showLogin() {
    showModal('loginModal');
}

function showRegister() {
    showModal('registerModal');
}

function showAppointment() {
    showModal('appointmentModal');
}

function showConsultation() {
    showModal('consultationModal');
}

function showMedicalRequest() {
    showModal('medicalRequestModal');
}

function showMedicalFile() {
    showModal('medicalFileModal');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-overlay[style*="flex"]');
        openModals.forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});

// Form validation
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = '#e53e3e';
            isValid = false;
        } else {
            input.style.borderColor = '#e2e8f0';
        }
    });
    
    return isValid;
}

// Email validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// National ID validation
function validateNationalId(nationalId) {
    return nationalId.length >= 10 && /^\d+$/.test(nationalId);
}

// Simple notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00a651' : '#e53e3e'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function() {
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(this)) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const formData = {
                fullName: document.getElementById('fullName').value,
                nationalId: document.getElementById('nationalId').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            };

            // التحقق من صحة البيانات
            if (!validateNationalId(formData.nationalId)) {
                showNotification('رقم الهوية غير صحيح', 'error');
                return;
            }

            if (!validateEmail(formData.email)) {
                showNotification('البريد الإلكتروني غير صحيح', 'error');
                return;
            }

            try {
                const user = dataManager.registerUser(formData);
                showNotification('تم إنشاء الحساب بنجاح!', 'success');
                hideModal('registerModal');
                this.reset();
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(this)) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const nationalId = document.getElementById('loginNationalId').value;

            try {
                const user = dataManager.loginUser(nationalId);
                showNotification('تم تسجيل الدخول بنجاح!', 'success');
                hideModal('loginModal');
                
                // الانتقال إلى لوحة التحكم
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Appointment form
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(this)) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const nationalId = document.getElementById('appointmentNationalId').value;
            
            try {
                const requestData = {
                    nationalId: nationalId,
                    type: 'appointment',
                    data: {
                        specialty: document.getElementById('specialty').value,
                        city: document.getElementById('city').value,
                        preferredDate: document.getElementById('preferredDate').value,
                        preferredTime: document.getElementById('preferredTime').value
                    }
                };

                const request = dataManager.createRequest(requestData);
                showNotification('تم حجز الموعد بنجاح! سيتم التواصل معك قريباً.', 'success');
                hideModal('appointmentModal');
                this.reset();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Consultation form
    const consultationForm = document.querySelector('#consultationModal form');
    if (consultationForm) {
        consultationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nationalId = prompt('يرجى إدخال رقم الهوية للتحقق:');
            if (!nationalId) return;
            
            try {
                const requestData = {
                    nationalId: nationalId,
                    type: 'consultation',
                    data: {
                        consultationType: this.querySelector('select').value,
                        description: this.querySelector('textarea').value
                    }
                };

                const request = dataManager.createRequest(requestData);
                showNotification('تم بدء الاستشارة! سيتم توصيلك بطبيب مختص.', 'success');
                hideModal('consultationModal');
                this.reset();
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Medical request form
    const medicalRequestForm = document.getElementById('medicalRequestForm');
    const reportTypeSelect = document.getElementById('reportType');
    const medicalExcuseFields = document.getElementById('medicalExcuseFields');
    const reviewCertificateFields = document.getElementById('reviewCertificateFields');
    const patientCompanionFields = document.getElementById('patientCompanionFields');
    const excuseStartDateInput = document.getElementById('excuseStartDate');
    const excuseEndDateInput = document.getElementById('excuseEndDate');
    const excuseDaysInput = document.getElementById('excuseDays');

    if (medicalRequestForm) {
        reportTypeSelect.addEventListener('change', function() {
            medicalExcuseFields.style.display = 'none';
            reviewCertificateFields.style.display = 'none';
            patientCompanionFields.style.display = 'none';

            if (this.value === 'medical_excuse') {
                medicalExcuseFields.style.display = 'block';
            } else if (this.value === 'review_certificate') {
                reviewCertificateFields.style.display = 'block';
            } else if (this.value === 'patient_companion_report') {
                patientCompanionFields.style.display = 'block';
            }
        });

        // Calculate excuse days
        function calculateExcuseDays() {
            const startDate = new Date(excuseStartDateInput.value);
            const endDate = new Date(excuseEndDateInput.value);
            if (startDate && endDate && startDate <= endDate) {
                const diffTime = Math.abs(endDate - startDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
                excuseDaysInput.value = diffDays;
            } else {
                excuseDaysInput.value = '';
            }
        }

        excuseStartDateInput.addEventListener('change', calculateExcuseDays);
        excuseEndDateInput.addEventListener('change', calculateExcuseDays);

        medicalRequestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(this)) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
                return;
            }

            const nationalId = prompt('يرجى إدخال رقم الهوية للتحقق:');
            if (!nationalId) return;
            
            let requestData = {
                nationalId: nationalId,
                type: 'medical_request',
                data: {
                    reportType: reportTypeSelect.value,
                    additionalNotes: document.getElementById('additionalNotes').value
                }
            };

            if (reportTypeSelect.value === 'medical_excuse') {
                requestData.data.excuseDetails = {
                    startDate: excuseStartDateInput.value,
                    endDate: excuseEndDateInput.value,
                    days: excuseDaysInput.value,
                    region: document.getElementById('excuseRegion').value,
                    workplace: document.getElementById('excuseWorkplace').value
                };
            } else if (reportTypeSelect.value === 'review_certificate') {
                requestData.data.reviewDetails = {
                    reviewDate: document.getElementById('reviewDate').value,
                    region: document.getElementById('reviewRegion').value,
                    workplace: document.getElementById('reviewWorkplace').value
                };
            } else if (reportTypeSelect.value === 'patient_companion_report') {
                requestData.data.patientCompanionDetails = {
                    patientName: document.getElementById('patientName').value,
                    patientNationalId: document.getElementById('patientNationalId').value,
                    hospitalEntryDate: document.getElementById('hospitalEntryDate').value,
                    hospitalExitDate: document.getElementById('hospitalExitDate').value,
                    medicalCondition: document.getElementById('medicalCondition').value,
                    patientRegion: document.getElementById('patientRegion').value,
                    companionName: document.getElementById('companionName').value,
                    companionNationalId: document.getElementById('companionNationalId').value,
                    relationship: document.getElementById('relationship').value
                };
            }

            try {
                const request = dataManager.createRequest(requestData);
                showNotification('تم طلب التقرير الطبي بنجاح! سيتم إرساله خلال 24 ساعة.', 'success');
                hideModal('medicalRequestModal');
                this.reset();
                // Reset dynamic fields display
                medicalExcuseFields.style.display = 'none';
                reviewCertificateFields.style.display = 'none';
                patientCompanionFields.style.display = 'none';
                reportTypeSelect.value = '';
                
            } catch (error) {
                showNotification(error.message, 'error');
            }
        });
    }

    // Medical file form
    const medicalFileForm = document.getElementById('medicalFileForm');
    if (medicalFileForm) {
        medicalFileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(this)) {
                showNotification('يرجى ملء رقم الهوية', 'error');
                return;
            }

            const nationalId = document.getElementById('medicalFileNationalId').value;
            
            // Redirect to dashboard with national ID
            window.location.href = `dashboard.html?nationalId=${nationalId}`;
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add click animations to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Add animation on scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('.service-card, .feature-card, .stat-item');
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    }

    // Initialize animations
    const elements = document.querySelectorAll('.service-card, .feature-card, .stat-item');
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    animateOnScroll();
    window.addEventListener('scroll', animateOnScroll);

    // Add touch support for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});

// Add loading animation for buttons
function addLoadingToButton(button, text = 'جاري التحميل...') {
    const originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
    
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 2000);
}

// Mobile menu toggle (if needed in future)
function toggleMobileMenu() {
    const navButtons = document.querySelector('.nav-buttons');
    navButtons.classList.toggle('mobile-open');
}

