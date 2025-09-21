#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class SystemVerifier {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'info') {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        console.log(`${icons[type]} ${message}`);
    }

    checkFileExists(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.log(`${description}: ${filePath}`, 'success');
            return true;
        } else {
            this.log(`${description}: ${filePath} - NOT FOUND`, 'error');
            this.errors.push(`Missing file: ${filePath}`);
            return false;
        }
    }

    checkDirectoryExists(dirPath, description) {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            this.log(`${description}: ${dirPath}`, 'success');
            return true;
        } else {
            this.log(`${description}: ${dirPath} - NOT FOUND`, 'error');
            this.errors.push(`Missing directory: ${dirPath}`);
            return false;
        }
    }

    checkImport(modulePath, description) {
        try {
            require(modulePath);
            this.log(`${description}: ${modulePath}`, 'success');
            return true;
        } catch (error) {
            this.log(`${description}: ${modulePath} - ERROR: ${error.message}`, 'error');
            this.errors.push(`Import error in ${modulePath}: ${error.message}`);
            return false;
        }
    }

    async verifySystem() {
        console.log('🔍 Verifying Course Management System...\n');

        // Проверяем основные файлы
        this.log('📁 Checking core files...', 'info');
        this.checkFileExists('config/courses.js', 'Course configuration');
        this.checkFileExists('utils/courseManager.js', 'Course manager');
        this.checkFileExists('models/Course.js', 'Course model');
        this.checkFileExists('public/images/3ddesigner.svg', '3D Designer icon');
        this.checkFileExists('public/js/translations.js', 'Translations file');

        // Проверяем скрипты
        this.log('\n📜 Checking scripts...', 'info');
        this.checkFileExists('scripts/syncCourses.js', 'Sync script');
        this.checkFileExists('scripts/generateTranslations.js', 'Translation generator');
        this.checkFileExists('scripts/initCourses.js', 'Initialization script');
        this.checkFileExists('scripts/manageCourses.js', 'Management CLI');

        // Проверяем импорты
        this.log('\n🔗 Checking imports...', 'info');
        this.checkImport('../config/courses', 'Course configuration import');
        this.checkImport('../utils/courseManager', 'Course manager import');
        this.checkImport('./syncCourses', 'Sync script import');
        this.checkImport('./generateTranslations', 'Translation generator import');

        // Проверяем Docker файлы
        this.log('\n🐳 Checking Docker files...', 'info');
        this.checkFileExists('Dockerfile', 'Dockerfile');
        this.checkFileExists('docker-compose.yml', 'Docker Compose');
        this.checkFileExists('package.json', 'Package.json');

        // Проверяем, что переводы содержат 3D Designer
        this.log('\n🌐 Checking translations...', 'info');
        try {
            const translationsContent = fs.readFileSync('public/js/translations.js', 'utf8');
            if (translationsContent.includes('course_3ddesigner_title')) {
                this.log('3D Designer course translations found', 'success');
            } else {
                this.log('3D Designer course translations NOT found', 'error');
                this.errors.push('3D Designer course translations missing');
            }
        } catch (error) {
            this.log(`Error reading translations: ${error.message}`, 'error');
            this.errors.push(`Translation file error: ${error.message}`);
        }

        // Проверяем, что система курсов работает
        this.log('\n🎓 Testing course system...', 'info');
        try {
            const CourseManager = require('../utils/courseManager');
            const cm = new CourseManager();
            const visibleCourses = cm.getVisibleCourses();
            
            if ('3ddesigner' in visibleCourses) {
                this.log('3D Designer course is visible', 'success');
            } else {
                this.log('3D Designer course is NOT visible', 'error');
                this.errors.push('3D Designer course not visible');
            }

            if (Object.keys(visibleCourses).length >= 6) {
                this.log(`Found ${Object.keys(visibleCourses).length} visible courses`, 'success');
            } else {
                this.log(`Only ${Object.keys(visibleCourses).length} visible courses found`, 'warning');
                this.warnings.push('Expected at least 6 courses');
            }
        } catch (error) {
            this.log(`Course system error: ${error.message}`, 'error');
            this.errors.push(`Course system error: ${error.message}`);
        }

        // Итоговый отчет
        this.log('\n📊 Verification Summary:', 'info');
        this.log(`Errors: ${this.errors.length}`, this.errors.length === 0 ? 'success' : 'error');
        this.log(`Warnings: ${this.warnings.length}`, this.warnings.length === 0 ? 'success' : 'warning');

        if (this.errors.length > 0) {
            this.log('\n❌ Errors found:', 'error');
            this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
        }

        if (this.warnings.length > 0) {
            this.log('\n⚠️ Warnings:', 'warning');
            this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warning'));
        }

        if (this.errors.length === 0) {
            this.log('\n🎉 System is ready for deployment!', 'success');
            this.log('You can now run: docker-compose up -d --build', 'success');
        } else {
            this.log('\n🚫 System has errors and is NOT ready for deployment', 'error');
        }

        return this.errors.length === 0;
    }
}

// Если скрипт запущен напрямую
if (require.main === module) {
    const verifier = new SystemVerifier();
    verifier.verifySystem().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = SystemVerifier;
