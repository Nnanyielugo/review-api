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

  if (!req.bbody.user.password) {
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
