#!/usr/bin/env node

const CourseManager = require('../utils/courseManager');
const CourseSync = require('./syncCourses');
const TranslationGenerator = require('./generateTranslations');

class CourseManagementCLI {
    constructor() {
        this.courseManager = new CourseManager();
        this.sync = new CourseSync();
        this.translationGenerator = new TranslationGenerator();
    }

    async showHelp() {
        console.log(`
🎓 Course Management CLI

Usage: node scripts/manageCourses.js <command> [options]

Commands:
  list                    - List all courses
  details <courseKey>     - Show details of a specific course
  hide <courseKey>        - Hide a course (set visible: false)
  show <courseKey>        - Show a course (set visible: true)
  order <courseKey> <num> - Set course order
  sync                    - Sync courses with database
  generate                - Generate translations
  init                    - Initialize course system
  status                  - Show database status

Examples:
  node scripts/manageCourses.js list
  node scripts/manageCourses.js hide minecraft
  node scripts/manageCourses.js order python 1
  node scripts/manageCourses.js sync
        `);
    }

    async listCourses() {
        console.log('\n📚 Available Courses:');
        console.log('====================');
        
        const courses = this.courseManager.getAllCourses();
        Object.entries(courses).forEach(([key, course]) => {
            const courseData = this.courseManager.getCourseData(key);
            const status = course.visible ? '✅' : '❌';
            const order = course.order || 'N/A';
            console.log(`${status} ${key} - ${courseData.title} (Order: ${order})`);
        });
    }

    async showCourseDetails(courseKey) {
        const courseData = this.courseManager.getCourseData(courseKey);
        if (!courseData) {
            console.log(`❌ Course '${courseKey}' not found`);
            return;
        }

        console.log(`\n📖 Course Details: ${courseKey}`);
        console.log('========================');
        console.log(`Title: ${courseData.title}`);
        console.log(`Description: ${courseData.description}`);
        console.log(`Age: ${courseData.age}`);
        console.log(`Duration: ${courseData.duration}`);
        console.log(`Format: ${courseData.format}`);
        console.log(`Tools: ${courseData.tools.join(', ')}`);
        console.log(`Default Duration: ${courseData.defaultDuration} minutes`);
        console.log(`Visible: ${this.courseManager.courses[courseKey].visible}`);
        console.log(`Order: ${this.courseManager.courses[courseKey].order}`);
    }

    async hideCourse(courseKey) {
        const success = this.courseManager.setCourseVisibility(courseKey, false);
        if (success) {
            console.log(`✅ Course '${courseKey}' hidden`);
            await this.regenerateTranslations();
        } else {
            console.log(`❌ Course '${courseKey}' not found`);
        }
    }

    async showCourse(courseKey) {
        const success = this.courseManager.setCourseVisibility(courseKey, true);
        if (success) {
            console.log(`✅ Course '${courseKey}' shown`);
            await this.regenerateTranslations();
        } else {
            console.log(`❌ Course '${courseKey}' not found`);
        }
    }

    async setOrder(courseKey, order) {
        const orderNum = parseInt(order);
        if (isNaN(orderNum)) {
            console.log('❌ Order must be a number');
            return;
        }

        const success = this.courseManager.setCourseOrder(courseKey, orderNum);
        if (success) {
            console.log(`✅ Course '${courseKey}' order set to ${orderNum}`);
            await this.regenerateTranslations();
        } else {
            console.log(`❌ Course '${courseKey}' not found`);
        }
    }

    async syncWithDatabase() {
        console.log('🔄 Syncing with database...');
        const connected = await this.sync.connectToDatabase();
        if (connected) {
            await this.sync.syncCourses();
            await this.sync.disconnect();
        } else {
            console.log('❌ Cannot connect to database');
        }
    }

    async generateTranslations() {
        console.log('📝 Generating translations...');
        this.translationGenerator.generateTranslations();
    }

    async regenerateTranslations() {
        await this.generateTranslations();
    }

    async showStatus() {
        const connected = await this.sync.connectToDatabase();
        if (connected) {
            await this.sync.getDatabaseStatus();
            await this.sync.disconnect();
        } else {
            console.log('❌ Cannot connect to database');
        }
    }

    async init() {
        console.log('🚀 Initializing course system...');
        await this.generateTranslations();
        await this.syncWithDatabase();
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'list':
                await this.listCourses();
                break;
            case 'details':
                if (args[1]) {
                    await this.showCourseDetails(args[1]);
                } else {
                    console.log('❌ Please specify course key');
                }
                break;
            case 'hide':
                if (args[1]) {
                    await this.hideCourse(args[1]);
                } else {
                    console.log('❌ Please specify course key');
                }
                break;
            case 'show':
                if (args[1]) {
                    await this.showCourse(args[1]);
                } else {
                    console.log('❌ Please specify course key');
                }
                break;
            case 'order':
                if (args[1] && args[2]) {
                    await this.setOrder(args[1], args[2]);
                } else {
                    console.log('❌ Please specify course key and order');
                }
                break;
            case 'sync':
                await this.syncWithDatabase();
                break;
            case 'generate':
                await this.generateTranslations();
                break;
            case 'init':
                await this.init();
                break;
            case 'status':
                await this.showStatus();
                break;
            case 'help':
            case '--help':
            case '-h':
                await this.showHelp();
                break;
            default:
                console.log('❌ Unknown command. Use --help for usage information.');
        }
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const cli = new CourseManagementCLI();
    cli.run().catch(console.error);
}

module.exports = CourseManagementCLI;
