// ===================================
// === ГЛАВНЫЙ ФАЙЛ ГЛОБАЛЬНЫХ СКРИПТОВ ===
// ===================================

// Состояние инициализации приложения
const APP_STATE = {
    initialized: false,
    dashboardInitialized: false,
    lessonModalInitialized: false
};

// Инициализация всех модулей после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    if (APP_STATE.initialized) return;
    APP_STATE.initialized = true;
    
    // Базовые функции интерфейса
    initializeThemeSwitcher();
    initializeSidebar();
    initializePasswordToggles();
    initializeFileUploads();
    initializeMobileFilters();
    initializeProjectFieldsToggle();

    // Главный обработчик для всей интерактивности CRM
    initializeDashboardActions();
    
    // Инициализация модального окна (логика и обработчики)
    initializeLessonModal();
});

// ===================================
// === ОСНОВНЫЕ МОДУЛИ ИНИЦИАЛИЗАЦИИ ===
// ===================================

function initializeThemeSwitcher() {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (!themeSwitcher) return;
    
    const html = document.documentElement;
    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }
    
    themeSwitcher.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(currentTheme);
    });
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

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
    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('is-showing');
            const input = this.previousElementSibling;
            input.type = input.type === 'password' ? 'text' : 'password';
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

// ===================================
// === ЕДИНЫЙ ОБРАБОТЧИК ДЕЙСТВИЙ CRM ===
// ===================================
function initializeDashboardActions() {
    if (APP_STATE.dashboardInitialized) return;
    APP_STATE.dashboardInitialized = true;
    
    let activeDropdown = null;

    document.body.addEventListener('click', async (e) => {
        const target = e.target;

        // 1. Логика для дропдауна статусов
        const statusCell = target.closest('.status-cell');
        if (statusCell) {
            const dropdown = statusCell.querySelector('.status-dropdown');
            if (activeDropdown && activeDropdown !== dropdown) {
                activeDropdown.classList.remove('show');
                activeDropdown.closest('.status-cell').classList.remove('is-open');
            }
            dropdown.classList.toggle('show');
            statusCell.classList.toggle('is-open');
            activeDropdown = dropdown.classList.contains('show') ? dropdown : null;
            return;
        }
        
        if (activeDropdown && !target.closest('.status-dropdown')) {
            activeDropdown.classList.remove('show');
            activeDropdown.closest('.status-cell').classList.remove('is-open');
            activeDropdown = null;
        }

        // 2. Логика для выбора нового статуса
        const dropdownItem = target.closest('.status-dropdown-item');
        if (dropdownItem) {
            e.stopPropagation();
            const newStatus = dropdownItem.dataset.status;
            const cell = dropdownItem.closest('.status-cell');
            const lessonId = cell.dataset.lessonId;
            
            if (newStatus === cell.dataset.currentStatus) {
                cell.querySelector('.status-dropdown').classList.remove('show');
                cell.classList.remove('is-open');
                activeDropdown = null;
                return;
            }
            
            try {
                const response = await fetch(`/api/lessons/${lessonId}/status`, { 
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ status: newStatus }) 
                });
                
                if (!response.ok) throw new Error((await response.json()).msg);
                const { lesson } = await response.json();
                const badge = cell.querySelector('.current-status-badge');
                badge.textContent = lesson.status.replace(/_/g, ' ');
                badge.className = `badge status-${lesson.status} current-status-badge`;
                cell.dataset.currentStatus = lesson.status;
                dropdownItem.closest('.status-dropdown').classList.remove('show');
                cell.classList.remove('is-open');
                activeDropdown = null;
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
            return;
        }
        
        // 3. Логика для кнопок, требующих подтверждения
        const deleteUserLink = target.closest('a[href*="/users/delete/"]');
        if (deleteUserLink) {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this user? This is irreversible.')) {
                window.location.href = deleteUserLink.href;
            }
            return;
        }

        const deleteLessonButton = target.closest('.delete-lesson-btn');
        if (deleteLessonButton) {
            e.preventDefault();
            const lessonId = deleteLessonButton.dataset.id;
            if (confirm('Are you sure you want to permanently delete this lesson?')) {
                try {
                    const response = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error((await response.json()).msg || 'Failed to delete');
                    const rowToRemove = document.querySelector(`tr[data-lesson-id="${lessonId}"]`);
                    if (rowToRemove) {
                        rowToRemove.style.transition = 'opacity 0.3s ease';
                        rowToRemove.style.opacity = '0';
                        setTimeout(() => rowToRemove.remove(), 300);
                    }
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
            return;
        }

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
// === ЛОГИКА МОДАЛЬНОГО ОКНА УРОКОВ ===
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
        modalFormContent.innerHTML = '<div class="spinner"></div>';
    };
    
    const closeModal = () => document.body.classList.remove('modal-open');

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

    // Обработчики открытия модального окна
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
            e.preventDefault();
            const lessonId = editBtn.href.split('/').pop();
            window.openLessonModal('edit', lessonId);
            return;
        }
    });

    // Обработчики закрытия модального окна и отправки формы
    [closeBtn, cancelBtn, modalOverlay].forEach(el => {
        el.addEventListener('click', closeModal);
    });
    
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

function initializeFlashMessages() {
    const messages = document.querySelectorAll('.flash-message');
    messages.forEach(message => {
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000);
    });
}

if (document.querySelector('.dashboard-layout')) {
    initializeFlashMessages();
}