const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { notifyAllAdmins } = require('../services/notificationService');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            User.findOne({ email: email.toLowerCase() })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'That email is not registered' });
                    }

                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => console.log(err));
        })
    );

    passport.use(
        new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.BASE_URL + '/users/auth/google/callback' 
            },
            async(accessToken, refreshToken, profile, done) => {
                const newUser = {
                    googleId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    timeZone: 'Europe/Moscow'
                };

                try {
                    let user = await User.findOne({ googleId: profile.id });
                    if (user) {
                        done(null, user);
                    } else {
                        user = await User.findOne({ email: newUser.email });
                        if (user) {
                            user.googleId = newUser.googleId;
                            await user.save();
                            done(null, user);
                        } else {
                            user = await User.create(newUser);
                            
                            // Notify admins about new Google user registration
                            const adminMessage = `🆕 *New Google Registration*\n\n` +
                                `👤 *Name:* ${user.name}\n` +
                                `📧 *Email:* ${user.email}\n` +
                                `🔗 *Google ID:* ${user.googleId}\n` +
                                `🕒 *Registration Date:* ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Moscow' })}\n` +
                                `🌐 *Time Zone:* ${user.timeZone}`;
                            
                            try {
                                await notifyAllAdmins(adminMessage);
                            } catch (error) {
                                console.error('Failed to send admin notification for Google user registration:', error);
                            }
                            
                            done(null, user);
                        }
                    }
                } catch (err) {
                    console.error('Google OAuth error:', err);
                    done(err, null);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id)
            .then(user => {
                done(null, user);
            })
            .catch(err => {
                done(err, null);
            });
    });
};