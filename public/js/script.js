document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const body = document.body;
    const themeSwitcher = document.getElementById('theme-switcher');
    const languageSwitcher = document.querySelector('.language-switcher');
    const feedbackForm = document.getElementById('feedback-form');
    const courseModal = document.getElementById('course-modal');
    const paymentModal = document.getElementById('payment-modal');
    const sunIcon = 'https://emojicdn.elk.sh/☀️';
    const moonIcon = 'https://emojicdn.elk.sh/🌙';

    const paymentConfig = {
        currency: 'EUR',
        basePrices: { '25': 10, '50': 20 },
        discounts: { 1: 0, 5: 5, 10: 10, 15: 15, 20: 20 },
        availableSystems: [
            { id: 'cryptocloud', name: 'CryptoCloud' },
            { id: 'robokassa', name: 'Robokassa' }
        ]
    };
    
    let currentBasePrice = 0;
    let currentTariffName = '';
    let selectedPaymentSystem = null;

    function setLanguage(lang) {

        if (typeof translations === 'undefined' || !translations[lang]) lang = 'en';
        const langData = translations[lang];
        html.setAttribute('lang', lang);
        body.setAttribute('dir', langData.dir || 'ltr');

        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            if (langData[key] !== undefined) el.innerHTML = langData[key];
        });

        document.querySelectorAll('.course-card').forEach(card => {
            const courseKey = card.dataset.courseKey;
            if (courseKey) {
                const titleEl = card.querySelector('h3');
                const ageEl = card.querySelector('.course-age');
                const descEl = card.querySelector('p');
                if (titleEl) titleEl.innerHTML = langData[`course_${courseKey}_title`] || '';
                if (ageEl) ageEl.innerHTML = langData[`course_${courseKey}_age`] || '';
                if (descEl) descEl.innerHTML = langData[`course_${courseKey}_desc`] || '';
            }
        });
        
        if (languageSwitcher) {
            const currentLangDisplay = languageSwitcher.querySelector('.current-lang');
            const selectedLangElement = languageSwitcher.querySelector(`.lang-dropdown [data-lang="${lang}"]`);
            if (selectedLangElement && currentLangDisplay) {
                currentLangDisplay.innerHTML = selectedLangElement.innerHTML;
            }
        }
        localStorage.setItem('language', lang);
    }

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        if (themeSwitcher) themeSwitcher.innerHTML = `<img src="${theme === 'dark' ? sunIcon : moonIcon}" alt="theme icon">`;
        localStorage.setItem('theme', theme);
    }
    
    async function handleFormSubmit(e) {
        e.preventDefault();
        const formStatus = document.getElementById('form-status');
        const submitButton = feedbackForm.querySelector('button[type="submit"]');
        if (!formStatus || !submitButton) return;

        const formData = new FormData(feedbackForm);
        const data = Object.fromEntries(formData.entries());
        const currentLang = localStorage.getItem('language') || 'en';

        submitButton.disabled = true;
        submitButton.textContent = translations[currentLang]?.form_sending || 'Sending...';

        try {
            const response = await fetch('/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (response.ok) {
                formStatus.textContent = translations[currentLang]?.form_success || "Your request has been sent!";
                formStatus.style.color = 'var(--accent-color-1)';
                feedbackForm.reset();
            } else {
                formStatus.textContent = result.message || 'An error occurred.';
                formStatus.style.color = 'var(--accent-color-2)';
            }
        } catch (error) {
            formStatus.textContent = 'Network error. Please try again.';
            formStatus.style.color = 'var(--accent-color-2)';
        } finally {
            setTimeout(() => {
                submitButton.textContent = translations[currentLang]?.form_button || "Send Request";
                submitButton.disabled = false;
                formStatus.textContent = '';
            }, 5000);
        }
    }

    function updatePaymentModalPrice() {
        if (!paymentModal) return;
        const quantityEl = document.getElementById('lesson-quantity');
        if (!quantityEl) return;
        
        const quantity = parseInt(quantityEl.value, 10);
        const quantityValueEl = document.getElementById('quantity-value');
        const pricePerLessonEl = document.getElementById('modal-price-per-lesson');
        const discountEl = document.getElementById('modal-discount');
        const totalPriceEl = document.getElementById('modal-total-price');
        const finalPayButton = document.getElementById('final-pay-button');

        const discountBreakpoints = Object.keys(paymentConfig.discounts).map(Number).sort((a,b) => b-a);
        let applicableDiscount = 0;
        for (const bp of discountBreakpoints) {
            if (quantity >= bp) {
                applicableDiscount = paymentConfig.discounts[bp];
                break;
            }
        }
        
        const finalTotal = (currentBasePrice * quantity) * (1 - applicableDiscount / 100);
        const pricePerLesson = (quantity > 0) ? (finalTotal / quantity) : 0;

        if (quantityValueEl) quantityValueEl.textContent = quantity;
        if (pricePerLessonEl) pricePerLessonEl.textContent = `${pricePerLesson.toFixed(2)} ${paymentConfig.currency}`;
        if (discountEl) discountEl.textContent = `${applicableDiscount}%`;
        if (totalPriceEl) totalPriceEl.textContent = `${finalTotal.toFixed(2)} ${paymentConfig.currency}`;
        if (finalPayButton) finalPayButton.disabled = !selectedPaymentSystem;
    }

    function openPaymentModal(tariffDuration) {
        if (!paymentModal) return;
        
        currentBasePrice = paymentConfig.basePrices[tariffDuration];
        currentTariffName = `Lesson ${tariffDuration} min`;

        const tariffNameEl = document.getElementById('modal-tariff-name');
        if (tariffNameEl) tariffNameEl.textContent = currentTariffName;
        
        const quantitySlider = document.getElementById('lesson-quantity');
        if (quantitySlider) quantitySlider.value = 1;
        
        selectedPaymentSystem = null;

        const systemsContainer = paymentModal.querySelector('.systems');
        if (systemsContainer) {
            systemsContainer.innerHTML = '';
            paymentConfig.availableSystems.forEach(system => {
                const card = document.createElement('div');
                card.className = 'payment-system-card';
                card.dataset.system = system.id;
                card.textContent = system.name;
                systemsContainer.appendChild(card);
            });
        }
        updatePaymentModalPrice();
        paymentModal.classList.add('is-open');
    }

    if (languageSwitcher) {
        const langButton = languageSwitcher.querySelector('.current-lang');
        const langDropdown = languageSwitcher.querySelector('.lang-dropdown');

        langButton.addEventListener('click', (e) => {
            e.stopPropagation(); 
            languageSwitcher.classList.toggle('is-active');
        });

        langDropdown.addEventListener('click', (e) => {
            const lang = e.target.closest('li')?.dataset.lang; 
            if (lang) {
                setLanguage(lang);
                languageSwitcher.classList.remove('is-active');
            }
        });

        window.addEventListener('click', () => {
            if (languageSwitcher.classList.contains('is-active')) {
                languageSwitcher.classList.remove('is-active');
            }
        });
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    }

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', handleFormSubmit);
    }
    
    if (courseModal) {
        const modalTitle = courseModal.querySelector('#modal-title');
        const modalBody = courseModal.querySelector('#modal-body');
        const closeBtn = courseModal.querySelector('.close-button');

        const openCourseModal = (courseKey) => {
            const currentLang = localStorage.getItem('language') || 'en';
            const langData = translations[currentLang];
            const title = langData[`course_${courseKey}_title`] || courseKey.toUpperCase();
            const modules = langData[`course_${courseKey}_modules`] || [];
            
            if (modalTitle) modalTitle.textContent = title;
            
            let modulesHtml = '<ul>';
            if (Array.isArray(modules) && modules.length > 0) {
                modulesHtml += modules.map(mod => `<li>${mod}</li>`).join('');
            } else {
                modulesHtml += `<li>Module information is not yet available in this language.</li>`;
            }
            modulesHtml += '</ul>';
            
            if (modalBody) modalBody.innerHTML = modulesHtml;
            courseModal.classList.add('is-open');
        };

        const closeCourseModal = () => courseModal.classList.remove('is-open');

        document.querySelector('.courses-grid').addEventListener('click', (e) => {
            const button = e.target.closest('.details-button');
            if(button) {
                const courseKey = button.closest('.course-card').dataset.courseKey;
                openCourseModal(courseKey);
            }
        });
        
        if (closeBtn) closeBtn.addEventListener('click', closeCourseModal);
        window.addEventListener('click', (event) => { if (event.target === courseModal) closeCourseModal(); });
        window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && courseModal.classList.contains('is-open')) closeCourseModal(); });
    }

    document.querySelectorAll('.buy-button').forEach(button => {
        button.addEventListener('click', () => {
            const tariffDuration = button.dataset.duration;
            if (tariffDuration) openPaymentModal(tariffDuration);
        });
    });

    if (paymentModal) {
        const quantitySlider = document.getElementById('lesson-quantity');
        const systemsContainer = paymentModal.querySelector('.systems');
        const finalPayButton = document.getElementById('final-pay-button');
        const closeBtn = paymentModal.querySelector('.close-button');

        if(quantitySlider) quantitySlider.addEventListener('input', updatePaymentModalPrice);
        
        if (systemsContainer) systemsContainer.addEventListener('click', (e) => {
            const target = e.target.closest('.payment-system-card');
            if (!target) return;
            systemsContainer.querySelectorAll('.payment-system-card').forEach(card => card.classList.remove('active'));
            target.classList.add('active');
            selectedPaymentSystem = target.dataset.system;
            updatePaymentModalPrice();
        });

        if (finalPayButton) {
            finalPayButton.addEventListener('click', async () => {
                const button = finalPayButton;
                const currentLang = localStorage.getItem('language') || 'en';
                const originalText = translations[currentLang]?.payment_modal_pay_button || 'Pay';
                
                button.disabled = true;
                button.textContent = translations[currentLang]?.payment_creating || 'Creating invoice...';

                const amount = document.getElementById('modal-total-price').textContent.split(' ')[0];
                const quantity = document.getElementById('lesson-quantity').value;
                const description = `${currentTariffName} x${quantity}`;
                const orderId = `clearn-${Date.now()}`;

                try {
                    const response = await fetch('/create-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            amount: parseFloat(amount),
                            currency: paymentConfig.currency,
                            description: description,
                            orderId: orderId,
                            paymentSystem: selectedPaymentSystem
                        })
                    });
                    
                    const data = await response.json();
                    if (response.ok && data.paymentUrl) {
                        window.location.href = data.paymentUrl;
                    } else {
                        alert('Error creating invoice: ' + (data.error || 'Unknown error'));
                        button.innerHTML = originalText;
                        button.disabled = false;
                    }
                } catch (error) {
                    alert('Network error. Please try again.');
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            });
        }
        
        const closePaymentModal = () => paymentModal.classList.remove('is-open');
        if (closeBtn) closeBtn.addEventListener('click', closePaymentModal);
        window.addEventListener('click', (event) => { if (event.target === paymentModal) closePaymentModal(); });
        window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && paymentModal.classList.contains('is-open')) closePaymentModal(); });
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    let savedLang = localStorage.getItem('language') || 'en';

    setTheme(savedTheme);
    setLanguage(savedLang);
});