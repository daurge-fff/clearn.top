document.addEventListener('DOMContentLoaded', () => {
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

    // Set initial theme on page load
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
});

// Password visibility toggle
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