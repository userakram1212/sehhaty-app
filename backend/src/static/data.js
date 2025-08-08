// نظام إدارة البيانات لموقع صحتي - يتصل بالواجهة الخلفية

// رابط الواجهة الخلفية
const API_BASE_URL = 'https://sehhaty-backend-2025.onrender.com/api';

class DataManager {
    constructor() {
        this.currentUser = null;
    }

    // دالة مساعدة لإرسال طلبات HTTP
    async makeRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // لإرسال الكوكيز
            };

            const finalOptions = { ...defaultOptions, ...options };
            
            if (finalOptions.body && typeof finalOptions.body === 'object') {
                finalOptions.body = JSON.stringify(finalOptions.body);
            }

            console.log('Making request to:', url, 'with options:', finalOptions);
            
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            console.log('Response status:', response.status, 'Data:', data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Request failed:', error);
            throw error;
        }
    }

    // تسجيل مستخدم جديد
    async registerUser(userData) {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/register`, {
                method: 'POST',
                body: userData
            });

            return response.user;
        } catch (error) {
            throw new Error(error.message || 'فشل في إنشاء الحساب');
        }
    }

    // تسجيل دخول المستخدم
    async loginUser(nationalId) {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/login`, {
                method: 'POST',
                body: { national_id: nationalId }
            });

            this.currentUser = response.user;
            return response.user;
        } catch (error) {
            throw new Error(error.message || 'فشل في تسجيل الدخول');
        }
    }

    // تسجيل خروج المستخدم
    async logoutUser() {
        try {
            await this.makeRequest(`${API_BASE_URL}/logout`, {
                method: 'POST'
            });

            this.currentUser = null;
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            this.currentUser = null;
            return false;
        }
    }

    // إنشاء طلب جديد
    async createRequest(requestData) {
        try {
            // التحقق من تسجيل الدخول أولاً
            if (requestData.nationalId) {
                await this.loginUser(requestData.nationalId);
            }

            const response = await this.makeRequest(`${API_BASE_URL}/requests`, {
                method: 'POST',
                body: {
                    type: requestData.type,
                    data: requestData.data
                }
            });

            return response.request;
        } catch (error) {
            throw new Error(error.message || 'فشل في إنشاء الطلب');
        }
    }

    // الحصول على طلبات المستخدم
    async getUserRequests() {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/requests`);
            return response;
        } catch (error) {
            throw new Error(error.message || 'فشل في جلب الطلبات');
        }
    }

    // الحصول على ملفات المستخدم
    async getUserFiles() {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/pdf/user-files`);
            return response;
        } catch (error) {
            throw new Error(error.message || 'فشل في جلب الملفات');
        }
    }

    // التحقق من حالة الجلسة
    async checkSession() {
        try {
            const response = await this.makeRequest(`${API_BASE_URL}/check-session`);
            if (response.logged_in) {
                this.currentUser = response.user;
            }
            return response;
        } catch (error) {
            console.error('Session check error:', error);
            return { logged_in: false };
        }
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // دوال مساعدة للنصوص
    getRequestTypeText(type) {
        const types = {
            'appointment': 'حجز موعد طبي',
            'consultation': 'استشارة طبية فورية',
            'medical_request': 'طلب تقرير طبي',
            'medical_excuse': 'عذر طبي (سكليف)',
            'review_certificate': 'مشهد مراجعة',
            'patient_companion_report': 'تقرير مرافق مريض'
        };
        return types[type] || type;
    }

    getRequestStatusText(status) {
        const statuses = {
            'pending': 'قيد المراجعة',
            'in_progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'cancelled': 'ملغي'
        };
        return statuses[status] || status;
    }

    // تنسيق التاريخ
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // تنسيق التاريخ المختصر
    formatDateShort(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SA');
    }
}

// إنشاء مثيل واحد من DataManager
const dataManager = new DataManager();

// تصدير للاستخدام العام
window.dataManager = dataManager;

