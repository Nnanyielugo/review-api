const User = require('mongoose').model('User');
const passport = require('passport');
const user_utils = require('../utils/user_utils');

module.exports.signup = async (req, res, next) => {
  try {
    const user = new User();
    user.username = req.body.user.username;
    user.email = req.body.user.email;
    user.first_name = req.body.user.first_name;
    user.family_name = req.body.user.family_name;
    user.setPassword(req.body.user.password);
    if (req.body.user.give_admin_priviledges) {
      user.user_type = 'admin';
    }

    if (req.body.user.give_mod_priviledges) {
      user.user_type = 'moderator';
    }

    if (
      !req.body.user.username
        || !req.body.user.password
        || !req.body.user.email
        || !req.body.user.first_name
        || !req.body.user.family_name
    ) {
      // generic error message since there will be frontend validation
      return res.status(400).json({
        error: {
          message: 'Required form values need to be complete!',
        },
      });
    }

    await user.save();
    return res.json({ user: user.toAuthJsonFor() });
  } catch (err) {
    next(err);
  }
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
    if (user.suspended && user.suspension_timeline > Date.now()) {
      user_utils.unsuspend_user(user._id);
    }
    user.token = user.generateJwt();
    return res.json({ user: user.toAuthJsonFor() });
  })(req, res, next);
};

module.exports.get = async (req, res, next) => {
  try {
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.sendStatus(401);
    }

    if (user.suspended && user.suspension_timeline > Date.now()) {
      user = await User.findByIdAndUpdate().update({
        suspended: false,
        suspension_timeline: null,
      });
    }

    // change returned object depending on who is making the request
    if (req.payload) {
      if (req.payload.id.toString() === user._id.toString()) {
        return res.json({ user: user.toAuthJsonFor() });
      }
      const viewing_user = await User.findById(req.payload.id);
      return res.json({ user: user.toObjectJsonFor(viewing_user) });
    }
    return res.json({ user: user.toObjectJsonFor() });
  } catch (err) {
    next(err);
  }
};

module.exports.update = async (req, res, next) => {
  try {
    const request_user = await User.findById(req.params.id);
    if (request_user._id.toString() !== req.payload.id.toString()) {
      res.status(400).json({
        error: {
          message: "Cannot edit another user's profile!",
        },
      });
    }
    const user = await User.findByIdAndUpdate(req.payload.id, req.body.user, { new: true });
    if (!user) {
      return res.sendStatus(401);
    }
    return res.json({ user: user.toAuthJsonFor() });
  } catch (err) {
    next(err);
  }
};

module.exports.suspend = async (req, res, next) => {
  try {
    const super_user = await User.findById(req.payload.id);
    if (!super_user) {
      return res.sendStatus(401);
    }
    if (super_user.user_type !== 'admin' && super_user.user_type !== 'moderator') {
      return res.status(401).json({ error: { message: 'You have to be an admin or a moderator to perform this action' } });
    }

    const user = await user_utils.suspend_user(req.params.id);
    return res.json({ user: user.toObjectJsonFor(user) });
  } catch (err) {
    next(err);
  }
};
