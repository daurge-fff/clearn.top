# clearn.top - CRM & Telegram Bot

This is a comprehensive CRM system with a deeply integrated Telegram bot, built with Node.js and Express. It's designed to manage users, courses, lessons, and payments, with a powerful notification system and a referral program.

![Screenshot of the dashboard](public/images/thumb.jpg)

## 🌟 Features Overview

The platform provides different functionality depending on the user's role: administrator, teacher, or student.

### 👤 Common Pages for All Users

*   **Home Page:** Presents an overview of the courses and general information about the platform.
*   **Informational Pages:** Includes "Terms of Service", "Privacy Policy", "Cookie Policy", and "Refund Policy".
*   **FAQ Page:** Contains answers to frequently asked questions.
*   **Payment Result Pages:** Informs the user about a successful or failed payment.
*   **Login and Registration:** Standard forms for user authentication, including an option to log in with Google. New users can register using a referral code.

### 👑 Administrator Functionality

The administrator has full access to all system functions through the control panel.

*   **Dashboard:** Displays key statistics: total number of students, teachers, and scheduled lessons.
*   **User Management:**
    *   View a list of all users with the ability to filter by role (student, teacher, admin) and status (active, inactive, paused).
    *   Add, edit, and delete users.
    *   When editing a user, you can change their name, email, role, contact information, number of paid lessons (for students), status, and assign or change a teacher for a student.
    *   View a detailed user profile, including balance history.
    *   Ability to export the user list to CSV.
*   **Lesson Management:**
    *   View a list of all lessons with filtering options.
    *   Add, edit, and delete lessons.
    *   Assign students and teachers to lessons.
*   **Payment Management:**
    *   View the history of all payments.
    *   Change the status of a payment.
*   **Analytics:** Access to an analytics page to track key platform metrics.

### 🧑‍🏫 Teacher Functionality

Teachers use the control panel to interact with their students and manage their schedule.

*   **Dashboard:** Displays the number of lessons for the current week and the total number of active students.
*   **Calendar:** An interactive calendar to view their lesson schedule.
*   **My Students:** A list of all students assigned to the teacher.
*   **Lesson Management:** Ability to manage their lessons, marking them as completed or canceled.

### 🎓 Student Functionality

Students use their personal account to track their progress and schedule.

*   **Dashboard:** Displays the number of paid lessons and information about the next scheduled lesson.
*   **My Lessons:**
    *   View a list of all their past and future lessons.
    *   View payment history.
    *   Ability to cancel an upcoming lesson (with a reason).
*   **Progress:** View their progress in various courses.
*   **Lesson View:** Detailed information about a specific lesson, including materials and homework.

## 🤖 Telegram Bot Integration

The project includes a Telegram bot that extends the platform's functionality:

*   **Role-Based Menus:** The bot provides custom keyboards and menus based on the user's role (student, teacher, or admin).
*   **Schedule Management:** Users can view their schedule (today, this week, this month) via an interactive calendar.
*   **Lesson Management:**
    *   Teachers can mark lessons as 'completed' or 'no-show'.
    *   Students and teachers can cancel upcoming lessons (with a reason).
*   **Student-Teacher Interaction:**
    *   Students can view their teacher's contact information.
    *   Teachers can view a list of their students.
*   **Balance Management:**
    *   Students can check their remaining paid lessons.
    *   Admins can manually adjust a user's lesson balance.
*   **Notifications:** Users receive notifications about upcoming lessons, schedule changes, and other important events. Admins are notified of new user registrations and payments.
*   **Referral Program:** Users can get their unique referral link through the bot to invite new users.
*   **User Search:** Admins can search for users by name or email directly within the bot.
*   **Settings:** Users can manage their notification preferences and change their emoji avatar.

## 🤝 Referral Program

The platform includes a referral system to incentivize user growth:

*   **Unique Referral Links:** Each user gets a unique referral link to share.
*   **Tracking:** The system tracks who was referred by whom.
*   **Rewards:** The specific rewards for referring new users can be configured in the admin panel (details on rewards are managed within the application logic).