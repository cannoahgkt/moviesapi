const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const User = require('./models').User;
const jwt = require('jsonwebtoken');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user || !user.validatePassword(password)) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'hG7zPwIVrs',
    },
    (jwtPayload, done) => {
      try {
        if (Date.now() >= jwtPayload.expires) {
          return done(null, false, { message: 'Token has expired' });
        }
        return done(null, jwtPayload);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
