// ===================================
// === MAIN GLOBAL SCRIPT FILE ===
// ===================================

// ===================================
// === THEME TOGGLE FUNCTIONALITY ===
// ===================================
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            theme = 'dark';
            themeToggle.textContent = '☀️';
            document.body.classList.add('dark-theme');
        } else {
            theme = 'light';
            themeToggle.textContent = '🌙';
            document.body.classList.remove('dark-theme');
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
}

// Application initialization state
const APP_STATE = {
    initialized: false,
    dashboardInitialized: false,
    lessonModalInitialized: false
};

// ===================================
// === BACK TO TOP FUNCTIONALITY ===
// ===================================


// ===================================
// === CORE INITIALIZATION MODULES ===
// ===================================

function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const body = document.querySelector('.dashboard-body');

    if (sidebarToggle && body) {
        sidebarToggle.addEventListener('click', () => {
            body.classList.toggle('sidebar-open');
        });
    }
    
    if (sidebarOverlay && body) {
        sidebarOverlay.addEventListener('click', () => {
            body.classList.remove('sidebar-open');
        });
    }
}

function initializePasswordToggles() {
    document.querySelectorAll('.password-toggle, .modern-password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('is-showing');
            const input = this.previousElementSibling;
            const eyeIcon = this.querySelector('.icon-eye');
            const eyeOffIcon = this.querySelector('.icon-eye-off');
            
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.add('active');
                if (eyeIcon && eyeOffIcon) {
                    eyeIcon.style.display = 'none';
                    eyeOffIcon.style.display = 'inline';
                }
            } else {
                input.type = 'password';
                this.classList.remove('active');
                if (eyeIcon && eyeOffIcon) {
                    eyeIcon.style.display = 'inline';
                    eyeOffIcon.style.display = 'none';
                }
            }
        });
    });
}

function initializeFileUploads() {
    document.querySelectorAll('.file-upload-wrapper').forEach(wrapper => {
        const input = wrapper.querySelector('.file-input');
        const fileNameEl = wrapper.querySelector('.file-name');

        wrapper.addEventListener('click', () => input.click());
        input.addEventListener('click', (e) => e.stopPropagation());
        wrapper.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            wrapper.classList.add('is-dragging'); 
        });
        wrapper.addEventListener('dragleave', () => wrapper.classList.remove('is-dragging'));
        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            wrapper.classList.remove('is-dragging');
            if (e.dataTransfer.files.length > 0) {
                input.files = e.dataTransfer.files;
                if(fileNameEl) fileNameEl.textContent = input.files[0].name;
            }
        });
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                if(fileNameEl) fileNameEl.textContent = input.files[0].name;
            } else {
                if(fileNameEl) fileNameEl.textContent = '';
            }
        });
    });
}

function initializeMobileFilters() {
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    const collapsibleFilters = document.querySelector('.collapsible-filters');

    if (mobileFilterToggle && collapsibleFilters) {
        mobileFilterToggle.addEventListener('click', function() {
            collapsibleFilters.classList.toggle('is-open');
        });
    }
}

function initializeProjectFieldsToggle() {
    document.body.addEventListener('change', (e) => {
        if (e.target.id === 'isProject') {
            const projectFields = document.getElementById('project-fields');
            if(projectFields) projectFields.style.display = e.target.checked ? 'block' : 'none';
        }
    });
}

