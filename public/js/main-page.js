// Функция, которая будет запускать всю логику главной страницы.
// Мы вызовем ее, когда будем уверены, что всё загружено.
function initializeMainPage() {
    console.log("main-page.js: Initializing...");

    // --- ЭЛЕМЕНТЫ СТРАНИЦЫ ---
    const body = document.body;
    const languageSwitcher = document.querySelector('.language-switcher');
    const feedbackForm = document.getElementById('feedback-form');
    const paymentModal = document.getElementById('payment-modal');
    const donateCard = document.getElementById('donate-card');
    const courseDetailsModal = document.getElementById('course-details-modal');

    // Если ключевых элементов нет, значит мы не на главной странице, выходим.
    if (!courseDetailsModal || !paymentModal) {
        console.log("main-page.js: Not on the main page. Exiting.");
        return;
    }

    // --- ПЕРЕМЕННЫЕ И КОНФИГУРАЦИЯ ---
    const paymentConfig = {
        currency: 'EUR',
        basePrices: { '25': 10, '50': 20 },
        discounts: { 1: 0, 5: 5, 10: 10, 15: 15, 20: 20 },
        availableSystems: [ { id: 'paypal', name: 'PayPal' }, { id: 'cryptocloud', name: 'CryptoCloud' }, { id: 'robokassa', name: 'Robokassa' }]
    };
    
    let currentBasePrice = 0;
    let currentTariffName = '';
    let selectedPaymentSystem = null;
    let isDonationMode = false;

    // --- ФУНКЦИИ ---
    function setLanguage(lang) {
        if (typeof translations === 'undefined') { return; }
        if (lang === 'ua') lang = 'uk';
        if (!translations[lang]) lang = 'en';
        
        const langData = translations[lang];
        document.documentElement.setAttribute('lang', lang);
        body.setAttribute('dir', langData.dir || 'ltr');

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            if (langData[key] !== undefined) el.innerHTML = langData[key];
        });

        document.querySelectorAll('.course-card').forEach(card => {
            const courseKey = card.dataset.courseKey;
            if (courseKey && langData[`course_${courseKey}_title`]) {
                card.querySelector('h3').innerHTML = langData[`course_${courseKey}_title`];
                card.querySelector('.course-age').innerHTML = langData[`course_${courseKey}_age`];
                card.querySelector('p').innerHTML = langData[`course_${courseKey}_desc`];
            }
        });
        
        if (languageSwitcher) {
            const display = languageSwitcher.querySelector('.current-lang');
            const item = languageSwitcher.querySelector(`.lang-dropdown [data-lang="${lang}"]`);
            if (display && item) display.innerHTML = item.innerHTML;
        }
        localStorage.setItem('language', lang);
    }

    function openPaymentModal(tariffDuration, donationMode = false) {
        isDonationMode = donationMode;
        currentTariffName = isDonationMode ? 'Donation' : `Lesson ${tariffDuration} min`;
        currentBasePrice = isDonationMode ? 1 : paymentConfig.basePrices[tariffDuration];

        paymentModal.querySelector('#modal-tariff-name').textContent = currentTariffName;
        paymentModal.querySelector('#lesson-quantity-selector').style.display = isDonationMode ? 'none' : 'block';
        paymentModal.querySelector('#donation-amount-selector').style.display = isDonationMode ? 'block' : 'none';
        paymentModal.querySelector('.price-breakdown').style.display = isDonationMode ? 'none' : 'block';
        
        const lessonSlider = document.getElementById('lesson-quantity');
        lessonSlider.value = 1;
        lessonSlider.dataset.duration = tariffDuration;
        document.getElementById('donation-amount').value = 10;
        document.getElementById('terms-checkbox').checked = false;
        selectedPaymentSystem = null;
        
        const systemsContainer = paymentModal.querySelector('.systems');
        systemsContainer.innerHTML = '';
        paymentConfig.availableSystems.forEach(system => {
            const card = document.createElement('div');
            card.className = 'payment-system-card';
            card.dataset.system = system.id;
            card.textContent = system.name;
            systemsContainer.appendChild(card);
        });

        const paypalContainer = document.getElementById('paypal-button-container');
        if (paypalContainer) { paypalContainer.innerHTML = ''; paypalContainer.style.display = 'none'; }
        document.getElementById('final-pay-button').style.display = 'block';
        
        updatePaymentModalPrice();
        paymentModal.classList.add('is-open');
    }
    
    // --- ЕДИНЫЙ ОБРАБОТЧИК КЛИКОВ НА ВСЕЙ СТРАНИЦЕ (Event Delegation) ---
    // Это надежнее, чем вешать много отдельных обработчиков
    document.body.addEventListener('click', function(e) {
        
        // 1. Клик по карточке курса
        const courseCard = e.target.closest('.course-card');
        if (courseCard) {
            console.log("Course card clicked:", courseCard.dataset.courseKey);
            // Тут должна быть функция открытия модалки с деталями
            // openCourseDetailsModal(courseCard.dataset.courseKey);
            return;
        }

        // 2. Клик по кнопке "Выбрать" или "Enroll"
        const buyButton = e.target.closest('.buy-button');
        if (buyButton && buyButton.dataset.duration) {
            console.log("Buy button clicked:", buyButton.dataset.duration);
            if (courseDetailsModal && courseDetailsModal.classList.contains('is-open')) {
                courseDetailsModal.classList.remove('is-open');
            }
            openPaymentModal(buyButton.dataset.duration, false);
            return;
        }

        // 3. Клик по карточке доната
        if (e.target.closest('#donate-card')) {
             console.log("Donate card clicked");
             openPaymentModal(null, true);
             return;
        }
    });

    // Инициализация языка (ждем, пока объект translations будет доступен)
    if (typeof translations !== 'undefined') {
        let savedLang = localStorage.getItem('language') || 'en';
        setLanguage(savedLang);
    } else {
        console.error("Translations not available on init.");
    }
    
    console.log("main-page.js: Initialized successfully.");
}


// --- ТОЧКА ВХОДА ---
// Эта конструкция будет ждать, пока загрузится не только HTML, но и все скрипты (включая translations.js)
window.addEventListener('load', function() {
    console.log("Window fully loaded. Starting main page script...");
    initializeMainPage();
});