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
    ensureRole: function(...roles) {
        return (req, res, next) => {
            if (!req.user) {
                 return res.status(401).send('Unauthorized');
            }
            if (roles.includes(req.user.role)) {
                return next();
            }
            res.status(403).send('Forbidden: You do not have access to this resource.');
        }
    }
};