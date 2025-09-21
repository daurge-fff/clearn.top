const courses = require('../config/courses');

class CourseManager {
    constructor() {
        this.courses = courses;
    }

    // Получить все видимые курсы, отсортированные по порядку
    getVisibleCourses() {
        return Object.entries(this.courses)
            .filter(([key, course]) => course.visible)
            .sort(([,a], [,b]) => (a.order || 999) - (b.order || 999))
            .reduce((acc, [key, course]) => {
                acc[key] = {};
                return acc;
            }, {});
    }

    // Получить все курсы (включая скрытые)
    getAllCourses() {
        return Object.entries(this.courses).reduce((acc, [key, course]) => {
            acc[key] = course;
            return acc;
        }, {});
    }

    // Получить данные курса для конкретного языка
    getCourseData(courseKey, language = 'en') {
        const course = this.courses[courseKey];
        if (!course) return null;

        return {
            title: course.name[language] || course.name.en,
            description: course.description[language] || course.description.en,
            age: course.age[language] || course.age.en,
            duration: course.duration[language] || course.duration.en,
            format: course.format[language] || course.format.en,
            tools: course.tools,
            defaultDuration: course.defaultDuration,
            whatYouLearn: course.whatYouLearn[language] || course.whatYouLearn.en,
            modules: course.modules.map(module => ({
                title: module.title[language] || module.title.en,
                description: module.description[language] || module.description.en
            }))
        };
    }

    // Получить переводы для всех курсов на конкретном языке
    getTranslationsForLanguage(language = 'en') {
        const translations = {};
        
        Object.keys(this.courses).forEach(courseKey => {
            const course = this.courses[courseKey];
            if (!course.visible) return;

            const data = this.getCourseData(courseKey, language);
            if (!data) return;

            translations[`course_${courseKey}_title`] = data.title;
            translations[`course_${courseKey}_desc`] = data.description;
            translations[`course_${courseKey}_age`] = data.age;
            translations[`course_${courseKey}_duration`] = data.duration;
            translations[`course_${courseKey}_format`] = data.format;
            translations[`course_${courseKey}_tools`] = data.tools;
            translations[`course_${courseKey}_default_duration`] = data.defaultDuration;
            translations[`course_${courseKey}_what_you_learn`] = data.whatYouLearn;
            translations[`course_${courseKey}_modules`] = data.modules;
        });

        return translations;
    }

    // Показать/скрыть курс
    setCourseVisibility(courseKey, visible) {
        if (this.courses[courseKey]) {
            this.courses[courseKey].visible = visible;
            // Сохраняем изменения в файл конфигурации
            this.saveConfig();
            return true;
        }
        return false;
    }

    // Сохранить конфигурацию в файл
    saveConfig() {
        const fs = require('fs');
        const path = require('path');
        
        const configPath = path.join(__dirname, '../config/courses.js');
        const content = `// Конфигурация курсов
// Этот файл содержит все курсы с их настройками
// Для добавления нового курса просто добавьте его в объект courses
// Для скрытия курса установите visible: false

const courses = ${JSON.stringify(this.courses, null, 4)};

module.exports = courses;`;
        
        fs.writeFileSync(configPath, content);
    }

    // Изменить порядок курса
    setCourseOrder(courseKey, order) {
        if (this.courses[courseKey]) {
            this.courses[courseKey].order = order;
            this.saveConfig();
            return true;
        }
        return false;
    }

    // Добавить новый курс
    addCourse(courseKey, courseData) {
        if (this.courses[courseKey]) {
            return false; // Курс уже существует
        }
        
        this.courses[courseKey] = {
            visible: true,
            order: Object.keys(this.courses).length + 1,
            ...courseData
        };
        return true;
    }

    // Удалить курс
    removeCourse(courseKey) {
        if (this.courses[courseKey]) {
            delete this.courses[courseKey];
            return true;
        }
        return false;
    }

    // Получить курс для базы данных
    getCourseForDatabase(courseKey) {
        const course = this.courses[courseKey];
        if (!course) return null;

        return {
            name: course.name.en,
            description: course.description.en,
            ageGroup: course.age.en,
            tools: course.tools,
            visible: course.visible,
            order: course.order
        };
    }

    // Получить все курсы для базы данных
    getAllCoursesForDatabase() {
        return Object.entries(this.courses).map(([key, course]) => ({
            key,
            ...this.getCourseForDatabase(key)
        }));
    }
}

module.exports = CourseManager;
