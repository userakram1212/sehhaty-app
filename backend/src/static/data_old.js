// نظام إدارة البيانات المحلية لموقع صحتي

class DataManager {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        if (!localStorage.getItem("sehhaty_users")) {
            localStorage.setItem("sehhaty_users", JSON.stringify([]));
        }
        if (!localStorage.getItem("sehhaty_requests")) {
            localStorage.setItem("sehhaty_requests", JSON.stringify([]));
        }
        if (!localStorage.getItem("sehhaty_current_user")) {
            localStorage.setItem("sehhaty_current_user", JSON.stringify(null));
        }
        if (!localStorage.getItem("sehhaty_blocked_users")) {
            localStorage.setItem("sehhaty_blocked_users", JSON.stringify([]));
        }
    }

    // إدارة المستخدمين
    registerUser(userData) {
        const users = this.getUsers();
        const blockedUsers = this.getBlockedUsers();
        
        // التحقق من الحظر
        if (blockedUsers.includes(userData.nationalId)) {
            throw new Error("هذا المستخدم محظور ولا يمكنه التسجيل");
        }
        
        // التحقق من وجود المستخدم
        const existingUser = users.find(user => 
            user.nationalId === userData.nationalId || user.email === userData.email
        );
        
        if (existingUser) {
            throw new Error("المستخدم مسجل مسبقاً");
        }

        // إنشاء مستخدم جديد
        const newUser = {
            id: this.generateId(),
            fullName: userData.fullName,
            nationalId: userData.nationalId,
            email: userData.email,
            phone: userData.phone,
            registrationDate: new Date().toISOString(),
            status: "active", // active, blocked
            requests: []
        };

        users.push(newUser);
        localStorage.setItem("sehhaty_users", JSON.stringify(users));
        return newUser;
    }

    loginUser(nationalId) {
        const users = this.getUsers();
        const blockedUsers = this.getBlockedUsers();
        
        // التحقق من الحظر
        if (blockedUsers.includes(nationalId)) {
            throw new Error("هذا المستخدم محظور ولا يمكنه تسجيل الدخول");
        }
        
        const user = users.find(u => u.nationalId === nationalId);
        
        if (!user) {
            throw new Error("المستخدم غير مسجل. يرجى إنشاء حساب أولاً");
        }
        
        // التحقق من حالة المستخدم
        if (user.status === "blocked") {
            throw new Error("هذا المستخدم محظور ولا يمكنه تسجيل الدخول");
        }

        localStorage.setItem("sehhaty_current_user", JSON.stringify(user));
        return user;
    }

    logoutUser() {
        localStorage.setItem("sehhaty_current_user", JSON.stringify(null));
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem("sehhaty_current_user"));
    }

    checkSession() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            // التحقق من أن المستخدم لا يزال موجوداً في قاعدة البيانات
            const user = this.getUserByNationalId(currentUser.nationalId);
            if (user && user.status === 'active') {
                return user;
            } else {
                // إذا لم يعد المستخدم موجوداً أو محظور، قم بتسجيل الخروج
                this.logoutUser();
                return null;
            }
        }
        return null;
    }

    getUsers() {
        return JSON.parse(localStorage.getItem("sehhaty_users")) || [];
    }

    getUserByNationalId(nationalId) {
        const users = this.getUsers();
        return users.find(user => user.nationalId === nationalId);
    }

    // إدارة الطلبات
    createRequest(requestData) {
        const user = this.getUserByNationalId(requestData.nationalId);
        
        if (!user) {
            throw new Error("لم يتم العثور على المستخدم. يرجى إنشاء حساب أولاً");
        }

        const requests = this.getRequests();
        const newRequest = {
            id: this.generateId(),
            userId: user.id,
            userNationalId: user.nationalId,
            userName: user.fullName,
            type: requestData.type,
            data: requestData.data,
            status: "pending",
            createdDate: new Date().toISOString(),
            pdfGenerated: false
        };

        requests.push(newRequest);
        localStorage.setItem("sehhaty_requests", JSON.stringify(requests));

        // إضافة الطلب لسجل المستخدم
        this.addRequestToUser(user.id, newRequest.id);

        return newRequest;
    }

    getRequests() {
        return JSON.parse(localStorage.getItem("sehhaty_requests")) || [];
    }

    getUserRequests(userId) {
        const requests = this.getRequests();
        return requests.filter(request => request.userId === userId);
    }

    updateRequestStatus(requestId, status, processedData = null) {
        const requests = this.getRequests();
        const requestIndex = requests.findIndex(r => r.id === requestId);
        
        if (requestIndex !== -1) {
            requests[requestIndex].status = status;
            requests[requestIndex].updatedDate = new Date().toISOString();
            
            if (processedData) {
                requests[requestIndex].processedData = processedData;
            }
            
            localStorage.setItem("sehhaty_requests", JSON.stringify(requests));
            return requests[requestIndex];
        }
        return null;
    }

    getRequestById(requestId) {
        const requests = this.getRequests();
        return requests.find(r => r.id === requestId);
    }

    getRequestsByNationalId(nationalId) {
        const requests = this.getRequests();
        return requests.filter(r => r.nationalId === nationalId);
    }

    // توليد ملفات PDF وهمية (تم استبدالها بدوال الرفع الحقيقية)
    generatePDF(requestId, type) {
        const request = this.getRequests().find(r => r.id === requestId);
        if (!request) return null;

        // محاكاة توليد PDF
        const pdfData = {
            id: this.generateId(),
            requestId: requestId,
            type: type,
            fileName: `${type}_${request.userNationalId}_${Date.now()}.pdf`,
            generatedDate: new Date().toISOString(),
            size: Math.floor(Math.random() * 500) + 100 + " KB"
        };

        // تحديث حالة الطلب
        this.updateRequestStatus(requestId, "completed");
        
        // حفظ معلومات PDF
        const requests = this.getRequests();
        const requestIndex = requests.findIndex(r => r.id === requestId);
        if (requestIndex !== -1) {
            requests[requestIndex].pdfData = pdfData;
            requests[requestIndex].pdfGenerated = true;
            localStorage.setItem("sehhaty_requests", JSON.stringify(requests));
        }

        return pdfData;
    }

    // محاكاة تحميل PDF (تم استبدالها بدوال الرفع الحقيقية)
    downloadPDF(requestId) {
        const request = this.getRequests().find(r => r.id === requestId);
        if (!request || !request.pdfGenerated) {
            throw new Error("الملف غير متوفر");
        }

        // محاكاة تحميل الملف
        const blob = new Blob(["محتوى PDF وهمي"], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = request.pdfData.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // أدوات مساعدة
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    getStatusText(status) {
        const statusMap = {
            "pending": "قيد المراجعة",
            "in_progress": "قيد التنفيذ",
            "completed": "مكتمل",
            "cancelled": "ملغي"
        };
        return statusMap[status] || status;
    }

    getRequestTypeText(type) {
        const typeMap = {
            "appointment": "حجز موعد",
            "consultation": "استشارة فورية",
            "medical_request": "طلب تقرير طبي",
            "medical_excuse": "عذر طبي (سكليف)",
            "review_certificate": "مشهد مراجعة",
            "patient_companion_report": "تقرير مرافق مريض"
        };
        return typeMap[type] || type;
    }

    // إحصائيات للإدارة
    getStatistics() {
        const users = this.getUsers();
        const requests = this.getRequests();
        
        return {
            totalUsers: users.length,
            totalRequests: requests.length,
            pendingRequests: requests.filter(r => r.status === "pending").length,
            completedRequests: requests.filter(r => r.status === "completed").length,
            todayRequests: requests.filter(r => {
                const today = new Date().toDateString();
                const requestDate = new Date(r.createdDate).toDateString();
                return today === requestDate;
            }).length
        };
    }

    // تصدير البيانات للنسخ الاحتياطي
    exportData() {
        return {
            users: this.getUsers(),
            requests: this.getRequests(),
            exportDate: new Date().toISOString()
        };
    }

    // استيراد البيانات
    importData(data) {
        if (data.users) {
            localStorage.setItem("sehhaty_users", JSON.stringify(data.users));
        }
        if (data.requests) {
            localStorage.setItem("sehhaty_requests", JSON.stringify(data.requests));
        }
    }

    // مسح جميع البيانات
    clearAllData() {
        localStorage.removeItem("sehhaty_users");
        localStorage.removeItem("sehhaty_requests");
        localStorage.removeItem("sehhaty_current_user");
        this.initializeData();
    }

    // دوال إضافية لدعم معالجة الطلبات من الإدارة
    addRequestToUser(userId, requestId) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            if (!users[userIndex].requests) {
                users[userIndex].requests = [];
            }
            users[userIndex].requests.push(requestId);
            localStorage.setItem("sehhaty_users", JSON.stringify(users));
        }
    }

    // إضافة بيانات تجريبية للاختبار
    addSampleData() {
        // إضافة مستخدم تجريبي
        const sampleUser = {
            fullName: "أحمد محمد العلي",
            nationalId: "1234567890",
            email: "ahmed@example.com",
            phone: "0501234567"
        };
        
        try {
            this.registerUser(sampleUser);
        } catch (error) {
            // المستخدم موجود مسبقاً
        }
        
        // إضافة طلبات تجريبية
        const sampleRequests = [
            {
                nationalId: "1234567890",
                type: "appointment",
                data: {
                    specialty: "طب الأطفال",
                    city: "الرياض",
                    preferredDate: "2025-07-20",
                    preferredTime: "10:00"
                }
            },
            {
                nationalId: "1234567890",
                type: "consultation",
                data: {
                    consultationType: "استشارة عامة",
                    description: "استشارة طبية عامة"
                }
            },
            {
                nationalId: "1234567890",
                type: "medical_request",
                data: {
                    reportType: "تقرير طبي",
                    purpose: "للعمل",
                    notes: "تقرير طبي للتوظيف"
                }
            }
        ];
        
        sampleRequests.forEach(requestData => {
            try {
                this.createRequest(requestData);
            } catch (error) {
                // الطلب موجود مسبقاً أو خطأ آخر
            }
        });
    }

    // دوال محسنة لدعم رفع ملفات PDF الحقيقية
    uploadRealPDF(requestId, file, notes = "") {
        const requests = this.getRequests();
        const requestIndex = requests.findIndex(r => r.id === requestId);
        
        if (requestIndex === -1) {
            throw new Error("الطلب غير موجود");
        }
        
        // التحقق من نوع الملف
        if (file.type !== "application/pdf") {
            throw new Error("يجب أن يكون الملف بصيغة PDF");
        }
        
        // إنشاء بيانات الملف
        const pdfData = {
            id: this.generateId(),
            requestId: requestId,
            fileName: file.name,
            size: this.formatFileSize(file.size),
            generatedDate: new Date().toISOString(),
            notes: notes,
            fileType: file.type,
            lastModified: file.lastModified
        };
        
        // تحديث الطلب
        requests[requestIndex].status = "completed";
        requests[requestIndex].pdfGenerated = true;
        requests[requestIndex].pdfData = pdfData;
        requests[requestIndex].processedData = { 
            notes: notes,
            uploadedBy: "admin",
            uploadDate: new Date().toISOString()
        };
        
        // حفظ الملف في localStorage (محاكاة - في التطبيق الحقيقي سيتم رفعه للخادم)
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileData = e.target.result;
                pdfData.content = fileData; // Save the actual file content
                localStorage.setItem(`pdf_${requestId}`, fileData);
                // تحديث الطلب بعد حفظ الملف
                requests[requestIndex].status = "completed";
                requests[requestIndex].pdfGenerated = true;
                requests[requestIndex].pdfData = pdfData;
                requests[requestIndex].processedData = { 
                    notes: notes,
                    uploadedBy: "admin",
                    uploadDate: new Date().toISOString()
                };
                localStorage.setItem("sehhaty_requests", JSON.stringify(requests));
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.warn("تعذر حفظ الملف محلياً:", error);
        }
        
        localStorage.setItem("sehhaty_requests", JSON.stringify(requests));
        return pdfData;
    }

    // دالة لتحميل PDF لدعم الملفات الحقيقية
    downloadRealPDF(requestId) {
        const request = this.getRequests().find(r => r.id === requestId);
        if (!request || !request.pdfGenerated || !request.pdfData || !request.pdfData.content) {
            throw new Error("الملف غير متوفر أو تالف");
        }
        
        const savedFileContent = request.pdfData.content;
        const link = document.createElement("a");
        link.href = savedFileContent;
        link.download = request.pdfData.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // دالة لعرض PDF في نافذة جديدة
    viewPDF(requestId) {
        const request = this.getRequests().find(r => r.id === requestId);
        if (!request || !request.pdfGenerated || !request.pdfData || !request.pdfData.content) {
            throw new Error("الملف غير متوفر أو تالف");
        }
        
        const savedFileContent = request.pdfData.content;
        window.open(savedFileContent, '_blank');
    }
    // دالة لتنسيق حجم الملف
    formatFileSize(bytes) {
        if (bytes === 0) return "0 Bytes";
        
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    // دالة للتحقق من صحة ملف PDF
    validatePDFFile(file) {
        const errors = [];
        
        // التحقق من نوع الملف
        if (file.type !== "application/pdf") {
            errors.push("يجب أن يكون الملف بصيغة PDF");
        }
        
        // التحقق من حجم الملف (أقصى حد 10 ميجابايت)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            errors.push("حجم الملف يجب أن يكون أقل من 10 ميجابايت");
        }
        
        // التحقق من اسم الملف
        if (!file.name || file.name.length < 1) {
            errors.push("اسم الملف غير صحيح");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // دالة لحفظ معلومات الملف المرفوع
    saveUploadedFileInfo(requestId, fileInfo) {
        const uploadedFiles = JSON.parse(localStorage.getItem("sehhaty_uploaded_files") || "[]");
        
        const fileRecord = {
            id: this.generateId(),
            requestId: requestId,
            fileName: fileInfo.fileName,
            fileSize: fileInfo.size,
            uploadDate: new Date().toISOString(),
            uploadedBy: "admin",
            fileType: fileInfo.fileType || "application/pdf"
        };
        
        uploadedFiles.push(fileRecord);
        localStorage.setItem("sehhaty_uploaded_files", JSON.stringify(uploadedFiles));
        
        return fileRecord;
    }

    // دالة للحصول على قائمة الملفات المرفوعة
    getUploadedFiles() {
        return JSON.parse(localStorage.getItem("sehhaty_uploaded_files") || "[]");
    }

    // دالة لحذف ملف مرفوع
    deleteUploadedFile(requestId) {
        // حذف الملف من localStorage
        localStorage.removeItem(`pdf_${requestId}`);
        
        // تحديث معلومات الطلب
        const requests = this.getRequests();
        const requestIndex = requests.findIndex(r => r.id === requestId);
        
        if (requestIndex !== -1) {
            requests[requestIndex].pdfGenerated = false;
            requests[requestIndex].pdfData = null;
            requests[requestIndex].status = "pending";
            localStorage.setItem("sehhaty_requests", JSON.stringify(requests));
        }
        
        // حذف سجل الملف
        const uploadedFiles = this.getUploadedFiles();
        const filteredFiles = uploadedFiles.filter(f => f.requestId !== requestId);
        localStorage.setItem("sehhaty_uploaded_files", JSON.stringify(filteredFiles));
        
        return true;
    }

    // تحسين دالة الإحصائيات لتشمل معلومات الملفات
    getEnhancedStatistics() {
        const basicStats = this.getStatistics();
        const uploadedFiles = this.getUploadedFiles();
        
        return {
            ...basicStats,
            totalUploadedFiles: uploadedFiles.length,
            totalFileSize: uploadedFiles.reduce((total, file) => {
                // تحويل حجم الملف إلى بايت للحساب
                const sizeInBytes = this.parseFileSize(file.fileSize);
                return total + sizeInBytes;
            }, 0),
            recentUploads: uploadedFiles
                .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
                .slice(0, 5)
        };
    }

    // دالة مساعدة لتحويل حجم الملف إلى بايت
    parseFileSize(sizeString) {
        if (!sizeString) return 0;
        
        const units = { "Bytes": 1, "KB": 1024, "MB": 1024*1024, "GB": 1024*1024*1024 };
        const match = sizeString.match(/^([\d.]+)\s*(\w+)$/);
        
        if (!match) return 0;
        
        const value = parseFloat(match[1]);
        const unit = match[2];
        
        return value * (units[unit] || 1);
    }

    // دوال إدارة المستخدمين المتقدمة
    deleteUser(userId) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error("المستخدم غير موجود");
        }
        
        const user = users[userIndex];
        
        // حذف جميع طلبات المستخدم
        const requests = this.getRequests();
        const filteredRequests = requests.filter(r => r.userId !== userId);
        localStorage.setItem("sehhaty_requests", JSON.stringify(filteredRequests));
        
        // حذف ملفات PDF المرتبطة بالمستخدم
        requests.filter(r => r.userId === userId).forEach(request => {
            localStorage.removeItem(`pdf_${request.id}`);
        });
        
        // حذف المستخدم
        users.splice(userIndex, 1);
        localStorage.setItem("sehhaty_users", JSON.stringify(users));
        
        return { success: true, deletedUser: user };
    }

    blockUser(userId) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error("المستخدم غير موجود");
        }
        
        const user = users[userIndex];
        
        // تحديث حالة المستخدم
        users[userIndex].status = "blocked";
        users[userIndex].blockedDate = new Date().toISOString();
        localStorage.setItem("sehhaty_users", JSON.stringify(users));
        
        // إضافة رقم الهوية لقائمة المحظورين
        const blockedUsers = this.getBlockedUsers();
        if (!blockedUsers.includes(user.nationalId)) {
            blockedUsers.push(user.nationalId);
            localStorage.setItem("sehhaty_blocked_users", JSON.stringify(blockedUsers));
        }
        
        // إنهاء جلسة المستخدم إذا كان مسجل دخول
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            this.logoutUser();
        }
        
        return { success: true, blockedUser: users[userIndex] };
    }

    unblockUser(userId) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error("المستخدم غير موجود");
        }
        
        const user = users[userIndex];
        
        // تحديث حالة المستخدم
        users[userIndex].status = "active";
        users[userIndex].unblockedDate = new Date().toISOString();
        delete users[userIndex].blockedDate;
        localStorage.setItem("sehhaty_users", JSON.stringify(users));
        
        // إزالة رقم الهوية من قائمة المحظورين
        const blockedUsers = this.getBlockedUsers();
        const filteredBlocked = blockedUsers.filter(id => id !== user.nationalId);
        localStorage.setItem("sehhaty_blocked_users", JSON.stringify(filteredBlocked));
        
        return { success: true, unblockedUser: users[userIndex] };
    }

    getBlockedUsers() {
        return JSON.parse(localStorage.getItem("sehhaty_blocked_users") || "[]");
    }

    searchUsers(searchTerm) {
        const users = this.getUsers();
        if (!searchTerm) return users;
        
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
            user.fullName.toLowerCase().includes(term) ||
            user.nationalId.includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.phone.includes(term)
        );
    }

    filterUsersByStatus(status) {
        const users = this.getUsers();
        if (status === "all") return users;
        
        return users.filter(user => user.status === status);
    }

    getUsersStatistics() {
        const users = this.getUsers();
        const blockedUsers = this.getBlockedUsers();
        
        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === "active").length,
            blockedUsers: users.filter(u => u.status === "blocked").length,
            totalBlockedIds: blockedUsers.length,
            recentRegistrations: users
                .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
                .slice(0, 5)
        };
    }

    updateUser(userId, updateData) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            throw new Error("المستخدم غير موجود");
        }
        
        const allowedFields = ["fullName", "email", "phone"];
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                users[userIndex][field] = updateData[field];
            }
        });
        
        users[userIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem("sehhaty_users", JSON.stringify(users));
        
        return users[userIndex];
    }

    getUserDetails(userId) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            throw new Error("المستخدم غير موجود");
        }
        
        const userRequests = this.getUserRequests(userId);
        
        return {
            ...user,
            requestsCount: userRequests.length,
            pendingRequests: userRequests.filter(r => r.status === "pending").length,
            completedRequests: userRequests.filter(r => r.status === "completed").length,
            lastRequestDate: userRequests.length > 0 ? 
                Math.max(...userRequests.map(r => new Date(r.createdDate))) : null
        };
    }

    exportUsersData() {
        const users = this.getUsers();
        const blockedUsers = this.getBlockedUsers();
        const requests = this.getRequests();
        
        return {
            users: users,
            blockedUsers: blockedUsers,
            requests: requests,
            statistics: this.getUsersStatistics(),
            exportDate: new Date().toISOString()
        };
    }

    importUsersData(data) {
        if (data.users) {
            localStorage.setItem("sehhaty_users", JSON.stringify(data.users));
        }
        if (data.blockedUsers) {
            localStorage.setItem("sehhaty_blocked_users", JSON.stringify(data.blockedUsers));
        }
        if (data.requests) {
            localStorage.setItem("sehhaty_requests", JSON.stringify(data.requests));
        }
        
        return { success: true, importDate: new Date().toISOString() };
    }

    cleanupDeletedData() {
        const users = this.getUsers();
        const requests = this.getRequests();
        const userIds = users.map(u => u.id);
        
        // حذف الطلبات للمستخدمين المحذوفين
        const validRequests = requests.filter(r => userIds.includes(r.userId));
        localStorage.setItem("sehhaty_requests", JSON.stringify(validRequests));
        
        // حذف ملفات PDF للطلبات المحذوفة
        const deletedRequests = requests.filter(r => !userIds.includes(r.userId));
        deletedRequests.forEach(request => {
            localStorage.removeItem(`pdf_${request.id}`);
        });
        
        return {
            deletedRequests: deletedRequests.length,
            cleanupDate: new Date().toISOString()
        };
    }
}

// إنشاء مثيل عام لإدارة البيانات
const dataManager = new DataManager();

// تشغيل إضافة البيانات التجريبية عند التحميل
if (typeof window !== "undefined") {
    window.addEventListener("load", function() {
        dataManager.addSampleData();
    });
}


