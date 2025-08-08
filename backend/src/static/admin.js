// Admin Dashboard JavaScript

let isAdminLoggedIn = false;
let allUsers = [];
let allRequests = [];
let filteredRequests = [];

// Admin credentials (في التطبيق الحقيقي يجب أن تكون مشفرة ومحفوظة بشكل آمن)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminLogin();
    setupAdminLoginForm();
});

// Check if admin is logged in
function checkAdminLogin() {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession) {
        isAdminLoggedIn = true;
        showAdminDashboard();
    }
}

// Setup admin login form
function setupAdminLoginForm() {
    const loginForm = document.getElementById('adminLoginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                isAdminLoggedIn = true;
                localStorage.setItem('admin_session', 'true');
                showAdminDashboard();
                showNotification('تم تسجيل الدخول بنجاح', 'success');
            } else {
                showNotification('بيانات الدخول غير صحيحة', 'error');
            }
        });
    }
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('adminLoginForm').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    loadAdminData();
    updateAdminStatistics();
}

// Load admin data
function loadAdminData() {
    allUsers = dataManager.getUsers();
    allRequests = dataManager.getRequests();
    filteredRequests = [...allRequests];
    
    loadUsersTable();
    loadRequestsTable();
    loadReportsTable();
    loadSystemStats();
}

// Update admin statistics
function updateAdminStatistics() {
    const stats = dataManager.getStatistics();
    
    document.getElementById('adminTotalUsers').textContent = stats.totalUsers;
    document.getElementById('adminTotalRequests').textContent = stats.totalRequests;
    document.getElementById('adminPendingRequests').textContent = stats.pendingRequests;
    document.getElementById('adminTodayRequests').textContent = stats.todayRequests;
}

