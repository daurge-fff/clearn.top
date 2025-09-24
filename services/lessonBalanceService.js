const User = require('../models/User');
const Lesson = require('../models/Lesson');

/**
 * Централизованный сервис для управления балансом уроков
 * Обеспечивает безопасное списание и возврат уроков при изменении статуса
 */
class LessonBalanceService {
    
    /**
     * Безопасное изменение статуса урока с корректным управлением балансом
     * @param {string} lessonId - ID урока
     * @param {string} newStatus - Новый статус
     * @param {string} oldStatus - Старый статус
     * @param {object} actor - Пользователь, выполняющий действие
     * @returns {Promise<object>} Результат операции
     */
    static async changeLessonStatus(lessonId, newStatus, oldStatus, actor) {
        try {
            // Получаем урок с информацией о студенте
            const lesson = await Lesson.findById(lessonId).populate('student', 'name lessonsPaid');
            if (!lesson) {
                return { success: false, error: 'Lesson not found' };
            }

            // Если статус не изменился, ничего не делаем
            if (oldStatus === newStatus) {
                return { success: true, message: 'Status unchanged', balanceChange: 0 };
            }

            // Вычисляем изменение баланса
            const balanceChange = this.calculateBalanceChange(oldStatus, newStatus);
            
            if (balanceChange !== 0) {
                // Обновляем баланс студента (разрешаем отрицательный баланс)
                const updatedStudent = await User.findByIdAndUpdate(
                    lesson.student._id,
                    { $inc: { lessonsPaid: balanceChange } },
                    { new: true }
                );

                // Логируем изменение баланса
                await this.logBalanceChange(lesson, oldStatus, newStatus, balanceChange, actor);

                return {
                    success: true,
                    message: `Balance updated by ${balanceChange > 0 ? '+' : ''}${balanceChange}`,
                    balanceChange,
                    newBalance: updatedStudent.lessonsPaid
                };
            }

            return { success: true, message: 'No balance change needed', balanceChange: 0 };

        } catch (error) {
            console.error('Error in changeLessonStatus:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Вычисляет изменение баланса при смене статуса урока
     * @param {string} oldStatus - Старый статус
     * @param {string} newStatus - Новый статус
     * @returns {number} Изменение баланса (+1 возврат, -1 списание, 0 без изменений)
     */
    static calculateBalanceChange(oldStatus, newStatus) {
        // Определяем, какие статусы считаются "потраченными" (урок списан)
        const consumedStatuses = ['completed', 'no_show'];
        const cancelledStatuses = ['cancelled_by_student', 'cancelled_by_teacher'];
        const scheduledStatus = 'scheduled';

        // Если статус не изменился
        if (oldStatus === newStatus) {
            return 0;
        }

        // Создаем карту состояний
        const oldIsConsumed = consumedStatuses.includes(oldStatus);
        const oldIsCancelled = cancelledStatuses.includes(oldStatus);
        const oldIsScheduled = oldStatus === scheduledStatus;

        const newIsConsumed = consumedStatuses.includes(newStatus);
        const newIsCancelled = cancelledStatuses.includes(newStatus);
        const newIsScheduled = newStatus === scheduledStatus;

        // Логика изменения баланса:

        // 1. scheduled → cancelled: возвращаем урок (+1)
        if (oldIsScheduled && newIsCancelled) {
            return 1;
        }

        // 2. cancelled → scheduled: списываем урок (-1)
        if (oldIsCancelled && newIsScheduled) {
            return -1;
        }

        // 3. scheduled → consumed: урок уже списан при создании (0)
        if (oldIsScheduled && newIsConsumed) {
            return 0;
        }

        // 4. consumed → scheduled: возвращаем урок (+1)
        if (oldIsConsumed && newIsScheduled) {
            return 1;
        }

        // 5. cancelled → consumed: списываем урок (-1)
        if (oldIsCancelled && newIsConsumed) {
            return -1;
        }

        // 6. consumed → cancelled: возвращаем урок (+1)
        if (oldIsConsumed && newIsCancelled) {
            return 1;
        }

        // 7. consumed → consumed: без изменений (0)
        if (oldIsConsumed && newIsConsumed) {
            return 0;
        }

        // 8. cancelled → cancelled: без изменений (0)
        if (oldIsCancelled && newIsCancelled) {
            return 0;
        }

        // 9. Любые другие переходы: без изменений (0)
        return 0;
    }

    /**
     * Логирует изменение баланса в историю студента
     */
    static async logBalanceChange(lesson, oldStatus, newStatus, balanceChange, actor) {
        try {
            const student = await User.findById(lesson.student._id);
            if (!student) return;

            const reason = this.generateBalanceChangeReason(oldStatus, newStatus, lesson, actor);
            
            student.balanceHistory.push({
                date: new Date(),
                change: balanceChange,
                lessonsBalanceAfter: student.lessonsPaid,
                starsBalanceAfter: student.stars || 0,
                reason: reason,
                transactionType: 'Lesson Status Change',
                lessonId: lesson._id,
                oldStatus: oldStatus,
                newStatus: newStatus,
                actorId: actor._id,
                actorName: actor.name
            });

            await student.save();
        } catch (error) {
            console.error('Error logging balance change:', error);
        }
    }

    /**
     * Генерирует описание причины изменения баланса
     */
    static generateBalanceChangeReason(oldStatus, newStatus, lesson, actor) {
        const statusNames = {
            'scheduled': 'Запланирован',
            'completed': 'Проведен',
            'no_show': 'Неявка',
            'cancelled_by_student': 'Отменен студентом',
            'cancelled_by_teacher': 'Отменен учителем'
        };

        const oldStatusName = statusNames[oldStatus] || oldStatus;
        const newStatusName = statusNames[newStatus] || newStatus;
        
        const action = oldStatus === 'scheduled' && newStatus.startsWith('cancelled_') ? 'возвращен' :
                      oldStatus.startsWith('cancelled_') && newStatus === 'scheduled' ? 'списан' :
                      oldStatus === 'scheduled' && (newStatus === 'completed' || newStatus === 'no_show') ? 'списан' :
                      (oldStatus === 'completed' || oldStatus === 'no_show') && newStatus === 'scheduled' ? 'возвращен' :
                      oldStatus.startsWith('cancelled_') && (newStatus === 'completed' || newStatus === 'no_show') ? 'списан' :
                      (oldStatus === 'completed' || oldStatus === 'no_show') && newStatus.startsWith('cancelled_') ? 'возвращен' :
                      'изменен';

        return `Урок ${action} при смене статуса: ${oldStatusName} → ${newStatusName}. Действие: ${actor.name} (${actor.role})`;
    }

    /**
     * Проверяет корректность статуса урока
     */
    static isValidStatus(status) {
        const validStatuses = [
            'scheduled',
            'completed', 
            'no_show',
            'cancelled_by_student',
            'cancelled_by_teacher'
        ];
        return validStatuses.includes(status);
    }

    /**
     * Получает информацию о балансе студента
     */
    static async getStudentBalance(studentId) {
        try {
            const student = await User.findById(studentId).select('lessonsPaid stars name');
            if (!student) {
                return { success: false, error: 'Student not found' };
            }
            return {
                success: true,
                lessonsPaid: student.lessonsPaid || 0,
                stars: student.stars || 0,
                name: student.name
            };
        } catch (error) {
            console.error('Error getting student balance:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Валидирует возможность изменения статуса урока
     */
    static validateStatusChange(oldStatus, newStatus, actor) {
        // Проверяем валидность статусов
        if (!this.isValidStatus(oldStatus) || !this.isValidStatus(newStatus)) {
            return { valid: false, error: 'Invalid status' };
        }

        // Проверяем, что статус действительно изменился
        if (oldStatus === newStatus) {
            return { valid: false, error: 'Status unchanged' };
        }

        // Дополнительные проверки можно добавить здесь
        // Например, проверка прав пользователя на изменение статуса

        return { valid: true };
    }
}

module.exports = LessonBalanceService;
