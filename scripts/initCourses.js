const CourseSync = require('./syncCourses');
const TranslationGenerator = require('./generateTranslations');

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
            const connected = await this.sync.connectToDatabase();
            
            if (connected) {
                await this.sync.syncCourses();
                await this.sync.getDatabaseStatus();
                await this.sync.disconnect();
                console.log('✅ Database sync completed');
            } else {
                console.log('⚠️  Database not available, using configuration only');
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
