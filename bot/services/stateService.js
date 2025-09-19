const User = require('../../models/User');

// Temporary storage for messages (in production, use Redis or database)
const messageStorage = new Map();

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
 * Gets the current state for a user.
 * @param {string} telegramChatId
 * @returns {Promise<object|null>}
 */
async function getState(telegramChatId) {
    const user = await User.findOne({ telegramChatId: String(telegramChatId) }, { botState: 1 }).lean();
    return user ? user.botState : null;
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

/**
 * Stores a message temporarily and returns a unique ID
 * @param {string} message - The message to store
 * @param {object} metadata - Additional metadata (role, userId, etc.)
 * @returns {string} - Unique message ID
 */
function storeMessage(message, metadata = {}) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    messageStorage.set(messageId, {
        message,
        metadata,
        timestamp: Date.now()
    });
    
    // Clean up old messages (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, data] of messageStorage.entries()) {
        if (data.timestamp < oneHourAgo) {
            messageStorage.delete(id);
        }
    }
    
    return messageId;
}

/**
 * Retrieves a stored message by ID
 * @param {string} messageId - The message ID
 * @returns {object|null} - The message data or null if not found
 */
function getMessage(messageId) {
    return messageStorage.get(messageId) || null;
}

/**
 * Removes a stored message by ID
 * @param {string} messageId - The message ID
 */
function removeMessage(messageId) {
    messageStorage.delete(messageId);
}

module.exports = {
    setState,
    getState,
    clearState,
    storeMessage,
    getMessage,
    removeMessage,
};