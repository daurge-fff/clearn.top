const CourseSync = require('./syncCourses');
const TranslationGenerator = require('./generateTranslations');
const mongoose = require('mongoose');

class CourseInitializer {
    constructor() {
        this.sync = new CourseSync();
        this.translationGenerator = new TranslationGenerator();
    }

    async initialize() {
        console.log('🚀 Initializing courses system...');
        
        try {
            // 1. Генерируем переводы
            console.log('📝 Step 1: Generating translations...');
            this.translationGenerator.generateTranslations();
            
            // 2. Пытаемся синхронизировать с базой данных
            console.log('🔄 Step 2: Syncing with database...');
            
            // Проверяем, есть ли уже активное соединение
            if (mongoose.connection.readyState === 1) {
                console.log('✅ Using existing MongoDB connection');
                await this.sync.syncCourses();
                await this.sync.getDatabaseStatus();
                console.log('✅ Database sync completed');
            } else {
                console.log('⚠️  MongoDB not connected, using configuration only');
            }
            
            console.log('✅ Course system initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Course initialization failed:', error);
            return false;
        }
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const initializer = new CourseInitializer();
    initializer.initialize().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = CourseInitializer;
