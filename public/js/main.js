// Theme toggle functionality
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load saved theme on page load
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Initialize Why Code & Learn cards functionality
    initWhyUsCards();
    
    // Initialize photo gallery
    initPhotoGallery();
    
    // Initialize back to top button
    initBackToTop();
});

// Why Code & Learn cards functionality
function initWhyUsCards() {
    const cards = document.querySelectorAll('.why-us-card');
    
    cards.forEach((card, index) => {
        card.addEventListener('click', function() {
            // Add click animation
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 150);
            
            // Show modal with detailed information
            showCardModal(index);
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', function() {
            card.style.cursor = 'pointer';
        });     });


     
     // Expert Teacher badge functionality
     const expertBadge = document.querySelector('.profile-badge');
     if (expertBadge) {
         expertBadge.addEventListener('click', function() {
             showExpertTeacherModal();
         });
         expertBadge.style.cursor = 'pointer';
     }
     
     function showExpertTeacherModal() {
         const modal = document.createElement('div');
         modal.className = 'expert-modal';
         modal.innerHTML = `
             <div class="expert-modal-content">
                 <div class="expert-modal-header">
                     <div class="expert-avatar">
                         <img src="/images/german_photo.jpg" alt="German Vitiaz">
                     </div>
                     <h3 data-translate="expert_modal_title">Personal Message from German</h3>
                     <button class="expert-modal-close">&times;</button>
                 </div>
                 <div class="expert-modal-body">
                     <div class="expert-message">
                         <p data-translate="expert_modal_greeting">Hello! 👋</p>
                         <p data-translate="expert_modal_message">I'm passionate about making programming accessible and fun for everyone. With over 5 years of teaching experience, I've helped hundreds of students discover their potential in coding.</p>
                         <p data-translate="expert_modal_approach">My approach is simple: learn by doing! We'll build real projects, create games, and solve interesting challenges together. Every lesson is tailored to your unique learning style and goals.</p>
                         <div class="expert-achievements">
                             <div class="achievement">
                                 <span class="achievement-icon">🏆</span>
                                 <span data-translate="expert_achievement_1">200+ Students Taught</span>
                             </div>
                             <div class="achievement">
                                 <span class="achievement-icon">💻</span>
                                 <span data-translate="expert_achievement_2">15+ Programming Languages</span>
                             </div>
                             <div class="achievement">
                                 <span class="achievement-icon">⭐</span>
                                 <span data-translate="expert_achievement_3">98% Success Rate</span>
                             </div>
                         </div>
                         <p data-translate="expert_modal_cta">Ready to start your coding journey? Let's connect and create something amazing together!</p>
                     </div>
                     <div class="expert-modal-actions">
                         <a href="https://t.me/daurge" target="_blank" class="expert-action-btn primary">
                             <span data-translate="expert_contact_telegram">Contact on Telegram</span>
                         </a>
                         <a href="mailto:admin@clearn.top" class="expert-action-btn secondary">
                             <span data-translate="expert_contact_email">Send Email</span>
                         </a>
                     </div>
                 </div>
             </div>
         `;
         
         document.body.appendChild(modal);
         
         // Close modal functionality
         const closeBtn = modal.querySelector('.expert-modal-close');
         closeBtn.addEventListener('click', () => {
             modal.remove();
         });
         
         modal.addEventListener('click', (e) => {
             if (e.target === modal) {
                 modal.remove();
             }
         });
         
         // Apply current language translations
         if (window.applyTranslations) {
             window.applyTranslations();
         }
         
         // Animate modal appearance
         setTimeout(() => {
             modal.classList.add('show');
         }, 10);
     }
}

