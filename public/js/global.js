document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const themeSwitcher = document.getElementById('theme-switcher');
    const sunIcon = 'https://emojicdn.elk.sh/☀️';
    const moonIcon = 'https://emojicdn.elk.sh/🌙';

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        if (themeSwitcher) {
            themeSwitcher.innerHTML = `<img src="${theme === 'dark' ? sunIcon : moonIcon}" alt="theme icon">`;
        }
        localStorage.setItem('theme', theme);
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            setTheme(currentTheme);
        });
    }

    // Устанавливаем тему при загрузке, либо 'light' по умолчанию
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
});