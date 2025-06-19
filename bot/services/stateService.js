const User = require('../../models/User');

/**
 * Sets a new state for a user in the database.
 * @param {string} telegramChatId
 * @param {string} stateName - The name of the state (e.g., 'awaiting_user_search').
 * @param {object} context - Any additional data to store with the state.
 */
async function setState(telegramChatId, stateName, context = {}) {
    return User.updateOne(
        { telegramChatId: String(telegramChatId) },
        {
            $set: {
                botState: {
                    name: stateName,
                    context: context,
                    updatedAt: new Date()
                }
            }
        }
    );
}

/**
 * Clears the state for a user in the database.
 * @param {string} telegramChatId
 */
async function clearState(telegramChatId) {
    return User.updateOne(
        { telegramChatId: String(telegramChatId) },
        {
            $set: {
                botState: {
                    name: null,
                    context: {}
                }
            }
        }
    );
}

module.exports = {
    setState,
    clearState,
};