const mongoose = require('mongoose');
const CourseManager = require('../utils/courseManager');
require('dotenv').config();

const Course = require('../models/Course');

class CourseSync {
    constructor() {
        this.courseManager = new CourseManager();
    }

    async connectToDatabase() {
        try {
            // Проверяем, есть ли уже активное соединение
            if (mongoose.connection.readyState === 1) {
                console.log('✅ Using existing MongoDB connection');
                return true;
            }
            
            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 30000,
                maxPoolSize: 10,
                minPoolSize: 5,
                maxIdleTimeMS: 30000,
                bufferCommands: false
            });
            console.log('✅ Connected to MongoDB');
            return true;
        } catch (error) {
            console.error('❌ MongoDB Connection Error:', error.message);
            return false;
        }
    }

    async syncCourses() {
        console.log('🔄 Starting course synchronization...');
        
        const coursesFromConfig = this.courseManager.getAllCoursesForDatabase();
        console.log(`📚 Found ${coursesFromConfig.length} courses in configuration`);

        for (const courseData of coursesFromConfig) {
            const { key, ...courseInfo } = courseData;
            
            try {
                // Ищем существующий курс по имени
                let existingCourse = await Course.findOne({ name: courseInfo.name });
                
                if (existingCourse) {
                    // Обновляем существующий курс
                    existingCourse.description = courseInfo.description;
                    existingCourse.ageGroup = courseInfo.ageGroup;
                    existingCourse.tools = courseInfo.tools;
                    
                    // Добавляем новые поля, если их нет
                    if (!existingCourse.visible) existingCourse.visible = courseInfo.visible;
                    if (!existingCourse.order) existingCourse.order = courseInfo.order;
                    if (!existingCourse.key) existingCourse.key = key;
                    
                    await existingCourse.save();
                    console.log(`✅ Updated course: ${courseInfo.name}`);
                } else {
                    // Создаем новый курс
                    const newCourse = new Course({
                        ...courseInfo,
                        key: key
                    });
                    await newCourse.save();
                    console.log(`➕ Added new course: ${courseInfo.name}`);
                }
            } catch (error) {
                console.error(`❌ Error processing course ${courseInfo.name}:`, error.message);
            }
        }

        // Проверяем курсы в базе данных, которых нет в конфигурации
        const allDbCourses = await Course.find();
        const configKeys = coursesFromConfig.map(c => c.key);
        
        for (const dbCourse of allDbCourses) {
            if (dbCourse.key && !configKeys.includes(dbCourse.key)) {
                console.log(`⚠️  Course ${dbCourse.name} (${dbCourse.key}) exists in database but not in configuration`);
                // Можно добавить логику для удаления или скрытия таких курсов
            }
        }

        console.log('✅ Course synchronization completed');
    }

    async getDatabaseStatus() {
        try {
            const courses = await Course.find().sort({ order: 1 });
            console.log('\n📊 Database Status:');
            console.log('==================');
            
            if (courses.length === 0) {
                console.log('No courses found in database');
                return;
            }

            courses.forEach(course => {
                const status = course.visible ? '✅' : '❌';
                console.log(`${status} ${course.name} (${course.key || 'no-key'}) - Order: ${course.order || 'N/A'}`);
            });
        } catch (error) {
            console.error('❌ Error getting database status:', error.message);
        }
    }

    async disconnect() {
        try {
            await mongoose.disconnect();
            console.log('🔌 Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ Error disconnecting:', error.message);
        }
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const sync = new CourseSync();
    
    async function run() {
        const connected = await sync.connectToDatabase();
        if (!connected) {
            console.log('❌ Cannot connect to database. Exiting...');
            process.exit(1);
        }

        try {
            await sync.syncCourses();
            await sync.getDatabaseStatus();
        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            await sync.disconnect();
        }
    }

    run();
}

module.exports = CourseSync;
