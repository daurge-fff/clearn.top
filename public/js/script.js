function copyToClipboard(text, message = 'Copied to clipboard!') {
    // Remove trailing dot if present
    const cleanText = text.replace(/\.$/, '');
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(cleanText).then(() => {
            showNotification(message, 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showNotification('Failed to copy', 'error');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = cleanText;
        Object.assign(textArea.style, { position: 'fixed', left: '-999999px', top: '-999999px' });
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification(message, 'success');
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
            showNotification('Failed to copy', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
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
            { 
                id: 'betatransfer', 
                name: 'Betatransfer', 
                regions: ['🌟 Global'],
                preferred: 'europe',
                description: 'Open banking, P2P, Crypto'
            },
            { 
                id: 'paypal', 
                name: 'PayPal', 
                regions: ['🌍 Global'], 
                description: 'Global payments'
            },
            { 
                id: 'payoneer', 
                name: 'Payoneer', 
                regions: ['🇮🇱 Israel'], 
                description: 'International transfers'
            },
            { 
                id: 'monobank', 
                name: 'Monobank', 
                regions: ['🇺🇦 Ukraine'], 
                description: 'Ukrainian banking'
            },
            { 
                id: 'cryptocloud', 
                name: 'CryptoCloud', 
                regions: ['🪙 Crypto'], 
                description: 'Cryptocurrency payments'
            },
            { 
                id: 'robokassa', 
                name: 'Robokassa', 
                regions: ['💳 CIS'], 
                description: 'CIS countries'
            }
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

    function updatePayButtonText() {
        const finalPayButton = document.getElementById('final-pay-button');
        if (!finalPayButton) return;
        
        let buttonText = 'Pay'; // Default text
        
        // Get current language from localStorage
        const currentLanguage = localStorage.getItem('language') || 'en';
        if (typeof translations !== 'undefined' && currentLanguage && translations[currentLanguage]) {
            if (selectedPaymentSystem === 'robokassa') {
                buttonText = translations[currentLanguage].payment_modal_pay_button || 'Pay';
            } else {
                buttonText = translations[currentLanguage].payment_modal_pay_button || 'Pay';
            }
        }
        
        finalPayButton.textContent = buttonText;
    }

    function updatePayButtonState() {
        const finalPayButton = document.getElementById('final-pay-button');
        const confirmManualButton = document.getElementById('confirm-manual-payment');
        const termsCheckbox = document.getElementById('terms-checkbox');
        const identifierInput = document.getElementById('payment-identifier');
        const transactionIdInput = document.getElementById('paypal-transaction-id');
        const paymentSystemsContainer = document.querySelector('.payment-system-chooser .systems');
        
        const hasIdentifier = identifierInput && identifierInput.value.trim() !== '';
        const hasTerms = termsCheckbox && termsCheckbox.checked;
        const canShowPaymentSystems = hasIdentifier && hasTerms;

        // Show/hide payment systems based on form completion
        const paymentSystemChooser = document.querySelector('.payment-system-chooser');
        if (paymentSystemChooser) {
            paymentSystemChooser.style.display = canShowPaymentSystems ? 'block' : 'none';
        }

        if (finalPayButton) {
            finalPayButton.disabled = !(selectedPaymentSystem && hasIdentifier && hasTerms);
        }
        if (confirmManualButton) {
            const hasTransactionId = transactionIdInput && transactionIdInput.value.trim() !== '';
            confirmManualButton.disabled = !(hasTransactionId && hasIdentifier && hasTerms);
        }
        
        // Update button text
        updatePayButtonText();
    }

    function updatePaymentModalPrice() {
        let quantity, finalTotal;
        if (isDonationMode) {
            const donationInput = document.getElementById('donation-amount');
            if (donationInput) {
                quantity = Math.max(1, parseFloat(donationInput.value) || 1);
                donationInput.value = quantity;
                finalTotal = quantity;
            } else {
                quantity = 1;
                finalTotal = 1;
            }
        } else {
            const lessonSlider = document.getElementById('lesson-quantity');
            if (lessonSlider) {
                quantity = parseInt(lessonSlider.value, 10);
                const quantityValue = document.getElementById('quantity-value');
                if (quantityValue) quantityValue.textContent = quantity;
                
                const discount = paymentConfig.discounts[Object.keys(paymentConfig.discounts).sort((a,b)=>b-a).find(bp => quantity >= bp)] || 0;
                finalTotal = (currentBasePrice * quantity) * (1 - discount / 100);
                
                const modalPricePerLesson = document.getElementById('modal-price-per-lesson');
                const modalDiscount = document.getElementById('modal-discount');
                
                if (modalPricePerLesson) modalPricePerLesson.textContent = `${(finalTotal / quantity || 0).toFixed(2)} ${paymentConfig.currency}`;
                if (modalDiscount) modalDiscount.textContent = `${discount}%`;
            } else {
                quantity = 1;
                finalTotal = currentBasePrice || 0;
            }
        }
        
        const modalTotalPrice = document.getElementById('modal-total-price');
        if (modalTotalPrice) modalTotalPrice.textContent = `${finalTotal.toFixed(2)} ${paymentConfig.currency}`;
        
        updatePayButtonState();
    }
    
    function openPaymentModal(tariffDuration, donationMode) {
        if (!paymentModal) return;
        isDonationMode = donationMode;
        
        const lessonQuantitySelector = document.getElementById('lesson-quantity-selector');
        const donationAmountSelector = document.getElementById('donation-amount-selector');
        const priceBreakdown = document.querySelector('.price-breakdown');
        
        if (lessonQuantitySelector) lessonQuantitySelector.style.display = donationMode ? 'none' : 'block';
        if (donationAmountSelector) donationAmountSelector.style.display = donationMode ? 'block' : 'none';
        if (priceBreakdown) priceBreakdown.style.display = donationMode ? 'none' : 'block';

        currentBasePrice = donationMode ? 10 : paymentConfig.basePrices[tariffDuration];
        currentTariffName = donationMode ? 'Donation' : `Lesson ${tariffDuration} min`;

        const modalTariffName = document.getElementById('modal-tariff-name');
        const lessonQuantity = document.getElementById('lesson-quantity');
        const donationAmount = document.getElementById('donation-amount');
        const termsCheckbox = document.getElementById('terms-checkbox');
        const paymentIdentifier = document.getElementById('payment-identifier');
        const identifierError = document.getElementById('identifier-error');
        
        if (modalTariffName) modalTariffName.textContent = currentTariffName;
        if (lessonQuantity) lessonQuantity.value = 1;
        if (donationAmount) donationAmount.value = 10;
        if (termsCheckbox) termsCheckbox.checked = false;
        if (paymentIdentifier) paymentIdentifier.value = '';
        if (identifierError) identifierError.style.display = 'none';
        
        selectedPaymentSystem = null;
        manualPaymentRendered = false;
        
        const systemsContainer = paymentModal.querySelector('.systems');
        if (systemsContainer) {
            systemsContainer.innerHTML = paymentConfig.availableSystems.map(sys => {
                const logoPath = `/images/payment-logos/${sys.id}.svg`;
                const isPreferred = sys.preferred === 'europe';
                // Создаем сокращенные описания регионов с эмодзи
                const regionIcons = {
                    'EU': '🇪🇺 EU',
                    'India': '🇮🇳 India',
                    'Japan': '🇯🇵 Japan',
                    'South Korea': '🇰🇷 Korea',
                    'Brazil': '🇧🇷 Brazil',
                    'Mexico': '🇲🇽 Mexico',
                    'Argentina': '🇦🇷 Argentina',
                    'CIS': '🌐 CIS',
                    'Ukraine': '🇺🇦 Ukraine',
                    'Kyrgyzstan': '🇰🇬 Kyrgyzstan',
                    'Kazakhstan': '🇰🇿 Kazakhstan',
                    'Azerbaijan': '🇦🇿 Azerbaijan',
                    'Tajikistan': '🇹🇯 Tajikistan',
                    'Uzbekistan': '🇺🇿 Uzbekistan',
                    'Crypto': '₿ Crypto'
                };
                
                const regionsText = sys.regions ? sys.regions.map(region => regionIcons[region] || region).slice(0, 3).join(', ') + (sys.regions.length > 3 ? '...' : '') : '';
                const lang = localStorage.getItem('language') || 'en';
                const t = (typeof translations !== 'undefined' && translations[lang]) ? translations[lang] : translations['en'] || {};
                const preferredBadge = isPreferred ? `<div class="preferred-badge">${t.payment_recommended_europe || '🌟 Recommended for Europe'}</div>` : '';
                
                return `<div class="payment-system-card ${isPreferred ? 'preferred' : ''}" data-system="${sys.id}">
                    ${preferredBadge}
                    <img src="${logoPath}" alt="${sys.name}" class="logo" onerror="this.style.display='none'">
                    <div class="payment-info">
                        <span class="name">${sys.name}</span>
                        ${regionsText ? `<div class="regions">${regionsText}</div>` : ''}
                    </div>
                </div>`;
            }).join('');
        }
        
        const paypalButtonContainer = document.getElementById('paypal-button-container');
        const finalPayButton = document.getElementById('final-pay-button');
        const paymentSystemsContainer = document.querySelector('.payment-system-chooser .systems');
        
        if (paypalButtonContainer) paypalButtonContainer.innerHTML = '';
        if (finalPayButton) finalPayButton.style.display = 'flex';
        
        // Show payment systems chooser
        const paymentSystemChooser = document.querySelector('.payment-system-chooser');
        if (paymentSystemChooser) paymentSystemChooser.classList.add('show');
        
        updatePaymentModalPrice();
        updatePayButtonText();
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
        
        let instructionsHTML = '';
        
        if (system === 'monobank') {
            instructionsHTML = `
                <div class="manual-payment-instructions">
                    <p>Transfer <strong>${amount} ${paymentConfig.currency}</strong> to card <span class="copyable-item inline" onclick="copyToClipboard('4441 1111 2641 9468', 'Card number copied!')"><span class="copyable-text">4441 1111 2641 9468</span><i class="copy-icon">📋</i></span> or use <a href="https://send.monobank.ua/jar/5LRNnQJPXQ" target="_blank" style="color: var(--accent-color-1); text-decoration: underline;">this link</a> and confirm payment with Transaction ID below.</p>
                </div>`;
        } else {
            instructionsHTML = `
                <div class="manual-payment-instructions">
                    <p>Send <strong>${amount} ${paymentConfig.currency}</strong> to <span class="copyable-item inline" onclick="copyToClipboard('admin@clearn.top', 'Email copied!')"><span class="copyable-text">admin@clearn.top</span><i class="copy-icon">📋</i></span> and confirm payment with Transaction ID below.</p>
                </div>`;
        }
    
        manualPaymentContainer.innerHTML = `
            <div class="manual-payment-container">
                <h4 class="manual-payment-title">Manual Payment via ${systemName}</h4>
                ${instructionsHTML}
                <div class="transaction-id-group">
                    <input type="text" id="paypal-transaction-id" class="transaction-input" placeholder="Paste Transaction ID here" required>
                </div>
                <button id="confirm-manual-payment" class="modern-submit-btn" disabled>I Have Paid</button>
                <p class="payment-error" id="paypal-manual-error" style="display: none;"></p>
            </div>`;
        
        const confirmButton = document.getElementById('confirm-manual-payment');
        const transactionIdInput = document.getElementById('paypal-transaction-id');
        
        // Add event listeners for the transaction ID input
        if (transactionIdInput) {
            transactionIdInput.addEventListener('input', updatePayButtonState);
            transactionIdInput.addEventListener('change', updatePayButtonState);
        }
        
        // Re-add event listeners for existing elements to ensure they work with the new manual payment form
        const termsCheckbox = document.getElementById('terms-checkbox');
        const identifierInput = document.getElementById('payment-identifier');
        
        if (termsCheckbox) {
            // Remove existing listeners to avoid duplicates
            termsCheckbox.removeEventListener('input', updatePayButtonState);
            termsCheckbox.removeEventListener('change', updatePayButtonState);
            // Add fresh listeners
            termsCheckbox.addEventListener('input', updatePayButtonState);
            termsCheckbox.addEventListener('change', updatePayButtonState);
        }
        
        if (identifierInput) {
            // Remove existing listeners to avoid duplicates
            identifierInput.removeEventListener('input', updatePayButtonState);
            identifierInput.removeEventListener('change', updatePayButtonState);
            // Add fresh listeners
            identifierInput.addEventListener('input', updatePayButtonState);
            identifierInput.addEventListener('change', updatePayButtonState);
        }

        updatePayButtonState();

        let manualSubmitting = false;
        confirmButton.addEventListener('click', async () => {
            if (manualSubmitting) return;
            manualSubmitting = true;
            confirmButton.disabled = true;
            const transactionId = transactionIdInput.value.trim();
            const identifier = document.getElementById('payment-identifier').value.trim();
            const errorP = document.getElementById('paypal-manual-error');
            
            if (!transactionId || !identifier || !document.getElementById('terms-checkbox').checked) {
                showNotification('Please fill all fields and agree to the terms', 'error');
                return;
            }

            const quantity = isDonationMode ? 0 : parseInt(document.getElementById('lesson-quantity').value, 10);
            const description = isDonationMode ? "Donation" : `${currentTariffName} x${quantity}`;

            try {
                // First create a payment, then confirm it
                const createResponse = await fetch('/api/payments/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                        currency: paymentConfig.currency,
                        description,
                        paymentSystem: system,
                        identifier
                    })
                });
                
                if (!createResponse.ok) {
                    const createError = await createResponse.json();
                    throw new Error(createError.error || 'Failed to create payment');
                }
                
                const createResult = await createResponse.json();
                
                // Now confirm the payment
                const response = await fetch('/api/payments/manual-confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        transactionId, 
                        paymentSystem: system, 
                        amount: parseFloat(amount),
                        currency: paymentConfig.currency, 
                        orderId: createResult.orderId, 
                        identifier
                    })
                });
                if (response.ok) {
                    const result = await response.json();
                    showNotification(result.message || 'Payment confirmation submitted successfully!', 'success');
                    setTimeout(() => {
                        const currentLang = getCurrentLanguage();
                        window.location.href = `/successful-payment?lang=${currentLang}&amount=${amount}&currency=${paymentConfig.currency}&orderId=${createResult.orderId}`;
                    }, 2000);
                } else {
                    const errorData = await response.json();
                    showNotification(errorData.error || 'An error occurred', 'error');
                }
            } catch (error) {
                showNotification('Network error. Please try again', 'error');
            }
            manualSubmitting = false;
            confirmButton.disabled = false;
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
            document.getElementById('terms-checkbox').addEventListener(evt, (e) => {
                updatePayButtonState();
                // Hide manual payment container when checkbox is unchecked
                if (!e.target.checked) {
                    const manualPaymentContainer = document.querySelector('.manual-payment-container');
                    if (manualPaymentContainer) {
                        manualPaymentContainer.style.display = 'none';
                    }
                }
            });
            document.getElementById('payment-identifier').addEventListener(evt, updatePayButtonState);
        });
        
        const closePaymentModal = () => {
            paymentModal.classList.remove('is-open');
            body.classList.remove('modal-open-scroll-lock');
        };

        paymentModal.querySelector('.systems')?.addEventListener('click', (e) => {
            const target = e.target.closest('.payment-system-card');
            if (!target) return;
            
            paymentModal.querySelectorAll('.payment-system-card.active').forEach(c => c.classList.remove('active'));
            target.classList.add('active');
            selectedPaymentSystem = target.dataset.system;
            const isManual = ['paypal', 'payoneer', 'monobank'].includes(selectedPaymentSystem);
            document.getElementById('final-pay-button').style.display = isManual ? 'none' : 'flex';
            document.getElementById('paypal-button-container').style.display = isManual ? 'block' : 'none';
            
            if (isManual) {
                // Always render manual payment flow for manual systems to ensure info is displayed
                renderManualPaymentFlow(selectedPaymentSystem);
                manualPaymentRendered = true;
            } else {
                // Clear container and reset flag for non-manual systems
                document.getElementById('paypal-button-container').innerHTML = '';
                manualPaymentRendered = false;
            }
            
            updatePayButtonState();
            updatePayButtonText();
        });
        
        document.getElementById('final-pay-button').addEventListener('click', async () => {
            const button = document.getElementById('final-pay-button');
            const identifier = document.getElementById('payment-identifier').value.trim();
            const termsChecked = document.getElementById('terms-checkbox').checked;
            
            // Validation with notifications
            if (!identifier) {
                showNotification('Please enter your email or Telegram', 'warning');
                return;
            }
            if (!termsChecked) {
                showNotification('Please agree to the terms', 'warning');
                return;
            }
            if (!selectedPaymentSystem) {
                showNotification('Please select a payment system', 'warning');
                return;
            }
            
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Creating invoice...';
            const amount = document.getElementById('modal-total-price').textContent.split(' ')[0];
            const quantity = isDonationMode ? 1 : document.getElementById('lesson-quantity').value;
            const description = isDonationMode ? "Donation" : `${currentTariffName} x${quantity}`;
            
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
                    showNotification('Error: ' + (data.error || 'Failed to create payment invoice'), 'error');
                    button.textContent = originalText;
                    button.disabled = false;
                }
            } catch (error) {
                showNotification('Network error. Please try again', 'error');
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


