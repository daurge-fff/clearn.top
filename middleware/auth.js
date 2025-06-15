module.exports = {
    ensureAuth: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/users/login');
        }
    },
    ensureGuest: function(req, res, next) {
        if (req.isAuthenticated()) {
            res.redirect('/dashboard');
        } else {
            return next();
        }
    },
    ensureRole: function(role) {
        return (req, res, next) => {
            if (req.user.role === role) {
                return next();
            }
            res.status(403).send('Forbidden: You do not have access to this resource.');
        }
    }
};