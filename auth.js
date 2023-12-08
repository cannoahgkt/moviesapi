const jwt = require('jsonwebtoken');
const passport = require('passport');

module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        console.error('Authentication failed:', error);
        return res.status(400).json({
          message: 'Invalid username or password',
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          console.error('Login error:', error);
          res.send(error);
        }
        console.log('Login successful');
        const payload = {
          sub: user._id,
          username: user.username,
        };
        const token = jwt.sign(payload, 'hG7zPwIVrs', { expiresIn: '1h' });
        return res.json({ user, token });
      });
    })(req, res);
  });
};