function initializeModernInputs() {
    // Modern floating labels functionality
    const modernInputs = document.querySelectorAll('.modern-input, .modern-select');
    
    modernInputs.forEach(input => {
        // Check if input has value on page load (including pre-filled values)
        const hasValue = input.value && input.value.trim() !== '';
        const isSelect = input.tagName === 'SELECT' && input.value !== '' && input.value !== null;
        const hasAttribute = input.hasAttribute('value') && input.getAttribute('value') !== '' && input.getAttribute('value') !== null;
        
        // Принудительно проверяем все возможные случаи
        if (hasValue || isSelect || hasAttribute) {
            input.classList.add('has-value');
            input.setAttribute('data-has-value', 'true');
            
            // Дополнительно устанавливаем атрибут value если его нет
            if (hasValue && !input.hasAttribute('value')) {
                input.setAttribute('value', input.value);
            }
        }
        
        // Специальная обработка для select элементов
        if (input.tagName === 'SELECT' && input.selectedIndex > 0) {
            input.classList.add('has-value');
            input.setAttribute('data-has-value', 'true');
        }
        
        // Handle focus and blur events
        input.addEventListener('focus', function() {
            this.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.classList.remove('focused');
            const currentHasValue = this.value && this.value.trim() !== '';
            const currentIsSelect = this.tagName === 'SELECT' && this.value !== '';
            
            if (currentHasValue || currentIsSelect) {
                this.classList.add('has-value');
                this.setAttribute('data-has-value', 'true');
            } else {
                this.classList.remove('has-value');
                this.removeAttribute('data-has-value');
            }
        });
        
        // Handle input events for real-time updates
        input.addEventListener('input', function() {
            const currentHasValue = this.value && this.value.trim() !== '';
            const currentIsSelect = this.tagName === 'SELECT' && this.value !== '';
            
            if (currentHasValue || currentIsSelect) {
                this.classList.add('has-value');
                this.setAttribute('data-has-value', 'true');
            } else {
                this.classList.remove('has-value');
                this.removeAttribute('data-has-value');
            }
        });
        
        // Handle change events for selects
        if (input.tagName === 'SELECT') {
            input.addEventListener('change', function() {
                if (this.value !== '') {
                    this.classList.add('has-value');
                    this.setAttribute('data-has-value', 'true');
                } else {
                    this.classList.remove('has-value');
                    this.removeAttribute('data-has-value');
                }
            });
        }
    });
    
    // Enhanced card hover effects
    const modernCards = document.querySelectorAll('.modern-card, .notification-toggle-card');
    
    modernCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.setProperty('--hover-intensity', '1');
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.setProperty('--hover-intensity', '0');
        });
    });
    
    // Smooth scroll for form validation errors
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const firstError = this.querySelector('input:invalid, select:invalid');
            if (firstError) {
                e.preventDefault();
                firstError.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                firstError.focus();
            }
        });
    }
}

