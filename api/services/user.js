const User = require('mongoose').model('User');
const passport = require('passport');


module.exports.get = (req, res, next) => {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }
      return res.json({ user: user.toAuthJsonFor() });
    })
    .catch(next);
};

module.exports.signup = (req, res, next) => {
  const user = new User();
  user.username = req.body.username;
  user.email = req.body.email;
  user.setPassword(req.body.password);

  user
    .save()
    .then(() => res.json({ user: user.toAuthJsonFor() }))
    .catch(next);
};

module.exports.login = (req, res, next) => {
  if (!req.body.user.email) {
    return res.status(422).json({ error: { message: "Email can't be blank" } });
  }

  if (!req.body.user.password) {
    return res.status(422).json({ error: { message: "Password can't be blank" } });
  }

  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(422).json(info);
    }
    user.token = user.generateJwt();
    return res.json({ user: user.toAuthJsonFor() });
  })(req, res, next);
};

module.exports.update = (req, res, next) => {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }
      return user
        .update(req.body.user)
        .then(() => res.json({ user: user.toAuthJsonFor() }))
        .catch(next);
    })
    .catch(next);
};

module.exports.suspend = (req, res, next) => {
  User
    .findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: { message: 'You have to be an admin or a moderator to perform this action' } });
      }
      if (user.user_type !== 'admin' || user.user_type !== 'moderator') {
        return res.sendStatus(401);
      }
      return user
        .update({
          suspended: true,
          suspension_timeline: Date.now() + 21600000, // 6 hours
        });
    })
    .catch(next);
};
