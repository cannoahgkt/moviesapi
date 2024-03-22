const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const User = require('./models').User;

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, callback) => {
      console.log(`${username} ${password}`);
      await User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          console.log('incorrect username');
          return callback(null, false, {
            message: 'Incorrect username or password.',
          });
        }
        console.log('finished');
        return callback(null, user);
      })
      .catch((error) => {
        if (error) {
          console.log(error);
          return callback(error);
        }
      })
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