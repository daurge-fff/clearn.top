# 🎓 Course Management

## Quick Commands

```bash
# List all courses
node scripts/manageCourses.js list

# Hide course
node scripts/manageCourses.js hide minecraft

# Show course
node scripts/manageCourses.js show minecraft

# Change order
node scripts/manageCourses.js order python 1

# Sync with database
node scripts/manageCourses.js sync

# Show course details
node scripts/manageCourses.js details 3ddesigner
```

## Adding New Course

1. Edit [`config/courses.js`](config/courses.js)
2. Create icon `public/images/{courseKey}.svg`
3. Run sync: `node scripts/manageCourses.js sync`

## System Files

- **Configuration**: [`config/courses.js`](config/courses.js)
- **API**: [`utils/courseManager.js`](utils/courseManager.js)
- **CLI**: [`scripts/manageCourses.js`](scripts/manageCourses.js)
- **Sync**: [`scripts/syncCourses.js`](scripts/syncCourses.js)
- **Translations**: [`scripts/generateTranslations.js`](scripts/generateTranslations.js)

## Available Courses

- **scratch** - Visual Programming (7-11 years)
- **python** - Python Programming (12+ years)
- **roblox** - Roblox Game Development (9-12 years)
- **junior** - For Youngest Students (5-7 years)
- **minecraft** - Minecraft Modding (8-12 years)
- **3ddesigner** - 3D Modeling and Design (12+ years)