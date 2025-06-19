class UndoStack {
    constructor() {
        this.stack = {};
    }

    push(action) {
        if (!this.stack[action.chatId]) {
            this.stack[action.chatId] = [];
        }
        this.stack[action.chatId].push(action);

        if (this.stack[action.chatId].length > 5) {
            this.stack[action.chatId].shift();
        }
    }

    pop(chatId) {
        if (!this.stack[chatId] || this.stack[chatId].length === 0) {
            return null;
        }
        return this.stack[chatId].pop();
    }

    hasActions(chatId) {
        return this.stack[chatId] && this.stack[chatId].length > 0;
    }
}

module.exports = UndoStack;