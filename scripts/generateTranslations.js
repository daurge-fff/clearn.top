const fs = require('fs');
const path = require('path');
const CourseManager = require('../utils/courseManager');

class TranslationGenerator {
    constructor() {
        this.courseManager = new CourseManager();
        this.languages = ['en', 'ru', 'de', 'he', 'pl', 'nl', 'uk', 'es', 'it'];
    }

    generateTranslations() {
        console.log('🔄 Generating translations...');
        
        const translations = {};
        
        this.languages.forEach(lang => {
            console.log(`📝 Generating translations for ${lang}...`);
            
            // Получаем переводы курсов для этого языка
            const courseTranslations = this.courseManager.getTranslationsForLanguage(lang);
            
            // Базовые переводы (можно расширить)
            translations[lang] = {
                dir: lang === 'he' ? 'rtl' : 'ltr',
                nav_courses: this.getTranslation('nav_courses', lang),
                nav_tariffs: this.getTranslation('nav_tariffs', lang),
                nav_why_us: this.getTranslation('nav_why_us', lang),
                nav_about: this.getTranslation('nav_about', lang),
                courses_title: this.getTranslation('courses_title', lang),
                ...courseTranslations
            };
        });

        // Записываем в файл
        const outputPath = path.join(__dirname, '../public/js/translations.js');
        const content = `const translations = ${JSON.stringify(translations, null, 4)};`;
        
        fs.writeFileSync(outputPath, content);
        console.log('✅ Translations generated successfully');
    }

    getTranslation(key, lang) {
        // Базовые переводы - можно расширить
        const baseTranslations = {
            nav_courses: {
                en: "Courses",
                ru: "Курсы",
                de: "Kurse",
                he: "קורסים",
                pl: "Kursy",
                nl: "Cursussen",
                uk: "Курси",
                es: "Cursos",
                it: "Corsi"
            },
            nav_tariffs: {
                en: "Pricing",
                ru: "Цены",
                de: "Preise",
                he: "מחירים",
                pl: "Cennik",
                nl: "Prijzen",
                uk: "Ціни",
                es: "Precios",
                it: "Prezzi"
            },
            nav_why_us: {
                en: "Why Us",
                ru: "Почему мы",
                de: "Warum wir",
                he: "למה אנחנו",
                pl: "Dlaczego my",
                nl: "Waarom wij",
                uk: "Чому ми",
                es: "Por qué nosotros",
                it: "Perché noi"
            },
            nav_about: {
                en: "About me",
                ru: "Обо мне",
                de: "Über mich",
                he: "עליי",
                pl: "O mnie",
                nl: "Over mij",
                uk: "Про мене",
                es: "Sobre mí",
                it: "Su di me"
            },
            courses_title: {
                en: "Learning Paths",
                ru: "Пути обучения",
                de: "Lernpfade",
                he: "נתיבי למידה",
                pl: "Ścieżki nauki",
                nl: "Leerpaden",
                uk: "Шляхи навчання",
                es: "Rutas de aprendizaje",
                it: "Percorsi di apprendimento"
            }
        };

        return baseTranslations[key]?.[lang] || baseTranslations[key]?.['en'] || key;
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const generator = new TranslationGenerator();
    generator.generateTranslations();
}

module.exports = TranslationGenerator;