// ===================================
// === UNIFIED CRM ACTION HANDLER ===
// ===================================
function initializeDashboardActions() {
    if (APP_STATE.dashboardInitialized) return;
    APP_STATE.dashboardInitialized = true;

    let activeDropdown = null;

    // Function to close all active dropdowns
    const closeActiveDropdown = () => {
        if (activeDropdown) {
            activeDropdown.classList.remove('show');
            if (activeDropdown.closest('.status-cell')) {
                activeDropdown.closest('.status-cell').classList.remove('is-open');
            }
            activeDropdown = null;
        }
    };
    
    // Global click to close menus
    document.body.addEventListener('click', (e) => {
        if (!e.target.closest('.status-cell')) {
            closeActiveDropdown();
        }
    });

    // Delegated handler for all actions
    document.body.addEventListener('click', async (e) => {
        const target = e.target;

        // 1. Handle status cell click (to open/close)
        const statusCell = target.closest('.status-cell');
        if (statusCell && !target.closest('.status-dropdown-item')) {
            e.stopPropagation();
            const dropdown = statusCell.querySelector('.status-dropdown');
            if (dropdown) {
                if (dropdown.classList.contains('show')) {
                    closeActiveDropdown();
                } else {
                    closeActiveDropdown(); // Close the previous one if it exists
                    dropdown.classList.add('show');
                    statusCell.classList.add('is-open');
                    activeDropdown = dropdown;
                }
            }
            return;
        }

        // 2. Handle new status selection
        const statusDropdownItem = target.closest('.status-dropdown-item');
        if (statusDropdownItem) {
            e.stopPropagation();
            const cell = statusDropdownItem.closest('.status-cell');
            if (!cell) return;
            
            closeActiveDropdown(); // Close the menu after selection

            const newStatus = statusDropdownItem.dataset.status;
            const currentStatus = cell.dataset.currentStatus;
            if (newStatus === currentStatus) return;

            const lessonId = cell.dataset.lessonId;
            const paymentId = cell.dataset.paymentId;
            let url, body;

            if (lessonId) {
                url = `/api/lessons/${lessonId}/status`;
                body = { status: newStatus };
            } else if (paymentId) {
                url = `/api/payments/${paymentId}/status`;
                body = { status: newStatus };
            } else {
                return;
            }

            try {
                const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.msg || 'Failed to update status');
                
                const entity = result.lesson || result.payment;
                
                const badge = cell.querySelector('.current-status-badge');
                if (badge) {
                    badge.textContent = entity.status.replace(/_/g, ' ');
                    badge.className = `badge status-${entity.status.replace(/ /g, '_')} current-status-badge`;
                }
                cell.dataset.currentStatus = entity.status;

                if (paymentId) { // If it's a payment, update the available actions
                    const dropdown = cell.querySelector('.status-dropdown');
                    if (dropdown) dropdown.innerHTML = `<div class="status-dropdown-item">No actions available</div>`;
                }

            } catch (error) { 
                alert(`Error: ${error.message}`); 
            }
            return;
        }

        // 3. Handle user deletion
        const deleteUserLink = target.closest('a[href*="/users/delete/"]');
        if (deleteUserLink) {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this user? This is irreversible.')) {
                window.location.href = deleteUserLink.href;
            }
            return;
        }

        // 4. Handle lesson deletion
        const deleteLessonButton = target.closest('.delete-lesson-btn');
        if (deleteLessonButton) {
            e.preventDefault();
            const lessonId = deleteLessonButton.dataset.id;
            if (confirm('Are you sure you want to PERMANENTLY delete this lesson? This will NOT refund a lesson to the student.')) {
                try {
                    const response = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error((await response.json()).msg || 'Failed to delete');
                    deleteLessonButton.closest('tr').remove();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
            return;
        }

        // 5. Handle payment deletion
        const deletePaymentButton = target.closest('.delete-payment-btn');
        if (deletePaymentButton) {
            e.preventDefault();
            const paymentId = deletePaymentButton.dataset.id;
            if (confirm('Are you sure you want to PERMANENTLY delete this payment record?')) {
                try {
                    const response = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error((await response.json()).msg || 'Failed to delete');
                    deletePaymentButton.closest('tr').remove();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
            return;
        }

        // 6. Handle password reset
        const resetPasswordBtn = target.closest('#reset-password-btn');
        if (resetPasswordBtn) {
            e.preventDefault();
            const userId = window.location.pathname.split('/').pop();
            if (confirm('Are you sure you want to reset the password? A new temporary password will be sent to the user\'s Telegram.')) {
                try {
                    const response = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.msg);
                    alert(data.msg);
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
            return;
        }
    });
}

// ===================================
// === LESSON MODAL LOGIC ===
// ===================================
function initializeLessonModal() {
    if (APP_STATE.lessonModalInitialized) return;
    APP_STATE.lessonModalInitialized = true;
    
    const modalOverlay = document.getElementById('lesson-modal-overlay');
    const modalContainer = document.getElementById('lesson-modal');
    if (!modalContainer) return;

    const modalTitle = document.getElementById('modal-title');
    const modalFormContent = document.getElementById('modal-form-content');
    const lessonForm = document.getElementById('lesson-form');
    const closeBtn = document.getElementById('modal-close-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    let formCache = {};

    const openModal = () => {
        document.body.classList.add('modal-open');
        modalOverlay.style.display = 'block';
        modalContainer.style.display = 'block';
        modalFormContent.innerHTML = '<div class="spinner"></div>';
    };
    
    const closeModal = () => {
        document.body.classList.remove('modal-open');
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
    };

    const buildFormHtml = (data, lesson = {}, preselectedStudentId = null) => {
        const toLocalISOString = (date) => {
            if (!date) return '';
            const d = new Date(date);
            const tzoffset = d.getTimezoneOffset() * 60000;
            return new Date(d - tzoffset).toISOString().slice(0, 16);
        };
        
        const lessonDate = lesson.lessonDate ? toLocalISOString(lesson.lessonDate) : '';
        const studentId = preselectedStudentId || (lesson.student ? String(lesson.student._id || lesson.student) : null);
        const teacherId = lesson.teacher ? String(lesson.teacher._id || lesson.teacher) : null;
        const courseId = lesson.course ? String(lesson.course._id || lesson.course) : null;
        
        return `
            <div class="form-group"><label for="student">Student</label><select id="student" name="student" required>${data.students.map(s => `<option value="${s._id}" ${studentId === String(s._id) ? 'selected' : ''}>${s.name} (Balance: ${s.lessonsPaid})</option>`).join('')}</select></div>
            <div class="form-group"><label for="teacher">Teacher</label><select id="teacher" name="teacher" required>${data.teachers.map(t => `<option value="${t._id}" ${teacherId === String(t._id) ? 'selected' : ''}>${t.name}</option>`).join('')}</select></div>
            <div class="form-group"><label for="course">Course</label><select id="course" name="course" required>${data.courses.map(c => `<option value="${c._id}" ${courseId === String(c._id) ? 'selected' : ''}>${c.name}</option>`).join('')}</select></div>
            <div class="form-group"><label for="topic">Specific Topic</label><input type="text" id="topic" name="topic" value="${lesson.topic || ''}"></div>
            <div class="form-group"><label for="lessonDate">Date and Time</label><input type="datetime-local" id="lessonDate" name="lessonDate" value="${lessonDate}" required></div>
            <div class="form-group"><label for="duration">Duration (minutes)</label><select id="duration" name="duration"><option value="25" ${lesson.duration == 25 ? 'selected' : ''}>25</option><option value="50" ${!lesson.duration || lesson.duration == 50 ? 'selected' : ''}>50</option><option value="80" ${lesson.duration == 80 ? 'selected' : ''}>80</option></select></div>
        `;
    };

    const populateForm = async (mode, lessonId = null, preselectedStudentId = null) => {
        openModal();
        try {
            if (Object.keys(formCache).length === 0) {
                const res = await fetch('/api/lessons/form-data');
                if (!res.ok) throw new Error('Failed to load form data.');
                formCache = await res.json();
            }
            
            let lessonData = {};
            if (mode === 'edit') {
                const lessonRes = await fetch(`/api/lessons/${lessonId}`);
                if (!lessonRes.ok) throw new Error('Failed to load lesson data.');
                lessonData = await lessonRes.json();
            }
            
            modalTitle.textContent = mode === 'create' ? 'Schedule New Lesson' : 'Edit Lesson';
            lessonForm.dataset.mode = mode;
            lessonForm.dataset.id = lessonId || '';
            modalFormContent.innerHTML = buildFormHtml(formCache, lessonData, preselectedStudentId);
        } catch(err) {
            modalFormContent.innerHTML = `<p style="color: red;">${err.message}</p>`;
        }
    };

    window.openLessonModal = populateForm;

    document.body.addEventListener('click', (e) => {
        const createBtn = e.target.closest('a[href="/dashboard/lessons/add"], #schedule-lesson-btn');
        if (createBtn) {
            e.preventDefault();
            const studentId = createBtn.dataset.studentId || null;
            window.openLessonModal('create', null, studentId);
            return;
        }
        
        const editBtn = e.target.closest('a[href*="/dashboard/lessons/manage/"]');
        if (editBtn) {
            // The modal opens ONLY for the admin.
            // The teacher will simply follow the link.
            if (document.body.dataset.userRole === 'admin') {
                e.preventDefault();
                const lessonId = editBtn.href.split('/').pop();
                window.openLessonModal('edit', lessonId);
                return;
            }
            // If the role is not admin, do nothing, and the browser follows the link.
        }
    });

    // Modal close and form submission handlers
    [closeBtn, cancelBtn, modalOverlay].forEach(el => {
        if (el) {
            el.addEventListener('click', closeModal);
        }
    });
    
    // Additional close handler for all modal close buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn')) {
            closeModal();
        }
    });
    
    if (lessonForm) {
        lessonForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(lessonForm).entries());
            const { mode, id } = lessonForm.dataset;
            const url = mode === 'create' ? '/api/lessons' : `/api/lessons/${id}`;
            const method = mode === 'create' ? 'POST' : 'PUT';
            
            try {
                const response = await fetch(url, { 
                    method, 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify(data) 
                });
                
                if (!response.ok) throw new Error((await response.json()).msg);
                closeModal();
                location.reload();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    }
}



document.addEventListener('DOMContentLoaded', () => {
    initializeThemeToggle();
    if (APP_STATE.initialized) return;
    APP_STATE.initialized = true;
    
    // Basic UI functions
    initializeSidebar();
    initializePasswordToggles();
    initializeFileUploads();
    initializeMobileFilters();
    initializeProjectFieldsToggle();
    initializeModernInputs();


    // Main handler for all CRM interactivity
    initializeDashboardActions();
    
    // ПРИНУДИТЕЛЬНАЯ ИНИЦИАЛИЗАЦИЯ FLOATING LABELS
function initializeFloatingLabels() {
    const modernInputs = document.querySelectorAll('.modern-input, .modern-select');
    modernInputs.forEach(input => {
        // Проверяем все возможные способы определения значения
        const hasValue = input.value && input.value.trim() !== '' && input.value !== 'undefined';
        const isSelect = input.tagName.toLowerCase() === 'select';
        const selectHasValue = isSelect && input.selectedIndex > 0;
        
        if (hasValue || selectHasValue) {
            input.setAttribute('data-has-value', 'true');
            input.classList.add('has-value');
            input.setAttribute('value', input.value);
            
            // Принудительно позиционируем лейбл
            const label = input.parentNode.querySelector('.floating-label');
            if (label) {
                label.style.top = '-8px';
                label.style.left = '16px';
                label.style.fontSize = '12px';
                label.style.color = 'var(--accent-color-1)';
                label.style.fontWeight = '600';
                label.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9))';
                label.style.borderRadius = '8px';
                label.style.padding = '0 8px';
                label.style.zIndex = '10';
                label.style.transform = 'translateY(0) scale(1)';
            }
        }
        
        // Добавляем обработчики событий для всех полей ввода
        input.addEventListener('input', function() {
            const label = this.parentNode.querySelector('.floating-label');
            if (this.value && this.value.trim() !== '') {
                this.setAttribute('data-has-value', 'true');
                this.classList.add('has-value');
                if (label) {
                    label.style.top = '-8px';
                     label.style.left = '16px';
                     label.style.fontSize = '12px';
                     label.style.color = 'var(--accent-color-1)';
                     label.style.fontWeight = '600';
                     label.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9))';
                     label.style.borderRadius = '8px';
                     label.style.padding = '0 8px';
                     label.style.zIndex = '10';
                     label.style.transform = 'translateY(0) scale(1)';
                }
            } else {
                 this.removeAttribute('data-has-value');
                 this.classList.remove('has-value');
                 if (label) {
                     label.style.top = '14px';
                     label.style.left = '20px';
                     label.style.fontSize = '16px';
                     label.style.color = '#6c757d';
                     label.style.fontWeight = 'normal';
                     label.style.background = 'transparent';
                     label.style.borderRadius = '';
                     label.style.padding = '0 8px';
                     label.style.zIndex = '2';
                     label.style.transform = '';
                 }
             }
        });
        
        // Добавляем обработчики focus и blur
        input.addEventListener('focus', function() {
            const label = this.parentNode.querySelector('.floating-label');
            if (label && (!this.value || this.value.trim() === '')) {
                 label.style.top = '-8px';
                label.style.left = '16px';
                label.style.fontSize = '12px';
                label.style.color = 'var(--accent-color-1)';
                label.style.fontWeight = '600';
                label.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9))';
                label.style.borderRadius = '8px';
                label.style.padding = '0 8px';
                label.style.zIndex = '10';
                label.style.transform = 'translateY(0) scale(1)';
            }
        });
        
        input.addEventListener('blur', function() {
             const label = this.parentNode.querySelector('.floating-label');
             if (label && (!this.value || this.value.trim() === '')) {
                 label.style.top = '14px';
                 label.style.left = '20px';
                 label.style.fontSize = '16px';
                 label.style.color = '#6c757d';
                 label.style.fontWeight = 'normal';
                 label.style.background = 'transparent';
                 label.style.borderRadius = '';
                 label.style.padding = '0 8px';
                 label.style.zIndex = '2';
                 label.style.transform = '';
             }
         });
    });
}

