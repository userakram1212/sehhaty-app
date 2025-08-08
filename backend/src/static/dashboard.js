// Dashboard JavaScript

let currentUser = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    currentUser = dataManager.getCurrentUser();
    
    if (!currentUser) {
        // إذا لم يكن المستخدم مسجل دخول، إعادة توجيه للصفحة الرئيسية
        window.location.href = 'index.html';
        return;
    }
    
    loadUserData();
    loadUserRequests();
    updateStatistics();
});

// Load user data
function loadUserData() {
    if (!currentUser) return;
    
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('profileName').value = currentUser.fullName;
    document.getElementById('profileNationalId').value = currentUser.nationalId;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone;
    document.getElementById('profileRegistrationDate').value = dataManager.formatDate(currentUser.registrationDate);
}

// Load user requests
function loadUserRequests() {
    if (!currentUser) return;
    
    const requests = dataManager.getUserRequests(currentUser.id);
    const requestsContent = document.getElementById('requestsContent');
    const reportsContent = document.getElementById('reportsContent');
    const appointmentsContent = document.getElementById('appointmentsContent');
    
    if (requests.length === 0) {
        requestsContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>لا توجد طلبات حالياً</p>
            </div>
        `;
        return;
    }
    
    // عرض جميع الطلبات
    requestsContent.innerHTML = createRequestsTable(requests);
    
    // فصل التقارير
    const reports = requests.filter(r => r.type === 'medical_request' && r.pdfGenerated);
    if (reports.length > 0) {
        reportsContent.innerHTML = createReportsTable(reports);
    }
    
    // فصل المواعيد
    const appointments = requests.filter(r => r.type === 'appointment');
    if (appointments.length > 0) {
        appointmentsContent.innerHTML = createAppointmentsTable(appointments);
    }
}

// Create requests table
function createRequestsTable(requests) {
    let html = `
        <table class="requests-table">
            <thead>
                <tr>
                    <th>نوع الطلب</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    requests.forEach(request => {
        html += `
            <tr>
                <td>${dataManager.getRequestTypeText(request.type)}</td>
                <td>${dataManager.formatDate(request.createdDate)}</td>
                <td><span class="status-badge status-${request.status}">${dataManager.getStatusText(request.status)}</span></td>
                <td>
                    ${request.pdfGenerated ? 
                        `<button class="download-btn" onclick="viewPDF('${request.id}')" style="background: #3b82f6; margin-left: 5px;">اطلاع</button>
                         <button class="download-btn" onclick="downloadPDF('${request.id}')">تحميل</button>` :
                        `<button class="download-btn" disabled>غير متاح</button>`
                    }
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Create reports table
function createReportsTable(reports) {
    let html = `
        <table class="requests-table">
            <thead>
                <tr>
                    <th>نوع التقرير</th>
                    <th>تاريخ الإنشاء</th>
                    <th>حجم الملف</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    reports.forEach(report => {
        html += `
            <tr>
                <td>${report.data.reportType || 'تقرير طبي'}</td>
                <td>${dataManager.formatDate(report.createdDate)}</td>
                <td>${report.pdfData ? report.pdfData.size : 'غير محدد'}</td>
                <td>
                    <button class="download-btn" onclick="viewPDF('${report.id}')" style="background: #3b82f6; margin-left: 5px;">اطلاع</button>
                    <button class="download-btn" onclick="downloadPDF('${report.id}')">تحميل</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Create appointments table
function createAppointmentsTable(appointments) {
    let html = `
        <table class="requests-table">
            <thead>
                <tr>
                    <th>التخصص</th>
                    <th>المدينة</th>
                    <th>التاريخ المفضل</th>
                    <th>الوقت</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    appointments.forEach(appointment => {
        const data = appointment.data;
        html += `
            <tr>
                <td>${data.specialty || 'غير محدد'}</td>
                <td>${data.city || 'غير محدد'}</td>
                <td>${data.preferredDate || 'غير محدد'}</td>
                <td>${data.preferredTime || 'غير محدد'}</td>
                <td><span class="status-badge status-${appointment.status}">${dataManager.getStatusText(appointment.status)}</span></td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Update statistics
function updateStatistics() {
    if (!currentUser) return;
    
    const requests = dataManager.getUserRequests(currentUser.id);
    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const completedCount = requests.filter(r => r.status === 'completed').length;
    const reportsCount = requests.filter(r => r.pdfGenerated).length;
    
    document.getElementById('totalRequests').textContent = requests.length;
    document.getElementById('pendingRequests').textContent = pendingCount;
    document.getElementById('completedRequests').textContent = completedCount;
    document.getElementById('availableReports').textContent = reportsCount;
}

// Tab navigation
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').style.display = 'block';
    
    // Add active class to clicked nav tab
    event.target.classList.add('active');
}

// Download PDF
function downloadPDF(requestId) {
    try {
        dataManager.downloadPDF(requestId);
        showNotification('تم تحميل الملف بنجاح', 'success');
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Logout
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        dataManager.logoutUser();
        showNotification('تم تسجيل الخروج بنجاح', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Go to home
function goToHome() {
    window.location.href = 'index.html';
}

// Notification system (same as main script)
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

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (currentUser) {
        loadUserRequests();
        updateStatistics();
    }
}, 30000);


// View PDF function
function viewPDF(requestId) {
    try {
        const request = dataManager.getRequestById(requestId);
        if (!request || !request.pdfGenerated || !request.pdfData || !request.pdfData.content) {
            showNotification("الملف غير متاح للعرض أو تالف", "error");
            return;
        }
        
        // إنشاء URL للملف من المحتوى المحفوظ
        const blob = new Blob([request.pdfData.content], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        
        // فتح الملف في نافذة جديدة
        const newWindow = window.open(url, "_blank");
        if (!newWindow) {
            showNotification("يرجى السماح بفتح النوافذ المنبثقة لعرض الملف", "error");
        } else {
            showNotification("تم فتح الملف للاطلاع", "success");
        }
        
        // تنظيف URL بعد فترة
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000); // 1 دقيقة
        
    } catch (error) {
        console.error("Error viewing PDF:", error);
        showNotification("حدث خطأ في عرض الملف", "error");
    }
}

