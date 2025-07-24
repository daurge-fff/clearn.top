function copyToClipboard(text) {
    const lang = localStorage.getItem('language') || 'en';
    const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : { notification_copy_success: 'Copied to clipboard!' };
    const message = t.notification_copy_success;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy: ', err));
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        Object.assign(textArea.style, { position: 'fixed', left: '-999999px', top: '-999999px' });
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }
}

function closeCardModal() {
    const modal = document.querySelector('.card-modal');
    if (modal) {
        document.body.classList.remove('modal-open-scroll-lock');
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function scrollToContact() {
    closeCardModal();
    document.querySelector('#contact-form')?.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', () => {
    const html = document.documentElement;
    const body = document.body;
    const sunIcon = 'https://emojicdn.elk.sh/☀️';
    const moonIcon = 'https://emojicdn.elk.sh/🌙';

    const themeSwitcher = document.getElementById('theme-switcher');
    const languageSwitcher = document.querySelector('.language-switcher');
    const feedbackForm = document.getElementById('feedback-form');
    const paymentModal = document.getElementById('payment-modal');
    const courseDetailsModal = document.getElementById('course-details-modal');
    
    // Mobile menu functionality
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mobileNav.classList.toggle('active');
            body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close mobile menu when clicking on nav links
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
                body.style.overflow = '';
            });
        });
        
        // Close mobile menu when clicking outside
        mobileNav.addEventListener('click', (e) => {
            if (e.target === mobileNav) {
                mobileMenuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
                body.style.overflow = '';
            }
        });
    }

    const paymentConfig = {
        currency: 'EUR',
        basePrices: { '25': 10, '50': 20 },
        discounts: { 1: 0, 5: 5, 10: 10, 15: 15, 20: 20 },
        availableSystems: [
            { id: 'paypal', name: 'PayPal' }, { id: 'payoneer', name: 'Payoneer' },
            { id: 'cryptocloud', name: 'CryptoCloud' }, { id: 'robokassa', name: 'Robokassa' }
        ]
    };
    let currentBasePrice = 0, currentTariffName = '', selectedPaymentSystem = null, manualPaymentRendered = false, isDonationMode = false;

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        if (themeSwitcher) {
            themeSwitcher.innerHTML = `<img src="${theme === 'dark' ? sunIcon : moonIcon}" alt="theme icon">`;
        }
        localStorage.setItem('theme', theme);
    }

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
            if (courseKey && langData[`course_${courseKey}_title`]) {
                card.querySelector('h3').innerHTML = langData[`course_${courseKey}_title`];
                card.querySelector('.course-age').innerHTML = langData[`course_${courseKey}_age`];
                card.querySelector('p').innerHTML = langData[`course_${courseKey}_desc`];
            }
        });
        
        if (languageSwitcher) {
            const currentLangSpan = languageSwitcher.querySelector('.current-lang span');
            const currentLangImg = languageSwitcher.querySelector('.current-lang img');
            const selectedLangLi = languageSwitcher.querySelector(`.lang-dropdown [data-lang="${lang}"]`);
            if (selectedLangLi && currentLangSpan && currentLangImg) {
                currentLangSpan.textContent = selectedLangLi.textContent.trim();
                currentLangImg.src = selectedLangLi.querySelector('img').src;
                currentLangImg.alt = selectedLangLi.querySelector('img').alt;
            }
        }
        localStorage.setItem('language', lang);
    }

    if (themeSwitcher) {
        themeSwitcher.addEventListener('click', () => {
            const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }

    if (languageSwitcher) {
        const langButton = languageSwitcher.querySelector('.current-lang');
        langButton.addEventListener('click', (e) => { 
            e.stopPropagation();
            languageSwitcher.classList.toggle('is-active');
        });
        languageSwitcher.querySelector('.lang-dropdown').addEventListener('click', (e) => {
            const lang = e.target.closest('li')?.dataset.lang;
            if (lang) {
                setLanguage(lang);
                languageSwitcher.classList.remove('is-active');
            }
        });
        window.addEventListener('click', () => languageSwitcher.classList.remove('is-active'));
    }
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    let savedLang = localStorage.getItem('language') || navigator.language.split('-')[0];
    if (savedLang === 'ua') { savedLang = 'uk'; }
    setTheme(savedTheme);
    setLanguage(savedLang);

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.length > 1) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    document.querySelectorAll('.floating-input input, .floating-input textarea').forEach(input => {
        if (input.value) input.classList.add('has-value');
        input.addEventListener('input', function() { this.classList.toggle('has-value', !!this.value); });
        input.addEventListener('focus', function() { this.parentElement.classList.add('focused'); });
        input.addEventListener('blur', function() { this.parentElement.classList.remove('focused'); });
    });


    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    function initWhyUsCards() {
        document.querySelectorAll('.why-us-card').forEach(card => {
            card.addEventListener('click', function() {
                const modalIndex = parseInt(this.dataset.modalIndex, 10);
                showCardModal(modalIndex);
            });
        });
        document.querySelector('.profile-badge')?.addEventListener('click', showExpertTeacherModal);
    }
    
    function showCardModal(cardIndex) {
        const lang = localStorage.getItem('language') || 'en';
        const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
        const cardData = [
            { title: t.why_us_modal_1_title, description: t.why_us_modal_1_desc, benefits: t.why_us_modal_1_benefits || [] },
            { title: t.why_us_modal_2_title, description: t.why_us_modal_2_desc, benefits: t.why_us_modal_2_benefits || [] },
            { title: t.why_us_modal_3_title, description: t.why_us_modal_3_desc, benefits: t.why_us_modal_3_benefits || [] }
        ];
        const card = cardData[cardIndex];
        if (!card) return;
        const modal = document.createElement('div');
        modal.className = 'card-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header"><h3>${card.title || ''}</h3><button class="modal-close"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div>
                <div class="modal-body"><p>${card.description || ''}</p><h4>${t.modal_what_you_learn || 'Advantages'}:</h4><ul>${(card.benefits).map(b => `<li>${b}</li>`).join('')}</ul></div>
                <div class="modal-footer"><button class="modern-cta-btn" onclick="scrollToContact()">${t.modal_enroll_button || 'Learn More'}</button></div>
            </div>`;
        document.body.appendChild(modal);
        body.classList.add('modal-open-scroll-lock');
        setTimeout(() => modal.classList.add('show'), 10);
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('.modal-close')) closeCardModal();
        });
    }

    function showExpertTeacherModal() {
        const lang = localStorage.getItem('language') || 'en';
        const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
        const modal = document.createElement('div');
        modal.className = 'expert-modal';
        modal.innerHTML = `
            <div class="expert-modal-content">
                <div class="expert-modal-header"><div class="expert-avatar"><img src="/images/german_photo.jpg" alt="German Vitiaz"></div><h3>${t.expert_modal_title || ''}</h3><button class="expert-modal-close">×</button></div>
                <div class="expert-modal-body">
                    <div class="expert-message">
                        <p>${t.expert_modal_greeting || ''}</p><p>${t.expert_modal_message || ''}</p><p>${t.expert_modal_approach || ''}</p>
                        <div class="expert-achievements">
                            <div class="achievement"><span>🏆</span><span>${t.expert_achievement_1 || ''}</span></div>
                            <div class="achievement"><span>💻</span><span>${t.expert_achievement_2 || ''}</span></div>
                            <div class="achievement"><span>⭐</span><span>${t.expert_achievement_3 || ''}</span></div>
                        </div>
                        <p>${t.expert_modal_cta || ''}</p>
                    </div>
                    <div class="expert-modal-actions">
                        <a href="https://t.me/daurge" target="_blank" class="expert-action-btn primary"><span>${t.expert_contact_telegram || ''}</span></a>
                        <a href="mailto:admin@clearn.top" class="expert-action-btn secondary"><span>${t.expert_contact_email || ''}</span></a>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        body.classList.add('modal-open-scroll-lock');
        const closeAction = () => {
            body.classList.remove('modal-open-scroll-lock');
            modal.remove();
        };
        modal.querySelector('.expert-modal-close').addEventListener('click', closeAction);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeAction(); });
        setTimeout(() => modal.classList.add('show'), 10);
    }
    
    initWhyUsCards();

    async function openCourseDetailsModal(courseKey) {
        if (!courseDetailsModal) return;
        const lang = localStorage.getItem('language') || 'en';
        const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
        document.getElementById('details-modal-title').textContent = t[`course_${courseKey}_title`] || "";
        document.getElementById('details-modal-short-desc').textContent = t[`course_${courseKey}_desc`] || "";
        const detailsImageContainer = document.getElementById('details-modal-image');
        detailsImageContainer.innerHTML = '';
        try {
            const response = await fetch(`/images/${courseKey}.svg`);
            if (response.ok) detailsImageContainer.innerHTML = await response.text();
        } catch (error) { console.error('Error fetching SVG:', error); }
        document.getElementById('details-modal-age').textContent = t[`course_${courseKey}_age`] || "";
        document.getElementById('details-modal-duration').textContent = t[`course_${courseKey}_duration`] || "";
        document.getElementById('details-modal-format').textContent = t[`course_${courseKey}_format`] || "";
        const buyButton = document.getElementById('details-modal-buy-button');
        const defaultDuration = t[`course_${courseKey}_default_duration`];
        buyButton.onclick = () => {
            closeCourseDetailsModal();
            openPaymentModal(defaultDuration, false);
        };
        document.getElementById('details-modal-learning').innerHTML = (t[`course_${courseKey}_what_you_learn`] || []).map(item => `<li>${item}</li>`).join('');
        document.getElementById('details-modal-tools').innerHTML = (t[`course_${courseKey}_tools`] || []).map(item => `<li>${item}</li>`).join('');
        document.getElementById('details-modal-program').innerHTML = (t[`course_${courseKey}_modules`] || []).map(module => `<li class="module-item"><div class="module-title">${module.title}</div><div class="module-content"><p>${module.description}</p></div></li>`).join('');
        courseDetailsModal.classList.add('is-open');
        body.classList.add('modal-open-scroll-lock');
    }

    function closeCourseDetailsModal() {
        if (courseDetailsModal) {
            courseDetailsModal.classList.remove('is-open');
            body.classList.remove('modal-open-scroll-lock');
        }
    }

    if (courseDetailsModal) {
        document.querySelector('.courses-grid')?.addEventListener('click', (e) => {
            const card = e.target.closest('.course-card');
            if (card) openCourseDetailsModal(card.dataset.courseKey);
        });
        courseDetailsModal.querySelector('.close-button').addEventListener('click', closeCourseDetailsModal);
        courseDetailsModal.addEventListener('click', (e) => { if (e.target === courseDetailsModal) closeCourseDetailsModal(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && courseDetailsModal.classList.contains('is-open')) closeCourseDetailsModal(); });
        document.getElementById('details-modal-program')?.addEventListener('click', (e) => {
            const title = e.target.closest('.module-title');
            if (title) title.parentElement.classList.toggle('active');
        });
    }

    function updatePayButtonState() {
        const finalPayButton = document.getElementById('final-pay-button');
        const confirmManualButton = document.getElementById('confirm-manual-payment');
        const termsCheckbox = document.getElementById('terms-checkbox');
        const identifierInput = document.getElementById('payment-identifier');
        const transactionIdInput = document.getElementById('paypal-transaction-id');
        
        const hasIdentifier = identifierInput && identifierInput.value.trim() !== '';
        const hasTerms = termsCheckbox && termsCheckbox.checked;

        if (finalPayButton) {
            finalPayButton.disabled = !(selectedPaymentSystem && hasIdentifier && hasTerms);
        }
        if (confirmManualButton) {
            const hasTransactionId = transactionIdInput && transactionIdInput.value.trim() !== '';
            confirmManualButton.disabled = !(hasTransactionId && hasIdentifier && hasTerms);
        }
        
        paymentModal?.querySelectorAll('.payment-system-card').forEach(card => card.classList.toggle('disabled', !hasIdentifier));
    }

    function updatePaymentModalPrice() {
        let quantity, finalTotal;
        if (isDonationMode) {
            const donationInput = document.getElementById('donation-amount');
            quantity = Math.max(1, parseFloat(donationInput.value) || 1);
            donationInput.value = quantity;
            finalTotal = quantity;
        } else {
            const lessonSlider = document.getElementById('lesson-quantity');
            quantity = parseInt(lessonSlider.value, 10);
            document.getElementById('quantity-value').textContent = quantity;
            const discount = paymentConfig.discounts[Object.keys(paymentConfig.discounts).sort((a,b)=>b-a).find(bp => quantity >= bp)] || 0;
            finalTotal = (currentBasePrice * quantity) * (1 - discount / 100);
            document.getElementById('modal-price-per-lesson').textContent = `${(finalTotal / quantity || 0).toFixed(2)} ${paymentConfig.currency}`;
            document.getElementById('modal-discount').textContent = `${discount}%`;
        }
        document.getElementById('modal-total-price').textContent = `${finalTotal.toFixed(2)} ${paymentConfig.currency}`;
        updatePayButtonState();
    }
    
    function openPaymentModal(tariffDuration, donationMode) {
        if (!paymentModal) return;
        isDonationMode = donationMode;
        
        document.getElementById('lesson-quantity-selector').style.display = donationMode ? 'none' : 'block';
        document.getElementById('donation-amount-selector').style.display = donationMode ? 'block' : 'none';
        document.querySelector('.price-breakdown').style.display = donationMode ? 'none' : 'block';

        currentBasePrice = donationMode ? 1 : paymentConfig.basePrices[tariffDuration];
        currentTariffName = donationMode ? 'Donation' : `Lesson ${tariffDuration} min`;

        document.getElementById('modal-tariff-name').textContent = currentTariffName;
        document.getElementById('lesson-quantity').value = 1;
        document.getElementById('donation-amount').value = 10;
        document.getElementById('terms-checkbox').checked = false;
        document.getElementById('payment-identifier').value = '';
        document.getElementById('identifier-error').style.display = 'none';
        
        selectedPaymentSystem = null;
        manualPaymentRendered = false;
        paymentModal.querySelector('.systems').innerHTML = paymentConfig.availableSystems.map(sys => `<div class="payment-system-card disabled" data-system="${sys.id}">${sys.name}</div>`).join('');
        document.getElementById('paypal-button-container').innerHTML = '';
        document.getElementById('final-pay-button').style.display = 'flex';
        
        updatePaymentModalPrice();
        paymentModal.classList.add('is-open');
        body.classList.add('modal-open-scroll-lock');
    }
    
    function renderManualPaymentFlow(system) {
        const lang = localStorage.getItem('language') || 'en';
        const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : {};
        const manualPaymentContainer = document.getElementById('paypal-button-container');
        if (!manualPaymentContainer) return;
    
        const amount = document.getElementById('modal-total-price').textContent.split(' ')[0];
        const systemName = system.charAt(0).toUpperCase() + system.slice(1);
    
        manualPaymentContainer.innerHTML = `
            <div class="manual-payment-container">
                <h4 class="manual-payment-title">${t.manual_payment_title || 'Manual Payment via'} ${systemName}</h4>
                <div class="manual-payment-instructions">
                    <ol>
                        <li>${t.manual_payment_instruction_1 || 'Please send'} <strong>${amount} ${paymentConfig.currency}</strong> ${t.manual_payment_instruction_2 || 'to our account:'} <strong><span class="copyable-email" onclick="copyToClipboard('admin@clearn.top')">admin@clearn.top</span></strong>. ${t.manual_payment_instruction_3 || 'After paying, copy the Transaction ID'}.</li>
                        <li>${t.manual_payment_instruction_4 || 'Paste it below and confirm.'}</li>
                        <li>${t.manual_payment_instruction_5 || 'Our manager will verify and credit the lessons.'}</li>
                    </ol>
                    <div class="form-group" style="margin-top: 20px;">
                        <input type="text" id="paypal-transaction-id" placeholder=" " required>
                        <label for="paypal-transaction-id">${t.manual_payment_placeholder || 'Paste Transaction ID here'}</label>
                    </div>
                    <button id="confirm-manual-payment" class="modern-submit-btn" disabled>${t.manual_payment_button || 'I Have Paid'}</button>
                    <p class="payment-error" id="paypal-manual-error" style="display: none;"></p>
                </div>
            </div>`;
        
        const confirmButton = document.getElementById('confirm-manual-payment');
        const transactionIdInput = document.getElementById('paypal-transaction-id');
        
        [transactionIdInput, document.getElementById('terms-checkbox'), document.getElementById('payment-identifier')].forEach(el => {
            el.addEventListener('input', updatePayButtonState);
            el.addEventListener('change', updatePayButtonState);
        });

        updatePayButtonState();

        confirmButton.addEventListener('click', async () => {
            const transactionId = transactionIdInput.value.trim();
            const identifier = document.getElementById('payment-identifier').value.trim();
            const errorP = document.getElementById('paypal-manual-error');
            
            if (!transactionId || !identifier || !document.getElementById('terms-checkbox').checked) {
                errorP.textContent = t.manual_payment_error_fields || 'Please fill all fields and agree to the terms.';
                errorP.style.display = 'block';
                return;
            }

            const quantity = isDonationMode ? 0 : parseInt(document.getElementById('lesson-quantity').value, 10);
            const description = isDonationMode ? "Donation" : `${currentTariffName} x${quantity}`;

            try {
                const response = await fetch('/api/manual-payment/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transactionId, paymentSystem: system, amount: parseFloat(amount),
                        currency: paymentConfig.currency, lessonsPurchased: quantity, description, identifier
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

    if (paymentModal) {
        document.getElementById('donate-card')?.addEventListener('click', () => openPaymentModal(null, true));
        document.querySelectorAll('.buy-button:not(#details-modal-buy-button)').forEach(button => {
            button.addEventListener('click', () => openPaymentModal(button.dataset.duration, false));
        });

        ['input', 'change'].forEach(evt => {
            document.getElementById('lesson-quantity').addEventListener(evt, updatePaymentModalPrice);
            document.getElementById('donation-amount').addEventListener(evt, updatePaymentModalPrice);
            document.getElementById('terms-checkbox').addEventListener(evt, updatePayButtonState);
            document.getElementById('payment-identifier').addEventListener(evt, updatePayButtonState);
        });
        
        const closePaymentModal = () => {
            paymentModal.classList.remove('is-open');
            body.classList.remove('modal-open-scroll-lock');
        };

        paymentModal.querySelector('.systems').addEventListener('click', (e) => {
            const target = e.target.closest('.payment-system-card');
            if (!target || target.classList.contains('disabled')) return;
            paymentModal.querySelectorAll('.payment-system-card.active').forEach(c => c.classList.remove('active'));
            target.classList.add('active');
            selectedPaymentSystem = target.dataset.system;
            const isManual = ['paypal', 'payoneer'].includes(selectedPaymentSystem);
            document.getElementById('final-pay-button').style.display = isManual ? 'none' : 'flex';
            document.getElementById('paypal-button-container').style.display = isManual ? 'block' : 'none';
            if (isManual && !manualPaymentRendered) {
                renderManualPaymentFlow(selectedPaymentSystem);
                manualPaymentRendered = true;
            } else if (!isManual) {
                document.getElementById('paypal-button-container').innerHTML = '';
                manualPaymentRendered = false;
            }
            updatePayButtonState();
        });
        
        document.getElementById('final-pay-button').addEventListener('click', async () => {
            const button = document.getElementById('final-pay-button');
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Creating invoice...';
            const amount = document.getElementById('modal-total-price').textContent.split(' ')[0];
            const quantity = isDonationMode ? 1 : document.getElementById('lesson-quantity').value;
            const description = isDonationMode ? "Donation" : `${currentTariffName} x${quantity}`;
            const identifier = document.getElementById('payment-identifier').value;
            const errorP = document.getElementById('identifier-error');
            try {
                const response = await fetch('/api/payments/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: parseFloat(amount), currency: paymentConfig.currency, description, paymentSystem: selectedPaymentSystem, identifier })
                });
                const data = await response.json();
                if (response.ok && data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    errorP.textContent = 'Error: ' + (data.error || 'Failed to create payment invoice.');
                    errorP.style.display = 'block';
                    button.textContent = originalText;
                    button.disabled = false;
                }
            } catch (error) {
                errorP.textContent = 'Network error. Please try again.';
                errorP.style.display = 'block';
                button.textContent = originalText;
                button.disabled = false;
            }
        });

        paymentModal.querySelector('.close-button').addEventListener('click', closePaymentModal);
        paymentModal.addEventListener('click', (e) => { if (e.target === paymentModal) closePaymentModal(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && paymentModal.classList.contains('is-open')) closePaymentModal(); });
    }

    const gallery = document.getElementById('new-photo-gallery');
    if (gallery) {
        const mainImage = document.getElementById('gallery-main-image');
        const thumbnails = Array.from(gallery.querySelectorAll('.thumbnail-item'));
        const prevBtn = gallery.querySelector('.gallery-nav-btn.prev');
        const nextBtn = gallery.querySelector('.gallery-nav-btn.next');

        const lightbox = document.getElementById('gallery-lightbox');
        const lightboxImage = document.getElementById('lightbox-image');
        const lightboxCloseBtn = lightbox.querySelector('.lightbox-close');
        const lightboxPrevBtn = lightbox.querySelector('.lightbox-prev');
        const lightboxNextBtn = lightbox.querySelector('.lightbox-next');
        
        let currentIndex = 0;

        function updateMainImage(index) {
            if (index < 0 || index >= thumbnails.length) return;
            mainImage.classList.add('fade-out');
            setTimeout(() => {
                mainImage.src = thumbnails[index].href;
                mainImage.alt = thumbnails[index].querySelector('img').alt;
                thumbnails.forEach((thumb, i) => thumb.classList.toggle('active', i === index));
                mainImage.onload = () => mainImage.classList.remove('fade-out');
            }, 200);
            currentIndex = index;
        }

        function openLightbox(index) {
            currentIndex = index;
            lightboxImage.src = thumbnails[currentIndex].href;
            lightbox.classList.add('is-open');
            body.classList.add('modal-open-scroll-lock');
        }

        function closeLightbox() {
            lightbox.classList.remove('is-open');
            body.classList.remove('modal-open-scroll-lock');
        }

        function showNextImage() {
            const newIndex = (currentIndex + 1) % thumbnails.length;
            updateMainImage(newIndex);
            if (lightbox.classList.contains('is-open')) {
                lightboxImage.src = thumbnails[newIndex].href;
            }
        }
        
        function showPrevImage() {
            const newIndex = (currentIndex - 1 + thumbnails.length) % thumbnails.length;
            updateMainImage(newIndex);
            if (lightbox.classList.contains('is-open')) {
                lightboxImage.src = thumbnails[newIndex].href;
            }
        }

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', (e) => {
                e.preventDefault();
                updateMainImage(index);
            });
        });

        prevBtn.addEventListener('click', showPrevImage);
        nextBtn.addEventListener('click', showNextImage);
        
        mainImage.addEventListener('click', () => {
            openLightbox(currentIndex);
        });

        lightboxCloseBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        lightboxPrevBtn.addEventListener('click', showPrevImage);
        lightboxNextBtn.addEventListener('click', showNextImage);

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        });

        updateMainImage(0);

    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
        

        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (!name || !email || !message) {
                return;
            }
            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message, timezone })
                });
                const data = await response.json();
                if (response.ok) {
                    feedbackForm.reset();
                }
            } catch (error) {
            }
        });
    }
    }
});