// Запускаем инициализацию несколько раз для надежности
setTimeout(initializeFloatingLabels, 50);
setTimeout(initializeFloatingLabels, 200);
setTimeout(initializeFloatingLabels, 500);
    
    // Modal initialization (logic and handlers)
    initializeLessonModal();

    const adminOverlay = document.getElementById('admin-actions-overlay');
    
    function closeAllModals() {
        if(adminOverlay) adminOverlay.style.display = 'none';
        document.querySelectorAll('.modal-container').forEach(modal => modal.style.display = 'none');
        document.querySelectorAll('.modal-overlay').forEach(overlay => overlay.style.display = 'none');
        document.body.classList.remove('modal-open');
    }

    if(adminOverlay) {
        adminOverlay.addEventListener('click', closeAllModals);
        document.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeAllModals();
            });
        });
    }
    
    // Global modal close handler for all close buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn')) {
            e.preventDefault();
            e.stopPropagation();
            closeAllModals();
        }
    });

    const adjustBalanceModal = document.getElementById('adjust-balance-modal');
    if (adjustBalanceModal) {
        document.body.addEventListener('click', e => {
            if (e.target.id === 'adjust-balance-btn') {
                const profileContainer = e.target.closest('.profile-page-container');
                if (profileContainer) {
                    const userId = window.location.pathname.split('/').pop();
                    const userName = profileContainer.querySelector('h1').textContent;
                    document.getElementById('adjust-balance-username').textContent = userName;
                    document.getElementById('adjust-balance-userid').value = userId;
                    adminOverlay.style.display = 'block';
                    adjustBalanceModal.style.display = 'block';
                }
            }
        });

        document.getElementById('adjust-balance-form').addEventListener('submit', async e => {
            e.preventDefault();
            const form = e.target;
            const userId = form.querySelector('#adjust-balance-userid').value;
            const response = await fetch(`/dashboard/user-profile/${userId}/adjust-balance`, {
                method: 'POST',
                body: new URLSearchParams(new FormData(form))
            });
            if(response.ok) location.reload();
            else alert('Failed to adjust balance.');
        });
    } 
    const linkPaymentModal = document.getElementById('link-payment-modal');
        if (linkPaymentModal) {
            const searchInput = document.getElementById('user-search-input');
            const searchResults = document.getElementById('user-search-results');
            const paymentIdField = document.getElementById('link-payment-id');
            const paymentIdentifierField = document.getElementById('link-payment-identifier');
            
            document.body.addEventListener('click', e => {
                if (e.target.classList.contains('link-payment-btn')) {
                    const paymentId = e.target.dataset.paymentId;
                    const identifier = e.target.dataset.identifier;
                    
                    paymentIdField.value = paymentId;
                    paymentIdentifierField.textContent = identifier;
                    searchResults.innerHTML = '';
                    searchInput.value = '';
                    
                    adminOverlay.style.display = 'block';
                    linkPaymentModal.style.display = 'block';
                }
            });

            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    const searchTerm = searchInput.value.trim();
                    if (searchTerm.length < 2) {
                        searchResults.innerHTML = '';
                        return;
                    }
                    const response = await fetch('/api/users/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ searchTerm })
                    });
                    const users = await response.json();
                    searchResults.innerHTML = users.map(user => `
                        <div class="result-item" data-user-id="${user._id}">
                            <span>${user.name} (<em>${user.email}</em>)</span>
                            <span class="badge role-${user.role}">${user.role}</span>
                        </div>
                    `).join('');
                }, 300);
            });

            searchResults.addEventListener('click', async e => {
                const resultItem = e.target.closest('.result-item');
                if (resultItem) {
                    const userId = resultItem.dataset.userId;
                    const paymentId = paymentIdField.value;
                    
                    const response = await fetch(`/api/payments/${paymentId}/link-user`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId })
                    });

                    if (response.ok) location.reload();
                    else alert('Failed to link user.');
                }
            });
        }
});