// Load users table
function loadUsersTable() {
    const container = document.getElementById('usersTableContainer');
    
    if (allUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>لا يوجد مستخدمون مسجلون</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>المستخدم</th>
                    <th>رقم الهوية</th>
                    <th>البريد الإلكتروني</th>
                    <th>رقم الجوال</th>
                    <th>تاريخ التسجيل</th>
                    <th>عدد الطلبات</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    allUsers.forEach(user => {
        const userRequests = allRequests.filter(r => r.userId === user.id);
        html += `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${user.fullName.charAt(0)}</div>
                        <div>
                            <div style="font-weight: bold;">${user.fullName}</div>
                        </div>
                    </div>
                </td>
                <td>${user.nationalId}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${dataManager.formatDate(user.registrationDate)}</td>
                <td>${userRequests.length}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-view" onclick="viewUserDetails('${user.id}')">عرض</button>
                        <button class="action-btn btn-download" onclick="downloadUserReports('${user.id}')">التقارير</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Load requests table
function loadRequestsTable(requests = filteredRequests) {
    const container = document.getElementById('requestsTableContainer');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>لا توجد طلبات</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>المستخدم</th>
                    <th>نوع الطلب</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>التفاصيل</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    requests.forEach(request => {
        const user = allUsers.find(u => u.id === request.userId);
        const userName = user ? user.fullName : 'مستخدم محذوف';
        
        html += `
            <tr>
                <td>${userName}</td>
                <td>${dataManager.getRequestTypeText(request.type)}</td>
                <td>${dataManager.formatDate(request.createdDate)}</td>
                <td><span class="status-badge status-${request.status}">${dataManager.getStatusText(request.status)}</span></td>
                <td>
                    <button class="action-btn btn-view" onclick="viewRequestDetails('${request.id}')">التفاصيل</button>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-update" onclick="updateRequestStatus('${request.id}')">تحديث</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Load reports table
function loadReportsTable() {
    const container = document.getElementById('reportsTableContainer');
    const reportsRequests = allRequests.filter(r => r.pdfGenerated);
    
    if (reportsRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <p>لا توجد تقارير متاحة</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>المستخدم</th>
                    <th>نوع التقرير</th>
                    <th>تاريخ الإنشاء</th>
                    <th>حجم الملف</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reportsRequests.forEach(request => {
        const user = allUsers.find(u => u.id === request.userId);
        const userName = user ? user.fullName : 'مستخدم محذوف';
        
        html += `
            <tr>
                <td>${userName}</td>
                <td>${dataManager.getRequestTypeText(request.type)}</td>
                <td>${dataManager.formatDate(request.createdDate)}</td>
                <td>${request.pdfData ? request.pdfData.size : 'غير محدد'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn btn-download" onclick="downloadRequestPDF('${request.id}')">تحميل</button>
                        <button class="action-btn btn-view" onclick="viewRequestDetails('${request.id}')">عرض</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Load system statistics
function loadSystemStats() {
    const container = document.getElementById('systemStats');
    const stats = dataManager.getStatistics();
    
    const html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
                <strong>إجمالي المستخدمين:</strong> ${stats.totalUsers}
            </div>
            <div>
                <strong>إجمالي الطلبات:</strong> ${stats.totalRequests}
            </div>
            <div>
                <strong>طلبات قيد المراجعة:</strong> ${stats.pendingRequests}
            </div>
            <div>
                <strong>طلبات مكتملة:</strong> ${stats.completedRequests}
            </div>
            <div>
                <strong>طلبات اليوم:</strong> ${stats.todayRequests}
            </div>
            <div>
                <strong>آخر تحديث:</strong> ${new Date().toLocaleString('ar-SA')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Tab navigation
function showAdminTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.admin-tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.admin-nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById('admin' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab').style.display = 'block';
    
    // Add active class to clicked nav tab
    event.target.classList.add('active');
}

// Search functions
function searchUsers(query) {
    const filteredUsers = allUsers.filter(user => 
        user.fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.nationalId.includes(query) ||
        user.email.toLowerCase().includes(query.toLowerCase())
    );
    
    // Temporarily update allUsers for table rendering
    const originalUsers = [...allUsers];
    allUsers = filteredUsers;
    loadUsersTable();
    allUsers = originalUsers;
}

function searchRequests(query) {
    const filtered = allRequests.filter(request => {
        const user = allUsers.find(u => u.id === request.userId);
        const userName = user ? user.fullName : '';
        
        return userName.toLowerCase().includes(query.toLowerCase()) ||
               dataManager.getRequestTypeText(request.type).includes(query) ||
               dataManager.getStatusText(request.status).includes(query);
    });
    
    loadRequestsTable(filtered);
}

function filterRequests(filter) {
    if (!filter) {
        filteredRequests = [...allRequests];
    } else if (['pending', 'completed'].includes(filter)) {
        filteredRequests = allRequests.filter(r => r.status === filter);
    } else {
        filteredRequests = allRequests.filter(r => r.type === filter);
    }
    
    loadRequestsTable(filteredRequests);
}

// Action functions
function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const userRequests = allRequests.filter(r => r.userId === userId);
    
    alert(`تفاصيل المستخدم:
الاسم: ${user.fullName}
رقم الهوية: ${user.nationalId}
البريد الإلكتروني: ${user.email}
رقم الجوال: ${user.phone}
تاريخ التسجيل: ${dataManager.formatDate(user.registrationDate)}
عدد الطلبات: ${userRequests.length}`);
}

function viewRequestDetails(requestId) {
    const request = allRequests.find(r => r.id === requestId);
    if (!request) return;
    
    const user = allUsers.find(u => u.id === request.userId);
    const userName = user ? user.fullName : 'مستخدم محذوف';
    
    let details = `تفاصيل الطلب:
المستخدم: ${userName}
نوع الطلب: ${dataManager.getRequestTypeText(request.type)}
التاريخ: ${dataManager.formatDate(request.createdDate)}
الحالة: ${dataManager.getStatusText(request.status)}

البيانات:`;
    
    Object.keys(request.data).forEach(key => {
        details += `\n${key}: ${request.data[key]}`;
    });
    
    alert(details);
}

function updateRequestStatus(requestId) {
    const newStatus = prompt('أدخل الحالة الجديدة:\npending - قيد المراجعة\nin_progress - قيد التنفيذ\ncompleted - مكتمل\ncancelled - ملغي');
    
    if (newStatus && ['pending', 'in_progress', 'completed', 'cancelled'].includes(newStatus)) {
        dataManager.updateRequestStatus(requestId, newStatus);
        loadRequestsTable();
        updateAdminStatistics();
        showNotification('تم تحديث حالة الطلب بنجاح', 'success');
    } else if (newStatus) {
        showNotification('حالة غير صحيحة', 'error');
    }
}

function downloadRequestPDF(requestId) {
    try {
        dataManager.downloadPDF(requestId);
        showNotification('تم تحميل الملف بنجاح', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

function downloadUserReports(userId) {
    const userRequests = allRequests.filter(r => r.userId === userId && r.pdfGenerated);
    
    if (userRequests.length === 0) {
        showNotification('لا توجد تقارير متاحة لهذا المستخدم', 'error');
        return;
    }
    
    userRequests.forEach(request => {
        setTimeout(() => {
            try {
                dataManager.downloadPDF(request.id);
            } catch (error) {
                console.error('خطأ في تحميل التقرير:', error);
            }
        }, 500);
    });
    
    showNotification(`تم تحميل ${userRequests.length} تقرير`, 'success');
}

// System functions
function exportData() {
    const data = dataManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sehhaty_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('تم تصدير البيانات بنجاح', 'success');
}

function clearAllData() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        if (confirm('تأكيد أخير: سيتم مسح جميع المستخدمين والطلبات والتقارير!')) {
            dataManager.clearAllData();
            loadAdminData();
            updateAdminStatistics();
            showNotification('تم مسح جميع البيانات', 'success');
        }
    }
}

function adminLogout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('admin_session');
        isAdminLoggedIn = false;
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('adminLoginForm').style.display = 'block';
        showNotification('تم تسجيل الخروج بنجاح', 'success');
    }
}

function goToMainSite() {
    window.location.href = 'index.html';
}

// Notification system
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

// Auto-refresh data every 60 seconds
setInterval(() => {
    if (isAdminLoggedIn) {
        loadAdminData();
        updateAdminStatistics();
    }
}, 60000);


// دوال معالجة الطلبات المختلفة

// عرض تفاصيل الطلب
function viewRequestDetails(requestId) {
    const request = dataManager.getRequestById(requestId);
    if (!request) {
        showNotification('لم يتم العثور على الطلب', 'error');
        return;
    }
    
    const user = allUsers.find(u => u.id === request.userId);
    const userName = user ? user.fullName : 'مستخدم محذوف';
    
    let detailsHtml = `
        <div style="padding: 20px;">
            <h3>معلومات المستخدم</h3>
            <p><strong>الاسم:</strong> ${userName}</p>
            <p><strong>رقم الهوية:</strong> ${request.userNationalId}</p>
            <p><strong>تاريخ الطلب:</strong> ${dataManager.formatDate(request.createdDate)}</p>
            <p><strong>نوع الطلب:</strong> ${dataManager.getRequestTypeText(request.type)}</p>
            <p><strong>الحالة:</strong> ${dataManager.getStatusText(request.status)}</p>
            
            <h3>تفاصيل الطلب</h3>
    `;
    
    if (request.type === 'appointment') {
        detailsHtml += `
            <p><strong>التخصص:</strong> ${request.data.specialty || 'غير محدد'}</p>
            <p><strong>المدينة:</strong> ${request.data.city || 'غير محدد'}</p>
            <p><strong>التاريخ المفضل:</strong> ${request.data.preferredDate || 'غير محدد'}</p>
            <p><strong>الوقت المفضل:</strong> ${request.data.preferredTime || 'غير محدد'}</p>
        `;
        
        if (request.status === 'pending') {
            detailsHtml += `
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="processAppointment('${requestId}')">معالجة الطلب</button>
                </div>
            `;
        } else if (request.processedData) {
            detailsHtml += `
                <h3>بيانات الموعد المحجوز</h3>
                <p><strong>المستشفى:</strong> ${request.processedData.hospitalName}</p>
                <p><strong>الطبيب:</strong> ${request.processedData.doctorName}</p>
                <p><strong>التخصص:</strong> ${request.processedData.doctorSpecialty}</p>
                <p><strong>رقم الهاتف:</strong> ${request.processedData.doctorPhone}</p>
                <p><strong>تاريخ الموعد:</strong> ${request.processedData.appointmentDate}</p>
                <p><strong>وقت الموعد:</strong> ${request.processedData.appointmentTime}</p>
            `;
        }
    } else if (request.type === 'consultation') {
        detailsHtml += `
            <p><strong>نوع الاستشارة:</strong> ${request.data.consultationType || 'غير محدد'}</p>
            <p><strong>الوصف:</strong> ${request.data.description || 'غير محدد'}</p>
        `;
        
        if (request.status === 'pending') {
            detailsHtml += `
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="processConsultation('${requestId}')">معالجة الطلب</button>
                </div>
            `;
        } else if (request.processedData) {
            detailsHtml += `
                <h3>بيانات الطبيب المختص</h3>
                <p><strong>الطبيب:</strong> ${request.processedData.doctorName}</p>
                <p><strong>التخصص:</strong> ${request.processedData.doctorSpecialty}</p>
                <p><strong>رقم الواتساب:</strong> ${request.processedData.doctorPhone}</p>
            `;
        }
    } else if (request.type === 'medical_request') {
        detailsHtml += `
            <p><strong>نوع التقرير:</strong> ${request.data.reportType || 'غير محدد'}</p>
            <p><strong>الغرض:</strong> ${request.data.purpose || 'غير محدد'}</p>
            <p><strong>ملاحظات:</strong> ${request.data.notes || 'لا توجد'}</p>
        `;
        
        if (request.status === 'pending') {
            detailsHtml += `
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="processMedicalReport('${requestId}')">رفع تقرير طبي</button>
                </div>
            `;
        } else if (request.pdfGenerated && request.pdfData) {
            detailsHtml += `
                <h3>ملف التقرير</h3>
                <p><strong>اسم الملف:</strong> ${request.pdfData.fileName}</p>
                <p><strong>حجم الملف:</strong> ${request.pdfData.size}</p>
                <p><strong>تاريخ الإنشاء:</strong> ${dataManager.formatDate(request.pdfData.generatedDate)}</p>
                <button class="btn btn-secondary" onclick="downloadRequestPDF('${requestId}')">تحميل الملف</button>
            `;
        }
    }
    
    detailsHtml += '</div>';
    
    document.getElementById('requestDetailsContent').innerHTML = detailsHtml;
    showModal('requestDetailsModal');
}

// معالجة طلب حجز الموعد
function processAppointment(requestId) {
    document.getElementById('processRequestId').value = requestId;
    hideModal('requestDetailsModal');
    showModal('appointmentProcessModal');
}

// معالجة طلب الاستشارة
function processConsultation(requestId) {
    document.getElementById('consultationRequestId').value = requestId;
    hideModal('requestDetailsModal');
    showModal('consultationProcessModal');
}

// معالجة طلب التقرير الطبي
function processMedicalReport(requestId) {
    document.getElementById('medicalReportRequestId').value = requestId;
    hideModal('requestDetailsModal');
    showModal('medicalReportProcessModal');
}

// إعداد معالجات النماذج
document.addEventListener('DOMContentLoaded', function() {
    // معالج نموذج حجز الموعد
    const appointmentForm = document.getElementById('appointmentProcessForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const requestId = document.getElementById('processRequestId').value;
            const processedData = {
                hospitalName: document.getElementById('hospitalName').value,
                doctorName: document.getElementById('doctorName').value,
                doctorSpecialty: document.getElementById('doctorSpecialty').value,
                doctorPhone: document.getElementById('doctorPhone').value,
                appointmentDate: document.getElementById('appointmentDate').value,
                appointmentTime: document.getElementById('appointmentTime').value
            };
            
            dataManager.updateRequestStatus(requestId, 'completed', processedData);
            hideModal('appointmentProcessModal');
            loadRequestsTable();
            updateAdminStatistics();
            showNotification('تم قبول طلب حجز الموعد بنجاح', 'success');
            
            // مسح النموذج
            appointmentForm.reset();
        });
    }
    
    // معالج نموذج الاستشارة
    const consultationForm = document.getElementById('consultationProcessForm');
    if (consultationForm) {
        consultationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const requestId = document.getElementById('consultationRequestId').value;
            const processedData = {
                doctorName: document.getElementById('consultationDoctorName').value,
                doctorSpecialty: document.getElementById('consultationDoctorSpecialty').value,
                doctorPhone: document.getElementById('consultationDoctorPhone').value
            };
            
            dataManager.updateRequestStatus(requestId, 'completed', processedData);
            hideModal('consultationProcessModal');
            loadRequestsTable();
            updateAdminStatistics();
            showNotification('تم قبول طلب الاستشارة بنجاح', 'success');
            
            // مسح النموذج
            consultationForm.reset();
        });
    }
    
    // معالج نموذج التقرير الطبي
    const medicalReportForm = document.getElementById('medicalReportProcessForm');
    if (medicalReportForm) {
        medicalReportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const requestId = document.getElementById('medicalReportRequestId').value;
            const fileInput = document.getElementById('medicalReportFile');
            const notes = document.getElementById('medicalReportNotes').value;
            
            if (!fileInput.files[0]) {
                showNotification('يرجى اختيار ملف PDF', 'error');
                return;
            }
            
            const file = fileInput.files[0];
            if (file.type !== 'application/pdf') {
                showNotification('يجب أن يكون الملف بصيغة PDF', 'error');
                return;
            }
            
            // محاكاة رفع الملف وحفظه
            const pdfData = {
                id: dataManager.generateId(),
                requestId: requestId,
                fileName: file.name,
                size: Math.round(file.size / 1024) + ' KB',
                generatedDate: new Date().toISOString(),
                notes: notes,
                fileData: file // في التطبيق الحقيقي سيتم رفعه للخادم
            };
            
            // تحديث الطلب
            const requests = dataManager.getRequests();
            const requestIndex = requests.findIndex(r => r.id === requestId);
            if (requestIndex !== -1) {
                requests[requestIndex].status = 'completed';
                requests[requestIndex].pdfGenerated = true;
                requests[requestIndex].pdfData = pdfData;
                requests[requestIndex].processedData = { notes: notes };
                localStorage.setItem('sehhaty_requests', JSON.stringify(requests));
            }
            
            hideModal('medicalReportProcessModal');
            loadRequestsTable();
            loadReportsTable();
            updateAdminStatistics();
            showNotification('تم رفع التقرير الطبي بنجاح', 'success');
            
            // مسح النموذج
            medicalReportForm.reset();
        });
    }
});

// دوال رفض الطلبات
function rejectRequest() {
    const requestId = document.getElementById('processRequestId').value;
    dataManager.updateRequestStatus(requestId, 'cancelled');
    hideModal('appointmentProcessModal');
    loadRequestsTable();
    updateAdminStatistics();
    showNotification('تم رفض الطلب', 'success');
}

function rejectConsultationRequest() {
    const requestId = document.getElementById('consultationRequestId').value;
    dataManager.updateRequestStatus(requestId, 'cancelled');
    hideModal('consultationProcessModal');
    loadRequestsTable();
    updateAdminStatistics();
    showNotification('تم رفض طلب الاستشارة', 'success');
}

function rejectMedicalRequest() {
    const requestId = document.getElementById('medicalReportRequestId').value;
    dataManager.updateRequestStatus(requestId, 'cancelled');
    hideModal('medicalReportProcessModal');
    loadRequestsTable();
    updateAdminStatistics();
    showNotification('تم رفض طلب التقرير الطبي', 'success');
}

// دوال إدارة النوافذ المنبثقة
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}


// دوال إدارة المستخدمين المتقدمة

// تحديث جدول المستخدمين
function updateUsersTable() {
    const users = dataManager.getUsers();
    const container = document.getElementById('usersTableContainer');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>لا يوجد مستخدمون مسجلون</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>رقم الهوية</th>
                    <th>البريد الإلكتروني</th>
                    <th>الجوال</th>
                    <th>تاريخ التسجيل</th>
                    <th>الحالة</th>
                    <th>الطلبات</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const userRequests = dataManager.getUserRequests(user.id);
        const isBlocked = user.status === 'blocked';
        
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <div class="user-avatar">${user.fullName.charAt(0)}</div>
                        <span style="margin-right: 10px;">${user.fullName}</span>
                    </div>
                </td>
                <td>${user.nationalId}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${dataManager.formatDate(user.registrationDate)}</td>
                <td>
                    <span class="status-${user.status}">
                        ${user.status === 'active' ? 'نشط' : 'محظور'}
                    </span>
                </td>
                <td>
                    <span style="background: #e0f2fe; color: #0277bd; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${userRequests.length}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        ${isBlocked ? 
                            `<button class="btn-unblock" onclick="unblockUser('${user.id}')" title="إلغاء الحظر">
                                إلغاء الحظر
                            </button>` :
                            `<button class="btn-block" onclick="blockUser('${user.id}')" title="حظر المستخدم">
                                حظر
                            </button>`
                        }
                        <button class="btn-delete" onclick="deleteUser('${user.id}')" title="حذف المستخدم">
                            حذف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// حذف مستخدم
function deleteUser(userId) {
    const user = dataManager.getUsers().find(u => u.id === userId);
    if (!user) {
        showAdminNotification('المستخدم غير موجود', 'error');
        return;
    }
    
    const confirmMessage = `هل أنت متأكد من حذف المستخدم "${user.fullName}"؟\n\nسيتم حذف:\n- بيانات المستخدم\n- جميع طلباته\n- ملفاته المرفوعة\n\nهذا الإجراء لا يمكن التراجع عنه!`;
    
    if (confirm(confirmMessage)) {
        try {
            const result = dataManager.deleteUser(userId);
            showAdminNotification(`تم حذف المستخدم "${result.deletedUser.fullName}" بنجاح`, 'success');
            updateUsersTable();
            updateAdminStatistics();
        } catch (error) {
            showAdminNotification(error.message, 'error');
        }
    }
}

// حظر مستخدم
function blockUser(userId) {
    const user = dataManager.getUsers().find(u => u.id === userId);
    if (!user) {
        showAdminNotification('المستخدم غير موجود', 'error');
        return;
    }
    
    const confirmMessage = `هل أنت متأكد من حظر المستخدم "${user.fullName}"؟\n\nسيتم:\n- منع المستخدم من تسجيل الدخول\n- إنهاء جلسته الحالية إن وجدت\n- منعه من التسجيل مرة أخرى برقم الهوية نفسه`;
    
    if (confirm(confirmMessage)) {
        try {
            const result = dataManager.blockUser(userId);
            showAdminNotification(`تم حظر المستخدم "${result.blockedUser.fullName}" بنجاح`, 'success');
            updateUsersTable();
            updateAdminStatistics();
        } catch (error) {
            showAdminNotification(error.message, 'error');
        }
    }
}

// إلغاء حظر مستخدم
function unblockUser(userId) {
    const user = dataManager.getUsers().find(u => u.id === userId);
    if (!user) {
        showAdminNotification('المستخدم غير موجود', 'error');
        return;
    }
    
    const confirmMessage = `هل أنت متأكد من إلغاء حظر المستخدم "${user.fullName}"؟\n\nسيتمكن المستخدم من:\n- تسجيل الدخول مرة أخرى\n- استخدام جميع خدمات الموقع`;
    
    if (confirm(confirmMessage)) {
        try {
            const result = dataManager.unblockUser(userId);
            showAdminNotification(`تم إلغاء حظر المستخدم "${result.unblockedUser.fullName}" بنجاح`, 'success');
            updateUsersTable();
            updateAdminStatistics();
        } catch (error) {
            showAdminNotification(error.message, 'error');
        }
    }
}

// البحث في المستخدمين
function searchUsers(searchTerm) {
    const users = dataManager.searchUsers(searchTerm);
    const container = document.getElementById('usersTableContainer');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <p>لا توجد نتائج للبحث "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    // إعادة إنشاء الجدول بالنتائج المفلترة
    displayFilteredUsers(users);
}

// فلترة المستخدمين حسب الحالة
function filterUsers(status) {
    const users = dataManager.filterUsersByStatus(status);
    displayFilteredUsers(users);
}

// عرض المستخدمين المفلترين
function displayFilteredUsers(users) {
    const container = document.getElementById('usersTableContainer');
    
    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <p>لا توجد نتائج</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>الاسم</th>
                    <th>رقم الهوية</th>
                    <th>البريد الإلكتروني</th>
                    <th>الجوال</th>
                    <th>تاريخ التسجيل</th>
                    <th>الحالة</th>
                    <th>الطلبات</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach(user => {
        const userRequests = dataManager.getUserRequests(user.id);
        const isBlocked = user.status === 'blocked';
        
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center;">
                        <div class="user-avatar">${user.fullName.charAt(0)}</div>
                        <span style="margin-right: 10px;">${user.fullName}</span>
                    </div>
                </td>
                <td>${user.nationalId}</td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td>${dataManager.formatDate(user.registrationDate)}</td>
                <td>
                    <span class="status-${user.status}">
                        ${user.status === 'active' ? 'نشط' : 'محظور'}
                    </span>
                </td>
                <td>
                    <span style="background: #e0f2fe; color: #0277bd; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${userRequests.length}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        ${isBlocked ? 
                            `<button class="btn-unblock" onclick="unblockUser('${user.id}')" title="إلغاء الحظر">
                                إلغاء الحظر
                            </button>` :
                            `<button class="btn-block" onclick="blockUser('${user.id}')" title="حظر المستخدم">
                                حظر
                            </button>`
                        }
                        <button class="btn-delete" onclick="deleteUser('${user.id}')" title="حذف المستخدم">
                            حذف
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// تحديث الإحصائيات لتشمل بيانات المستخدمين
function updateAdminStatistics() {
    const users = dataManager.getUsers();
    const requests = dataManager.getRequests();
    const userStats = dataManager.getUsersStatistics();
    
    // تحديث إحصائيات المستخدمين
    document.getElementById('totalUsers').textContent = userStats.totalUsers;
    document.getElementById('activeUsers').textContent = userStats.activeUsers;
    document.getElementById('blockedUsers').textContent = userStats.blockedUsers;
    
    // تحديث إحصائيات الطلبات
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const completedRequests = requests.filter(r => r.status === 'completed').length;
    const totalReports = requests.filter(r => r.pdfGenerated).length;
    
    document.getElementById('totalRequests').textContent = requests.length;
    document.getElementById('pendingRequests').textContent = pendingRequests;
    document.getElementById('completedRequests').textContent = completedRequests;
    document.getElementById('totalReports').textContent = totalReports;
}

// تصدير بيانات المستخدمين
function exportUsersData() {
    try {
        const data = dataManager.exportUsersData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sehhaty_users_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showAdminNotification('تم تصدير بيانات المستخدمين بنجاح', 'success');
    } catch (error) {
        showAdminNotification('حدث خطأ في تصدير البيانات', 'error');
    }
}

// تنظيف البيانات المحذوفة
function cleanupData() {
    if (confirm('هل أنت متأكد من تنظيف البيانات المحذوفة؟\n\nسيتم حذف:\n- طلبات المستخدمين المحذوفين\n- ملفات PDF المرتبطة بها')) {
        try {
            const result = dataManager.cleanupDeletedData();
            showAdminNotification(`تم تنظيف ${result.deletedRequests} طلب محذوف`, 'success');
            updateRequestsTable();
            updateAdminStatistics();
        } catch (error) {
            showAdminNotification('حدث خطأ في تنظيف البيانات', 'error');
        }
    }
}

// تحديث دالة التهيئة لتشمل المستخدمين
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة البيانات
    dataManager.initializeData();
    
    // تحديث الجداول والإحصائيات
    updateUsersTable();
    updateRequestsTable();
    updateReportsTable();
    updateAdminStatistics();
    
    // تحديث دوري كل 30 ثانية
    setInterval(() => {
        updateUsersTable();
        updateRequestsTable();
        updateReportsTable();
        updateAdminStatistics();
    }, 30000);
});

// تحديث دالة showAdminTab لتشمل المستخدمين
function showAdminTab(tabName) {
    // إخفاء جميع التبويبات
    const tabs = document.querySelectorAll('.admin-tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // إزالة الفئة النشطة من جميع الأزرار
    const navTabs = document.querySelectorAll('.admin-nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // إظهار التبويب المحدد
    const selectedTab = document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    // إضافة الفئة النشطة للزر المضغوط
    event.target.classList.add('active');
    
    // تحديث البيانات حسب التبويب
    switch(tabName) {
        case 'users':
            updateUsersTable();
            break;
        case 'requests':
            updateRequestsTable();
            break;
        case 'reports':
            updateReportsTable();
            break;
    }
}

