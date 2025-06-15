document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    if (themeSwitcher) {
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

    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const body = document.querySelector('.dashboard-body');

    if (sidebarToggle && body) {
        sidebarToggle.addEventListener('click', function() {
            body.classList.toggle('sidebar-open');
        });
    }
    if (sidebarOverlay && body) {
        sidebarOverlay.addEventListener('click', function() {
            body.classList.remove('sidebar-open');
        });
    }

    document.querySelectorAll('.password-toggle').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('is-showing');
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
            } else {
                input.type = 'password';
            }
        });
    });
});