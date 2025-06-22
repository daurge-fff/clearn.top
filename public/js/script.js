document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const body = document.body;
    const themeSwitcher = document.getElementById('theme-switcher');
    const languageSwitcher = document.querySelector('.language-switcher');
    const feedbackForm = document.getElementById('feedback-form');
    const paymentModal = document.getElementById('payment-modal');
    const donateCard = document.getElementById('donate-card');
    const courseDetailsModal = document.getElementById('course-details-modal');
    const sunIcon = 'https://emojicdn.elk.sh/☀️';
    const moonIcon = 'https://emojicdn.elk.sh/🌙';

    const paymentConfig = {
        currency: 'EUR',
        basePrices: { '25': 10, '50': 20 },
        discounts: { 1: 0, 5: 5, 10: 10, 15: 15, 20: 20 },
        availableSystems: [
            { id: 'paypal', name: 'PayPal' },
            { id: 'cryptocloud', name: 'CryptoCloud' },
            { id: 'robokassa', name: 'Robokassa' }
        ]
    };
    
    let currentBasePrice = 0;
    let currentTariffName = '';
    let selectedPaymentSystem = null;
    let isDonationMode = false;
    let paypalButtonsRendered = false;

    function setLanguage(lang) {
        if (lang === 'ua') lang = 'uk';
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
        submitButton.textContent = (translations[currentLang]?.form_sending || 'Sending...');
        try {
            const response = await fetch('/submit-form', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await response.json();
            if (response.ok) {
                formStatus.textContent = (translations[currentLang]?.form_success || "Your request has been sent!");
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
                submitButton.textContent = (translations[currentLang]?.form_button || "Send Request");
                submitButton.disabled = false;
                formStatus.textContent = '';
            }, 5000);
        }
    }

    async function openCourseDetailsModal(courseKey) {
        if (!courseDetailsModal) return;
        const lang = localStorage.getItem('language') || 'en';
        const t = translations[lang];
        if (!t) return;
        const detailsImageContainer = document.getElementById('details-modal-image');
        detailsImageContainer.innerHTML = '';
        
        courseDetailsModal.querySelector('[data-translate="modal_what_you_learn"]').textContent = t.modal_what_you_learn || "What the student will learn";
        courseDetailsModal.querySelector('[data-translate="modal_tools"]').textContent = t.modal_tools || "Tools";
        courseDetailsModal.querySelector('[data-translate="modal_program"]').textContent = t.modal_program || "Course Program";
        
        document.getElementById('details-modal-title').textContent = t[`course_${courseKey}_title`] || "Course Details";
        document.getElementById('details-modal-short-desc').textContent = t[`course_${courseKey}_desc`] || "";
        try {
            const response = await fetch(`/images/${courseKey}.svg`);
            if (response.ok) {
                detailsImageContainer.innerHTML = await response.text();
            } else {
                detailsImageContainer.innerHTML = 'Icon not found';
            }
        } catch (error) {
            console.error('Error fetching course icon SVG:', error);
            detailsImageContainer.innerHTML = 'Error loading icon';
        }
        document.getElementById('details-modal-age').textContent = t[`course_${courseKey}_age`] || "";
        document.getElementById('details-modal-duration').textContent = t[`course_${courseKey}_duration`] || "";
        document.getElementById('details-modal-format').textContent = t[`course_${courseKey}_format`] || "";
        
        const buyButton = document.getElementById('details-modal-buy-button');
        buyButton.textContent = t.modal_enroll_button || "Enroll Now";
        const defaultDuration = t[`course_${courseKey}_default_duration`];
        buyButton.onclick = () => {
            closeCourseDetailsModal();
            openPaymentModal(defaultDuration, false);
        };
        const learningList = document.getElementById('details-modal-learning');
        learningList.innerHTML = (t[`course_${courseKey}_what_you_learn`] || []).map(item => `<li>${item}</li>`).join('');
        const toolsList = document.getElementById('details-modal-tools');
        toolsList.innerHTML = (t[`course_${courseKey}_tools`] || []).map(item => `<li>${item}</li>`).join('');
        const programList = document.getElementById('details-modal-program');
        programList.innerHTML = (t[`course_${courseKey}_modules`] || []).map(module => `
            <li class="module-item">
                <div class="module-title">${module.title}</div>
                <div class="module-content"><p>${module.description}</p></div>
            </li>`).join('');
        courseDetailsModal.classList.add('is-open');
    }

    function closeCourseDetailsModal() {
        if (courseDetailsModal) courseDetailsModal.classList.remove('is-open');
    }
    
    function updatePayButtonState() {
        if (!paymentModal) return;

        const finalPayButton = document.getElementById('final-pay-button');
        const termsCheckbox = document.getElementById('terms-checkbox');
        const identifierInput = document.getElementById('payment-identifier');
        
        if (!finalPayButton || !termsCheckbox || !identifierInput) return;

        const isReadyToPay = selectedPaymentSystem && termsCheckbox.checked && identifierInput.value.trim() !== '';
        finalPayButton.disabled = !isReadyToPay;
    }

    function updatePaymentModalPrice() {
        if (!paymentModal) return;
        let quantity = 1;
        let finalTotal;
        if (isDonationMode) {
            const donationInput = document.getElementById('donation-amount');
            quantity = parseFloat(donationInput.value) || 1;
            if (quantity < 1) quantity = 1;
            donationInput.value = quantity;
            finalTotal = quantity;
        } else {
            const lessonSlider = document.getElementById('lesson-quantity');
            quantity = parseInt(lessonSlider.value, 10);
            document.getElementById('quantity-value').textContent = quantity;
            const discountBreakpoints = Object.keys(paymentConfig.discounts).map(Number).sort((a,b) => b-a);
            let applicableDiscount = 0;
            for (const bp of discountBreakpoints) { if (quantity >= bp) { applicableDiscount = paymentConfig.discounts[bp]; break; } }
            finalTotal = (currentBasePrice * quantity) * (1 - applicableDiscount / 100);
            const pricePerLesson = quantity > 0 ? (finalTotal / quantity) : 0;
            document.getElementById('modal-price-per-lesson').textContent = `${pricePerLesson.toFixed(2)} ${paymentConfig.currency}`;
            document.getElementById('modal-discount').textContent = `${applicableDiscount}%`;
        }
        document.getElementById('modal-total-price').textContent = `${finalTotal.toFixed(2)} ${paymentConfig.currency}`;
        updatePayButtonState();
    }
    
    function openPaymentModal(tariffDuration, donationMode = false) {
        if (!paymentModal) return;
        isDonationMode = donationMode;
        const lessonSelector = document.getElementById('lesson-quantity-selector');
        const donationSelector = document.getElementById('donation-amount-selector');
        const priceBreakdown = document.querySelector('.price-breakdown');

        if (isDonationMode) {
            currentBasePrice = 1;
            currentTariffName = 'Donation';
            lessonSelector.style.display = 'none';
            donationSelector.style.display = 'block';
            priceBreakdown.style.display = 'none';
        } else {
            currentBasePrice = paymentConfig.basePrices[tariffDuration];
            currentTariffName = `Lesson ${tariffDuration} min`;
            lessonSelector.style.display = 'block';
            donationSelector.style.display = 'none';
            priceBreakdown.style.display = 'block';
        }

        document.getElementById('modal-tariff-name').textContent = currentTariffName;
        document.getElementById('lesson-quantity').value = 1;
        document.getElementById('donation-amount').value = 10;
        document.getElementById('terms-checkbox').checked = false;
        document.getElementById('payment-identifier').value = '';
        const errorP = document.getElementById('identifier-error');
        if(errorP) errorP.style.display = 'none';

        selectedPaymentSystem = null;
        paypalButtonsRendered = false;
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
        if (paypalContainer) paypalContainer.innerHTML = '';
        
        const finalPayButton = document.getElementById('final-pay-button');
        if(finalPayButton) finalPayButton.style.display = 'block';
        if(paypalContainer) paypalContainer.style.display = 'none';

        const currentLang = localStorage.getItem('language') || 'en';
        setLanguage(currentLang);
        updatePaymentModalPrice();
        paymentModal.classList.add('is-open');
    }

    if (languageSwitcher) {
        const langButton = languageSwitcher.querySelector('.current-lang');
        const langDropdown = languageSwitcher.querySelector('.lang-dropdown');
        langButton.addEventListener('click', (e) => { e.stopPropagation(); languageSwitcher.classList.toggle('is-active'); });
        langDropdown.addEventListener('click', (e) => {
            const lang = e.target.closest('li')?.dataset.lang;
            if (lang) { setLanguage(lang); languageSwitcher.classList.remove('is-active'); }
        });
        window.addEventListener('click', () => { if (languageSwitcher.classList.contains('is-active')) languageSwitcher.classList.remove('is-active'); });
    }

    if (themeSwitcher) themeSwitcher.addEventListener('click', () => setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    if (feedbackForm) feedbackForm.addEventListener('submit', handleFormSubmit);
    if (donateCard) donateCard.addEventListener('click', () => openPaymentModal(null, true));

    document.querySelectorAll('.buy-button').forEach(button => {
        if (button.id !== 'donate-card' && button.id !== 'details-modal-buy-button') {
            button.addEventListener('click', () => openPaymentModal(button.dataset.duration, false));
        }
    });
    
    const coursesGrid = document.querySelector('.courses-grid');
    if (coursesGrid) {
        coursesGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.course-card');
            if (card) openCourseDetailsModal(card.dataset.courseKey);
        });
    }

    if (courseDetailsModal) {
        courseDetailsModal.querySelector('.close-button').addEventListener('click', closeCourseDetailsModal);
        courseDetailsModal.addEventListener('click', (event) => { if (event.target === courseDetailsModal) closeCourseDetailsModal(); });
        window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && courseDetailsModal.classList.contains('is-open')) closeCourseDetailsModal(); });
        
        const programContainer = document.getElementById('details-modal-program');
        if(programContainer) {
            programContainer.addEventListener('click', (e) => {
                const title = e.target.closest('.module-title');
                if (title) {
                    title.parentElement.classList.toggle('active');
                }
            });
        }
    }

    if (paymentModal) {
        const finalPayButton = document.getElementById('final-pay-button');
        const errorP = document.getElementById('identifier-error');

        document.getElementById('lesson-quantity').addEventListener('input', updatePaymentModalPrice);
        document.getElementById('donation-amount').addEventListener('input', updatePaymentModalPrice);
        document.getElementById('terms-checkbox').addEventListener('change', updatePayButtonState);
        document.getElementById('payment-identifier').addEventListener('input', updatePayButtonState);

        paymentModal.querySelector('.systems').addEventListener('click', (e) => {
            const target = e.target.closest('.payment-system-card');
            if (!target) return;
            
            paymentModal.querySelectorAll('.payment-system-card').forEach(card => card.classList.remove('active'));
            target.classList.add('active');
            selectedPaymentSystem = target.dataset.system;

            const paypalContainer = document.getElementById('paypal-button-container');
            const finalPayButton = document.getElementById('final-pay-button');
            if(finalPayButton) finalPayButton.style.display = (selectedPaymentSystem === 'paypal') ? 'none' : 'block';
            if(paypalContainer) paypalContainer.style.display = (selectedPaymentSystem === 'paypal') ? 'block' : 'none';

            if (selectedPaymentSystem === 'paypal' && !paypalButtonsRendered) {
                renderPayPalButtons();
                paypalButtonsRendered = true;
            }
            updatePayButtonState();
        });

        finalPayButton.addEventListener('click', async () => {
            const button = finalPayButton;
            const originalText = button.textContent;
            
            button.disabled = true;
            button.textContent = 'Creating invoice...';
            
            const amount = document.getElementById('modal-total-price').textContent.split(' ')[0];
            const quantity = isDonationMode ? 1 : document.getElementById('lesson-quantity').value;
            const description = isDonationMode ? "Donation" : `${currentTariffName} x${quantity}`;
            const identifier = document.getElementById('payment-identifier').value;

            try {
                const response = await fetch('/api/create-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                        currency: paymentConfig.currency,
                        description,
                        paymentSystem: selectedPaymentSystem,
                        identifier
                    })
                });
                const data = await response.json();
                if (response.ok && data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    if (errorP) {
                        errorP.textContent = 'Error: ' + (data.error || 'Failed to create payment invoice.');
                        errorP.style.display = 'block';
                    }
                    button.textContent = originalText;
                    button.disabled = false;
                }
            } catch (error) {
                if (errorP) {
                    errorP.textContent = 'Network error. Please try again.';
                    errorP.style.display = 'block';
                }
                button.textContent = originalText;
                button.disabled = false;
            }
        });

        function renderPayPalButtons() {
            const paypalContainer = document.getElementById('paypal-button-container');
            if (!paypalContainer) return;

            paypalContainer.innerHTML = '';

            const amount = document.getElementById('modal-total-price').textContent.split(' ')[0];
            const DONATION_BUTTON_ID = 'TBLSPGUQZX45J';

            const manualPaymentHTML = `
                <div class="donation-sdk-container">
                    <div id="donate-button-container-sdk">
                        <div id="donate-button"></div>
                    </div>
                    <div class="manual-payment-instructions">
                        <p>After completing the payment, please follow these steps:</p>
                        <ol>
                            <li>Copy the <strong>Transaction ID</strong> from the PayPal confirmation screen.</li>
                            <li>Paste it into the field below and confirm your payment.</li>
                        </ol>
                        <div class="form-group" style="margin-top: 20px;">
                            <input type="text" id="paypal-transaction-id" placeholder=" " required>
                            <label for="paypal-transaction-id">Paste Transaction ID here</label>
                        </div>
                        <!-- Кнопка теперь изначально выключена -->
                        <button id="confirm-manual-payment" class="form-submit-button" disabled>I Have Paid</button>
                        <p class="payment-error" id="paypal-manual-error" style="display: none;"></p>
                    </div>
                </div>
            `;
            paypalContainer.innerHTML = manualPaymentHTML;
            const confirmButton = document.getElementById('confirm-manual-payment');
            const transactionIdInput = document.getElementById('paypal-transaction-id');
            const termsCheckbox = document.getElementById('terms-checkbox');

            function updateConfirmManualButtonState() {
                if (!confirmButton || !transactionIdInput || !termsCheckbox) return;
                const isReady = transactionIdInput.value.trim() !== '' && termsCheckbox.checked;
                confirmButton.disabled = !isReady;
            }
            transactionIdInput.addEventListener('input', updateConfirmManualButtonState);
            termsCheckbox.addEventListener('change', updateConfirmManualButtonState);
            const script = document.createElement('script');
            script.src = "https://www.paypalobjects.com/donate/sdk/donate-sdk.js";
            script.charset = "UTF-8";
            script.onload = () => {
                PayPal.Donation.Button({
                    env: 'production',
                    hosted_button_id: DONATION_BUTTON_ID,
                    image: {
                        src: 'https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif',
                        alt: 'Donate with PayPal button',
                        title: 'PayPal - The safer, easier way to pay online!',
                    }
                }).render('#donate-button');
            };
            document.body.appendChild(script);

            confirmButton.addEventListener('click', async () => {
                const transactionId = transactionIdInput.value.trim();
                const errorP = document.getElementById('paypal-manual-error');
                
                if (!transactionId || !termsCheckbox.checked) {
                    errorP.textContent = 'Please paste the Transaction ID and agree to the terms.';
                    errorP.style.display = 'block';
                    return;
                }

                const identifier = document.getElementById('payment-identifier').value;
                const quantity = isDonationMode ? 0 : parseInt(document.getElementById('lesson-quantity').value, 10);
                const description = isDonationMode ? "Donation" : `${currentTariffName} x${quantity}`;

                try {
                    const response = await fetch('/api/paypal/submit-manual-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transactionId,
                            amount: parseFloat(amount),
                            currency: paymentConfig.currency,
                            lessonsPurchased: quantity,
                            description,
                            identifier
                        })
                    });

                    if (response.ok) {
                        window.location.href = '/successful-payment';
                    } else {
                        const errorData = await response.json();
                        errorP.textContent = errorData.msg || 'An error occurred.';
                        errorP.style.display = 'block';
                    }
                } catch (error) {
                    errorP.textContent = 'Network error. Please try again.';
                    errorP.style.display = 'block';
                }
            });
        }
        
        const closePaymentModal = () => paymentModal.classList.remove('is-open');
        paymentModal.querySelector('.close-button').addEventListener('click', closePaymentModal);
        window.addEventListener('click', (event) => { if (event.target === paymentModal) closePaymentModal(); });
        window.addEventListener('keydown', (event) => { if (event.key === 'Escape' && paymentModal.classList.contains('is-open')) closePaymentModal(); });
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    let savedLang = localStorage.getItem('language') || 'en';
    if (savedLang === 'ua') { savedLang = 'uk'; localStorage.setItem('language', 'uk'); }
    setTheme(savedTheme);
    setLanguage(savedLang);
});