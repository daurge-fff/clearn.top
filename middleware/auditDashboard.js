const { logEvent } = require('../services/auditService');

function sanitizeBody(body) {
    try {
        const clone = JSON.parse(JSON.stringify(body || {}));
        const redactKeys = ['password', 'password2', 'newPassword', 'confirmPassword', 'token'];
        for (const k of Object.keys(clone)) {
            if (redactKeys.includes(k.toLowerCase())) clone[k] = '[REDACTED]';
            if (typeof clone[k] === 'string' && clone[k].length > 200) clone[k] = clone[k].slice(0, 200) + '…';
        }
        return clone;
    } catch {
        return {};
    }
}

module.exports = function dashboardAudit(req, res, next) {
    try {
        if (!req || !req.path) return next();
        if (!req.baseUrl || req.baseUrl.indexOf('/dashboard') !== 0) return next();
        const method = (req.method || '').toUpperCase();
        if (method !== 'POST' && method !== 'PUT' && method !== 'DELETE') return next();

        const segments = (req.path || '').split('/').filter(Boolean);
        const main = segments[0] || 'dashboard';
        const action = segments[1] || '';
        const tags = ['dashboard', main];
        if (action) tags.push(action);

        const filesInfo = req.files ? Object.keys(req.files) : (req.file ? [req.file.fieldname] : []);
        const hasFiles = filesInfo && filesInfo.length > 0;

        Promise.resolve(logEvent({
            tags,
            title: `${method} ${req.path}`,
            lines: [
                hasFiles ? `Files: ${filesInfo.join(', ')}` : '',
                `QueryKeys: ${Object.keys(req.query || {}).join(', ')}`,
                `Body: ${JSON.stringify(sanitizeBody(req.body))}`
            ],
            actor: req.user,
            ip: req.realIp,
            emoji: hasFiles ? '📤' : '🧩'
        })).catch(e => console.error('[audit] dashboard middleware:', e.message));
    } catch (e) {
        console.error('[audit] dashboard middleware:', e.message);
    }
    return next();
};


