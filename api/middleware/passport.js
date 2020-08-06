const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('mongoose').model('User');

// login
passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]',
}, (email, password, done) => {
  User
    .findOne({ email })
    .then((user) => {
      if (!user || !user.validPassword(password)) {
        return done(null, false, { error: { message: 'Email or password is invalid' } });
      }
      return done(null, user);
    })
    .catch(done);
}));
