module.exports = {
    // Ensure user is authenticated
    ensureAuth: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/users/login');
        }
    },
    // Ensure user is a guest (not logged in)
    ensureGuest: function(req, res, next) {
        if (req.isAuthenticated()) {
            res.redirect('/dashboard');
        } else {
            return next();
        }
    },
    // Check user role
    ensureRole: function(role) {
        return (req, res, next) => {
            if (req.user.role === role) {
                return next();
            }
            // Redirect to their dashboard or show an error
            res.status(403).send('Forbidden: You do not have access to this resource.');
        }
    }
};