// Show modal with card details
function showCardModal(cardIndex) {
    const cardData = [
        {
            title: "Практический подход",
            description: "Мы фокусируемся на реальных проектах и практических навыках. Каждый урок включает hands-on задания, которые помогают закрепить теоретические знания на практике. Вы будете создавать реальные приложения с первого дня обучения.",
            benefits: [
                "Работа с реальными проектами",
                "Портфолио готовых работ",
                "Опыт решения практических задач",
                "Навыки, востребованные работодателями"
            ]
        },
        {
            title: "Индивидуальный подход",
            description: "Каждый студент уникален, поэтому мы адаптируем программу под ваши потребности и темп обучения. Персональная поддержка преподавателей и гибкий график занятий помогают достичь максимальных результатов.",
            benefits: [
                "Персональный план обучения",
                "Гибкий график занятий",
                "Индивидуальные консультации",
                "Адаптация под ваш уровень"
            ]
        },
        {
            title: "Современные технологии",
            description: "Мы обучаем только актуальным технологиям и инструментам, которые используются в современной разработке. Наша программа постоянно обновляется в соответствии с трендами индустрии.",
            benefits: [
                "Актуальный стек технологий",
                "Современные инструменты разработки",
                "Следование индустриальным стандартам",
                "Подготовка к реальной работе"
            ]
        }
    ];
    
    const card = cardData[cardIndex];
    if (!card) return;
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'card-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${card.title}</h3>
                <button class="modal-close" onclick="closeCardModal()">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p>${card.description}</p>
                <h4>Преимущества:</h4>
                <ul>
                    ${card.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-footer">
                <button class="modern-cta-btn" onclick="scrollToContact()">
                    Узнать больше
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCardModal();
        }
    });
}

// Close card modal
function closeCardModal() {
    const modal = document.querySelector('.card-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Scroll to contact section
function scrollToContact() {
    closeCardModal();
    const contactSection = document.querySelector('#contact');
    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Back to top functionality
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Contact card click functionality
    document.querySelectorAll('.contact-card').forEach(card => {
        card.addEventListener('click', function() {
            const cardType = this.querySelector('h3').textContent.toLowerCase();
            
            if (cardType.includes('telegram')) {
                window.open('https://t.me/hermvit', '_blank');
            } else if (cardType.includes('phone') || cardType.includes('телефон')) {
                window.open('tel:+1234567890', '_self');
            } else if (cardType.includes('email') || cardType.includes('почта')) {
                window.open('mailto:contact@clearn.top', '_self');
            }
        });
    });
});

// Form submission handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('#contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Add loading state
            const submitBtn = this.querySelector('.modern-submit-btn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Отправка...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual logic)
            setTimeout(() => {
                submitBtn.innerHTML = 'Отправлено!';
                submitBtn.style.background = 'var(--success-color)';
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                    contactForm.reset();
                }, 2000);
            }, 1500);
        });
    }
});

// Add floating label animation
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('.floating-input input, .floating-input textarea');
    
    inputs.forEach(input => {
        // Check if input has value on load
        if (input.value) {
            input.classList.add('has-value');
        }
        
        input.addEventListener('input', function() {
            if (this.value) {
                this.classList.add('has-value');
            } else {
                this.classList.remove('has-value');
            }
        });
        
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});

// Photo Gallery functionality
function initPhotoGallery() {
    let currentImageIndex = 0;
    const galleryImages = [
        '/images/gallery/main-photo.jpg',
        '/images/gallery/lesson-screenshot.jpg', 
        '/images/gallery/student-project.jpg',
        '/images/gallery/coding-setup.jpg'
    ];
    
    const mainImage = document.getElementById('galleryMainImage');
    const prevBtn = document.getElementById('galleryPrevBtn');
    const nextBtn = document.getElementById('galleryNextBtn');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (!mainImage || !prevBtn || !nextBtn || thumbnails.length === 0) {
        console.log('Gallery elements not found');
        return;
    }
    
    function showImage(index) {
        if (mainImage && galleryImages[index]) {
            mainImage.src = galleryImages[index];
            mainImage.alt = thumbnails[index]?.getAttribute('data-alt') || 'Gallery image';
            currentImageIndex = index;
            
            // Update thumbnails
            thumbnails.forEach((thumb, i) => {
                if (i === index) {
                    thumb.classList.add('active');
                } else {
                    thumb.classList.remove('active');
                }
            });
        }
    }
    
    function nextImage() {
        const nextIndex = (currentImageIndex + 1) % galleryImages.length;
        showImage(nextIndex);
    }
    
    function prevImage() {
        const prevIndex = currentImageIndex === 0 ? galleryImages.length - 1 : currentImageIndex - 1;
        showImage(prevIndex);
    }
    
    // Event listeners
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextImage();
    });
    
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevImage();
    });
    
    // Thumbnail clicks
    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', (e) => {
            e.preventDefault();
            showImage(index);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (document.querySelector('.photo-gallery:hover') || document.activeElement.closest('.photo-gallery')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevImage();
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextImage();
            }
        }
    });
    
    // Initialize first image
    showImage(0);
    
    console.log('Photo gallery initialized successfully');
}